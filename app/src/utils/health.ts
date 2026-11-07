// Import des données d'Apple Santé : un Raccourci iPhone copie un texte, l'app le lit
import type { DailySummary } from '../types';

export interface HealthData {
  weight?: number;   // kg
  rest?: number;     // kcal au repos
  activity?: number; // kcal actives
  burned?: number;   // dépense totale, si le raccourci l'a déjà calculée
}

const FIELDS: { key: keyof HealthData; label: RegExp; min: number; max: number }[] = [
  { key: 'weight', label: /poids|weight/i, min: 30, max: 300 },
  { key: 'rest', label: /repos|rest/i, min: 100, max: 6000 },
  { key: 'activity', label: /actives?|activity/i, min: 0, max: 8000 },
  { key: 'burned', label: /brul|brûl|burned|total/i, min: 100, max: 12000 }
];

const SPACES = /[\s  ]/g;

/** Cherche « nom : nombre » sur une ligne, avec virgule ou point décimal */
function readNumber(text: string, label: RegExp): number | undefined {
  const line = new RegExp(`(?:${label.source})[^\\d\\n:=]*[:=]\\s*(-?[\\d\\s\\u00a0\\u202f]+(?:[.,]\\d+)?)`, label.flags);
  const match = line.exec(text);
  if (!match) return undefined;
  const value = parseFloat(match[1].replace(SPACES, '').replace(',', '.'));
  return Number.isNaN(value) ? undefined : value;
}

export function parseHealthText(text: string): HealthData {
  const data: HealthData = {};
  for (const { key, label, min, max } of FIELDS) {
    const value = readNumber(text, label);
    if (value !== undefined && value >= min && value <= max) data[key] = value;
  }
  return data;
}

/** Fusionne les données de Santé dans le bilan du jour, sans effacer ce qui y est déjà */
export function applyHealthToSummary(
  existing: DailySummary | undefined,
  date: string,
  data: HealthData,
  now = new Date().toISOString()
): DailySummary {
  const summary: DailySummary = existing
    ? { ...existing, updatedAt: now }
    : { date, createdAt: now, updatedAt: now };

  if (data.weight !== undefined) summary.weight = data.weight;
  if (data.rest !== undefined) summary.caloriesRest = data.rest;
  if (data.activity !== undefined) summary.caloriesActivity = data.activity;

  const total = data.burned ?? (data.rest !== undefined && data.activity !== undefined ? data.rest + data.activity : undefined);
  if (total !== undefined) {
    summary.caloriesBurned = Math.round(total);
    // La journée n'est pas finie : Santé continue de compter jusqu'à minuit
    summary.caloriesBurnedProvisional = true;
  }
  return summary;
}
