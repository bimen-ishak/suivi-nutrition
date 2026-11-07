import { useState, useEffect } from 'react';
import { getJournalEntriesByDate, getDailySummary, getWeightsSince, recalculateDailySummary, createDailySummary, updateDailySummary, updateJournalEntry, deleteJournalEntry } from '../db';
import type { JournalEntry, DailySummary } from '../types';
import { DailySummaryModal } from '../components/DailySummaryModal';
import { EditJournalModal } from '../components/EditJournalModal';
import { CalorieRing } from '../components/CalorieRing';
import { MacroCard } from '../components/MacroCard';
import { getObjective, onObjectiveChange } from '../utils/objective';
import { getWeightTrend, proteinTarget, carbLimit, SODIUM_LIMIT_MG, POTASSIUM_TARGET_MG } from '../utils/cut';
import { parseHealthText, applyHealthToSummary } from '../utils/health';
import './Today.css';

const DEFAULT_PROTEIN_GOAL = 150;
const DEFAULT_CARB_LIMIT = 250;

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
  const [objective, setObjective] = useState<number>(getObjective());
  const [proteinGoal, setProteinGoal] = useState(DEFAULT_PROTEIN_GOAL);
  const [carbMax, setCarbMax] = useState(DEFAULT_CARB_LIMIT);

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
      const twoWeeksAgo = new Date(Date.now() - 14 * 86_400_000).toISOString().split('T')[0];
      const [entries, summary, calculatedTotals, weights] = await Promise.all([
        getJournalEntriesByDate(today),
        getDailySummary(today),
        recalculateDailySummary(today),
        getWeightsSince(twoWeeksAgo)
      ]);

      const latestTrend = getWeightTrend(weights).at(-1)?.trend;
      setProteinGoal(latestTrend ? proteinTarget(latestTrend) : DEFAULT_PROTEIN_GOAL);
      setCarbMax(latestTrend ? carbLimit(latestTrend) : DEFAULT_CARB_LIMIT);
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

  const handleImportHealth = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = parseHealthText(text);
      const summary = applyHealthToSummary(dailySummary ?? undefined, today, data);
      const found = [
        data.weight !== undefined && `poids ${data.weight} kg`,
        summary.caloriesBurned !== undefined && `dépense ${summary.caloriesBurned} kcal`
      ].filter(Boolean);

      if (found.length === 0) {
        alert('Je ne trouve rien de Santé dans ce qui est copié. Lance d\'abord ton raccourci « Santé → Suivi », puis reviens ici.');
        return;
      }

      if (dailySummary) await updateDailySummary(summary);
      else await createDailySummary(summary);
      await loadTodayData();
      alert(`✅ Importé depuis Santé : ${found.join(', ')}.`);
    } catch (error) {
      console.error('Erreur lors de l\'import depuis Santé:', error);
      alert('Impossible de lire ce qui est copié. Autorise le collage si iPhone te le demande, puis réessaie.');
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

  const balance = getBalanceMessage();
  const burned = dailySummary?.caloriesBurned;
  // On peut manger ce qu'on a brûlé, moins le déficit visé (objectif négatif)
  const budget = burned ? Math.max(burned + objective, 0) : null;
  const remaining = budget !== null ? budget - totals.caloriesEaten : null;
  const net = burned ? totals.caloriesEaten - burned : null;

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

  return (
    <div className="today-page">
      <div className="today-header">
        <h1>{formatDate(today)}</h1>
      </div>

      {/* Carte Bilan du jour */}
      <section className="hero-card">
        <div className="hero-top">
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

        <CalorieRing eaten={totals.caloriesEaten} budget={budget} />

        <p className={`hero-message ${balance.type}`}>{balance.message}</p>

        <div className="stat-tiles">
          <div className="stat-tile">
            <span className="stat-tile-value">{dailySummary?.caloriesBurned ?? '?'}</span>
            <span className="stat-tile-label">
              brûlées
              {dailySummary?.caloriesBurnedProvisional && (
                <span className="provisional-badge">provisoire</span>
              )}
            </span>
          </div>
          <div className="stat-tile">
            <span className={`stat-tile-value ${remaining !== null && remaining < 0 ? 'negative' : ''}`}>
              {remaining !== null ? Math.abs(remaining) : '?'}
            </span>
            <span className="stat-tile-label">{remaining !== null && remaining < 0 ? 'en trop' : 'restant'}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile-value">
              {net !== null ? `${net > 0 ? '+' : ''}${net}` : '?'}
            </span>
            <span className="stat-tile-label">bilan net</span>
          </div>
        </div>

        <div className="action-row">
          <button className="btn btn-primary" onClick={() => setShowSummaryModal(true)}>
            {dailySummary?.caloriesBurned ? '✏️ Modifier le bilan' : '📊 Saisir ma dépense'}
          </button>
          <button className="btn btn-secondary" onClick={handleImportHealth}>
            ❤️ Importer depuis Santé
          </button>
        </div>
      </section>

      {/* Macros et minéraux */}
      <section className="macro-grid">
        <MacroCard label="Protéines" kind="protein" value={totals.protein} goal={proteinGoal} unit="g" />
        <MacroCard label="Glucides" kind="carbs" value={totals.carbs} goal={carbMax} unit="g" isLimit />
        <MacroCard label="Lipides" kind="fat" value={totals.fat} goal={70} unit="g" />
        <MacroCard label="Sodium" kind="sodium" value={totals.sodium} goal={SODIUM_LIMIT_MG} unit="mg" isLimit />
        <MacroCard label="Potassium" kind="potassium" value={totals.potassium} goal={POTASSIUM_TARGET_MG} unit="mg" wide />
        <p className="macro-note">
          Sodium et potassium ne comptent que les aliments où ils sont renseignés.
        </p>
      </section>

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
                      <span className="meal-total">{mealTotal} kcal</span>
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
      <div className="fab-bar">
        <button className="fab" onClick={onAddFood}>
          + Ajouter un aliment
        </button>
      </div>
    </div>
  );
}