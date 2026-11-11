import { foodDisplayName } from '../data/genericFoods';
import { useState } from 'react';
import type { JournalEntry, MealType } from '../types';
import { MEAL_TYPES } from '../types';
import { historicalNutrition, historicalUnits } from '../utils/journalNutrition';
import './EditJournalModal.css';
import { t, unitLabel, macroLetter } from '../i18n';
import { ti, Icon } from './Icon';

interface EditJournalModalProps {
  entry: JournalEntry;
  onSave: (updatedEntry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

export function EditJournalModal({ entry, onSave, onDelete, onCancel }: EditJournalModalProps) {
  const [quantity, setQuantity] = useState(entry.quantity.toString());
  const [selectedUnit, setSelectedUnit] = useState(entry.unit);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(entry.meal);
  const [time, setTime] = useState(entry.time);

  const unitOptions = historicalUnits(entry);
  const preview = historicalNutrition(entry, Number(quantity), selectedUnit);

  const handleSave = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert(t('Quantité invalide'));
      return;
    }

    const nutrition = historicalNutrition(entry, qty, selectedUnit);
    if (!nutrition) {
      alert(t('Quantité invalide'));
      return;
    }

    onSave({
      ...entry,
      quantity: qty,
      unit: selectedUnit,
      meal: selectedMeal,
      time,
      calculation: qty === entry.quantity && selectedUnit === entry.unit ? entry.calculation : undefined,
      kcal: nutrition.kcal,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      sodium: nutrition.sodium,
      potassium: nutrition.potassium,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDelete = () => {
    if (confirm(t('Supprimer cette entrée du journal ?'))) {
      onDelete(entry.id);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-journal-modal">
        <div className="modal-header">
          <h3>{t('Modifier l\'entrée')}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="entry-food-name">
            <h4>{foodDisplayName(entry.foodName, entry.foodSource)}</h4>
          </div>

          <div className="edit-field">
            <label htmlFor="edit-time">{t('Heure')}</label>
            <input
              id="edit-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="edit-field">
            <label htmlFor="edit-quantity">{t('Quantité')}</label>
            <div className="quantity-input-group">
              <input
                id="edit-quantity"
                type="number"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
              />
              <select
                aria-label={t('Unité')}
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="unit-selector"
              >
                {unitOptions.map(unit => (
                  <option key={unit} value={unit}>{unit === 'g' || unit === 'ml' ? unitLabel(unit) : unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="edit-field">
            <label htmlFor="edit-meal">{t('Repas')}</label>
            <select
              id="edit-meal"
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value as MealType)}
              className="meal-selector"
            >
              {MEAL_TYPES.map(meal => (
                <option key={meal} value={meal}>{t(meal)}</option>
              ))}
            </select>
          </div>

          {preview && (
            <div className="nutrition-preview">
              <span className="preview-kcal">{preview.kcal} {unitLabel('kcal')}</span>
              <span className="preview-macros">
                {macroLetter('P')} {preview.protein}{unitLabel('g')} · {macroLetter('G')} {preview.carbs}{unitLabel('g')} · {macroLetter('L')} {preview.fat}{unitLabel('g')}
              </span>
            </div>
          )}

          {entry.calculation && (
            <div className="calculation-note">
              <Icon name="calc" />{entry.calculation.description}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-danger" onClick={handleDelete}>
            {ti('🗑️ Supprimer')}
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            {t('Annuler')}
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {t('Enregistrer')}
          </button>
        </div>
      </div>
    </div>
  );
}
