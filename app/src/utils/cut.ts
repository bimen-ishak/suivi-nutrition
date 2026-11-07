// Calculs de suivi de sèche, sans effets de bord
import type { CutHistoryDay, DailySummary } from '../types';

const DAY_MS = 86_400_000;
const KCAL_PER_KG = 7700;
const TREND_DAYS = 7;
const RATE_WINDOW_DAYS = 14;
const MAINTENANCE_WINDOW_DAYS = 21;
const MAINTENANCE_REQUIRED_DAYS = 14;
const MIN_WEIGH_INS = 5;
const MIN_LOGGED_KCAL = 800; // en dessous, la journée est sans doute mal remplie
const PROTEIN_G_PER_KG = 2;
const CARBS_G_PER_KG = 3;

/** Repères de santé publique : sel au plus ~5,8 g/jour (2 300 mg de sodium), potassium au moins 3 500 mg */
export const SODIUM_LIMIT_MG = 2300;
export const POTASSIUM_TARGET_MG = 3500;

export interface WeightPoint {
  date: string;
  weight: number;
}

export interface TrendPoint extends WeightPoint {
  trend: number;
}

export interface IntakeDay {
  date: string;
  kcal: number;
  protein: number;
}

export interface WeeklyRate {
  kgPerWeek: number;
  percentPerWeek: number;
}

export interface RateVerdict {
  level: 'success' | 'neutral' | 'warning';
  message: string;
}

export interface MaintenanceEstimate {
  value: number | null;
  daysMissing: number;
}

const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY_MS;

const byDate = <T extends { date: string }>(items: T[]) =>
  [...items].sort((a, b) => a.date.localeCompare(b.date));

const isLogged = (day: IntakeDay) => day.kcal >= MIN_LOGGED_KCAL;

/** Moyenne des pesées des 7 derniers jours, pour gommer l'eau et le transit */
export function getWeightTrend(points: WeightPoint[]): TrendPoint[] {
  const sorted = byDate(points);
  return sorted.map(point => {
    const today = dayNumber(point.date);
    const recent = sorted.filter(p => {
      const age = today - dayNumber(p.date);
      return age >= 0 && age < TREND_DAYS;
    });
    const average = recent.reduce((sum, p) => sum + p.weight, 0) / recent.length;
    return { ...point, trend: Math.round(average * 100) / 100 };
  });
}

/** Pente de la droite qui passe au plus près des pesées, en kg par jour */
function getSlope(points: WeightPoint[]): number {
  const xs = points.map(p => dayNumber(p.date));
  const meanX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const meanY = points.reduce((sum, p) => sum + p.weight, 0) / points.length;
  const covariance = points.reduce((sum, p, i) => sum + (xs[i] - meanX) * (p.weight - meanY), 0);
  const variance = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  return variance === 0 ? 0 : covariance / variance;
}

function lastDays(points: WeightPoint[], days: number): WeightPoint[] {
  const sorted = byDate(points);
  if (sorted.length === 0) return [];
  const last = dayNumber(sorted[sorted.length - 1].date);
  return sorted.filter(p => last - dayNumber(p.date) < days);
}

const spanInDays = (points: WeightPoint[]) =>
  points.length < 2 ? 0 : dayNumber(points[points.length - 1].date) - dayNumber(points[0].date);

/** Rythme de perte sur les 14 derniers jours */
export function getWeeklyRate(points: WeightPoint[]): WeeklyRate | null {
  const recent = lastDays(points, RATE_WINDOW_DAYS);
  if (recent.length < 4 || spanInDays(recent) < 7) return null;

  const kgPerWeek = getSlope(recent) * 7;
  const trend = getWeightTrend(points);
  const latest = trend[trend.length - 1].trend;
  return { kgPerWeek, percentPerWeek: (kgPerWeek / latest) * 100 };
}

/** 0,5 à 1 % du poids par semaine est le repère courant pour préserver le muscle */
export function getRateVerdict(percentPerWeek: number): RateVerdict {
  if (percentPerWeek >= -0.1) {
    return { level: 'warning', message: 'Ton poids ne baisse plus : regarde tes calories de la semaine.' };
  }
  if (percentPerWeek > -0.5) {
    return { level: 'neutral', message: 'Rythme doux : ça descend, sans forcer.' };
  }
  if (percentPerWeek >= -1) {
    return { level: 'success', message: 'Bon rythme pour perdre du gras en gardant ton muscle.' };
  }
  return { level: 'warning', message: 'Perte rapide : tu risques de perdre du muscle, mange un peu plus.' };
}

/** Dépense réelle : ce qui est mangé, corrigé par ce que le poids a réellement fait */
export function estimateMaintenance(points: WeightPoint[], intakes: IntakeDay[]): MaintenanceEstimate {
  const recent = lastDays(points, MAINTENANCE_WINDOW_DAYS);
  const first = recent[0]?.date ?? '';
  const last = recent[recent.length - 1]?.date ?? '';
  const logged = intakes.filter(day => isLogged(day) && day.date >= first && day.date <= last);

  const weighedDays = recent.length === 0 ? 0 : spanInDays(recent) + 1;
  const daysMissing = Math.max(
    MAINTENANCE_REQUIRED_DAYS - logged.length,
    MAINTENANCE_REQUIRED_DAYS - weighedDays,
    MIN_WEIGH_INS - recent.length,
    0
  );
  if (daysMissing > 0) return { value: null, daysMissing };

  const averageKcal = logged.reduce((sum, day) => sum + day.kcal, 0) / logged.length;
  const value = averageKcal - getSlope(recent) * KCAL_PER_KG;
  return { value: Math.round(value / 10) * 10, daysMissing: 0 };
}

/** Moyenne des journées remplies */
export function averageIntake(days: IntakeDay[]): { days: number; kcal: number; protein: number } | null {
  const logged = days.filter(isLogged);
  if (logged.length === 0) return null;
  const total = logged.reduce(
    (sum, day) => ({ kcal: sum.kcal + day.kcal, protein: sum.protein + day.protein }),
    { kcal: 0, protein: 0 }
  );
  return {
    days: logged.length,
    kcal: Math.round(total.kcal / logged.length),
    protein: Math.round(total.protein / logged.length)
  };
}

/** Ajoute les pesées importées, sans remplacer celles saisies dans l'app */
export function mergeWeights(history: CutHistoryDay[], weights: WeightPoint[]): WeightPoint[] {
  const known = new Set(weights.map(w => w.date));
  const imported = history.flatMap(day =>
    day.weight !== undefined && !known.has(day.date) ? [{ date: day.date, weight: day.weight }] : []
  );
  return byDate([...imported, ...weights]);
}

/** Ajoute les totaux importés, sans remplacer les journées notées dans l'app */
export function mergeIntakes(history: CutHistoryDay[], intakes: IntakeDay[]): IntakeDay[] {
  const known = new Set(intakes.map(i => i.date));
  const imported = history.flatMap(day =>
    day.kcal !== undefined && !known.has(day.date)
      ? [{ date: day.date, kcal: day.kcal, protein: day.protein ?? 0 }]
      : []
  );
  return byDate([...imported, ...intakes]);
}

/** Ce que l'écran Historique affiche pour un jour importé, qui n'a que des totaux */
export function importedDayToView(day: CutHistoryDay): {
  hasCalories: boolean;
  totals: { caloriesEaten: number; protein: number; carbs: number; fat: number };
  summary: DailySummary | undefined;
} {
  const hasSummary = day.weight !== undefined || day.burned !== undefined;
  return {
    hasCalories: day.kcal !== undefined,
    totals: {
      caloriesEaten: day.kcal ?? 0,
      protein: day.protein ?? 0,
      carbs: day.carbs ?? 0,
      fat: day.fat ?? 0
    },
    summary: hasSummary
      ? { date: day.date, weight: day.weight, caloriesBurned: day.burned, createdAt: '', updatedAt: '' }
      : undefined
  };
}

/** Variation de la tendance entre le premier et le dernier point affichés */
export function weightChange(trend: TrendPoint[]): { kg: number; days: number } | null {
  if (trend.length < 2) return null;
  const first = trend[0];
  const last = trend[trend.length - 1];
  return { kg: last.trend - first.trend, days: dayNumber(last.date) - dayNumber(first.date) };
}

const GAUGE_MAX_PERCENT = 1.5;

/** Position (0 à 100) d'un rythme de perte sur la jauge : 0 = poids stable, 100 = 1,5 % par semaine ou plus */
export function paceGaugePosition(percentPerWeek: number): number {
  const loss = Math.max(-percentPerWeek, 0);
  return Math.min((loss / GAUGE_MAX_PERCENT) * 100, 100);
}

/** Plafond de glucides : au-delà, le corps stocke plus de glycogène, donc plus d'eau (environ 3 g par gramme) */
export function carbLimit(weight: number): number {
  return Math.round((weight * CARBS_G_PER_KG) / 5) * 5;
}

/** Objectif de protéines pendant une sèche, arrondi à 5 g */
export function proteinTarget(weight: number): number {
  return Math.round((weight * PROTEIN_G_PER_KG) / 5) * 5;
}
