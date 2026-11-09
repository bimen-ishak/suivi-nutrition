import { useState, useEffect } from 'react';
import type { Food, CalculationType, MealType } from '../types';
import { MEAL_TYPES } from '../types';
import { convertPortionToGrams, calculateNutrition } from '../utils/calculations';
import { AdvancedCalculationModal } from './AdvancedCalculationModal';
import './QuantityEntry.css';
import { t, unitLabel } from '../i18n';
import { ti, Icon } from './Icon';

interface QuantityEntryProps {
  food: Food;
  onSave: (entry: {
    quantity: number;
    unit: string;
    meal: MealType;
    calculation?: {
      type: CalculationType;
      values: number[];
      description: string;
    };
  }) => void;
  onCancel: () => void;
}

export function QuantityEntry({ food, onSave, onCancel }: QuantityEntryProps) {
  const [quantity, setQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('g');
  const [selectedMeal, setSelectedMeal] = useState<MealType>(MEAL_TYPES[0]);
  const [showAdvancedCalc, setShowAdvancedCalc] = useState(false);
  const [calculation, setCalculation] = useState<{
    type: CalculationType;
    values: number[];
    description: string;
  } | undefined>();

  // Définir l'unité par défaut selon les portions définies
  useEffect(() => {
    if (food.portions && food.portions.length > 0) {
      setSelectedUnit(food.portions[0].name);
    } else {
      setSelectedUnit(food.baseUnit ?? 'g');
    }
  }, [food]);

  // Options d'unités disponibles
  const getUnitOptions = (): Array<{ value: string; label: string }> => {
    const options: Array<{ value: string; label: string }> = [
      { value: 'g', label: 'g' },
      { value: 'ml', label: 'ml' }
    ];

    if (food.portions) {
      food.portions.forEach(p => {
        options.push({ value: p.name, label: p.name });
      });
    }

    return options;
  };

  // Calculer la nutrition en temps réel
  const calculatePreview = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return null;
    }

    let gramsForCalculation = qty;

    // Si c'est une portion personnalisée, convertir en grammes
    if (selectedUnit !== 'g' && selectedUnit !== 'ml' && food.portions) {
      const grams = convertPortionToGrams(qty, selectedUnit, food.portions);
      if (grams !== null) {
        gramsForCalculation = grams;
      }
    }

    return calculateNutrition(food, gramsForCalculation);
  };

  const preview = calculatePreview();

  const handleAdvancedCalcComplete = (result: {
    finalQuantity: number;
    type: CalculationType;
    values: number[];
    description: string;
  }) => {
    setQuantity(result.finalQuantity.toString());
    setCalculation({
      type: result.type,
      values: result.values,
      description: result.description
    });
    setShowAdvancedCalc(false);
  };

  const handleSubmit = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert(t('Veuillez saisir une quantité valide'));
      return;
    }

    onSave({
      quantity: qty,
      unit: selectedUnit,
      meal: selectedMeal,
      calculation
    });
  };

  const unitOptions = getUnitOptions();

  if (showAdvancedCalc) {
    return (
      <AdvancedCalculationModal
        onComplete={handleAdvancedCalcComplete}
        onCancel={() => setShowAdvancedCalc(false)}
      />
    );
  }

  return (
    <div className="quantity-entry">
      <div className="quantity-header">
        <button className="back-btn" onClick={onCancel}>
          {t('← Retour')}
        </button>
        <h2>{t('Quantité')}</h2>
        <div style={{ width: '40px' }}></div> {/* Spacer for centering */}
      </div>

      <div className="quantity-content">
        {/* Nom de l'aliment */}
        <div className="food-name-display">
          <h3>{food.name}</h3>
          {food.brand && <p className="food-brand">{food.brand}</p>}
        </div>

        {/* Saisie de quantité */}
        <div className="quantity-input-section">
          <label htmlFor="quantity-input">{t('Quantité')}</label>
          <div className="quantity-input-group">
            <input
              id="quantity-input"
              type="number"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              autoFocus
            />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="unit-selector"
            >
              {unitOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bouton Calcul avancé */}
        <button
          className="btn btn-secondary btn-block advanced-calc-btn"
          onClick={() => setShowAdvancedCalc(true)}
        >
          {ti('🧮 Calcul avancé')}
        </button>

        {calculation && (
          <div className="calculation-display">
            <span className="calc-icon"><Icon name="calc" /></span>
            <span className="calc-text">{calculation.description}</span>
          </div>
        )}

        {/* Sélecteur de repas */}
        <div className="meal-selector-section">
          <label htmlFor="meal-select">{t('Repas')}</label>
          <select
            id="meal-select"
            value={selectedMeal}
            onChange={(e) => setSelectedMeal(e.target.value as MealType)}
            className="meal-selector"
          >
            {MEAL_TYPES.map(meal => (
              <option key={meal} value={meal}>
                {t(meal)}
              </option>
            ))}
          </select>
        </div>

        {/* Aperçu nutrition */}
        {preview && (
          <div className="nutrition-preview">
            <h4>{t('Aperçu nutrition')}</h4>
            <div className="preview-main">
              <div className="preview-calories">
                <span className="preview-value">{preview.kcal}</span>
                <span className="preview-label">{t('kcal')}</span>
              </div>
            </div>
            <div className="preview-macros">
              <div className="preview-macro">
                <span className="macro-label">{t('Protéines')}</span>
                <span className="macro-value">{Math.round(preview.protein * 10) / 10}{unitLabel('g')}</span>
              </div>
              <div className="preview-macro">
                <span className="macro-label">{t('Glucides')}</span>
                <span className="macro-value">{Math.round(preview.carbs * 10) / 10}{unitLabel('g')}</span>
              </div>
              <div className="preview-macro">
                <span className="macro-label">{t('Lipides')}</span>
                <span className="macro-value">{Math.round(preview.fat * 10) / 10}{unitLabel('g')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="quantity-actions">
        <button
          className="btn btn-secondary"
          onClick={onCancel}
        >
          {t('Annuler')}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!quantity || parseFloat(quantity) <= 0}
        >
          {t('Valider')}
        </button>
      </div>
    </div>
  );
}
