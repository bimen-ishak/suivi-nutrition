// Les dictionnaires sont indexés par les textes français de l'application.
import { AR, type ArabicEntry } from './ar';

import { EN } from './en';

export const LANGUAGES = [
  { id: 'fr', label: 'Français', locale: 'fr-FR', name: 'French' },
  { id: 'ar-EG', label: 'عربي مصري', locale: 'ar-EG-u-nu-latn', name: 'Egyptian Arabic' },
  { id: 'en', label: 'English', locale: 'en-US', name: 'English' }
] as const;

export type Language = typeof LANGUAGES[number]['id'];

function languageConfig(language: string | null) {
  return LANGUAGES.find(option => option.id === language) ?? LANGUAGES[0];
}

const LANGUAGE_KEY = 'language';

export function getLanguage(): Language {
  try {
    return languageConfig(localStorage.getItem(LANGUAGE_KEY)).id;
  } catch {
    return 'fr';
  }
}

export function setLanguage(language: Language): void {
  localStorage.setItem(LANGUAGE_KEY, language);
}

export const isRtl = (language: Language = getLanguage()): boolean => language === 'ar-EG';

/** Format des dates et des nombres : chiffres occidentaux en arabe, plus lisibles pour des calories */
export function locale(): string {
  return languageConfig(getLanguage()).locale;
}

/** Règle la langue et le sens d'écriture de toute la page */
export function applyDirection(): void {
  const language = getLanguage();
  document.documentElement.setAttribute('lang', language);
  document.documentElement.setAttribute('dir', isRtl(language) ? 'rtl' : 'ltr');
}

type Params = Record<string, string | number>;

const fill = (text: string, params?: Params): string =>
  params ? text.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match)) : text;

/** Le texte dans la langue choisie, avec les variables {nom} remplacées */
export function t(fr: string, params?: Params): string {
  const language = getLanguage();
  const entry = language === 'ar-EG' ? AR[fr] : language === 'en' ? EN[fr] : undefined;
  return fill(typeof entry === 'string' ? entry : fr, params);
}

/** Choix entre singulier et pluriel. En arabe : un, deux, quelques-uns (3 à 10), beaucoup (11 et plus) */
export function tn(frOne: string, frMany: string, count: number, params?: Params): string {
  // En français, 0 et 1 prennent le singulier
  const french = count < 2 ? frOne : frMany;
  const language = getLanguage();
  if (language === 'fr') return fill(french, params);
  if (language === 'en') {
    const key = count === 1 ? frOne : frMany;
    return fill(EN[key] ?? key, params);
  }
  const entry: ArabicEntry | undefined = AR[frMany];
  if (entry === undefined) return fill(french, params);
  if (typeof entry === 'string') return fill(entry, params);
  const form = count === 1 ? entry.one : count === 2 ? entry.two : count >= 3 && count <= 10 ? entry.few : entry.many;
  return fill(form, params);
}

const UNITS: Record<string, { fr: string; ar: string }> = {
  g: { fr: 'g', ar: 'جم' },
  kg: { fr: 'kg', ar: 'كجم' },
  mg: { fr: 'mg', ar: 'مجم' },
  ml: { fr: 'ml', ar: 'مل' },
  kcal: { fr: 'kcal', ar: 'سعرة' },
  h: { fr: 'h', ar: 'س' },
  j: { fr: 'j', ar: 'يوم' }
};

/** Abréviation d'une unité (g, kg, mg, ml, kcal, h, j) dans la langue choisie */
export function unitLabel(name: 'g' | 'kg' | 'mg' | 'ml' | 'kcal' | 'h' | 'j'): string {
  const language = getLanguage();
  if (language === 'en' && name === 'j') return 'd';
  return UNITS[name][language === 'ar-EG' ? 'ar' : 'fr'];
}

const MACRO_LETTERS = { P: 'ب', G: 'ك', L: 'د' } as const;

/** Initiale d'un nutriment : P, G, L en français ; ب (بروتين), ك (كربوهيدرات), د (دهون) en arabe */
export function macroLetter(letter: 'P' | 'G' | 'L'): string {
  const language = getLanguage();
  if (language === 'en') return { P: 'P', G: 'C', L: 'F' }[letter];
  return language === 'ar-EG' ? MACRO_LETTERS[letter] : letter;
}

/** Unité d'une quantité saisie : g et ml sont traduits, une portion personnalisée (« biscuit ») reste telle quelle */
export function displayUnit(value: string): string {
  return value === 'g' || value === 'ml' ? unitLabel(value) : value;
}

/** Garde un nombre signé (comme -500) lisible de gauche à droite au milieu d'un texte arabe */
export function ltr(text: string | number): string {
  const value = String(text);
  return isRtl() ? `⁦${value}⁩` : value;
}
