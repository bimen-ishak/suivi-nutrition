import { useState, useEffect } from 'react';
import { getJournalEntriesByDate, getDailySummary, recalculateDailySummary } from '../db';
import type { JournalEntry, DailySummary } from '../types';
import './Today.css';

export function Today() {
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

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayData();
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
    const objective = -500;
    const remainingToObjective = net - objective;

    if (remainingToObjective > 0) {
      return {
        message: `Il faut brûler ${remainingToObjective} kcal de plus pour atteindre −500`,
        type: 'warning'
      };
    } else if (remainingToObjective < 0) {
      return {
        message: `Il te reste ${Math.abs(remainingToObjective)} kcal à manger pour atteindre −500`,
        type: 'success'
      };
    } else {
      return {
        message: 'Objectif atteint exactement ! 🎯',
        type: 'success'
      };
    }
  };

  const balance = getBalanceMessage();

  return (
    <div className="today-page">
      <div className="today-header">
        <h1>{formatDate(today)}</h1>
      </div>

      {/* Carte Bilan du jour */}
      <div className="balance-card">
        <h2>Bilan du jour</h2>

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

        {!dailySummary?.caloriesBurned && (
          <button className="btn btn-primary" style={{ marginTop: '12px' }}>
            📊 Saisir ma dépense
          </button>
        )}

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
          <div className="journal-list">
            {journalEntries.map(entry => (
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
                  <button className="btn-icon" title="Modifier">✏️</button>
                  <button className="btn-icon" title="Supprimer">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton principal "Ajouter" */}
      <button className="fab">
        + Ajouter un aliment
      </button>
    </div>
  );
}