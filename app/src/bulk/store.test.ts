import { beforeEach, describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { bulkDb, dailyCsv, getGoals, portionValues, saveGoals, totalValues, validBackup, type BulkMeal } from './store';

const meal: BulkMeal = { id: 'one', date: '2026-11-10', time: '12:00', name: 'Rice', quantity: 200, unit: 'g', values: { kcal: 130, protein: 3, carbs: 28, fat: .3 }, estimated: true, notes: '' };
beforeEach(() => localStorage.clear());
describe('independent bulking journal', () => {
  it('uses a separate database and the user’s stated targets', () => {
    expect(bulkDb.name).toBe('NutritionBulkDB');
    expect(getGoals()).toEqual({ kcal: 2800, protein: 140, showSugars: false });
    localStorage.setItem('calorieObjective', '-500');
    saveGoals({ kcal: 3000, protein: 150, showSugars: true });
    expect(localStorage.getItem('calorieObjective')).toBe('-500');
    expect(getGoals().kcal).toBe(3000);
  });
  it('calculates eaten quantities and keeps unknown sugar distinct from zero', () => {
    expect(portionValues(meal)).toEqual({ kcal: 260, protein: 6, carbs: 56, fat: .6, sugars: undefined });
    expect(portionValues({ ...meal, values: { ...meal.values, sugars: 0 } }).sugars).toBe(0);
    expect(totalValues([meal, meal])).toMatchObject({ kcal: 520, protein: 12, carbs: 112, fat: 1.2 });
  });
  it('rejects invalid and incompatible backups before replacing any records', () => {
    const backup = { type: 'nutrition-bulk', version: 1, goals: getGoals(), meals: [meal] };
    expect(validBackup(JSON.parse(JSON.stringify(backup)))).toBe(true);
    expect(validBackup({ ...backup, type: 'cut' })).toBe(false);
    expect(validBackup({ ...backup, meals: [meal, meal] })).toBe(false);
    expect(validBackup({ ...backup, meals: [{ ...meal, quantity: -1 }] })).toBe(false);
    expect(validBackup({ ...backup, meals: [{ ...meal, date: '2026-02-30' }] })).toBe(false);
    expect(validBackup({ ...backup, meals: [{ ...meal, values: { ...meal.values, kcal: null } }] })).toBe(false);
    expect(validBackup({ ...backup, goals: { kcal: -1, protein: 140, showSugars: false } })).toBe(false);
  });
  it('exports one row per date with daily totals, unknown sugar and inert food names', () => {
    const csv = dailyCsv([meal, { ...meal, id: 'two', name: '=HYPERLINK("x")', values: { ...meal.values, sugars: 0 } }, { ...meal, id: 'three', date: '2026-11-11' }]);
    const workbook = XLSX.read(csv, { type: 'string', raw: true });
    const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    expect(rows).toHaveLength(3);
    expect(rows[1].slice(0, 7)).toEqual(['2026-11-10', '520', '12', '112', '1.2', '0', '1/2']);
    expect(rows[1][7]).toContain('=HYPERLINK');
    expect(rows[1][7].startsWith("'")).toBe(true);
    expect(rows[2][5] ?? '').toBe('');
  });
});
