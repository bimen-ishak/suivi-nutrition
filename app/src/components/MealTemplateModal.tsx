import { useState } from 'react';
import type { JournalEntry, MealType } from '../types';
import { MEAL_TYPES } from '../types';
import './MealTemplateModal.css';

interface MealTemplateModalProps {
  entries: JournalEntry[];
  onSave: (name: string, meal: MealType) => void;
  onCancel: () => void;
}

export function MealTemplateModal({ entries, onSave, onCancel }: MealTemplateModalProps) {
  const [name, setName] = useState('');
  const [meal, setMeal] = useState<MealType>(entries[0]?.meal || MEAL_TYPES[0]);

  const totalKcal = entries.reduce((sum, e) => sum + e.kcal, 0);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Donne un nom au repas type');
      return;
    }
    onSave(name.trim(), meal);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content template-modal">
        <div className="modal-header">
          <h3>💾 Enregistrer comme repas type</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="template-items">
            <h4>{entries.length} aliment{entries.length > 1 ? 's' : ''} — {totalKcal} kcal</h4>
            {entries.map(e => (
              <div key={e.id} className="template-item">
                <span>{e.foodName}</span>
                <span className="item-qty">{e.quantity}{e.unit} · {e.kcal} kcal</span>
              </div>
            ))}
          </div>

          <div className="template-field">
            <label htmlFor="template-name">Nom du repas type</label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Petit-déj habituel"
              autoFocus
            />
          </div>

          <div className="template-field">
            <label htmlFor="template-meal">Repas par défaut</label>
            <select
              id="template-meal"
              value={meal}
              onChange={(e) => setMeal(e.target.value as MealType)}
            >
              {MEAL_TYPES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
