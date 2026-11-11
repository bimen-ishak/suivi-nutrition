import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BulkPage } from './BulkPage';
import { MealEditor } from './MealEditor';
import { understandMeal } from './understandMeal';
import { writeDay } from './googleSheets';
import { daySignature, type BulkMeal, type BulkWeight, type SyncMark } from './store';
import { Setup } from './Setup';
import { localDateKey } from '../utils/photo';

const memory = vi.hoisted(() => new Map<string, BulkMeal>());
const weights = vi.hoisted(() => new Map<string, BulkWeight>());
const marks = vi.hoisted(() => new Map<string, SyncMark>());
const google = vi.hoisted(() => ({ connected: false, sheet: null as null | { id: string; title: string; url: string } }));
vi.mock('./store', async importOriginal => ({
  ...await importOriginal<typeof import('./store')>(),
  bulkDb: { transaction: vi.fn(async (...args: unknown[]) => (args.at(-1) as () => Promise<unknown>)()), meals: {
    toArray: vi.fn(async () => [...memory.values()]),
    bulkPut: vi.fn(async (meals: BulkMeal[]) => { meals.forEach(m => memory.set(m.id, structuredClone(m))); }),
    delete: vi.fn(async (id: string) => memory.delete(id))
  }, syncMarks: { toArray: vi.fn(async () => [...marks.values()]), put: vi.fn(async (mark: SyncMark) => marks.set(mark.date, mark)) },
    weights: {
      toArray: vi.fn(async () => [...weights.values()]),
      put: vi.fn(async (weight: BulkWeight) => weights.set(weight.date, weight)),
      delete: vi.fn(async (date: string) => weights.delete(date))
    } }
}));
vi.mock('./ai', () => ({ getActiveKey: () => 'test-key', getProvider: () => 'gemini', getOpenRouterKey: () => null, getApiKey: () => null, setApiKey: vi.fn(), clearApiKey: vi.fn(), setOpenRouterKey: vi.fn(), clearOpenRouterKey: vi.fn(), setProvider: vi.fn() }));
vi.mock('./understandMeal', () => ({ understandMeal: vi.fn() }));
vi.mock('./googleSheets', () => ({ getHistorySheet: () => google.sheet, googleConnected: () => google.connected, googleConfigured: () => false, writeDay: vi.fn() }));
vi.mock('../utils/photo', async importOriginal => ({ ...await importOriginal<typeof import('../utils/photo')>(), compressPhoto: vi.fn(async () => 'data:image/jpeg;base64,test') }));
const initial: BulkMeal = { id: 'photo', date: '2026-11-10', time: '12:00', name: '', quantity: 0, unit: 'g', values: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, estimated: true, notes: '' };

beforeEach(() => {
  localStorage.clear(); localStorage.setItem('bulkSetupComplete', '1'); memory.clear(); marks.clear(); weights.clear();
  google.sheet = null; google.connected = false;
  vi.mocked(understandMeal).mockReset(); vi.mocked(writeDay).mockReset();
  URL.createObjectURL = vi.fn(() => 'blob:preview'); URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

describe('simple bulking workflow', () => {
  it('saves a manual portion, updates daily totals and keeps history after remount', async () => {
    const page = render(<BulkPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: '+ Ajouter un repas' }).hasAttribute('disabled')).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un repas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ou saisir les valeurs moi-même' }));
    fireEvent.change(screen.getByLabelText('Nom du repas'), { target: { value: 'Poulet' } });
    fireEvent.change(screen.getByLabelText('Quantité mangée'), { target: { value: '200' } });
    const card = within(screen.getByTestId('review-food-0'));
    for (const [key, value] of Object.entries({ kcal: '165', protein: '31', carbs: '0', fat: '3.6' })) fireEvent.change(card.getByRole('spinbutton', { name: ({ kcal: 'Calories', protein: 'Protéines', carbs: 'Glucides', fat: 'Lipides' } as Record<string, string>)[key] }), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    await waitFor(() => expect(memory.size).toBe(1));
    await screen.findByText('Repas enregistré sur cet appareil.');
    expect([...memory.values()][0].values.kcal).toBe(165);
    expect(screen.getByRole('progressbar', { name: 'Progression des calories' })).toHaveProperty('value', 330);
    page.unmount(); render(<BulkPage />);
    await screen.findByRole('heading', { name: 'Poulet' });
    expect(screen.queryByRole('button', { name: /Poulet/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un repas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Poulet' }));
    expect(screen.getByLabelText('Nom du repas')).toHaveProperty('value', 'Poulet');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
    expect(screen.getByText('Jours comptés · 1/7')).toBeTruthy();
    expect(screen.getByText('Calories moyennes')).toBeTruthy();
    expect(screen.getByText('330', { selector: 'dd' })).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: /330 kcal/ }));
    await screen.findByRole('heading', { name: 'Poulet' });
    expect(screen.getByRole('button', { name: 'Historique' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Aujourd’hui' }));
    expect(screen.getByRole('heading', { name: 'Ton journal du jour' })).toBeTruthy();
  });

  it('understands text without a photo, allows portion correction and saves all foods only after confirmation', async () => {
    vi.mocked(understandMeal).mockResolvedValue({ items: [
      { name: 'Lait', quantity: 100, unit: 'ml', values: { kcal: 60, protein: 3, carbs: 5, fat: 3 }, estimated: true },
      { name: 'Œufs', quantity: 120, unit: 'g', values: { kcal: 155, protein: 13, carbs: 1, fat: 11 }, estimated: true }
    ], assumptions: ['Lait entier, 100 ml.'] });
    const save = vi.fn().mockResolvedValue(undefined);
    render(<MealEditor initial={initial} onSave={save} onCancel={vi.fn()} onSettings={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Écris à ta façon' }), { target: { value: '100 melk and 2 eggs' } });
    expect(understandMeal).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Comprendre' }));
    await screen.findByText('Lait entier, 100 ml.');
    expect(understandMeal).toHaveBeenCalledWith('100 melk and 2 eggs', [], '');
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(within(screen.getByTestId('review-food-0')).getByLabelText('Quantité mangée'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0]).toHaveLength(2);
    expect(save.mock.calls[0][0][0]).toMatchObject({ quantity: 200, unit: 'ml', name: 'Lait' });
  });

  it('asks for clarification in the same text box and keeps input on failure', async () => {
    vi.mocked(understandMeal).mockResolvedValueOnce({ items: [], assumptions: [], question: 'Quelle quantité de riz ?' }).mockRejectedValueOnce(new Error('Network unavailable'));
    render(<MealEditor initial={initial} onSave={vi.fn()} onCancel={vi.fn()} onSettings={vi.fn()} />);
    const text = screen.getByRole('textbox', { name: 'Écris à ta façon' });
    fireEvent.change(text, { target: { value: 'rice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comprendre' }));
    await screen.findByText('Quelle quantité de riz ?');
    expect(screen.queryByRole('button', { name: 'Confirmer et enregistrer' })).toBeNull();
    fireEvent.change(text, { target: { value: 'rice 200g cooked' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comprendre' }));
    await screen.findByText('Network unavailable');
    expect(text).toHaveProperty('value', 'rice 200g cooked');
    expect(understandMeal).toHaveBeenLastCalledWith('rice 200g cooked', [], 'Quelle quantité de riz ?');
  });

  it('forwards optional photos and invalidates review after changing the text', async () => {
    vi.mocked(understandMeal).mockResolvedValue({ items: [{ name: 'Riz', quantity: 200, unit: 'g', values: { kcal: 130, protein: 3, carbs: 28, fat: .3 }, estimated: true }], assumptions: [] });
    const page = render(<MealEditor initial={initial} onSave={vi.fn()} onCancel={vi.fn()} onSettings={vi.fn()} />);
    fireEvent.change(page.container.querySelector('input[type=file]')!, { target: { files: [new File(['image'], 'meal.jpg', { type: 'image/jpeg' })] } });
    fireEvent.click(screen.getByRole('button', { name: 'Comprendre' }));
    await screen.findByText('Vérifie avant d’ajouter');
    expect(understandMeal).toHaveBeenCalledWith('', ['data:image/jpeg;base64,test'], '');
    fireEvent.change(screen.getByRole('textbox', { name: 'Écris à ta façon' }), { target: { value: 'Only half of it' } });
    expect(screen.getByRole('button', { name: 'Confirmer et enregistrer' })).toHaveProperty('disabled', true);
  });

  it('keeps weigh-ins optional, supports decimal input, and rolls over without moving yesterday’s weight', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 10, 23, 58));
    try {
      render(<BulkPage />);
      fireEvent.click(await screen.findByRole('button', { name: 'Ajouter mon poids (facultatif)' }));
      const input = screen.getByLabelText('Poids du matin (kg)');
      fireEvent.change(input, { target: { value: '٧٥٫٥' } });
      const form = within(input.closest('form')!);
      fireEvent.click(form.getByRole('button', { name: 'Enregistrer' }));
      await screen.findByRole('button', { name: 'Poids : 75,5 kg' });
      expect(weights.get('2026-11-10')?.kg).toBe(75.5);
      expect(memory.size).toBe(0);

      vi.setSystemTime(new Date(2026, 10, 11, 0, 1));
      await act(async () => { window.dispatchEvent(new Event('focus')); });
      expect(screen.getByRole('button', { name: 'Ajouter mon poids (facultatif)' })).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
      fireEvent.click(screen.getByRole('button', { name: /75,5 kg/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Poids : 75,5 kg' }));
      fireEvent.click(screen.getByRole('button', { name: 'Retirer le poids' }));
      await screen.findByRole('button', { name: 'Ajouter mon poids (facultatif)' });
      expect(weights.size).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not mark a day synchronized when Google has not confirmed the write', async () => {
    const meal = { ...initial, date: localDateKey(), name: 'Rice', quantity: 100 };
    memory.set(meal.id, meal);
    google.sheet = { id: 'newfile', url: 'https://docs.google.com/spreadsheets/d/newfile/edit', title: 'Nutrition' }; google.connected = true;
    vi.mocked(writeDay).mockRejectedValue(new Error('Google did not confirm'));
    render(<BulkPage />);
    await screen.findByRole('heading', { name: 'Rice' });
    expect(screen.queryByRole('button', { name: 'Envoyer cette journée' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
    fireEvent.click(await screen.findByRole('button', { name: /0 kcal/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer cette journée' }));
    await screen.findByText('Google did not confirm');
    expect(marks.size).toBe(0);
    expect(memory.size).toBe(1);
  });

  it('shows changes as unsent when the local records differ from the last confirmed snapshot', async () => {
    const meal = { ...initial, date: localDateKey(), name: 'Rice', quantity: 100 };
    google.sheet = { id: 'newfile', url: 'https://docs.google.com/spreadsheets/d/newfile/edit', title: 'Nutrition' };
    marks.set(meal.date, { date: meal.date, spreadsheetId: 'newfile', signature: daySignature([meal]), syncedAt: '' });
    memory.set(meal.id, { ...meal, quantity: 200 });
    render(<BulkPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
    fireEvent.click(await screen.findByRole('button', { name: /0 kcal/ }));
    await screen.findByText('Modifications à envoyer');
    expect(screen.queryByText('Synchronisé avec Google Sheets')).toBeNull();
  });
});

it('runs the goal/AI/optional Google setup before opening the journal', async () => {
  localStorage.removeItem('bulkSetupComplete');
  const done = vi.fn();
  render(<Setup onComplete={done} />);
  expect(screen.getByLabelText('Calories par jour')).toHaveProperty('value', '2800');
  fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
  expect(screen.getByRole('button', { name: 'Connecter Google et créer mon fichier' })).toHaveProperty('disabled', true);
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir mon journal' }));
  expect(localStorage.getItem('bulkSetupComplete')).toBe('1'); expect(done).toHaveBeenCalledOnce();
});
