import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Today } from './Today';

vi.mock('../db', async (importOriginal) => ({
  ...await importOriginal<typeof import('../db')>(),
  getJournalEntriesByDate: async () => [],
  getDailySummary: async () => ({ caloriesBurned: 2500 }),
  getWeightsSince: async () => [],
  getCutHistoryDay: async () => undefined,
  recalculateDailySummary: async () => ({
    caloriesEaten: 2250, protein: 0, carbs: 0, fat: 0, sodium: 0, potassium: 0,
  }),
}));

it('makes the calorie excess the main number and keeps intake and limit visible', async () => {
  render(<Today onAddFood={vi.fn()} />);

  const alert = await screen.findByRole('status');
  expect(within(alert).getByText('+250')).toBeTruthy();
  expect(within(alert).getByText('kcal au-dessus de la limite')).toBeTruthy();
  expect(alert.closest('.hero-card')?.getAttribute('data-over-budget')).toBe('true');
  expect(screen.getByText('2250 / 2000 kcal')).toBeTruthy();
});
