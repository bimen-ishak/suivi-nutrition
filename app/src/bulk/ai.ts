import { readFoodPhotos } from '../utils/labelReader';
import { readPhotosWithOpenRouter } from '../utils/openRouterReader';
import type { Provider } from '../utils/aiReader';
export type { Provider } from '../utils/aiReader';

// Each space owns its credentials: changing the bulking provider cannot affect cutting.
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
export const getApiKey = () => read('bulkGeminiApiKey');
export const setApiKey = (key: string) => localStorage.setItem('bulkGeminiApiKey', key.trim());
export const clearApiKey = () => localStorage.removeItem('bulkGeminiApiKey');
export const getOpenRouterKey = () => read('bulkOpenRouterApiKey');
export const setOpenRouterKey = (key: string) => localStorage.setItem('bulkOpenRouterApiKey', key.trim());
export const clearOpenRouterKey = () => localStorage.removeItem('bulkOpenRouterApiKey');
export const getProvider = (): Provider => read('bulkAiProvider') === 'openrouter' ? 'openrouter' : 'gemini';
export const setProvider = (provider: Provider) => localStorage.setItem('bulkAiProvider', provider);
export const getActiveKey = () => getProvider() === 'gemini' ? getApiKey() : getOpenRouterKey();
export function analysePhotos(images: string[], context = '') {
  const key = getActiveKey();
  if (!key) return Promise.reject(new Error('Missing bulk AI key'));
  return getProvider() === 'gemini'
    ? readFoodPhotos(images, key, undefined, context)
    : readPhotosWithOpenRouter(images, key, undefined, context);
}
