import { useState } from 'react';
import type { MealType, OneOffValues } from '../types';
import { MEAL_TYPES } from '../types';
import { calculateNutrition } from '../utils/calculations';
import { LabelScanButton } from './LabelScanButton';
import type { LabelResult } from '../utils/labelReader';
import { estimateMissingValues, needsEstimate } from '../utils/estimates';
import './QuickEntry.css';
import { t, unitLabel } from '../i18n';

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
  const [estimated, setEstimated] = useState(false);

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
    // Le poids lu sur la balance (ou estimé) devient la quantité mangée
    if (result.weight !== undefined) setQuantity(String(result.weight));
  };

  // Calories saisies sans aucune macro : on propose des valeurs moyennes
  const showEstimate = needsEstimate({ kcal: toNumber(kcal), protein, carbs, fat, potassium: '0' }) &&
    [protein, carbs, fat].every(value => value.trim() === '');

  const handleEstimate = () => {
    const estimate = estimateMissingValues(name, toNumber(kcal));
    setProtein(String(estimate.protein));
    setCarbs(String(estimate.carbs));
    setFat(String(estimate.fat));
    setEstimated(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      name: name.trim() || t('Aliment ponctuel'),
      quantity: eaten,
      unit,
      meal,
      values
    });
  };

  return (
    <form className="quick-entry" onSubmit={handleSubmit}>
      <p className="quick-intro">
        {t('Pour un aliment que tu ne manges pas souvent. Il compte dans ta journée, sans aller dans ta bibliothèque.')}
      </p>

      <LabelScanButton onRead={handleLabelRead} />

      <label className="quick-field">
        {t('Nom (optionnel)')}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('Ex : biscuit d\'un pote')}
        />
      </label>

      <div className="quick-pair">
        <label className="quick-field">
          {t('Calories pour 100 {unit}', { unit: unitLabel(unit) })}
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder={t('Ex : 450')}
          />
        </label>

        <label className="quick-field">
          {t("J'ai mangé")}
          <span className="quick-quantity">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('Ex : 30')}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'g' | 'ml')}
              aria-label={t('Unité')}
            >
              <option value="g">{t('g')}</option>
              <option value="ml">{t('ml')}</option>
            </select>
          </span>
        </label>
      </div>

      <p className="quick-subtitle">{t('Pour 100 {unit}, si tu les as (optionnel)', { unit: unitLabel(unit) })}</p>
      <div className="quick-macros">
        <label className="quick-field">
          {t('Protéines')}
          <input type="number" inputMode="decimal" min="0" step="any" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </label>
        <label className="quick-field">
          {t('Glucides')}
          <input type="number" inputMode="decimal" min="0" step="any" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </label>
        <label className="quick-field">
          {t('Lipides')}
          <input type="number" inputMode="decimal" min="0" step="any" value={fat} onChange={(e) => setFat(e.target.value)} />
        </label>
      </div>

      {showEstimate && (
        <div className="quick-estimate">
          <p>{t('Pas de macros ? Je peux proposer des valeurs moyennes, marquées « estimation ».')}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleEstimate}>
            {t('💡 Proposer des valeurs moyennes')}
          </button>
        </div>
      )}
      {estimated && !showEstimate && <p className="quick-estimate-note">{t('📊 Valeurs estimées, à titre indicatif.')}</p>}

      <label className="quick-field">
        {t('Repas')}
        <select value={meal} onChange={(e) => setMeal(e.target.value as MealType)}>
          {MEAL_TYPES.map(m => (
            <option key={m} value={m}>{t(m)}</option>
          ))}
        </select>
      </label>

      {preview && (
        <p className="quick-preview">
          <strong>{preview.kcal} {unitLabel('kcal')}</strong> {t('pour')} {eaten}{unitLabel(unit)}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={!canSave}>
        {t('Ajouter à ma journée')}
      </button>
    </form>
  );
}
