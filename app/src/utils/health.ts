// Import des données d'Apple Santé : un Raccourci iPhone copie un texte, l'app le lit
import type { DailySummary } from '../types';

export interface HealthData {
  date?: string;     // jour concerné (AAAA-MM-JJ), sinon aujourd'hui
  weight?: number;   // kg
  rest?: number;     // kcal au repos
  activity?: number; // kcal actives
  burned?: number;   // dépense totale, si le raccourci l'a déjà calculée
}

const FIELDS: { key: Exclude<keyof HealthData, 'date'>; label: RegExp; min: number; max: number }[] = [
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

/** Lit « date : 2026-11-08 » ou « date : 08/11/2026 » et renvoie AAAA-MM-JJ, ou undefined si elle n'existe pas */
function readDate(text: string): string | undefined {
  const isoMatch = /date[^\d\n]*[:=]\s*(\d{4})-(\d{2})-(\d{2})/i.exec(text);
  const frenchMatch = /date[^\d\n]*[:=]\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(text);
  let year: string, month: string, day: string;
  if (isoMatch) [, year, month, day] = isoMatch;
  else if (frenchMatch) [, day, month, year] = frenchMatch;
  else return undefined;
  const iso = `${year}-${month}-${day}`;
  const parsed = new Date(`${iso}T12:00:00Z`);
  const valid = !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(iso);
  return valid ? iso : undefined;
}

export function parseHealthText(text: string): HealthData {
  const data: HealthData = {};
  const date = readDate(text);
  if (date) data.date = date;
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
  now = new Date().toISOString(),
  today = now.split('T')[0]
): DailySummary {
  const summary: DailySummary = existing
    ? { ...existing, updatedAt: now }
    : { date, createdAt: now, updatedAt: now };

  if (data.weight !== undefined) summary.weight = data.weight;
  if (data.rest !== undefined) summary.caloriesRest = data.rest;
  if (data.activity !== undefined) summary.caloriesActivity = data.activity;

  // Sans calorie active, Santé renvoie un texte vide : la dépense du moment est alors le repos seul
  const total = data.burned ?? (data.rest !== undefined ? data.rest + (data.activity ?? 0) : undefined);
  if (total !== undefined) {
    summary.caloriesBurned = Math.round(total);
    // Seule la journée en cours n'est pas finie : Santé compte jusqu'à minuit
    summary.caloriesBurnedProvisional = date === today;
  }
  return summary;
}
