// Export Excel compatible avec le tableau existant Suivi_Calories_Bimen.xlsx
// 3 feuilles : Bilan quotidien, Journal, Photos
// SheetJS chargé dynamiquement (gros bundle) via loadXLSX()

import type { JournalEntry, DailySummary } from '../types';

type XLSXModule = typeof import('xlsx');

async function loadXLSX(): Promise<XLSXModule> {
  return import('xlsx');
}

interface BilanRow {
  date: string;
  poids: number | '';
  caloriesMangees: number;
  caloriesBrulees: number | '';
  bilanNet: number | '';
  proteines: number;
  glucides: number;
  lipides: number;
  alimentsManges: string;
  potassium: number;
  sodium: number;
  sommeil: number | '';
}

interface JournalRow {
  date: string;
  repas: string;
  aliment: string;
  quantite: string;
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  potassium: number;
  sodium: number;
}

/**
 * Formate une quantité avec la méthode de calcul si présente
 * Ex: "143 g mangés (261 pesés − 118 restants)"
 */
function formatQuantity(entry: JournalEntry): string {
  const base = `${entry.quantity}${entry.unit}`;
  if (entry.calculation) {
    return `${base} — ${entry.calculation.description}`;
  }
  return base;
}

/**
 * Formate le nom de l'aliment avec la source
 */
function formatFoodName(entry: JournalEntry): string {
  return `${entry.foodName} (${entry.foodSource})`;
}

/**
 * Exporte toutes les données en fichier Excel (.xlsx) avec 3 feuilles
 */
export async function exportToExcel(
  journal: JournalEntry[],
  dailySummaries: DailySummary[],
  period: '7d' | '30d' | 'all' = 'all'
): Promise<void> {
  const XLSX = await loadXLSX();
  // Filtrer par période
  const now = new Date();
  let startDate: Date | null = null;
  if (period === '7d') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === '30d') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
  }

  const filterByDate = <T extends { date: string }>(items: T[]): T[] => {
    if (!startDate) return items;
    const start = startDate.toISOString().split('T')[0];
    return items.filter(item => item.date >= start);
  };

  const filteredJournal = filterByDate(journal).sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
  );
  const filteredSummaries = filterByDate(dailySummaries).sort((a, b) => a.date.localeCompare(b.date));

  // ===== FEUILLE 1 : Bilan quotidien =====
  // Agréger le journal par date
  const journalByDate: { [date: string]: JournalEntry[] } = {};
  filteredJournal.forEach(e => {
    if (!journalByDate[e.date]) journalByDate[e.date] = [];
    journalByDate[e.date].push(e);
  });

  // Toutes les dates (union journal + summaries)
  const allDates = new Set<string>([
    ...Object.keys(journalByDate),
    ...filteredSummaries.map(s => s.date)
  ]);

  const bilanRows: BilanRow[] = Array.from(allDates).sort().map(date => {
    const entries = journalByDate[date] || [];
    const summary = filteredSummaries.find(s => s.date === date);

    const totals = entries.reduce((acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
      potassium: acc.potassium + (e.potassium || 0),
      sodium: acc.sodium + (e.sodium || 0)
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0, potassium: 0, sodium: 0 });

    const bilanNet = summary?.caloriesBurned
      ? totals.kcal - summary.caloriesBurned
      : '';

    const alimentsManges = entries
      .map(e => `${e.foodName} ${e.quantity}${e.unit}`)
      .join('; ');

    return {
      date,
      poids: summary?.weight ?? '',
      caloriesMangees: Math.round(totals.kcal),
      caloriesBrulees: summary?.caloriesBurned ?? '',
      bilanNet,
      proteines: Math.round(totals.protein * 10) / 10,
      glucides: Math.round(totals.carbs * 10) / 10,
      lipides: Math.round(totals.fat * 10) / 10,
      alimentsManges,
      potassium: Math.round(totals.potassium),
      sodium: Math.round(totals.sodium),
      sommeil: summary?.sleepDuration ?? ''
    };
  });

  const wsBilan = XLSX.utils.json_to_sheet(bilanRows);
  // En-têtes en français (A-L)
  XLSX.utils.sheet_add_aoa(wsBilan, [[
    'Date', 'Poids (kg)', 'Calories mangées', 'Calories brûlées', 'Bilan net',
    'Protéines (g)', 'Glucides (g)', 'Lipides (g)', 'Aliments mangés',
    'Potassium (mg)', 'Sodium (mg)', 'Sommeil (h)'
  ]], { origin: 'A1' });

  // Largeurs de colonnes
  wsBilan['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 10 },
    { wch: 13 }, { wch: 13 }, { wch: 12 }, { wch: 50 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }
  ];

  // ===== FEUILLE 2 : Journal =====
  const journalRows: JournalRow[] = filteredJournal.map(e => ({
    date: e.date,
    repas: e.meal,
    aliment: formatFoodName(e),
    quantite: formatQuantity(e),
    kcal: e.kcal,
    proteines: Math.round(e.protein * 10) / 10,
    glucides: Math.round(e.carbs * 10) / 10,
    lipides: Math.round(e.fat * 10) / 10,
    potassium: e.potassium ? Math.round(e.potassium) : 0,
    sodium: e.sodium ? Math.round(e.sodium) : 0
  }));

  const wsJournal = XLSX.utils.json_to_sheet(journalRows);
  XLSX.utils.sheet_add_aoa(wsJournal, [[
    'Date', 'Repas', 'Aliment', 'Quantité', 'kcal',
    'Protéines (g)', 'Glucides (g)', 'Lipides (g)', '', '',
    'Potassium (mg)', 'Sodium (mg)'
  ]], { origin: 'A1' });

  wsJournal['!cols'] = [
    { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 40 }, { wch: 8 },
    { wch: 13 }, { wch: 13 }, { wch: 12 }, { wch: 3 }, { wch: 3 },
    { wch: 14 }, { wch: 12 }
  ];

  // ===== FEUILLE 3 : Photos (vide, pour compatibilité) =====
  const wsPhotos = XLSX.utils.aoa_to_sheet([['Photo', 'Date']]);
  wsPhotos['!cols'] = [{ wch: 30 }, { wch: 12 }];

  // ===== Créer le classeur =====
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsBilan, 'Bilan quotidien');
  XLSX.utils.book_append_sheet(wb, wsJournal, 'Journal');
  XLSX.utils.book_append_sheet(wb, wsPhotos, 'Photos');

  // Télécharger le fichier
  const date = new Date().toISOString().split('T')[0];
  const periodLabel = period === '7d' ? '7j' : period === '30d' ? '30j' : 'tout';
  XLSX.writeFile(wb, `Suivi_Calories_Bimen_${periodLabel}_${date}.xlsx`);
}
