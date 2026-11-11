import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { getCutHistoryDay, getDailySummary, recalculateDailySummary } from '../db';
import type { JournalEntry } from '../types';
import { localDateKeys } from '../utils/photo';
import { History } from './History';

vi.mock('../db', () => ({
  getCutHistoryDay: vi.fn(),
  getDailySummary: vi.fn(),
  recalculateDailySummary: vi.fn()
}));
vi.mock('../components/CutCard', () => ({ CutCard: () => null }));

it('averages only recent days with both intake and expenditure, including imported totals', async () => {
  const [today, yesterday, withoutBurn, withoutMeals, , , , outsideWeek] = localDateKeys(8);
  vi.mocked(getCutHistoryDay).mockImplementation(async date =>
    date === yesterday ? { date, kcal: 2000, burned: 2200 } : undefined
  );
  vi.mocked(getDailySummary).mockImplementation(async date => {
    if (date === yesterday) return { date, weight: 75, createdAt: '', updatedAt: '' };
    if (![today, withoutMeals, outsideWeek].includes(date)) return undefined;
    return { date, caloriesBurned: 2600, caloriesBurnedProvisional: date === today, createdAt: '', updatedAt: '' };
  });
  vi.mocked(recalculateDailySummary).mockImplementation(async date => {
    const entries: JournalEntry[] = [today, withoutBurn, outsideWeek].includes(date) ? [{
      id: date, date, time: '12:00', meal: 'Repas', foodId: 'rice', foodName: 'Riz',
      foodSource: 'estimation', quantity: 100, unit: 'g', kcal: 1800,
      protein: 0, carbs: 0, fat: 0, createdAt: '', updatedAt: ''
    }] : [];
    return { caloriesEaten: entries[0]?.kcal ?? 0, protein: 0, carbs: 0, fat: 0, sodium: 0, potassium: 0, entries };
  });

  render(<History />);
  await screen.findByText('Jours comptés · 2/7');
  expect(screen.getByText('Déficit moyen')).toBeTruthy();
  expect(screen.getByText('500')).toBeTruthy();
  expect(screen.getByText(/Certaines dépenses sont estimées/)).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: /2000 kcal/ }));
  expect(screen.getByText('2200')).toBeTruthy();
});
