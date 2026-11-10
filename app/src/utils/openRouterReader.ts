// Lecture de photos d'un produit par une IA gratuite d'OpenRouter, avec la clé personnelle de l'utilisateur
import { t } from '../i18n';
import { PROMPT, parseLabelResponse, LabelReadError, type LabelResult } from './labelReader';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// OpenRouter essaie ces modèles gratuits dans l'ordre : si l'un est saturé, il passe au suivant tout seul
export const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3.5-super-vl:free'
];
const TIMEOUT_MS = 60_000;

type FetchLike = (url: string, init: {
  method: string;
  headers: Record<string, string>;
  body: string;
  signal?: AbortSignal;
}) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const describeFailure = (status: number): string => {
  if (status === 401 || status === 403) return t('Clé refusée par OpenRouter. Vérifie-la dans Paramètres.');
  if (status === 402) return t('OpenRouter refuse la demande : le solde de ton compte est négatif.');
  if (status === 429) return t('Limite gratuite atteinte (environ 50 lectures par jour). Réessaie plus tard, ou remplis à la main.');
  return t("OpenRouter n'a pas répondu (erreur {status}). Réessaie dans un instant.", { status });
};

/** Envoie 1 à 3 photos (data URL) à une IA gratuite d'OpenRouter et renvoie ce qui a été lu ou estimé */
export async function readPhotosWithOpenRouter(
  imageDataUrls: string[],
  apiKey: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike
): Promise<LabelResult> {
  const body = JSON.stringify({
    models: OPENROUTER_MODELS,
    temperature: 0,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: PROMPT },
        ...imageDataUrls.map(url => ({ type: 'image_url', image_url: { url } }))
      ]
    }]
  });

  // AbortSignal.timeout n'existe pas sur les anciens iPhone : on arme le délai à la main
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  let response;
  try {
    response = await fetchImpl(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body,
      signal: controller.signal
    });
  } catch (error) {
    if (timedOut) throw new LabelReadError(t("L'IA met trop de temps à répondre. Réessaie, ou remplis à la main."));
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error('Appel OpenRouter échoué:', error);
    throw new LabelReadError(`${t('Pas de connexion à Internet. Réessaie avec du réseau.')} (${detail})`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new LabelReadError(describeFailure(response.status));

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
    error?: { code?: number };
  };
  // OpenRouter peut répondre 200 avec une erreur dans le corps
  if (payload.error) throw new LabelReadError(describeFailure(payload.error.code ?? 500));

  const text = payload.choices?.[0]?.message?.content ?? '';
  const result = parseLabelResponse(text);
  if (!result) {
    throw new LabelReadError(t("Je ne vois rien d'exploitable sur ces photos. Cadre bien le produit sur la balance ou le tableau nutritionnel."));
  }
  return result;
}
