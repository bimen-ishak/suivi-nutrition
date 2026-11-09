// Lecture de photos d'un produit par l'IA Gemini, avec la clé personnelle de l'utilisateur
import { t } from '../i18n';

const KEY_STORAGE = 'geminiApiKey';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// Si un modèle disparaît (erreur 404), on essaie le suivant
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

const PROMPT = `Tu analyses 1 à 3 photos d'un produit alimentaire ou d'un repas : le produit posé sur une balance, son étiquette nutritionnelle, son emballage.
Réponds UNIQUEMENT par un objet JSON avec ces clés :
- mode : "label" si un tableau nutritionnel est lisible sur une photo, sinon "estimate"
- name : nom du produit ou du plat (texte) ou null
- brand : marque (texte) ou null
- barcode : le code-barres imprimé sous les barres, chiffres seulement (8, 12, 13 ou 14 chiffres), ou null s'il n'est pas lisible. Ne l'invente jamais.
- unit : "g" pour un solide, "ml" pour un liquide
- weight_g : le poids ou volume affiché sur l'écran de la balance si on le voit ; sinon, en mode "estimate" seulement, ton estimation du poids de ce qui est visible ; sinon null

Si mode = "label" (valeurs de l'étiquette, colonne « pour 100 g » ou « pour 100 ml » ; si l'étiquette n'a que des valeurs par portion, convertis-les pour 100 avec le poids de la portion) :
- kcal : énergie en kcal, jamais en kJ
- protein, carbs, sugars, fat, fiber : grammes pour 100
- salt_g : sel en grammes pour 100
- sodium_mg : sodium en mg pour 100, seulement s'il est écrit
- potassium_mg : potassium en mg pour 100. S'il est écrit, recopie-le. Sinon, donne TOUJOURS ton estimation d'après ce type de produit (jamais null)
- potassium_source : "label" si le potassium est écrit sur l'étiquette, "estimate" si tu l'as estimé

Si mode = "estimate" (aucun tableau lisible) : estime ce qu'il y a dans l'image, pour TOUT ce qui est visible :
- total_kcal, total_protein, total_carbs, total_fat : totaux pour toute la quantité visible (kcal et grammes)
- total_potassium_mg : potassium total estimé en mg pour toute la quantité visible (jamais null)

Mets null pour tout ce qui n'est pas visible ou pas certain. Des nombres avec un point décimal, sans unité.`;

export interface LabelResult {
  name?: string;
  brand?: string;
  barcode?: string;
  unit: 'g' | 'ml';
  /** Poids ou volume lu sur la balance, ou estimé quand il n'y a pas d'étiquette */
  weight?: number;
  /** Vrai quand les valeurs viennent d'une estimation de l'image et non d'une étiquette */
  estimated: boolean;
  kcal?: number;
  protein?: number;
  carbs?: number;
  sugars?: number;
  fat?: number;
  fiber?: number;
  salt?: number;
  sodium?: number;
  potassium?: number;
  /** Vrai quand le potassium a été estimé par l'IA et non lu sur l'étiquette */
  potassiumEstimated?: boolean;
}

export class LabelReadError extends Error {}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key.trim());
}

export function clearApiKey(): void {
  localStorage.removeItem(KEY_STORAGE);
}

// Valeurs maximales plausibles pour 100 g : au-delà, la lecture s'est sûrement trompée
const LIMITS = {
  kcal: 900,
  protein: 100,
  carbs: 100,
  sugars: 100,
  fat: 100,
  fiber: 100,
  salt: 100,
  sodium: 40_000,
  potassium: 10_000
};
const MAX_WEIGHT = 5000;

const toNumber = (value: unknown, max: number): number | undefined => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= max ? parsed : undefined;
};

const toText = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text !== '' ? text : undefined;
};

/** Vérifie la clé de contrôle d'un code EAN-8, UPC-A, EAN-13 ou GTIN-14 */
function hasValidCheckDigit(code: string): boolean {
  const digits = code.split('').map(Number);
  const check = digits.pop() as number;
  // On pondère 3, 1, 3, 1… en partant du chiffre juste avant la clé
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

const toBarcode = (value: unknown): string | undefined => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return [8, 12, 13, 14].includes(digits.length) && hasValidCheckDigit(digits) ? digits : undefined;
};

/** Transforme la réponse de l'IA en valeurs sûres, ou null si rien d'utile n'a été lu */
export function parseLabelResponse(text: string): LabelResult | null {
  let raw: Record<string, unknown>;
  try {
    const cleaned = text.replace(/```(?:json)?/gi, '').trim();
    raw = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;

  const estimated = raw.mode === 'estimate';
  const result: LabelResult = { unit: raw.unit === 'ml' ? 'ml' : 'g', estimated };

  const weight = toNumber(raw.weight_g, MAX_WEIGHT);
  if (weight !== undefined && weight > 0) result.weight = weight;

  if (estimated) {
    // L'IA donne des totaux pour la quantité visible : on les ramène à 100 g
    if (result.weight === undefined) return null;
    const per100 = (total: unknown) => {
      const value = toNumber(total, 100_000);
      return value === undefined ? undefined : Math.round((value / result.weight!) * 1000) / 10;
    };
    const totals: [keyof typeof LIMITS, unknown][] = [
      ['kcal', raw.total_kcal],
      ['protein', raw.total_protein],
      ['carbs', raw.total_carbs],
      ['fat', raw.total_fat],
      ['potassium', raw.total_potassium_mg]
    ];
    for (const [key, value] of totals) {
      const number = per100(value);
      if (number !== undefined && number <= LIMITS[key]) result[key] = key === 'kcal' || key === 'potassium' ? Math.round(number) : number;
    }
    if (result.potassium !== undefined) result.potassiumEstimated = true;
  } else {
    const fields: [keyof typeof LIMITS, unknown][] = [
      ['kcal', raw.kcal],
      ['protein', raw.protein],
      ['carbs', raw.carbs],
      ['sugars', raw.sugars],
      ['fat', raw.fat],
      ['fiber', raw.fiber],
      ['salt', raw.salt_g],
      ['sodium', raw.sodium_mg],
      ['potassium', raw.potassium_mg]
    ];
    for (const [key, value] of fields) {
      const number = toNumber(value, LIMITS[key]);
      if (number !== undefined) result[key] = number;
    }
    // Le sel prime : le formulaire en déduit le sodium
    if (result.salt !== undefined) delete result.sodium;
    if (result.potassium !== undefined && raw.potassium_source !== 'label') result.potassiumEstimated = true;
  }

  const name = toText(raw.name);
  const brand = toText(raw.brand);
  const barcode = toBarcode(raw.barcode);
  if (name) result.name = name;
  if (brand) result.brand = brand;
  if (barcode) result.barcode = barcode;

  const hasValue = [result.kcal, result.protein, result.carbs, result.fat].some(v => v !== undefined);
  return hasValue ? result : null;
}

const describeFailure = (status: number): string => {
  if (status === 400 || status === 401 || status === 403) {
    return t('Clé refusée par Google. Vérifie-la dans Paramètres.');
  }
  if (status === 429) {
    return t('Limite gratuite atteinte pour le moment. Réessaie dans quelques minutes, ou remplis à la main.');
  }
  return t("Google n'a pas répondu (erreur {status}). Réessaie dans un instant.", { status });
};

const toInlineData = (imageDataUrl: string) => {
  const [header, data] = imageDataUrl.split(',');
  const mimeType = /data:([^;]+);/.exec(header)?.[1] ?? 'image/jpeg';
  return { inline_data: { mime_type: mimeType, data } };
};

/** Envoie 1 à 3 photos (data URL) à Gemini et renvoie ce qui a été lu ou estimé */
export async function readFoodPhotos(
  imageDataUrls: string[],
  apiKey: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike
): Promise<LabelResult> {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: PROMPT }, ...imageDataUrls.map(toInlineData)] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0 }
  });

  let lastStatus = 0;
  for (const model of MODELS) {
    let response;
    try {
      response = await fetchImpl(`${API_BASE}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body
      });
    } catch {
      throw new LabelReadError(t('Pas de connexion à Internet. Réessaie avec du réseau.'));
    }

    if (response.status === 404) {
      lastStatus = 404;
      continue;
    }
    if (!response.ok) throw new LabelReadError(describeFailure(response.status));

    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const result = parseLabelResponse(text);
    if (!result) {
      throw new LabelReadError(t("Je ne vois rien d'exploitable sur ces photos. Cadre bien le produit sur la balance ou le tableau nutritionnel."));
    }
    return result;
  }
  throw new LabelReadError(describeFailure(lastStatus || 500));
}

/** Une seule photo, pour les appels existants */
export function readLabel(
  imageDataUrl: string,
  apiKey: string,
  fetchImpl?: FetchLike
): Promise<LabelResult> {
  return readFoodPhotos([imageDataUrl], apiKey, fetchImpl);
}
