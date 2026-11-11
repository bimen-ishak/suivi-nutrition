import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QuantityEntry } from './QuantityEntry';
import { EditJournalModal } from './EditJournalModal';
import type { Food, JournalEntry } from '../types';

const food: Food = {
  id: 'cereal', name: 'Céréales', kcal_per_100g: 400, protein: 20, carbs: 50, fat: 10,
  sodium: 0, potassium: 100, source: 'étiquette', portions: [{ name: 'bol', grams: 100 }],
  frequency: 0, lastUsed: '', createdAt: '', updatedAt: ''
};
const entry: JournalEntry = {
  id: 'old', foodId: food.id, foodName: food.name, foodSource: food.source,
  date: '2026-11-01', time: '08:00', meal: 'Petit-déj', quantity: 50, unit: 'g',
  kcal: 100, protein: 5, carbs: 10, fat: 2, sodium: 0, potassium: 30,
  createdAt: '', updatedAt: ''
};

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('historical journal edits', () => {
  it('preserves every stored nutrient when only the meal or time changes', () => {
    const save = vi.fn();
    render(<EditJournalModal entry={entry} onSave={save} onDelete={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Repas'), { target: { value: 'Déjeuner' } });
    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '12:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      kcal: 100, protein: 5, carbs: 10, fat: 2, sodium: 0, potassium: 30,
      meal: 'Déjeuner', time: '12:00'
    }));
  });

  it('scales legacy nutrition even after the library food has changed or been deleted', () => {
    const save = vi.fn();
    render(<EditJournalModal entry={entry} onSave={save} onDelete={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Quantité'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      kcal: 200, protein: 10, carbs: 20, fat: 4, sodium: 0, potassium: 60
    }));
  });

  it('uses saved portion weights and recipe values when converting an entry to grams', () => {
    const save = vi.fn();
    const saved: JournalEntry = {
      ...entry, quantity: 1, unit: 'bol', kcal: 400,
      nutritionSnapshot: { ...food, portions: [{ name: 'bol', grams: 100 }] }
    };
    render(<EditJournalModal entry={saved} onSave={save} onDelete={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Unité'), { target: { value: 'g' } });
    fireEvent.change(screen.getByLabelText('Quantité'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ unit: 'g', quantity: 50, kcal: 200, sodium: 0 }));
  });

  it('keeps legacy custom portions in their original unit rather than guessing their weight', () => {
    render(<EditJournalModal entry={{ ...entry, unit: 'bol' }} onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Unité').querySelectorAll('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'bol' })).toBeTruthy();
  });
});

describe('advanced weighing', () => {
  it.each(['Tare', 'Restant', 'Différence'])('logs a %s result in grams instead of bowls', mode => {
    const save = vi.fn();
    render(<QuantityEntry food={food} onSave={save} onCancel={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'bol' })).toHaveProperty('selected', true);
    fireEvent.click(screen.getByRole('button', { name: /Calcul avancé/ }));
    fireEvent.click(screen.getByRole('button', { name: mode }));
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '150' } });
    fireEvent.change(inputs[1], { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ce résultat' }));
    expect(screen.getByRole('option', { name: 'g' })).toHaveProperty('selected', true);
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ quantity: 50, unit: 'g' }));
  });
});
