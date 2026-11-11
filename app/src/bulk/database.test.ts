import { afterAll, expect, it } from 'vitest';
import Dexie from 'dexie';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import type { BulkMeal } from './store';

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;
const meal: BulkMeal = { id: 'old', date: '2026-11-10', time: '12:00', name: 'Rice', quantity: 100, unit: 'g', values: { kcal: 130, protein: 3, carbs: 28, fat: .3 }, estimated: true, notes: '' };
let database: typeof import('./store').bulkDb;
afterAll(async () => { await database?.delete(); });

it('migrates the existing bulking journal without losing meals and atomically writes a multi-food review', async () => {
  const old = new Dexie('NutritionBulkDB');
  old.version(1).stores({ meals: 'id, date' });
  await old.table('meals').put(meal); old.close();
  database = (await import('./store')).bulkDb;
  await database.open();
  expect(await database.meals.get('old')).toEqual(meal);
  expect(await database.syncMarks.count()).toBe(0);
  await database.transaction('rw', database.meals, () => database.meals.bulkPut([{ ...meal, id: 'a' }, { ...meal, id: 'b' }]));
  expect(await database.meals.count()).toBe(3);
  await expect(database.transaction('rw', database.meals, async () => {
    await database.meals.put({ ...meal, id: 'rollback' }); throw new Error('Simulated write failure');
  })).rejects.toThrow('Simulated');
  expect(await database.meals.get('rollback')).toBeUndefined();
});
