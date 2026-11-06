import { useState, useEffect } from 'react';
import type { JournalEntry, Food, MealType } from '../types';
import { MEAL_TYPES } from '../types';
import { getFood } from '../db';
import { convertPortionToGrams, calculateNutrition } from '../utils/calculations';
import './EditJournalModal.css';

interface EditJournalModalProps {
  entry: JournalEntry;
  onSave: (updatedEntry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

export function EditJournalModal({ entry, onSave, onDelete, onCancel }: EditJournalModalProps) {
  const [food, setFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(entry.quantity.toString());
  const [selectedUnit, setSelectedUnit] = useState(entry.unit);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(entry.meal);
  const [time, setTime] = useState(entry.time);

  useEffect(() => {
    loadFood();
  }, [entry.foodId]);

  const loadFood = async () => {
    const f = await getFood(entry.foodId);
    setFood(f || null);
  };

  const getUnitOptions = (): Array<{ value: string; label: string }> => {
    const options: Array<{ value: string; label: string }> = [
      { value: 'g', label: 'g' },
      { value: 'ml', label: 'ml' }
    ];
    if (food?.portions) {
      food.portions.forEach(p => {
        options.push({ value: p.name, label: p.name });
      });
    }
    return options;
  };

  const calculatePreview = () => {
    if (!food) return null;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return null;

    let grams = qty;
    if (selectedUnit !== 'g' && selectedUnit !== 'ml' && food.portions) {
      const g = convertPortionToGrams(qty, selectedUnit, food.portions);
      if (g !== null) grams = g;
    }
    return calculateNutrition(food, grams);
  };

  const preview = calculatePreview();

  const handleSave = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Quantité invalide');
      return;
    }

    let grams = qty;
    if (selectedUnit !== 'g' && selectedUnit !== 'ml' && food?.portions) {
      const g = convertPortionToGrams(qty, selectedUnit, food.portions);
      if (g !== null) grams = g;
    }

    const nutrition = food ? calculateNutrition(food, grams) : {
      kcal: entry.kcal, protein: entry.protein, carbs: entry.carbs, fat: entry.fat
    };

    onSave({
      ...entry,
      quantity: qty,
      unit: selectedUnit,
      meal: selectedMeal,
      time,
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
    if (confirm('Supprimer cette entrée du journal ?')) {
      onDelete(entry.id);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-journal-modal">
        <div className="modal-header">
          <h3>Modifier l'entrée</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="entry-food-name">
            <h4>{entry.foodName}</h4>
          </div>

          <div className="edit-field">
            <label htmlFor="edit-time">Heure</label>
            <input
              id="edit-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="edit-field">
            <label htmlFor="edit-quantity">Quantité</label>
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
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="unit-selector"
              >
                {getUnitOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="edit-field">
            <label htmlFor="edit-meal">Repas</label>
            <select
              id="edit-meal"
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value as MealType)}
              className="meal-selector"
            >
              {MEAL_TYPES.map(meal => (
                <option key={meal} value={meal}>{meal}</option>
              ))}
            </select>
          </div>

          {preview && (
            <div className="nutrition-preview">
              <span className="preview-kcal">{preview.kcal} kcal</span>
              <span className="preview-macros">
                P {preview.protein}g · G {preview.carbs}g · L {preview.fat}g
              </span>
            </div>
          )}

          {entry.calculation && (
            <div className="calculation-note">
              🧮 {entry.calculation.description}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-danger" onClick={handleDelete}>
            🗑️ Supprimer
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
