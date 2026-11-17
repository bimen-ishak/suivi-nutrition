// Périodes de craquage : jours mal comptés, mis de côté par les calculs de Ma sèche
import type { IntakeDay, WeightPoint } from './cut';

export interface BingePeriod {
  start: string; // AAAA-MM-JJ
  end: string; // AAAA-MM-JJ, inclus
}

const STORAGE_KEY = 'bingePeriods';
// Après un craquage, le poids garde de l'eau quelques jours : ces pesées sont mises de côté aussi
export const WATER_DAYS_AFTER = 3;

const isDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

export function getBingePeriods(): BingePeriod[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p): p is BingePeriod => !!p && isDate(p.start) && isDate(p.end) && p.start <= p.end)
      .sort((a, b) => b.start.localeCompare(a.start));
  } catch {
    return [];
  }
}

export const BINGE_CHANGE_EVENT = 'binge-periods-change';

function save(periods: BingePeriod[]): BingePeriod[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(periods));
  // L'Historique recalcule sa moyenne dès qu'une période est ajoutée ou retirée
  window.dispatchEvent(new Event(BINGE_CHANGE_EVENT));
  return getBingePeriods();
}

/** Ajoute une période ; les dates inversées sont remises dans l'ordre */
export function addBingePeriod(start: string, end: string): BingePeriod[] {
  const ordered = start <= end ? { start, end } : { start: end, end: start };
  return save([...getBingePeriods(), ordered]);
}

export function removeBingePeriod(period: BingePeriod): BingePeriod[] {
  return save(getBingePeriods().filter(p => p.start !== period.start || p.end !== period.end));
}

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
};

export function inBingePeriod(date: string, periods: BingePeriod[], extraDays = 0): boolean {
  return periods.some(p => date >= p.start && date <= addDays(p.end, extraDays));
}

/** Retire les jours de craquage des calories, et des pesées jusqu'à 3 jours après */
export function withoutBinges(
  weights: WeightPoint[],
  intakes: IntakeDay[],
  periods: BingePeriod[]
): { weights: WeightPoint[]; intakes: IntakeDay[] } {
  if (periods.length === 0) return { weights, intakes };
  return {
    weights: weights.filter(w => !inBingePeriod(w.date, periods, WATER_DAYS_AFTER)),
    intakes: intakes.filter(i => !inBingePeriod(i.date, periods))
  };
}

/** Keep the intake and weight windows aligned after the latest exclusion. */
export function afterLastBinge(
  weights: WeightPoint[],
  intakes: IntakeDay[],
  periods: BingePeriod[]
): { weights: WeightPoint[]; intakes: IntakeDay[] } {
  if (periods.length === 0) return { weights, intakes };
  const lastEnd = periods.reduce((latest, period) => period.end > latest ? period.end : latest, periods[0].end);
  const cutoff = addDays(lastEnd, WATER_DAYS_AFTER);
  return {
    weights: weights.filter(point => point.date > cutoff),
    intakes: intakes.filter(day => day.date > cutoff),
  };
}

/** Fin de la dernière période de craquage qui a commencé au plus tard aujourd'hui, ou null */
export function lastBingeEnd(periods: BingePeriod[], today: string): string | null {
  return periods
    .filter(period => period.start <= today)
    .reduce<string | null>((latest, period) => (latest === null || period.end > latest ? period.end : latest), null);
}
