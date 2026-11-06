import { useState, useEffect } from 'react';
import { getJournalEntriesByDate, getDailySummary, recalculateDailySummary, createDailySummary, updateDailySummary, updateJournalEntry, deleteJournalEntry, createMealTemplate } from '../db';
import type { JournalEntry, DailySummary, MealType } from '../types';
import { DailySummaryModal } from '../components/DailySummaryModal';
import { EditJournalModal } from '../components/EditJournalModal';
import { MealTemplateModal } from '../components/MealTemplateModal';
import { getObjective, onObjectiveChange } from '../utils/objective';
import './Today.css';

interface TodayProps {
  onAddFood: () => void;
}

export function Today({ onAddFood }: TodayProps) {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [totals, setTotals] = useState({
    caloriesEaten: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sodium: 0,
    potassium: 0
  });
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState<{ entries: JournalEntry[], meal: MealType } | null>(null);
  const [objective, setObjective] = useState<number>(getObjective());

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayData();
  }, []);

  // Recharger les données quand le composant redevient visible
  useEffect(() => {
    const handleFocus = () => {
      loadTodayData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Mettre à jour l'objectif si changé dans les réglages (autre onglet)
  useEffect(() => {
    return onObjectiveChange(setObjective);
  }, []);

  const loadTodayData = async () => {
    try {
      const [entries, summary, calculatedTotals] = await Promise.all([
        getJournalEntriesByDate(today),
        getDailySummary(today),
        recalculateDailySummary(today)
      ]);

      setJournalEntries(entries);
      setDailySummary(summary || null);
      setTotals(calculatedTotals);
    } catch (error) {
      console.error('Erreur lors du chargement des données du jour:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getBalanceMessage = () => {
    if (!dailySummary?.caloriesBurned) {
      return {
        message: 'Saisis ta dépense pour voir le bilan',
        type: 'neutral'
      };
    }

    const net = totals.caloriesEaten - dailySummary.caloriesBurned;
    const remainingToObjective = net - objective;
    const objLabel = objective > 0 ? `+${objective}` : `${objective}`;

    if (remainingToObjective > 0) {
      return {
        message: `Il faut brûler ${remainingToObjective} kcal de plus pour atteindre ${objLabel}`,
        type: 'warning'
      };
    } else if (remainingToObjective < 0) {
      return {
        message: `Il te reste ${Math.abs(remainingToObjective)} kcal à manger pour atteindre ${objLabel}`,
        type: 'success'
      };
    } else {
      return {
        message: 'Objectif atteint exactement ! 🎯',
        type: 'success'
      };
    }
  };

  const handleSaveSummary = async (summary: DailySummary) => {
    try {
      if (dailySummary) {
        // Mise à jour
        await updateDailySummary(summary);
      } else {
        // Création
        await createDailySummary(summary);
      }
      await loadTodayData();
      setShowSummaryModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du bilan:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleSaveEntry = async (updatedEntry: JournalEntry) => {
    try {
      await updateJournalEntry(updatedEntry.id, updatedEntry);
      await loadTodayData();
      setEditingEntry(null);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteJournalEntry(id);
      await loadTodayData();
      setEditingEntry(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleCreateTemplate = (meal: MealType) => {
    // Un aliment ponctuel n'a pas de fiche à réutiliser dans un repas type
    const mealEntries = journalEntries.filter(e => e.meal === meal && !e.oneOff);
    if (mealEntries.length === 0) {
      alert('Aucun aliment pour ce repas');
      return;
    }
    setCreatingTemplate({ entries: mealEntries, meal });
  };

  const handleSaveTemplate = async (name: string, meal: MealType) => {
    if (!creatingTemplate) return;

    const template = {
      id: crypto.randomUUID(),
      name,
      meal,
      items: creatingTemplate.entries.map(e => ({
        foodId: e.foodId,
        foodName: e.foodName,
        quantity: e.quantity,
        unit: e.unit,
        kcal: e.kcal
      })),
      createdAt: new Date().toISOString()
    };

    await createMealTemplate(template);
    setCreatingTemplate(null);
    alert(`Repas type "${name}" créé !`);
  };

  const balance = getBalanceMessage();

  if (editingEntry) {
    return (
      <EditJournalModal
        entry={editingEntry}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        onCancel={() => setEditingEntry(null)}
      />
    );
  }

  if (showSummaryModal) {
    return (
      <DailySummaryModal
        date={today}
        existingSummary={dailySummary}
        onSave={handleSaveSummary}
        onCancel={() => setShowSummaryModal(false)}
      />
    );
  }

  if (creatingTemplate) {
    return (
      <MealTemplateModal
        entries={creatingTemplate.entries}
        onSave={handleSaveTemplate}
        onCancel={() => setCreatingTemplate(null)}
      />
    );
  }

  return (
    <div className="today-page">
      <div className="today-header">
        <h1>{formatDate(today)}</h1>
      </div>

      {/* Carte Bilan du jour */}
      <div className="balance-card">
        <div className="card-header">
          <h2>Bilan du jour</h2>
          {(dailySummary?.weight || dailySummary?.sleepDuration) && (
            <div className="secondary-data">
              {dailySummary.weight && (
                <span className="data-badge">⚖️ {dailySummary.weight} kg</span>
              )}
              {dailySummary.sleepDuration && (
                <span className="data-badge">😴 {dailySummary.sleepDuration}h</span>
              )}
            </div>
          )}
        </div>

        <div className="balance-summary">
          <div className="balance-row">
            <span className="balance-label">Calories mangées</span>
            <span className="balance-value">{totals.caloriesEaten} kcal</span>
          </div>

          <div className="balance-row">
            <span className="balance-label">Calories brûlées</span>
            <span className="balance-value">
              {dailySummary?.caloriesBurned || '?'} kcal
              {dailySummary?.caloriesBurnedProvisional && (
                <span className="provisional-badge">provisoire</span>
              )}
            </span>
          </div>

          {dailySummary?.caloriesBurned && (
            <div className="balance-row net">
              <span className="balance-label">Bilan net</span>
              <span className="balance-value">
                {totals.caloriesEaten - dailySummary.caloriesBurned} kcal
              </span>
            </div>
          )}
        </div>

        <div className={`balance-message ${balance.type}`}>
          {balance.message}
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: '12px' }}
          onClick={() => setShowSummaryModal(true)}
        >
          {dailySummary?.caloriesBurned ? '✏️ Modifier le bilan' : '📊 Saisir ma dépense'}
        </button>

        {/* Barres de macros */}
        <div className="macros-bars">
          <div className="macro-bar">
            <div className="macro-label">
              <span>Protéines</span>
              <span className="macro-value">{Math.round(totals.protein * 10) / 10}g</span>
            </div>
            <div className="bar-container">
              <div
                className="bar bar-protein"
                style={{ width: `${Math.min((totals.protein / 150) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="macro-bar">
            <div className="macro-label">
              <span>Glucides</span>
              <span className="macro-value">{Math.round(totals.carbs * 10) / 10}g</span>
            </div>
            <div className="bar-container">
              <div
                className="bar bar-carbs"
                style={{ width: `${Math.min((totals.carbs / 250) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="macro-bar">
            <div className="macro-label">
              <span>Lipides</span>
              <span className="macro-value">{Math.round(totals.fat * 10) / 10}g</span>
            </div>
            <div className="bar-container">
              <div
                className="bar bar-fat"
                style={{ width: `${Math.min((totals.fat / 70) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Carte Aliments du jour */}
      <div className="foods-card">
        <h2>Aliments du jour</h2>

        {journalEntries.length === 0 ? (
          <div className="empty-journal">
            <p>Aucun aliment enregistré aujourd'hui</p>
          </div>
        ) : (
          <div className="journal-by-meal">
            {(() => {
              const byMeal = journalEntries.reduce((acc, entry) => {
                if (!acc[entry.meal]) acc[entry.meal] = [];
                acc[entry.meal].push(entry);
                return acc;
              }, {} as Record<string, JournalEntry[]>);

              return Object.entries(byMeal).map(([meal, entries]) => {
                const mealTotal = entries.reduce((sum, e) => sum + e.kcal, 0);
                return (
                  <div key={meal} className="meal-section">
                    <div className="meal-header">
                      <h3>{meal}</h3>
                      <div className="meal-header-actions">
                        <button
                          className="save-template-btn"
                          onClick={() => handleCreateTemplate(meal as MealType)}
                          title="Enregistrer comme repas type"
                        >
                          💾
                        </button>
                        <span className="meal-total">{mealTotal} kcal</span>
                      </div>
                    </div>
                    <div className="journal-list">
                      {entries.map(entry => (
                        <div key={entry.id} className="journal-entry">
                          <div className="entry-time">
                            {entry.time} · {entry.meal}
                          </div>
                          <div className="entry-main">
                            <div className="entry-food">
                              <strong>{entry.foodName}</strong>
                              <span className="entry-quantity">
                                {entry.quantity}{entry.unit}
                                {entry.calculation && (
                                  <span className="calculation-note"> · {entry.calculation.description}</span>
                                )}
                              </span>
                            </div>
                            <div className="entry-kcal">{entry.kcal} kcal</div>
                          </div>
                          <div className="entry-macros">
                            P {Math.round(entry.protein * 10) / 10}g ·
                            G {Math.round(entry.carbs * 10) / 10}g ·
                            L {Math.round(entry.fat * 10) / 10}g
                          </div>
                          <div className="entry-actions">
                            <button className="btn-icon" title="Modifier" onClick={() => setEditingEntry(entry)}>✏️</button>
                            <button
                              className="btn-icon"
                              title="Supprimer"
                              onClick={() => {
                                if (confirm('Supprimer cette entrée ?')) {
                                  handleDeleteEntry(entry.id);
                                }
                              }}
                            >🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Bouton principal "Ajouter" */}
      <button className="fab" onClick={onAddFood}>
        + Ajouter un aliment
      </button>
    </div>
  );
}