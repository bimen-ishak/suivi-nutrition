import { useState, useEffect } from 'react';
import type { DailySummary } from '../types';
import { calculateSleepDuration } from '../utils/calculations';
import './DailySummaryModal.css';

interface DailySummaryModalProps {
  date: string;
  existingSummary?: DailySummary | null;
  onSave: (summary: DailySummary) => void;
  onCancel: () => void;
}

export function DailySummaryModal({ date, existingSummary, onSave, onCancel }: DailySummaryModalProps) {
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [caloriesBurnedProvisional, setCaloriesBurnedProvisional] = useState(false);
  const [weight, setWeight] = useState('');
  const [sleepBedtime, setSleepBedtime] = useState('');
  const [sleepWakeup, setSleepWakeup] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingSummary) {
      setCaloriesBurned(existingSummary.caloriesBurned?.toString() || '');
      setCaloriesBurnedProvisional(existingSummary.caloriesBurnedProvisional || false);
      setWeight(existingSummary.weight?.toString() || '');
      setSleepBedtime(existingSummary.sleepBedtime || '');
      setSleepWakeup(existingSummary.sleepWakeup || '');
      setNotes(existingSummary.notes || '');
    }
  }, [existingSummary]);

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const summary: DailySummary = {
      date,
      caloriesBurned: caloriesBurned ? parseFloat(caloriesBurned) : undefined,
      caloriesBurnedProvisional,
      weight: weight ? parseFloat(weight) : undefined,
      sleepBedtime: sleepBedtime || undefined,
      sleepWakeup: sleepWakeup || undefined,
      sleepDuration: sleepBedtime && sleepWakeup ? calculateSleepDuration(sleepBedtime, sleepWakeup) : undefined,
      notes: notes || undefined,
      createdAt: existingSummary?.createdAt || now,
      updatedAt: now
    };

    onSave(summary);
  };

  const sleepDuration = sleepBedtime && sleepWakeup ? calculateSleepDuration(sleepBedtime, sleepWakeup) : null;

  return (
    <div className="modal-overlay">
      <div className="modal-content daily-summary-modal">
        <div className="modal-header">
          <h3>Bilan du jour</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          {/* Calories brûlées */}
          <div className="summary-field">
            <label htmlFor="calories-burned">Calories brûlées</label>
            <div className="input-with-unit">
              <input
                id="calories-burned"
                type="number"
                inputMode="decimal"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                placeholder="Ex: 2500"
                autoFocus
              />
              <span className="unit">kcal</span>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={caloriesBurnedProvisional}
                onChange={(e) => setCaloriesBurnedProvisional(e.target.checked)}
              />
              <span>Valeur provisoire</span>
            </label>
          </div>

          {/* Poids */}
          <div className="summary-field">
            <label htmlFor="weight">Poids du matin</label>
            <div className="input-with-unit">
              <input
                id="weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ex: 75.5"
              />
              <span className="unit">kg</span>
            </div>
          </div>

          {/* Sommeil */}
          <div className="summary-field">
            <label>Sommeil</label>
            <div className="sleep-inputs">
              <div className="sleep-input-group">
                <label htmlFor="sleep-bedtime" className="sleep-label">Coucher</label>
                <input
                  id="sleep-bedtime"
                  type="time"
                  value={sleepBedtime}
                  onChange={(e) => setSleepBedtime(e.target.value)}
                />
              </div>
              <div className="sleep-input-group">
                <label htmlFor="sleep-wakeup" className="sleep-label">Lever</label>
                <input
                  id="sleep-wakeup"
                  type="time"
                  value={sleepWakeup}
                  onChange={(e) => setSleepWakeup(e.target.value)}
                />
              </div>
            </div>
            {sleepDuration !== null && (
              <p className="sleep-duration">Durée: {sleepDuration}h</p>
            )}
          </div>

          {/* Notes */}
          <div className="summary-field">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes optionnelles..."
              rows={3}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
