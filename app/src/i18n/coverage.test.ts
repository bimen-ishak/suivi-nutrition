// Vérifie que chaque texte de l'application a sa traduction en arabe égyptien
import { describe, it, expect } from 'vitest';
import { AR } from './ar';
import { EN } from './en';
import { GENERIC_FOODS, GENERIC_CATEGORIES } from '../data/genericFoods';
import { MEAL_TYPES } from '../types';

// Tout le code source de l'application, lu comme du texte
const SOURCES = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Les fichiers de l'application, sans les tests, les traductions et les images */
const sourceFiles = Object.entries(SOURCES).filter(
  ([path]) => !/\.test\./.test(path) && !path.includes('/i18n/') && !path.includes('/test/') && !path.includes('/assets/')
);

const unescape = (text: string) => text.replace(/\\(['"\\])/g, '$1');

/** Les textes passés à t('…') et tn('…', '…') dans le code */
function usedKeys(): { key: string; file: string }[] {
  const found: { key: string; file: string }[] = [];
  for (const [file, code] of sourceFiles) {
    for (const match of code.matchAll(/\bti?\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g)) {
      found.push({ key: unescape(match[1] ?? match[2]), file });
    }
    for (const match of code.matchAll(/\btn\(\s*(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\s*,\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g)) {
      found.push({ key: unescape(match[1] ?? match[2]), file });
    }
  }
  return found;
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

describe('traductions arabes', () => {
  const keys = usedKeys();

  it('trouve bien les textes du code', () => {
    expect(keys.length).toBeGreaterThan(250);
  });

  it('traduit chaque texte utilisé dans le code', () => {
    const missing = [...new Set(keys.filter(({ key }) => !(key in AR)).map(({ key }) => key))];
    expect(missing).toEqual([]);
  });

  it('garde les mêmes variables {…} dans la traduction', () => {
    const wrong: string[] = [];
    for (const { key } of keys) {
      const entry = AR[key];
      if (entry === undefined) continue;
      const forms = typeof entry === 'string' ? [entry] : Object.values(entry);
      for (const form of forms) {
        const wanted = placeholders(key);
        const got = placeholders(form);
        const ok = typeof entry === 'string' ? JSON.stringify(wanted) === JSON.stringify(got) : got.every(name => wanted.includes(name));
        if (!ok) wrong.push(`${key} → ${form}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('n\'a aucune traduction vide', () => {
    const empty = Object.entries(AR).filter(([, value]) =>
      typeof value === 'string' ? value.trim() === '' : Object.values(value).some(form => form.trim() === '')
    );
    expect(empty).toEqual([]);
  });

  it('traduit les noms et catégories de la base générique', () => {
    const missing = [...GENERIC_FOODS.map(food => food.name), ...GENERIC_CATEGORIES].filter(name => !(name in AR));
    expect(missing).toEqual([]);
  });

  it('traduit les repas', () => {
    expect(MEAL_TYPES.filter(meal => !(meal in AR))).toEqual([]);
  });

  it('écrit les traductions en lettres arabes', () => {
    const latinOnly = Object.entries(AR)
      .filter(([, value]) => typeof value === 'string' && !/[؀-ۿ]/.test(value))
      .map(([key]) => key);
    // Quelques textes restent identiques dans les deux langues (noms propres, symboles)
    expect(latinOnly.sort()).toEqual(['Google AI Studio']);
  });
});

describe('English translations', () => {
  it('covers the interface, generic food database, and meal types', () => {
    const keys = new Set([...usedKeys().map(({ key }) => key), ...Object.keys(AR), ...MEAL_TYPES, '{n} aliment']);
    expect([...keys].filter(key => !EN[key]?.trim())).toEqual([]);
  });

  it('preserves interpolation parameters', () => {
    const mismatches = Object.entries(EN).filter(([key, value]) =>
      JSON.stringify(placeholders(key)) !== JSON.stringify(placeholders(value))
    );
    expect(mismatches).toEqual([]);
  });
});
