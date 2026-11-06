// Base de données locale avec Dexie.js
import Dexie, { type Table } from 'dexie';
import type { Food, JournalEntry, DailySummary, MealTemplate, BackupData, DailyPhoto, CutHistoryDay, HistoryImport } from '../types';
import { mergeIntakes, mergeWeights } from '../utils/cut';

class NutritionDatabase extends Dexie {
  foods!: Table<Food>;
  journal!: Table<JournalEntry>;
  dailySummaries!: Table<DailySummary>;
  mealTemplates!: Table<MealTemplate>;
  photos!: Table<DailyPhoto>;
  cutHistory!: Table<CutHistoryDay>;

  constructor() {
    super('NutritionDB');
    this.version(1).stores({
      foods: 'id, name, barcode, brand, frequency, lastUsed',
      journal: 'id, date, time, meal, foodId',
      dailySummaries: 'date',
      mealTemplates: 'id, name'
    });
    this.version(2).stores({
      photos: 'date'
    });
    this.version(3).stores({
      cutHistory: 'date'
    });
  }

  // Méthodes helper pour l'export/restauration
  async exportAll(): Promise<BackupData> {
    const [foods, journal, dailySummaries, mealTemplates, photos, cutHistory] = await Promise.all([
      this.foods.toArray(),
      this.journal.toArray(),
      this.dailySummaries.toArray(),
      this.mealTemplates.toArray(),
      this.photos.toArray(),
      this.cutHistory.toArray()
    ]);

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      foods,
      journal,
      dailySummaries,
      mealTemplates,
      photos,
      cutHistory
    };
  }

  async importAll(data: BackupData): Promise<void> {
    await this.transaction('rw', [this.foods, this.journal, this.dailySummaries, this.mealTemplates, this.photos, this.cutHistory], async () => {
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

      // Une ancienne sauvegarde n'a pas de photos : on garde celles de l'app
      if (data.photos) {
        await this.photos.clear();
        await this.photos.bulkAdd(data.photos);
      }

      if (data.cutHistory) {
        await this.cutHistory.clear();
        await this.cutHistory.bulkAdd(data.cutHistory);
      }
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
export async function createJournalEntry(entry: JournalEntry): Promise<void> {
  await db.journal.add(entry);
  await incrementFoodFrequency(entry.foodId);
}

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

export async function createDailySummary(summary: DailySummary): Promise<void> {
  await db.dailySummaries.add(summary);
}

export async function updateDailySummary(summary: DailySummary): Promise<void> {
  await db.dailySummaries.put(summary);
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

// Suivi de sèche
export async function getWeightsSince(date: string): Promise<{ date: string; weight: number }[]> {
  const [summaries, history] = await Promise.all([
    db.dailySummaries.where('date').aboveOrEqual(date).toArray(),
    db.cutHistory.where('date').aboveOrEqual(date).toArray()
  ]);
  const weights = summaries.flatMap(s => (s.weight ? [{ date: s.date, weight: s.weight }] : []));
  return mergeWeights(history, weights);
}

export async function getDailyIntakesSince(date: string): Promise<{ date: string; kcal: number; protein: number }[]> {
  const [entries, history] = await Promise.all([
    db.journal.where('date').aboveOrEqual(date).toArray(),
    db.cutHistory.where('date').aboveOrEqual(date).toArray()
  ]);
  const byDate = new Map<string, { date: string; kcal: number; protein: number }>();
  for (const entry of entries) {
    const day = byDate.get(entry.date) ?? { date: entry.date, kcal: 0, protein: 0 };
    day.kcal += entry.kcal;
    day.protein += entry.protein;
    byDate.set(entry.date, day);
  }
  return mergeIntakes(history, [...byDate.values()]);
}

/** Ajoute un historique sans toucher au journal ni aux photos déjà présentes */
export async function importHistory(data: HistoryImport): Promise<{ days: number; photos: number }> {
  return db.transaction('rw', [db.cutHistory, db.photos], async () => {
    await db.cutHistory.bulkPut(data.cutHistory);
    const existing = new Set(await db.photos.toCollection().primaryKeys());
    const newPhotos = data.photos.filter(photo => !existing.has(photo.date));
    await db.photos.bulkAdd(newPhotos);
    return { days: data.cutHistory.length, photos: newPhotos.length };
  });
}

// Photos du jour
export async function getAllPhotos(): Promise<DailyPhoto[]> {
  return db.photos.orderBy('date').reverse().toArray();
}

export async function savePhoto(photo: DailyPhoto): Promise<void> {
  await db.photos.put(photo);
}

export async function deletePhoto(date: string): Promise<void> {
  await db.photos.delete(date);
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

// Export/import pour sauvegarde JSON
export async function exportAllData(): Promise<BackupData> {
  return db.exportAll();
}

export async function importAllData(data: BackupData): Promise<void> {
  return db.importAll(data);
}

// Récupérer toutes les entrées du journal (pour export Excel)
export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  return db.journal.orderBy('date').toArray();
}

// Récupérer tous les résumés quotidiens
export async function getAllDailySummaries(): Promise<DailySummary[]> {
  return db.dailySummaries.orderBy('date').toArray();
}