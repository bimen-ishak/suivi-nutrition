import { describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { exportToExcel } from './excelExport';
import type { JournalEntry } from '../types';

vi.mock('xlsx', async importOriginal => ({
  ...await importOriginal<typeof import('xlsx')>(), writeFile: vi.fn()
}));

describe('Excel compatibility', () => {
  it('round-trips potassium/sodium in K/L and keeps I/J empty', async () => {
    const base: JournalEntry = {
      id: 'food', foodId: 'food', foodName: 'Test', foodSource: 'étiquette',
      date: '2026-11-01', time: '12:00', meal: 'Déjeuner', quantity: 100, unit: 'g',
      kcal: 400, protein: 20, carbs: 50, fat: 10, potassium: 432, sodium: 123,
      createdAt: '', updatedAt: ''
    };
    await exportToExcel([
      base,
      { ...base, id: 'zero', time: '13:00', potassium: 0, sodium: 0 },
      { ...base, id: 'unknown', time: '14:00', potassium: undefined, sodium: undefined }
    ], [], 'all');
    const workbook = vi.mocked(XLSX.writeFile).mock.calls.at(-1)![0];
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const roundTrip = XLSX.read(bytes, { type: 'array' });
    const journal = roundTrip.Sheets.Journal;
    expect(roundTrip.SheetNames).toEqual(['Bilan quotidien', 'Journal', 'Photos']);
    expect(journal.K1.v).toBe('Potassium (mg)');
    expect(journal.L1.v).toBe('Sodium (mg)');
    expect(journal.K2.v).toBe(432);
    expect(journal.L2.v).toBe(123);
    expect(journal.I2?.v ?? '').toBe('');
    expect(journal.J2?.v ?? '').toBe('');
    expect(journal.K3.v).toBe(0);
    expect(journal.L3.v).toBe(0);
    expect(journal.K4?.v ?? '').toBe('');
    expect(journal.L4?.v ?? '').toBe('');
  });
});
