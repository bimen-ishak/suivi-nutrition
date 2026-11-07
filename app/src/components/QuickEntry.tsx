import { useState } from 'react';
import type { MealType, OneOffValues } from '../types';
import { MEAL_TYPES } from '../types';
import { calculateNutrition } from '../utils/calculations';
import { LabelScanButton } from './LabelScanButton';
import type { LabelResult } from '../utils/labelReader';
import './QuickEntry.css';

export interface QuickEntryData {
  name: string;
  quantity: number;
  unit: 'g' | 'ml';
  meal: MealType;
  values: OneOffValues;
}

interface QuickEntryProps {
  onSave: (data: QuickEntryData) => void;
}

const toNumber = (value: string) => {
  const parsed = parseFloat(value.replace(',', '.'));
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
};

export function QuickEntry({ onSave }: QuickEntryProps) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'g' | 'ml'>('g');
  const [meal, setMeal] = useState<MealType>(MEAL_TYPES[1]);
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const values: OneOffValues = {
    kcal_per_100g: toNumber(kcal),
    protein: toNumber(protein),
    carbs: toNumber(carbs),
    fat: toNumber(fat)
  };
  const eaten = toNumber(quantity);
  const canSave = kcal.trim() !== '' && eaten > 0;
  const preview = canSave ? calculateNutrition(values, eaten) : null;

  const handleLabelRead = (result: LabelResult) => {
    const text = (value: number | undefined, previous: string) => (value !== undefined ? String(value) : previous);
    if (result.name) setName(result.name);
    setUnit(result.unit);
    setKcal(text(result.kcal, kcal));
    setProtein(text(result.protein, protein));
    setCarbs(text(result.carbs, carbs));
    setFat(text(result.fat, fat));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      name: name.trim() || 'Aliment ponctuel',
      quantity: eaten,
      unit,
      meal,
      values
    });
  };

  return (
    <form className="quick-entry" onSubmit={handleSubmit}>
      <p className="quick-intro">
        Pour un aliment que tu ne manges pas souvent. Il compte dans ta journée, sans aller dans ta bibliothèque.
      </p>

      <LabelScanButton onRead={handleLabelRead} />

      <label className="quick-field">
        Nom (optionnel)
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : biscuit d'un pote"
        />
      </label>

      <div className="quick-pair">
        <label className="quick-field">
          Calories pour 100{unit}
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder="Ex : 450"
          />
        </label>

        <label className="quick-field">
          J'ai mangé
          <span className="quick-quantity">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex : 30"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'g' | 'ml')}
              aria-label="Unité"
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
            </select>
          </span>
        </label>
      </div>

      <p className="quick-subtitle">Pour 100{unit}, si tu les as (optionnel)</p>
      <div className="quick-macros">
        <label className="quick-field">
          Protéines
          <input type="number" inputMode="decimal" min="0" step="any" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </label>
        <label className="quick-field">
          Glucides
          <input type="number" inputMode="decimal" min="0" step="any" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </label>
        <label className="quick-field">
          Lipides
          <input type="number" inputMode="decimal" min="0" step="any" value={fat} onChange={(e) => setFat(e.target.value)} />
        </label>
      </div>

      <label className="quick-field">
        Repas
        <select value={meal} onChange={(e) => setMeal(e.target.value as MealType)}>
          {MEAL_TYPES.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>

      {preview && (
        <p className="quick-preview">
          <strong>{preview.kcal} kcal</strong> pour {eaten}{unit}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={!canSave}>
        Ajouter à ma journée
      </button>
    </form>
  );
}
