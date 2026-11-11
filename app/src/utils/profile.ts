// Profil de la personne en sèche : métabolisme de base et plan « manger / brûler » choisi par elle
import { carbLimit, proteinTarget } from './cut';

export type Sex = 'male' | 'female';

export interface CutProfile {
  sex: Sex;
  age: number;
  height: number; // cm
  weight: number; // kg, au moment du questionnaire
  eat: number; // kcal à manger par jour
  burn: number; // kcal à brûler par jour (dépense visée)
}

export interface MacroTargets {
  protein: number;
  fat: number;
  carbs: number;
}

const STORAGE_KEY = 'cutProfile';
const CHANGE_EVENT = 'cut-profile-change';

/** Déficits proposés dans le questionnaire, en kcal par jour */
export const DEFICIT_PRESETS = [300, 500, 750];

const FAT_G_PER_KG = 0.8;
const MIN_FAT_G = 40;

const isProfile = (value: unknown): value is CutProfile => {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  const positive = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0;
  return (p.sex === 'male' || p.sex === 'female')
    && positive(p.age) && positive(p.height) && positive(p.weight)
    && positive(p.eat) && positive(p.burn);
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

type Body = Pick<CutProfile, 'sex' | 'age' | 'height' | 'weight'>;

/** Valeurs plausibles pour un adulte : protège les calculs d'une faute de frappe */
export function validBody(body: Body): boolean {
  return body.age >= 15 && body.age <= 100
    && body.height >= 120 && body.height <= 230
    && body.weight >= 35 && body.weight <= 300;
}

/** Un plan utilisable : on mange et on brûle des quantités réalistes */
export function validPlan(eat: number, burn: number): boolean {
  return eat >= 800 && eat <= 6000 && burn >= 800 && burn <= 8000;
}

/** Métabolisme de base (Mifflin-St Jeor), arrondi à 10 kcal */
export function basalMetabolism(body: Body, weight = body.weight): number {
  const base = 10 * weight + 6.25 * body.height - 5 * body.age + (body.sex === 'male' ? 5 : -161);
  return Math.round(base / 10) * 10;
}

/**
 * Plan proposé pour un déficit : manger un peu au-dessus du métabolisme de base
 * (centaine supérieure), et brûler ce qu'on mange plus le déficit.
 */
export function proposePlan(bmr: number, deficit: number): { eat: number; burn: number } {
  const eat = Math.floor(bmr / 100) * 100 + 100;
  return { eat, burn: eat + deficit };
}

/**
 * Dépense retenue pour la journée. Une dépense Santé de la journée en cours ne compte que
 * jusqu'à l'heure de l'import : tant qu'elle reste sous la dépense prévue, on garde la prévision.
 */
export function dayExpenditure(
  burned: number | undefined,
  provisional: boolean,
  planned: number | null
): { value: number | null; estimated: boolean } {
  if (burned && !(provisional && planned !== null && planned > burned)) return { value: burned, estimated: false };
  if (planned !== null) return { value: planned, estimated: true };
  return { value: burned || null, estimated: false };
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
