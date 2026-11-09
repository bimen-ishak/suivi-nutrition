// Fonctions de calcul pur (sans effets de bord) - à tester unitairement

import type { Food, Portion, NutritionResult, BalanceResult } from '../types';
import { t } from '../i18n';

/**
 * Calcule le sodium (mg) à partir du sel (g)
 * sodium = sel × 400
 */
export function calculateSodiumFromSalt(saltGrams: number): number {
  return Math.round(saltGrams * 400);
}

/**
 * Convertit une quantité en portions personnalisées vers des grammes
 * @param quantity Quantité (ex: 4)
 * @param portionName Nom de la portion (ex: "biscuit")
 * @param portions Liste des portions définies pour cet aliment
 * @returns Quantité en grammes
 */
export function convertPortionToGrams(
  quantity: number,
  portionName: string,
  portions: Portion[]
): number | null {
  const portion = portions.find(p => p.name.toLowerCase() === portionName.toLowerCase());
  if (!portion) return null;
  return quantity * portion.grams;
}

/**
 * Calcule les valeurs nutritionnelles pour une quantité donnée
 */
export function calculateNutrition(
  food: Pick<Food, 'kcal_per_100g' | 'protein' | 'carbs' | 'fat' | 'sodium' | 'potassium'>,
  quantityGrams: number
): NutritionResult {
  const ratio = quantityGrams / 100;

  return {
    kcal: Math.round(food.kcal_per_100g * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    sodium: food.sodium ? Math.round(food.sodium * ratio) : undefined,
    potassium: food.potassium ? Math.round(food.potassium * ratio) : undefined
  };
}

/**
 * Calcule le poids net par tare : poids total - poids d'un ingrédient connu
 * ex: bol 200g - céréales 100g = 100g de lait
 */
export function calculateTare(totalWeight: number, knownWeight: number): number {
  return totalWeight - knownWeight;
}

/**
 * Calcule le poids mangé par différence : poids avant - poids après
 * ex: 675g pesés - 119g restes = 556g mangés
 */
export function calculateRemaining(servedWeight: number, leftoverWeight: number): number {
  return servedWeight - leftoverWeight;
}

/**
 * Calcule le sommeil en heures décimales
 * Gère le passage de minuit
 * Si coucher == lever, retourne 0 (pas de sommeil enregistré)
 */
export function calculateSleepDuration(bedtime: string, wakeup: string): number {
  const [bedH, bedM] = bedtime.split(':').map(Number);
  const [wakeH, wakeM] = wakeup.split(':').map(Number);

  let bedMinutes = bedH * 60 + bedM;
  let wakeMinutes = wakeH * 60 + wakeM;

  // Si même heure, pas de sommeil (ou erreur de saisie)
  if (bedMinutes === wakeMinutes) {
    return 0;
  }

  // Si le lever est avant le coucher (passage de minuit), ajouter 24h
  if (wakeMinutes < bedMinutes) {
    wakeMinutes += 24 * 60;
  }

  const durationMinutes = wakeMinutes - bedMinutes;
  return Math.round(durationMinutes / 6) / 10; // Arrondi à 0.1h près (6 min)
}

/**
 * Calcule le bilan quotidien
 * @param caloriesEaten Calories mangées
 * @param caloriesBurned Calories brûlées (repos + activité)
 * @param objective Objectif quotidien (défaut -500)
 */
export function calculateDailyBalance(
  caloriesEaten: number,
  caloriesBurned: number,
  objective: number = -500
): BalanceResult {
  const net = caloriesEaten - caloriesBurned;
  const remainingToObjective = net - objective; // négatif = il reste à manger, positif = il faut brûler

  let message: string;
  if (remainingToObjective > 0) {
    message = t('Il faut brûler {n} kcal de plus pour atteindre {objectif} kcal', { n: remainingToObjective, objectif: objective });
  } else if (remainingToObjective < 0) {
    message = t('Il te reste {n} kcal à manger pour atteindre {objectif} kcal', { n: Math.abs(remainingToObjective), objectif: objective });
  } else {
    message = t('Objectif atteint exactement !');
  }

  return {
    net,
    remainingToObjective,
    message
  };
}

/**
 * Génère la description textuelle d'un calcul avancé
 */
export function generateCalculationDescription(
  type: 'tare' | 'difference' | 'remaining',
  values: number[]
): string {
  switch (type) {
    case 'tare':
      return t('{a} g − {b} g = {r} g (tare)', { a: values[0], b: values[1], r: values[0] - values[1] });
    case 'difference':
      return t('{a} g − {b} g = {r} g (différence)', { a: values[0], b: values[1], r: values[0] - values[1] });
    case 'remaining':
      return t('{a} g − {b} g = {r} g mangés (restes)', { a: values[0], b: values[1], r: values[0] - values[1] });
    default:
      return '';
  }
}

/**
 * Vérifie la cohérence macros/kcal
 * lipides × 9 + glucides × 4 + protéines × 4 ≈ kcal
 * Retourne l'écart en pourcentage
 */
export function checkMacroConsistency(
  kcal: number,
  protein: number,
  carbs: number,
  fat: number
): { consistent: boolean; calculatedKcal: number; diffPercent: number } {
  const calculatedKcal = fat * 9 + carbs * 4 + protein * 4;
  const diffPercent = kcal > 0 ? Math.abs((calculatedKcal - kcal) / kcal) * 100 : 100;
  return {
    consistent: diffPercent <= 10,
    calculatedKcal: Math.round(calculatedKcal),
    diffPercent: Math.round(diffPercent * 10) / 10
  };
}