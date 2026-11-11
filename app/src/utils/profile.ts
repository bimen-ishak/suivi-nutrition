// Profil de la personne en sèche : sert à estimer sa dépense et ses objectifs de macros
import { carbLimit, proteinTarget } from './cut';

export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'very';
export type Pace = 'gentle' | 'normal' | 'fast';

export interface CutProfile {
  sex: Sex;
  age: number;
  height: number; // cm
  weight: number; // kg, au moment du questionnaire
  activity: Activity;
  pace: Pace;
}

export interface MacroTargets {
  protein: number;
  fat: number;
  carbs: number;
}

const STORAGE_KEY = 'cutProfile';
const CHANGE_EVENT = 'cut-profile-change';

/** Multiplicateurs d'activité couramment utilisés avec la formule de Mifflin-St Jeor */
export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725
};

/** Déficit visé pour chaque rythme, en kcal par jour (négatif = déficit) */
export const PACE_DEFICITS: Record<Pace, number> = {
  gentle: -300,
  normal: -500,
  fast: -750
};

const FAT_G_PER_KG = 0.8;
const MIN_FAT_G = 40;

const isProfile = (value: unknown): value is CutProfile => {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  const positive = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0;
  return (p.sex === 'male' || p.sex === 'female')
    && positive(p.age) && positive(p.height) && positive(p.weight)
    && typeof p.activity === 'string' && p.activity in ACTIVITY_FACTORS
    && typeof p.pace === 'string' && p.pace in PACE_DEFICITS;
};

export function getProfile(): CutProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: CutProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onProfileChange(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

/** Valeurs plausibles pour un adulte : protège les calculs d'une faute de frappe */
export function validProfile(profile: CutProfile): boolean {
  return profile.age >= 15 && profile.age <= 100
    && profile.height >= 120 && profile.height <= 230
    && profile.weight >= 35 && profile.weight <= 300;
}

/** Métabolisme de base (Mifflin-St Jeor), en kcal par jour */
export function basalMetabolism(profile: CutProfile, weight = profile.weight): number {
  const base = 10 * weight + 6.25 * profile.height - 5 * profile.age;
  return base + (profile.sex === 'male' ? 5 : -161);
}

/** Dépense quotidienne estimée, arrondie à 10 kcal */
export function estimatedExpenditure(profile: CutProfile, weight = profile.weight): number {
  return Math.round((basalMetabolism(profile, weight) * ACTIVITY_FACTORS[profile.activity]) / 10) * 10;
}

/**
 * Objectifs de macros : protéines selon le poids, lipides 0,8 g/kg (au moins 40 g),
 * glucides = le reste des calories quand on les connaît, sinon le plafond habituel.
 */
export function macroTargets(weight: number, budget: number | null): MacroTargets {
  const protein = proteinTarget(weight);
  const fat = Math.max(MIN_FAT_G, Math.round((weight * FAT_G_PER_KG) / 5) * 5);
  const carbs = budget === null
    ? carbLimit(weight)
    : Math.max(0, Math.round((budget - protein * 4 - fat * 9) / 4 / 5) * 5);
  return { protein, fat, carbs };
}
