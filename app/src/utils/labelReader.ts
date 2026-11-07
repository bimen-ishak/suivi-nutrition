// Lecture d'une étiquette nutritionnelle par l'IA Gemini, avec la clé personnelle de l'utilisateur
const KEY_STORAGE = 'geminiApiKey';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// Si un modèle disparaît (erreur 404), on essaie le suivant
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

const PROMPT = `Tu lis l'étiquette nutritionnelle d'un produit alimentaire sur une photo.
Réponds UNIQUEMENT par un objet JSON avec ces clés :
- name : nom du produit (texte) ou null
- brand : marque (texte) ou null
- unit : "g" pour un solide, "ml" pour un liquide
- kcal : énergie en kcal pour 100 g (ou 100 ml), jamais en kJ
- protein, carbs, sugars, fat, fiber : grammes pour 100 g (ou 100 ml)
- salt_g : sel en grammes pour 100 g (ou 100 ml)
- sodium_mg : sodium en mg pour 100 g (ou 100 ml), seulement s'il est écrit
- potassium_mg : potassium en mg pour 100 g (ou 100 ml), seulement s'il est écrit
Prends la colonne « pour 100 g » ou « pour 100 ml ». S'il n'y a que des valeurs par portion, convertis-les pour 100 avec le poids de la portion.
Mets null pour tout ce qui n'est pas visible. Des nombres avec un point décimal, sans unité.`;

export interface LabelResult {
  name?: string;
  brand?: string;
  unit: 'g' | 'ml';
  kcal?: number;
  protein?: number;
  carbs?: number;
  sugars?: number;
  fat?: number;
  fiber?: number;
  salt?: number;
  sodium?: number;
  potassium?: number;
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

const toNumber = (value: unknown, max: number): number | undefined => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= max ? parsed : undefined;
};

const toText = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text !== '' ? text : undefined;
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

  const result: LabelResult = { unit: raw.unit === 'ml' ? 'ml' : 'g' };
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

  const name = toText(raw.name);
  const brand = toText(raw.brand);
  if (name) result.name = name;
  if (brand) result.brand = brand;

  const hasValue = [result.kcal, result.protein, result.carbs, result.fat].some(v => v !== undefined);
  return hasValue ? result : null;
}

const describeFailure = (status: number): string => {
  if (status === 400 || status === 401 || status === 403) {
    return 'Clé refusée par Google. Vérifie-la dans Paramètres.';
  }
  if (status === 429) {
    return 'Limite gratuite atteinte pour le moment. Réessaie dans quelques minutes, ou remplis à la main.';
  }
  return `Google n'a pas répondu (erreur ${status}). Réessaie dans un instant.`;
};

/** Envoie la photo (data URL JPEG) à Gemini et renvoie les valeurs lues */
export async function readLabel(
  imageDataUrl: string,
  apiKey: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike
): Promise<LabelResult> {
  const [header, data] = imageDataUrl.split(',');
  const mimeType = /data:([^;]+);/.exec(header)?.[1] ?? 'image/jpeg';
  const body = JSON.stringify({
    contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data } }] }],
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
      throw new LabelReadError('Pas de connexion à Internet. Réessaie avec du réseau.');
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
    if (!result) throw new LabelReadError('Je ne vois pas de valeurs sur cette photo. Cadre bien le tableau nutritionnel.');
    return result;
  }
  throw new LabelReadError(describeFailure(lastStatus || 500));
}
