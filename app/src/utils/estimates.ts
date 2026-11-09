// Valeurs moyennes proposées quand un aliment a des calories mais pas de macros ni de potassium
import { GENERIC_FOODS, type GenericFood } from '../data/genericFoods';

export interface Estimate {
  protein: number;
  carbs: number;
  fat: number;
  potassium: number;
  /** « generic » : copié sur un aliment proche de la base ; « average » : répartition moyenne des calories */
  basis: 'generic' | 'average';
  matchedName?: string;
}

// Potassium moyen en mg pour 100 g, par catégorie de la base (ordres de grandeur, pas des mesures)
const POTASSIUM_BY_CATEGORY: Record<string, number> = {
  Fruits: 250,
  'Légumes': 300,
  'Légumineuses': 400,
  'Féculents': 150,
  Viandes: 320,
  Poissons: 350,
  'Produits laitiers': 150,
  Boissons: 50,
  'Petit-déjeuner': 200,
  Snacks: 250,
  'Sucré': 120,
  Viennoiseries: 120,
  'Plats préparés': 200,
  Divers: 150
};
const DEFAULT_POTASSIUM = 150;

// Répartition moyenne d'une alimentation courante, sur les calories : 15 % protéines, 50 % glucides, 35 % lipides
const AVERAGE_SPLIT = { protein: 0.15, carbs: 0.5, fat: 0.35 };
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 };

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ');

const words = (text: string) => normalize(text).split(/\s+/).filter(word => word.length >= 3);

/** L'aliment de la base qui partage le plus de mots avec le nom donné, ou undefined */
function findClosest(name: string): GenericFood | undefined {
  const wanted = new Set(words(name));
  let best: { food: GenericFood; score: number } | undefined;
  for (const food of GENERIC_FOODS) {
    const score = words(food.name).filter(word => wanted.has(word)).length;
    if (score > 0 && (!best || score > best.score)) best = { food, score };
  }
  return best?.food;
}

const round = (value: number) => Math.round(value * 10) / 10;

export function estimateMissingValues(name: string, kcal: number): Estimate {
  if (kcal <= 0) return { protein: 0, carbs: 0, fat: 0, potassium: 0, basis: 'average' };

  const match = findClosest(name);
  if (match && match.kcal > 0) {
    const ratio = kcal / match.kcal;
    return {
      protein: round(match.protein * ratio),
      carbs: round(match.carbs * ratio),
      fat: round(match.fat * ratio),
      potassium: Math.round((POTASSIUM_BY_CATEGORY[match.category] ?? DEFAULT_POTASSIUM) * ratio),
      basis: 'generic',
      matchedName: match.name
    };
  }

  return {
    protein: round((kcal * AVERAGE_SPLIT.protein) / KCAL_PER_G.protein),
    carbs: round((kcal * AVERAGE_SPLIT.carbs) / KCAL_PER_G.carbs),
    fat: round((kcal * AVERAGE_SPLIT.fat) / KCAL_PER_G.fat),
    potassium: DEFAULT_POTASSIUM,
    basis: 'average'
  };
}

interface FilledValues {
  kcal: number;
  protein: string;
  carbs: string;
  fat: string;
  potassium: string;
}

/** Vrai quand les calories sont connues mais que les macros ou le potassium manquent */
export function needsEstimate(values: FilledValues): boolean {
  if (values.kcal <= 0) return false;
  const macrosMissing = [values.protein, values.carbs, values.fat].every(value => value.trim() === '');
  return macrosMissing || values.potassium.trim() === '';
}
