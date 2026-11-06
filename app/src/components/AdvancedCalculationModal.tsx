import { useState } from 'react';
import type { CalculationType } from '../types';
import { calculateTare, calculateRemaining, generateCalculationDescription } from '../utils/calculations';
import './AdvancedCalculationModal.css';

interface AdvancedCalculationModalProps {
  onComplete: (result: {
    finalQuantity: number;
    type: CalculationType;
    values: number[];
    description: string;
  }) => void;
  onCancel: () => void;
}

export function AdvancedCalculationModal({ onComplete, onCancel }: AdvancedCalculationModalProps) {
  const [mode, setMode] = useState<CalculationType>('tare');
  const [values, setValues] = useState<{ [key: string]: string }>({
    gross: '',
    tare: '',
    containerWeight: '',
    initial: '',
    remaining: '',
    value1: '',
    value2: ''
  });

  const handleValueChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const calculateResult = (): number | null => {
    switch (mode) {
      case 'tare': {
        const gross = parseFloat(values.gross);
        const tare = parseFloat(values.tare);
        if (isNaN(gross) || isNaN(tare)) return null;
        return calculateTare(gross, tare);
      }
      case 'remaining': {
        const initial = parseFloat(values.initial);
        const remaining = parseFloat(values.remaining);
        if (isNaN(initial) || isNaN(remaining)) return null;
        return calculateRemaining(initial, remaining);
      }
      case 'difference': {
        const value1 = parseFloat(values.value1);
        const value2 = parseFloat(values.value2);
        if (isNaN(value1) || isNaN(value2)) return null;
        return Math.abs(value1 - value2);
      }
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    const result = calculateResult();
    if (result === null || result <= 0) {
      alert('Veuillez saisir des valeurs valides');
      return;
    }

    const valuesArray = mode === 'tare'
      ? [parseFloat(values.gross), parseFloat(values.tare)]
      : mode === 'remaining'
      ? [parseFloat(values.initial), parseFloat(values.remaining)]
      : [parseFloat(values.value1), parseFloat(values.value2)];

    const description = generateCalculationDescription(mode, valuesArray);

    onComplete({
      finalQuantity: result,
      type: mode,
      values: valuesArray,
      description
    });
  };

  const result = calculateResult();

  return (
    <div className="modal-overlay">
      <div className="modal-content advanced-calc-modal">
        <div className="modal-header">
          <h3>Calcul avancé</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          {/* Sélecteur de mode */}
          <div className="calc-mode-selector">
            <button
              className={`mode-btn ${mode === 'tare' ? 'active' : ''}`}
              onClick={() => setMode('tare')}
            >
              Tare
            </button>
            <button
              className={`mode-btn ${mode === 'remaining' ? 'active' : ''}`}
              onClick={() => setMode('remaining')}
            >
              Restant
            </button>
            <button
              className={`mode-btn ${mode === 'difference' ? 'active' : ''}`}
              onClick={() => setMode('difference')}
            >
              Différence
            </button>
          </div>

          {/* Formulaires selon le mode */}
          <div className="calc-inputs">
            {mode === 'tare' && (
              <>
                <div className="calc-field">
                  <label htmlFor="gross">Poids brut (g)</label>
                  <input
                    id="gross"
                    type="number"
                    inputMode="decimal"
                    value={values.gross}
                    onChange={(e) => handleValueChange('gross', e.target.value)}
                    placeholder="Ex: 250"
                    autoFocus
                  />
                  <p className="field-hint">Poids total avec le contenant</p>
                </div>
                <div className="calc-field">
                  <label htmlFor="tare">Tare (g)</label>
                  <input
                    id="tare"
                    type="number"
                    inputMode="decimal"
                    value={values.tare}
                    onChange={(e) => handleValueChange('tare', e.target.value)}
                    placeholder="Ex: 50"
                  />
                  <p className="field-hint">Poids du contenant vide</p>
                </div>
              </>
            )}

            {mode === 'remaining' && (
              <>
                <div className="calc-field">
                  <label htmlFor="initial">Poids servi (g)</label>
                  <input
                    id="initial"
                    type="number"
                    inputMode="decimal"
                    value={values.initial}
                    onChange={(e) => handleValueChange('initial', e.target.value)}
                    placeholder="Ex: 675"
                    autoFocus
                  />
                  <p className="field-hint">Poids total servi</p>
                </div>
                <div className="calc-field">
                  <label htmlFor="remaining">Restes (g)</label>
                  <input
                    id="remaining"
                    type="number"
                    inputMode="decimal"
                    value={values.remaining}
                    onChange={(e) => handleValueChange('remaining', e.target.value)}
                    placeholder="Ex: 119"
                  />
                  <p className="field-hint">Ce qui reste dans l'assiette</p>
                </div>
              </>
            )}

            {mode === 'difference' && (
              <>
                <div className="calc-field">
                  <label htmlFor="value1">Valeur 1 (g)</label>
                  <input
                    id="value1"
                    type="number"
                    inputMode="decimal"
                    value={values.value1}
                    onChange={(e) => handleValueChange('value1', e.target.value)}
                    placeholder="Ex: 500"
                    autoFocus
                  />
                </div>
                <div className="calc-field">
                  <label htmlFor="value2">Valeur 2 (g)</label>
                  <input
                    id="value2"
                    type="number"
                    inputMode="decimal"
                    value={values.value2}
                    onChange={(e) => handleValueChange('value2', e.target.value)}
                    placeholder="Ex: 300"
                  />
                </div>
                <p className="field-hint">Calcule |Valeur 1 - Valeur 2|</p>
              </>
            )}
          </div>

          {/* Résultat */}
          {result !== null && result > 0 && (
            <div className="calc-result">
              <span className="result-label">Résultat:</span>
              <span className="result-value">{Math.round(result * 10) / 10} g</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={result === null || result <= 0}
          >
            Utiliser ce résultat
          </button>
        </div>
      </div>
    </div>
  );
}
