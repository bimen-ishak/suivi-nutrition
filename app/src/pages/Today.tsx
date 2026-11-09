import { useState, useEffect } from 'react';
import { getJournalEntriesByDate, getDailySummary, getWeightsSince, getCutHistoryDay, recalculateDailySummary, updateDailySummary, updateJournalEntry, deleteJournalEntry } from '../db';
import type { JournalEntry, DailySummary } from '../types';
import { DailySummaryModal } from '../components/DailySummaryModal';
import { EditJournalModal } from '../components/EditJournalModal';
import { CalorieRing } from '../components/CalorieRing';
import { MacroCard } from '../components/MacroCard';
import { getObjective, onObjectiveChange } from '../utils/objective';
import { getWeightTrend, proteinTarget, carbLimit, SODIUM_LIMIT_MG, POTASSIUM_TARGET_MG } from '../utils/cut';
import { parseHealthText, applyHealthToSummary } from '../utils/health';
import { showToast } from '../utils/toast';
import { pickMessage, getLanguage, isRtl, type MessageEvent } from '../utils/messages';
import './Today.css';
import { t, unitLabel, macroLetter, locale, displayUnit, ltr } from '../i18n';

const DEFAULT_PROTEIN_GOAL = 150;
const DEFAULT_CARB_LIMIT = 250;
const DISMISSED_KEY = 'dismissedMissingBurned';

const dateKey = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString().split('T')[0];

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
  // Hier : des repas notés mais pas de dépense, donc le raccourci Santé a sans doute été oublié
  const [yesterdaySummary, setYesterdaySummary] = useState<DailySummary | null>(null);
  const [yesterdayMissing, setYesterdayMissing] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY);
    } catch {
      return null;
    }
  });
  // Jour dont on saisit le bilan à la main : aujourd'hui, ou hier quand la dépense manque
  const [summaryDate, setSummaryDate] = useState<string | null>(null);

  const today = dateKey(0);
  const yesterday = dateKey(1);

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
      const [entries, summary, calculatedTotals, weights, yesterdayEntries, yesterdayDaily, yesterdayHistory] = await Promise.all([
        getJournalEntriesByDate(today),
        getDailySummary(today),
        recalculateDailySummary(today),
        getWeightsSince(twoWeeksAgo),
        getJournalEntriesByDate(yesterday),
        getDailySummary(yesterday),
        getCutHistoryDay(yesterday)
      ]);

      const ateYesterday = yesterdayEntries.length > 0 || (yesterdayHistory?.kcal ?? 0) > 0;
      const knowsBurned = !!yesterdayDaily?.caloriesBurned || !!yesterdayHistory?.burned;
      setYesterdaySummary(yesterdayDaily ?? null);
      setYesterdayMissing(ateYesterday && !knowsBurned);

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
    return new Intl.DateTimeFormat(locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getBalanceMessage = () => {
    if (!dailySummary?.caloriesBurned) {
      return {
        message: t('Saisis ta dépense pour voir le bilan'),
        type: 'neutral'
      };
    }

    const net = totals.caloriesEaten - dailySummary.caloriesBurned;
    const remainingToObjective = net - objective;
    const objLabel = ltr(objective > 0 ? `+${objective}` : `${objective}`);

    if (remainingToObjective > 0) {
      return {
        message: t('Il faut brûler {n} kcal de plus pour atteindre {objectif}', { n: remainingToObjective, objectif: objLabel }),
        type: 'warning'
      };
    } else if (remainingToObjective < 0) {
      return {
        message: t('Il te reste {n} kcal à manger pour atteindre {objectif}', { n: Math.abs(remainingToObjective), objectif: objLabel }),
        type: 'success'
      };
    } else {
      return {
        message: t('Objectif atteint exactement ! 🎯'),
        type: 'success'
      };
    }
  };

  const handleSaveSummary = async (summary: DailySummary) => {
    try {
      // put : crée le bilan du jour ou met à jour celui qui existe déjà
      await updateDailySummary(summary);
      await loadTodayData();
      setShowSummaryModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du bilan:', error);
      alert(t('Erreur lors de la sauvegarde'));
    }
  };

  const openSummary = (date: string) => {
    setSummaryDate(date);
    setShowSummaryModal(true);
  };

  const dismissMissing = () => {
    setDismissed(yesterday);
    try {
      localStorage.setItem(DISMISSED_KEY, yesterday);
    } catch {
      // Sans stockage, le rappel reviendra à la prochaine ouverture : rien de grave
    }
  };

  const handleImportHealth = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = parseHealthText(text);
      // Le raccourci peut donner la date du jour concerné : un oubli d'hier se rattrape ainsi
      const targetDate = data.date && data.date <= today ? data.date : today;
      const existing = targetDate === today ? dailySummary : await getDailySummary(targetDate);
      const summary = applyHealthToSummary(existing ?? undefined, targetDate, data, undefined, today);
      const found = [
        data.weight !== undefined && `${t('poids')} ${data.weight} ${unitLabel('kg')}`,
        summary.caloriesBurned !== undefined && `${t('dépense')} ${summary.caloriesBurned} ${unitLabel('kcal')}`
      ].filter(Boolean);

      if (found.length === 0) {
        alert(t('Je ne trouve rien de Santé dans ce qui est copié. Lance d\'abord ton raccourci « Santé → Suivi », puis reviens ici.'));
        return;
      }

      await updateDailySummary(summary);
      await loadTodayData();
      const when = targetDate === today ? '' : ` ${t('pour le {date}', { date: targetDate.split('-').reverse().join('/') })}`;
      showToast(`${t('✅ Importé')}${when} : ${found.join(', ')}\n${pickMessage('healthImported')}`);
    } catch (error) {
      console.error('Erreur lors de l\'import depuis Santé:', error);
      alert(t('Impossible de lire ce qui est copié. Autorise le collage si iPhone te le demande, puis réessaie.'));
    }
  };

  const handleSaveEntry = async (updatedEntry: JournalEntry) => {
    try {
      await updateJournalEntry(updatedEntry.id, updatedEntry);
      await loadTodayData();
      setEditingEntry(null);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert(t('Erreur lors de la modification'));
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteJournalEntry(id);
      await loadTodayData();
      setEditingEntry(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(t('Erreur lors de la suppression'));
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
    const modalDate = summaryDate ?? today;
    return (
      <DailySummaryModal
        date={modalDate}
        existingSummary={modalDate === today ? dailySummary : yesterdaySummary}
        onSave={handleSaveSummary}
        onCancel={() => setShowSummaryModal(false)}
      />
    );
  }

  // Une phrase drôle selon la journée, la même toute la journée pour ne pas changer à chaque affichage
  const language = getLanguage();
  const quipEvent: MessageEvent | null =
    journalEntries.length === 0
      ? 'emptyDay'
      : budget !== null && totals.caloriesEaten > budget
        ? 'overBudget'
        : totals.carbs > carbMax
          ? 'carbsOver'
          : totals.sodium > SODIUM_LIMIT_MG
            ? 'sodiumOver'
            : totals.protein >= proteinGoal
              ? 'proteinGoal'
              : remaining !== null && remaining > 0
                ? 'underBudget'
                : null;
  const quip = quipEvent ? pickMessage(quipEvent, language, today) : null;
  const showMissingBanner = yesterdayMissing && dismissed !== yesterday;

  return (
    <div className="today-page">
      <div className="today-header">
        <h1>{formatDate(today)}</h1>
      </div>

      {/* Rappel : la dépense d'hier manque */}
      {showMissingBanner && (
        <section className="missing-banner" dir={isRtl(language) ? 'rtl' : 'ltr'}>
          <p>{pickMessage('missingBurned', language, yesterday)}</p>
          <div className="missing-actions">
            <button className="btn btn-primary btn-sm" onClick={handleImportHealth}>
              {t('❤️ Importer depuis Santé')}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => openSummary(yesterday)}>
              {t('✏️ Saisir à la main')}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={dismissMissing}>
              {t('Plus tard')}
            </button>
          </div>
        </section>
      )}

      {/* Carte Bilan du jour */}
      <section className="hero-card">
        <div className="hero-top">
          <h2>{t('Bilan du jour')}</h2>
          {(dailySummary?.weight || dailySummary?.sleepDuration) && (
            <div className="secondary-data">
              {dailySummary.weight && (
                <span className="data-badge">⚖️ {dailySummary.weight} {unitLabel('kg')}</span>
              )}
              {dailySummary.sleepDuration && (
                <span className="data-badge">😴 {dailySummary.sleepDuration}{unitLabel('h')}</span>
              )}
            </div>
          )}
        </div>

        <CalorieRing eaten={totals.caloriesEaten} budget={budget} />

        <p className={`hero-message ${balance.type}`}>{balance.message}</p>
        {quip && (
          <p className="hero-quip" dir={isRtl(language) ? 'rtl' : 'ltr'}>
            {quip}
          </p>
        )}

        <div className="stat-tiles">
          <div className="stat-tile">
            <span className="stat-tile-value">{dailySummary?.caloriesBurned ?? '?'}</span>
            <span className="stat-tile-label">
              {t('brûlées')}
              {dailySummary?.caloriesBurnedProvisional && (
                <span className="provisional-badge">{t('provisoire')}</span>
              )}
            </span>
          </div>
          <div className="stat-tile">
            <span className={`stat-tile-value ${remaining !== null && remaining < 0 ? 'negative' : ''}`}>
              {remaining !== null ? Math.abs(remaining) : '?'}
            </span>
            <span className="stat-tile-label">{remaining !== null && remaining < 0 ? t('en trop') : t('restant')}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile-value">
              {net !== null ? ltr(`${net > 0 ? '+' : ''}${net}`) : '?'}
            </span>
            <span className="stat-tile-label">{t('bilan net')}</span>
          </div>
        </div>

        <div className="action-row">
          <button className="btn btn-primary" onClick={() => openSummary(today)}>
            {dailySummary?.caloriesBurned ? t('✏️ Modifier le bilan') : t('📊 Saisir ma dépense')}
          </button>
          <button className="btn btn-secondary" onClick={handleImportHealth}>
            {t('❤️ Importer depuis Santé')}
          </button>
        </div>
      </section>

      {/* Macros et minéraux */}
      <section className="macro-grid">
        <MacroCard label={t('Protéines')} kind="protein" value={totals.protein} goal={proteinGoal} unit="g" />
        <MacroCard label={t('Glucides')} kind="carbs" value={totals.carbs} goal={carbMax} unit="g" isLimit />
        <MacroCard label={t('Lipides')} kind="fat" value={totals.fat} goal={70} unit="g" />
        <MacroCard label={t('Sodium')} kind="sodium" value={totals.sodium} goal={SODIUM_LIMIT_MG} unit="mg" isLimit />
        <MacroCard label={t('Potassium')} kind="potassium" value={totals.potassium} goal={POTASSIUM_TARGET_MG} unit="mg" wide />
        <p className="macro-note">
          {t('Sodium et potassium ne comptent que les aliments où ils sont renseignés.')}
        </p>
      </section>

      {/* Carte Aliments du jour */}
      <div className="foods-card">
        <h2>{t('Aliments du jour')}</h2>

        {journalEntries.length === 0 ? (
          <div className="empty-journal">
            <p>{t('Aucun aliment enregistré aujourd\'hui')}</p>
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
                      <h3>{t(meal)}</h3>
                      <span className="meal-total">{mealTotal} {unitLabel('kcal')}</span>
                    </div>
                    <div className="journal-list">
                      {entries.map(entry => (
                        <div key={entry.id} className="journal-entry">
                          <div className="entry-time">
                            {entry.time} · {t(entry.meal)}
                          </div>
                          <div className="entry-main">
                            <div className="entry-food">
                              <strong>{entry.foodName}</strong>
                              <span className="entry-quantity">
                                {entry.quantity}{displayUnit(entry.unit)}
                                {entry.calculation && (
                                  <span className="calculation-note"> · {entry.calculation.description}</span>
                                )}
                              </span>
                            </div>
                            <div className="entry-kcal">{entry.kcal} {unitLabel('kcal')}</div>
                          </div>
                          <div className="entry-macros">
                            {macroLetter('P')} {Math.round(entry.protein * 10) / 10}{unitLabel('g')} ·
                            {macroLetter('G')} {Math.round(entry.carbs * 10) / 10}{unitLabel('g')} ·
                            {macroLetter('L')} {Math.round(entry.fat * 10) / 10}{unitLabel('g')}
                          </div>
                          <div className="entry-actions">
                            <button className="btn-icon" title={t('Modifier')} onClick={() => setEditingEntry(entry)}>✏️</button>
                            <button
                              className="btn-icon"
                              title={t('Supprimer')}
                              onClick={() => {
                                if (confirm(t('Supprimer cette entrée ?'))) {
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
          {t('+ Ajouter un aliment')}
        </button>
      </div>
    </div>
  );
}