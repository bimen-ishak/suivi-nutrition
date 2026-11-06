// Base de données locale avec Dexie.js
import Dexie, { type Table } from 'dexie';
import type { Food, JournalEntry, DailySummary, MealTemplate, BackupData } from '../types';

class NutritionDatabase extends Dexie {
  foods!: Table<Food>;
  journal!: Table<JournalEntry>;
  dailySummaries!: Table<DailySummary>;
  mealTemplates!: Table<MealTemplate>;

  constructor() {
    super('NutritionDB');
    this.version(1).stores({
      foods: 'id, name, barcode, brand, frequency, lastUsed',
      journal: 'id, date, time, meal, foodId',
      dailySummaries: 'date',
      mealTemplates: 'id, name'
    });
  }

  // Méthodes helper pour l'export/restauration
  async exportAll(): Promise<BackupData> {
    const [foods, journal, dailySummaries, mealTemplates] = await Promise.all([
      this.foods.toArray(),
      this.journal.toArray(),
      this.dailySummaries.toArray(),
      this.mealTemplates.toArray()
    ]);

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      foods,
      journal,
      dailySummaries,
      mealTemplates
    };
  }

  async importAll(data: BackupData): Promise<void> {
    await this.transaction('rw', this.foods, this.journal, this.dailySummaries, this.mealTemplates, async () => {
      await Promise.all([
        this.foods.clear(),
        this.journal.clear(),
        this.dailySummaries.clear(),
        this.mealTemplates.clear()
      ]);

      await Promise.all([
        this.foods.bulkAdd(data.foods),
        this.journal.bulkAdd(data.journal),
        this.dailySummaries.bulkAdd(data.dailySummaries),
        this.mealTemplates.bulkAdd(data.mealTemplates)
      ]);
    });
  }
}

export const db = new NutritionDatabase();

// Fonctions utilitaires pour les opérations courantes

// Foods
export async function createFood(food: Food): Promise<void> {
  await db.foods.add(food);
}

export async function getFood(id: string): Promise<Food | undefined> {
  return db.foods.get(id);
}

export async function getFoodByBarcode(barcode: string): Promise<Food | undefined> {
  return db.foods.where('barcode').equals(barcode).first();
}

export async function getAllFoods(): Promise<Food[]> {
  return db.foods.orderBy('frequency').reverse().toArray();
}

export async function getFrequentFoods(limit = 20): Promise<Food[]> {
  return db.foods.orderBy('frequency').reverse().limit(limit).toArray();
}

export async function updateFood(id: string, changes: Partial<Food>): Promise<number> {
  return db.foods.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

export async function deleteFood(id: string): Promise<void> {
  await db.foods.delete(id);
}

export async function incrementFoodFrequency(id: string): Promise<void> {
  const food = await db.foods.get(id);
  if (food) {
    await db.foods.update(id, {
      frequency: food.frequency + 1,
      lastUsed: new Date().toISOString().split('T')[0]
    });
  }
}

// Journal
export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await db.journal.add(entry);
  await incrementFoodFrequency(entry.foodId);
}

export async function getJournalEntriesByDate(date: string): Promise<JournalEntry[]> {
  return db.journal.where('date').equals(date).sortBy('time');
}

export async function updateJournalEntry(id: string, changes: Partial<JournalEntry>): Promise<number> {
  return db.journal.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await db.journal.delete(id);
}

export async function getJournalEntry(id: string): Promise<JournalEntry | undefined> {
  return db.journal.get(id);
}

// Daily Summaries
export async function getDailySummary(date: string): Promise<DailySummary | undefined> {
  return db.dailySummaries.get(date);
}

export async function upsertDailySummary(summary: DailySummary): Promise<void> {
  await db.dailySummaries.put({
    ...summary,
    updatedAt: new Date().toISOString()
  });
}

export async function getLastNDailySummaries(n: number): Promise<DailySummary[]> {
  const all = await db.dailySummaries.orderBy('date').reverse().limit(n).toArray();
  return all.reverse(); // ordre chronologique
}

// Meal Templates
export async function createMealTemplate(template: MealTemplate): Promise<void> {
  await db.mealTemplates.add(template);
}

export async function getAllMealTemplates(): Promise<MealTemplate[]> {
  return db.mealTemplates.toArray();
}

export async function getMealTemplate(id: string): Promise<MealTemplate | undefined> {
  return db.mealTemplates.get(id);
}

export async function updateMealTemplate(id: string, changes: Partial<MealTemplate>): Promise<number> {
  return db.mealTemplates.update(id, changes);
}

export async function deleteMealTemplate(id: string): Promise<void> {
  await db.mealTemplates.delete(id);
}

// Calculs quotidiens
export async function recalculateDailySummary(date: string): Promise<{
  caloriesEaten: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  potassium: number;
  entries: JournalEntry[];
}> {
  const entries = await getJournalEntriesByDate(date);

  const totals = entries.reduce(
    (acc, entry) => ({
      caloriesEaten: acc.caloriesEaten + entry.kcal,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
      sodium: acc.sodium + (entry.sodium || 0),
      potassium: acc.potassium + (entry.potassium || 0)
    }),
    { caloriesEaten: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, potassium: 0 }
  );

  return { ...totals, entries };
}