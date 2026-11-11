// Types TypeScript pour l'application de suivi nutritionnel

export interface Portion {
  name: string;           // ex: "biscuit", "bol", "carré"
  grams: number;          // poids en grammes
}

export interface Food {
  id: string;                    // UUID
  name: string;
  brand?: string;
  barcode?: string;
  kcal_per_100g: number;         // pour 100 g ou 100 ml selon baseUnit
  baseUnit?: 'g' | 'ml';         // unité de référence, 'g' si absent
  protein: number;               // g
  carbs: number;                 // g
  sugars?: number;               // g, optionnel
  fat: number;                   // g
  fiber?: number;                // g, optionnel
  salt?: number;                 // g, optionnel
  sodium?: number;               // mg
  potassium?: number;            // mg
  source: 'étiquette' | 'estimation';
  portions: Portion[];
  frequency: number;             // compteur d'utilisations
  lastUsed: string;              // ISO date
  createdAt: string;
  updatedAt: string;
  // Pour les versions de recette (V2)
  version?: number;
  parentId?: string;             // ID de l'aliment original
  versionDate?: string;          // Date de cette version
}

export type MealType =
  | 'Petit-déj'
  | 'Collation'
  | 'Déjeuner'
  | 'Dîner'
  | 'Repas'
  | 'Boisson';

export interface CalculationInfo {
  type: CalculationType;
  values: number[];
  description: string;           // ex: "556 g mangés (675 g − 119 g restes)"
}

// Valeurs pour 100 g d'un aliment noté une seule fois, hors bibliothèque
export interface OneOffValues {
  kcal_per_100g: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;               // mg pour 100
  potassium?: number;            // mg pour 100
}

export const ONE_OFF_FOOD_ID = 'ponctuel';

export interface JournalEntry {
  id: string;
  date: string;                  // YYYY-MM-DD
  time: string;                  // HH:MM
  meal: MealType;
  foodId: string;
  foodName: string;              // dénormalisé pour affichage rapide
  foodSource: 'étiquette' | 'estimation';
  quantity: number;
  unit: 'g' | 'ml' | string;     // ou nom de portion personnalisée
  calculation?: CalculationInfo;
  nutritionSnapshot?: OneOffValues & { portions: Portion[] }; // recette et portions au moment de la saisie
  oneOff?: OneOffValues;         // présent si l'aliment n'est pas dans la bibliothèque
  // Valeurs calculées (dénormalisées)
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
  potassium?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailySummary {
  date: string;                  // YYYY-MM-DD (clé primaire)
  weight?: number;               // kg
  caloriesBurned?: number;
  caloriesBurnedProvisional?: boolean;
  caloriesRest?: number;
  caloriesActivity?: number;
  sleepBedtime?: string;         // HH:MM
  sleepWakeup?: string;          // HH:MM
  sleepDuration?: number;        // heures décimales
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyPhoto {
  date: string;                  // YYYY-MM-DD (clé primaire, une photo par jour)
  image: string;                 // image JPEG compressée, en data URL (vide si le jour est marqué sans photo)
  skipped?: boolean;             // vrai quand l'utilisateur a choisi « pas de photo ce jour-là »
  createdAt: string;
}

// Journée importée pour Ma sèche : des totaux seulement, jamais de repas
export interface CutHistoryDay {
  date: string;                  // YYYY-MM-DD (clé primaire)
  weight?: number;
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  burned?: number;               // calories brûlées du jour
}

export interface HistoryImport {
  type: 'suivi-nutrition-historique';
  version: number;
  cutHistory: CutHistoryDay[];
  photos: DailyPhoto[];
}

export type CalculationType = 'tare' | 'difference' | 'remaining';

export interface MealTemplate {
  id: string;
  name: string;
  meal: MealType;
  items: {
    foodId: string;
    foodName: string;
    quantity: number;
    unit: string;
    kcal?: number;
  }[];
  createdAt: string;
}

export interface NutritionResult {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
  potassium?: number;
}

// Types pour la sauvegarde/restauration
export interface BackupData {
  version: string;
  exportDate: string;
  foods: Food[];
  journal: JournalEntry[];
  dailySummaries: DailySummary[];
  mealTemplates: MealTemplate[];
  photos?: DailyPhoto[];         // absent des sauvegardes d'avant l'onglet Photos
  cutHistory?: CutHistoryDay[];  // absent des sauvegardes d'avant l'import
}

// Types pour les calculs
export interface BalanceResult {
  net: number;                   // mangé - brûlé
  remainingToObjective: number;  // kcal restantes pour atteindre l'objectif (positif = à manger, négatif = à brûler)
  message: string;               // message lisible
}

// Constantes
export const MEAL_TYPES: MealType[] = [
  'Petit-déj',
  'Collation',
  'Déjeuner',
  'Dîner',
  'Repas',
  'Boisson'
];

export const OBJECTIVE_DEFAULT = -500; // kcal par jour