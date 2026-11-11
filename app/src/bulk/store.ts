import Dexie, { type Table } from 'dexie';
import { localDateKey } from '../utils/photo';

export interface BulkValues { kcal: number; protein: number; carbs: number; fat: number; sugars?: number }
export interface BulkMeal {
  id: string; date: string; time: string; name: string; quantity: number; unit: 'g' | 'ml';
  values: BulkValues; estimated: boolean; notes: string;
}
export interface BulkGoals { kcal: number; protein: number; showSugars: boolean }
export interface BulkWeight { date: string; kg: number }
export interface SyncMark { date: string; spreadsheetId: string; signature: string; syncedAt: string }
export const DEFAULT_GOALS: BulkGoals = { kcal: 2800, protein: 140, showSugars: false };

// Independent database: the original cutting database and its history are preserved.
class BulkDatabase extends Dexie {
  meals!: Table<BulkMeal>;
  syncMarks!: Table<SyncMark>;
  weights!: Table<BulkWeight>;
  constructor() {
    super('NutritionBulkDB');
    this.version(1).stores({ meals: 'id, date' });
    this.version(2).stores({ meals: 'id, date', syncMarks: 'date' });
    this.version(3).stores({ meals: 'id, date', syncMarks: 'date', weights: 'date' });
  }
}
export const bulkDb = new BulkDatabase();
/** Stable representation of the exact records sent, so a save during sync stays pending. */
export function daySignature(meals: BulkMeal[], weightKg?: number): string {
  const records = [...meals].sort((a, b) => a.id.localeCompare(b.id)).map(m => [
    m.id, m.date, m.time, m.name, m.quantity, m.unit,
    m.values.kcal, m.values.protein, m.values.carbs, m.values.fat, m.values.sugars ?? null, m.estimated, m.notes
  ]);
  return JSON.stringify(weightKg === undefined ? records : { records, weightKg });
}
export function getGoals(): BulkGoals {
  try {
    const saved = JSON.parse(localStorage.getItem('bulkGoals') ?? 'null');
    return validGoals(saved) ? saved : { ...DEFAULT_GOALS };
  } catch { return { ...DEFAULT_GOALS }; }
}
export function validGoals(value: unknown): value is BulkGoals {
  if (!value || typeof value !== 'object') return false;
  const g = value as BulkGoals;
  return Number.isFinite(g.kcal) && g.kcal > 0 && Number.isFinite(g.protein) && g.protein > 0 && typeof g.showSugars === 'boolean';
}
export function saveGoals(goals: BulkGoals) {
  if (!validGoals(goals)) throw new Error('Invalid goals');
  localStorage.setItem('bulkGoals', JSON.stringify(goals));
}
export function portionValues(meal: Pick<BulkMeal, 'values' | 'quantity'>): BulkValues {
  const scale = meal.quantity / 100;
  const tenth = (v: number) => Math.round(v * scale * 10) / 10;
  return {
    kcal: Math.round(meal.values.kcal * scale), protein: tenth(meal.values.protein),
    carbs: tenth(meal.values.carbs), fat: tenth(meal.values.fat),
    sugars: meal.values.sugars === undefined ? undefined : tenth(meal.values.sugars)
  };
}
export function totalValues(meals: BulkMeal[]): BulkValues {
  const totals = meals.reduce((sum, meal) => {
    const p = portionValues(meal);
    return { kcal: sum.kcal + p.kcal, protein: sum.protein + p.protein,
      carbs: sum.carbs + p.carbs, fat: sum.fat + p.fat, sugars: (sum.sugars ?? 0) + (p.sugars ?? 0) };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, sugars: 0 } as BulkValues);
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round(value * 10) / 10])) as unknown as BulkValues;
}
function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && localDateKey(date) === value;
}

export function validWeightKg(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validWeight(value: unknown): value is BulkWeight {
  if (!value || typeof value !== 'object') return false;
  const weight = value as BulkWeight;
  return validDate(weight.date) && validWeightKg(weight.kg);
}

export function validMeal(value: unknown): value is BulkMeal {
  if (!value || typeof value !== 'object') return false;
  const m = value as BulkMeal;
  return typeof m.id === 'string' && m.id.length > 0 && typeof m.name === 'string' && m.name.trim().length > 0
    && validDate(m.date)
    && typeof m.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(m.time)
    && Number.isFinite(m.quantity) && m.quantity > 0 && (m.unit === 'g' || m.unit === 'ml')
    && typeof m.estimated === 'boolean' && typeof m.notes === 'string' && !!m.values
    && [m.values.kcal, m.values.protein, m.values.carbs, m.values.fat].every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0)
    && (m.values.sugars === undefined || (Number.isFinite(m.values.sugars) && m.values.sugars >= 0));
}
export function validBackup(value: unknown): value is { type: 'nutrition-bulk'; version: 1; goals: BulkGoals; meals: BulkMeal[]; weights?: BulkWeight[] } {
  if (!value || typeof value !== 'object') return false;
  const b = value as { type: string; version: number; goals: unknown; meals: unknown[]; weights?: unknown };
  return b.type === 'nutrition-bulk' && b.version === 1 && validGoals(b.goals) && Array.isArray(b.meals)
    && b.meals.every(validMeal) && new Set(b.meals.map(m => (m as BulkMeal).id)).size === b.meals.length
    && (b.weights === undefined || (Array.isArray(b.weights) && b.weights.every(validWeight)
      && new Set(b.weights.map(w => w.date)).size === b.weights.length));
}
export function dailyCsv(meals: BulkMeal[], weights: BulkWeight[] = []): string {
  const weightByDate = new Map(weights.map(weight => [weight.date, weight.kg]));
  const dates = [...new Set([...meals.map(m => m.date), ...weightByDate.keys()])].sort();
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows: (string | number)[][] = [['Date', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Sugars recorded (g)', 'Sugar coverage', 'Meals', 'Weight (kg)']];
  for (const date of dates) {
    const day = meals.filter(m => m.date === date); const total = totalValues(day);
    rows.push([date, total.kcal, total.protein, total.carbs, total.fat,
      day.some(m => m.values.sugars !== undefined) ? total.sugars! : '',
      `${day.filter(m => m.values.sugars !== undefined).length}/${day.length}`,
      // Keep user food names as text when opening a CSV in a spreadsheet.
      `'${day.map(m => `${m.name} (${m.quantity} ${m.unit})`).join('; ')}`, weightByDate.get(date) ?? '']);
  }
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
export function downloadFile(contents: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
