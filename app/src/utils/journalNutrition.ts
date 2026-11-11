import type { JournalEntry, NutritionResult } from '../types';
import { calculateNutrition, convertPortionToGrams } from './calculations';

/** Only use the saved recipe. Library updates must never rewrite journal history. */
export function historicalUnits(entry: JournalEntry): string[] {
  const hasBasis = entry.nutritionSnapshot || entry.oneOff || entry.unit === 'g' || entry.unit === 'ml';
  return [...new Set([
    entry.unit,
    ...(hasBasis ? ['g', 'ml'] : []),
    ...(entry.nutritionSnapshot?.portions.map(portion => portion.name) ?? [])
  ])];
}

export function historicalNutrition(entry: JournalEntry, quantity: number, unit: string): NutritionResult | null {
  if (!Number.isFinite(quantity) || quantity <= 0 || !historicalUnits(entry).includes(unit)) return null;
  const stored = {
    kcal: entry.kcal, protein: entry.protein, carbs: entry.carbs, fat: entry.fat,
    sodium: entry.sodium, potassium: entry.potassium
  };
  // Preserve exact stored values for meal/time-only changes, including legacy entries.
  if (quantity === entry.quantity && unit === entry.unit) return stored;

  const snapshot = entry.nutritionSnapshot ?? entry.oneOff;
  if (snapshot) {
    const grams = unit === 'g' || unit === 'ml'
      ? quantity
      : convertPortionToGrams(quantity, unit, entry.nutritionSnapshot?.portions ?? []);
    if (grams === null) return null;
    return {
      ...calculateNutrition(snapshot, grams),
      ...(snapshot.sodium === 0 ? { sodium: 0 } : {}),
      ...(snapshot.potassium === 0 ? { potassium: 0 } : {})
    };
  }

  // Older backups have no recipe snapshot. Scale their recorded totals in the
  // original unit; an old custom portion's gram weight cannot be safely recovered.
  if (!Number.isFinite(entry.quantity) || entry.quantity <= 0) return null;
  const ratio = quantity / entry.quantity;
  return {
    kcal: Math.round(entry.kcal * ratio),
    protein: Math.round(entry.protein * ratio * 10) / 10,
    carbs: Math.round(entry.carbs * ratio * 10) / 10,
    fat: Math.round(entry.fat * ratio * 10) / 10,
    sodium: entry.sodium === undefined ? undefined : Math.round(entry.sodium * ratio),
    potassium: entry.potassium === undefined ? undefined : Math.round(entry.potassium * ratio)
  };
}
