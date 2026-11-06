import { useState, useEffect } from 'react';
import { getCutHistoryDay, getJournalEntriesByDate, getDailySummary, recalculateDailySummary } from '../db';
import type { JournalEntry, DailySummary } from '../types';
import { CutCard } from '../components/CutCard';
import { importedDayToView } from '../utils/cut';
import './History.css';

interface DayData {
  date: string;
  entries: JournalEntry[];
  summary: DailySummary | undefined;
  totals: {
    caloriesEaten: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  // Présent pour un jour importé : des totaux sans le détail des repas
  imported?: { hasCalories: boolean };
}

export function History() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les dates uniques du journal (30 derniers jours)
      const today = new Date();
      const dates: string[] = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }

      const daysData: DayData[] = [];
      for (const date of dates) {
        const [entries, summary, totals, history] = await Promise.all([
          getJournalEntriesByDate(date),
          getDailySummary(date),
          recalculateDailySummary(date),
          getCutHistoryDay(date)
        ]);

        // Un jour sans repas dans l'app peut venir d'un historique importé
        const imported = entries.length === 0 && history ? importedDayToView(history) : null;

        // Ne garder que les jours avec des données
        if (entries.length > 0 || summary || imported) {
          daysData.push({
            date,
            entries,
            summary: summary ?? imported?.summary,
            totals: imported?.totals ?? {
              caloriesEaten: totals.caloriesEaten,
              protein: totals.protein,
              carbs: totals.carbs,
              fat: totals.fat
            },
            imported: imported ? { hasCalories: imported.hasCalories } : undefined
          });
        }
      }

      setDays(daysData);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0];
  };

  const getNetBalance = (day: DayData) => {
    if (!day.summary?.caloriesBurned) return null;
    if (day.imported && !day.imported.hasCalories) return null;
    return day.totals.caloriesEaten - day.summary.caloriesBurned;
  };

  const groupEntriesByMeal = (entries: JournalEntry[]) => {
    const groups: { [meal: string]: JournalEntry[] } = {};
    entries.forEach(entry => {
      if (!groups[entry.meal]) groups[entry.meal] = [];
      groups[entry.meal].push(entry);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  // Vue détaillée d'un jour
  if (selectedDate) {
    const day = days.find(d => d.date === selectedDate);
    if (!day) return null;

    const mealGroups = groupEntriesByMeal(day.entries);
    const net = getNetBalance(day);

    return (
      <div className="history-page">
        <div className="history-header">
          <button className="back-btn" onClick={() => setSelectedDate(null)}>
            ← Retour
          </button>
          <h1>{formatDateLong(day.date)}</h1>
        </div>

        {/* Carte bilan */}
        <div className="day-balance-card">
          <h2>Bilan</h2>
          <div className="day-stats">
            <div className="stat">
              <span className="stat-value">
                {day.imported && !day.imported.hasCalories ? '?' : day.totals.caloriesEaten}
              </span>
              <span className="stat-label">kcal mangées</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {day.summary?.caloriesBurned ?? '?'}
              </span>
              <span className="stat-label">kcal brûlées</span>
            </div>
            <div className="stat">
              <span className={`stat-value ${net !== null ? (net < 0 ? 'negative' : 'positive') : ''}`}>
                {net !== null ? `${net > 0 ? '+' : ''}${net}` : '?'}
              </span>
              <span className="stat-label">bilan net (kcal)</span>
            </div>
          </div>

          <div className="day-macros">
            <div className="macro-stat">
              <span className="macro-label">Protéines</span>
              <span className="macro-value">{Math.round(day.totals.protein * 10) / 10}g</span>
            </div>
            <div className="macro-stat">
              <span className="macro-label">Glucides</span>
              <span className="macro-value">{Math.round(day.totals.carbs * 10) / 10}g</span>
            </div>
            <div className="macro-stat">
              <span className="macro-label">Lipides</span>
              <span className="macro-value">{Math.round(day.totals.fat * 10) / 10}g</span>
            </div>
          </div>

          {(day.summary?.weight || day.summary?.sleepDuration) && (
            <div className="day-extra">
              {day.summary.weight && <span>⚖️ {day.summary.weight} kg</span>}
              {day.summary.sleepDuration && <span>😴 {day.summary.sleepDuration}h</span>}
            </div>
          )}
        </div>

        {/* Aliments par repas */}
        <div className="day-foods-card">
          <h2>Aliments ({day.entries.length})</h2>
          {day.imported && (
            <p className="imported-note">
              Journée importée : les calories et les macros sont gardées, sans le détail des repas.
            </p>
          )}
          {Object.entries(mealGroups).map(([meal, entries]) => (
            <div key={meal} className="meal-group">
              <h3 className="meal-name">{meal}</h3>
              {entries.map(entry => (
                <div key={entry.id} className="history-entry">
                  <span className="entry-time">{entry.time}</span>
                  <div className="entry-info">
                    <strong>{entry.foodName}</strong>
                    <span className="entry-qty">{entry.quantity}{entry.unit}</span>
                  </div>
                  <span className="entry-kcal">{entry.kcal} kcal</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vue liste des jours
  return (
    <div className="history-page">
      <div className="history-header">
        <h1>📊 Historique</h1>
      </div>

      <CutCard />

      {days.length === 0 ? (
        <div className="empty-history">
          <p>Aucune donnée enregistrée</p>
          <p className="hint">Ajoute des aliments depuis l'onglet Aujourd'hui</p>
        </div>
      ) : (
        <div className="days-list">
          {days.map(day => {
            const net = getNetBalance(day);
            return (
              <div
                key={day.date}
                className={`day-card ${isToday(day.date) ? 'today' : ''}`}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className="day-card-header">
                  <span className="day-date">
                    {isToday(day.date) ? "Aujourd'hui" : formatDate(day.date)}
                  </span>
                  <span className={`day-net ${net !== null ? (net < 0 ? 'negative' : 'positive') : ''}`}>
                    {net !== null ? `${net > 0 ? '+' : ''}${net} kcal` : ''}
                  </span>
                </div>
                <div className="day-card-body">
                  {(!day.imported || day.imported.hasCalories) && (
                    <span className="day-kcal">{day.totals.caloriesEaten} kcal</span>
                  )}
                  <span className="day-count">
                    {day.imported ? 'importé' : `${day.entries.length} aliment${day.entries.length > 1 ? 's' : ''}`}
                  </span>
                  {day.summary?.weight && <span className="day-weight">⚖️ {day.summary.weight}kg</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
