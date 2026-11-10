// Choix de l'IA qui lit les photos (OpenRouter gratuit ou Gemini) et clés de chacune, gardées sur le téléphone
import { getApiKey as getGeminiKey, readFoodPhotos, type LabelResult } from './labelReader';
import { readPhotosWithOpenRouter } from './openRouterReader';

export type Provider = 'openrouter' | 'gemini';

const PROVIDER_STORAGE = 'aiProvider';
const OPENROUTER_KEY_STORAGE = 'openRouterApiKey';

export function getOpenRouterKey(): string | null {
  try {
    return localStorage.getItem(OPENROUTER_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setOpenRouterKey(key: string): void {
  localStorage.setItem(OPENROUTER_KEY_STORAGE, key.trim());
}

export function clearOpenRouterKey(): void {
  localStorage.removeItem(OPENROUTER_KEY_STORAGE);
}

export function getProvider(): Provider {
  try {
    const stored = localStorage.getItem(PROVIDER_STORAGE);
    if (stored === 'openrouter' || stored === 'gemini') return stored;
  } catch {
    // Stockage indisponible : on retombe sur le choix par défaut
  }
  // Sans choix fait, on garde Gemini pour qui n'a que cette clé, sinon OpenRouter
  return getGeminiKey() !== null && getOpenRouterKey() === null ? 'gemini' : 'openrouter';
}

export function setProvider(provider: Provider): void {
  localStorage.setItem(PROVIDER_STORAGE, provider);
}

/** La clé de l'IA choisie, ou null s'il n'y en a pas encore */
export function getActiveKey(): string | null {
  return getProvider() === 'openrouter' ? getOpenRouterKey() : getGeminiKey();
}

/** Lit ou estime ce qu'il y a sur les photos avec l'IA choisie */
export function analysePhotos(images: string[]): Promise<LabelResult> {
  const key = getActiveKey();
  if (!key) return Promise.reject(new Error('Aucune clé enregistrée'));
  return getProvider() === 'openrouter' ? readPhotosWithOpenRouter(images, key) : readFoodPhotos(images, key);
}
