import { foodDisplayName } from '../data/genericFoods';
import { useState, useEffect, type CSSProperties } from 'react';
import { getJournalEntriesByDate, getDailySummary, getWeightsSince, getCutHistoryDay, recalculateDailySummary, updateDailySummary, updateJournalEntry, deleteJournalEntry } from '../db';
import type { JournalEntry, DailySummary } from '../types';
import { DailySummaryModal } from '../components/DailySummaryModal';
import { EditJournalModal } from '../components/EditJournalModal';
import { getObjective, onObjectiveChange } from '../utils/objective';
import { getWeightTrend, proteinTarget, carbLimit, SODIUM_LIMIT_MG, POTASSIUM_TARGET_MG } from '../utils/cut';
import { parseHealthText, applyHealthToSummary } from '../utils/health';
import { showToast } from '../utils/toast';
import { pickMessage, getLanguage, isRtl, type MessageEvent } from '../utils/messages';
import './Today.css';
import { t, unitLabel, macroLetter, locale, displayUnit } from '../i18n';
import { ti, Icon } from '../components/Icon';
import { localDateKeys } from '../utils/photo';
import { getPinnedCutMetrics } from '../utils/cutDashboard';
import { dayExpenditure, getProfile, macroTargets, onProfileChange } from '../utils/profile';

const DEFAULT_PROTEIN_GOAL = 150;
const DEFAULT_CARB_LIMIT = 250;
const DEFAULT_FAT_GOAL = 70;
const DISMISSED_KEY = 'dismissedMissingBurned';

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
  // Tendance du poids des 14 derniers jours : les objectifs suivent le poids qui baisse
  const [trendWeight, setTrendWeight] = useState<number | undefined>(undefined);
  const [profile, setProfile] = useState(getProfile);
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

  const [today, yesterday] = localDateKeys(2);
  const [pinnedMetrics] = useState(getPinnedCutMetrics);

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

  useEffect(() => onProfileChange(() => {
    setProfile(getProfile());
    setObjective(getObjective());
  }), []);

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
      setTrendWeight(latestTrend);
      setJournalEntries(entries);
      setDailySummary(summary || null);
      setTotals(calculatedTotals);
    } catch (error) {
      console.error('Erreur lors du chargement des données du jour:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    return new Intl.DateTimeFormat(locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
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
      showToast(`${t('Importé')}${when} : ${found.join(', ')}\n${pickMessage('healthImported')}`);
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

  const burned = dailySummary?.caloriesBurned;
  // On peut manger ce qu'on a brûlé, moins le déficit visé (objectif négatif)
  const weight = trendWeight ?? profile?.weight;
  // Sans dépense réelle, ou avec une dépense Santé encore partielle, on part de la dépense prévue dans le plan
  const day = dayExpenditure(burned, !!dailySummary?.caloriesBurnedProvisional, profile?.burn ?? null);
  const estimated = day.estimated ? day.value : null;
  const budget = day.value ? Math.max(day.value + objective, 0) : null;
  const targets = profile && weight ? macroTargets(weight, budget) : null;
  const proteinGoal = targets?.protein ?? (weight ? proteinTarget(weight) : DEFAULT_PROTEIN_GOAL);
  const carbMax = targets?.carbs ?? (weight ? carbLimit(weight) : DEFAULT_CARB_LIMIT);
  const fatGoal = targets?.fat ?? DEFAULT_FAT_GOAL;
  const remaining = budget !== null ? Math.round((budget - totals.caloriesEaten) * 10) / 10 : null;
  const excess = Math.max(0, -(remaining ?? 0));
  const completion = budget ? Math.min(100, (totals.caloriesEaten / budget) * 100) : excess ? 100 : 0;

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
    remaining !== null && remaining < 0 ? 'overBudget'
      : totals.carbs > carbMax ? 'carbsOver'
      : totals.sodium > SODIUM_LIMIT_MG ? 'sodiumOver'
      : totals.protein >= proteinGoal ? 'proteinGoal'
      : remaining !== null && remaining > 0 && journalEntries.length > 0 ? 'underBudget'
      : null;
  const quip = quipEvent ? pickMessage(quipEvent, language, today) : null;
  const showMissingBanner = yesterdayMissing && dismissed !== yesterday;
  const metric = (key: string, label: string, value: number, goal: number, isLimit: boolean) => (
    <article key={key} data-over={(isLimit && value > goal) || undefined}>
      <span>{label}</span>
      <strong>{Math.round(value)} <small>/ {isLimit ? `${t('max')} ` : ''}{goal} {unitLabel('mg')}</small></strong>
      <progress value={Math.min(value, goal)} max={goal || 1} aria-label={label} />
    </article>
  );
  const details = [
    { id: 'sodium', card: metric('sodium', t('Sodium'), totals.sodium, SODIUM_LIMIT_MG, true) },
    { id: 'potassium', card: metric('potassium', t('Potassium'), totals.potassium, POTASSIUM_TARGET_MG, false) }
  ] as const;
  const pinned = details.filter(metric => pinnedMetrics.includes(metric.id));
  const unpinned = details.filter(metric => !pinnedMetrics.includes(metric.id));
  const hasMinerals = (metrics: readonly { id: string }[]) => metrics.some(metric => metric.id === 'sodium' || metric.id === 'potassium');
  const mineralsNote = t('Sodium et potassium ne comptent que les aliments où ils sont renseignés.');

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
              {ti('❤️ Importer depuis Santé')}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => openSummary(yesterday)}>
              {ti('✏️ Saisir à la main')}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={dismissMissing}>
              {t('Plus tard')}
            </button>
          </div>
        </section>
      )}

      {/* Carte Bilan du jour */}
      <section className="hero-card" data-over-budget={excess > 0 || undefined} style={{
        '--completion': `${completion}%`,
        '--cut-excess': `${Math.min(100, 100 * excess / (budget ? budget / 2 : 500))}%`,
      } as CSSProperties}>
        <div className="hero-top bulk-hero-top">
          <span><Icon name="flame" />{t('Calories mangées')}</span>
          {(dailySummary?.weight || dailySummary?.sleepDuration) && (
            <div className="secondary-data">
              {dailySummary.weight && (
                <span className="data-badge"><Icon name="scale" />{dailySummary.weight} {unitLabel('kg')}</span>
              )}
              {dailySummary.sleepDuration && (
                <span className="data-badge"><Icon name="moon" />{dailySummary.sleepDuration}{unitLabel('h')}</span>
              )}
            </div>
          )}
        </div>

        {/* Même présentation que la prise de masse : grand chiffre et cercle de progression */}
        <div className="bulk-hero-body" data-has-budget={budget !== null || undefined}>
          <div>
            {excess > 0 ? (
              <>
                <div className="cut-calorie-alert" role="status">
                  <div className="bulk-calories"><strong dir="ltr">+{excess.toLocaleString(locale(), { maximumFractionDigits: 1 })}</strong></div>
                  <span>{t('kcal au-dessus de la limite')}</span>
                </div>
                <p>{totals.caloriesEaten} / {budget} {unitLabel('kcal')}</p>
              </>
            ) : (
              <>
                <div className="bulk-calories">
                  <strong>{totals.caloriesEaten}</strong>
                  <span>{unitLabel('kcal')}</span>
                </div>
                {remaining === null && <p>{t('Saisis ta dépense pour voir ton objectif.')}</p>}
              </>
            )}
            {estimated ? (
              <p className="hero-burned">{t('À brûler : {n} kcal', { n: estimated })}</p>
            ) : null}
            {burned ? (
              <p className="hero-burned">
                {estimated ? t('Santé pour l’instant : {n} kcal', { n: burned }) : t('Dépense : {n} kcal', { n: burned })}
                {dailySummary?.caloriesBurnedProvisional && <span className="provisional-badge">{t('provisoire')}</span>}
              </p>
            ) : null}
          </div>
          {budget !== null && (
            <div className="bulk-energy-ring" aria-hidden={excess > 0 || undefined}>
              {excess > 0 ? <Icon name="warning" /> : (
                <span className="energy-ring-reading">
                  <strong>{remaining?.toLocaleString(locale(), { maximumFractionDigits: 1 })}</strong>
                  <small>{t('kcal restantes')}</small>
                </span>
              )}
            </div>
          )}
        </div>
        {budget !== null && (
          <progress className="bulk-sr-only" value={Math.min(totals.caloriesEaten, budget)} max={budget || 1} aria-label={t('Progression des calories')} />
        )}

        <div className="action-row">
          <button className="btn btn-secondary" onClick={() => openSummary(today)}>
            {burned ? ti('✏️ Modifier le bilan') : t('Saisir ma dépense pour voir le restant')}
          </button>
          <button className="btn btn-secondary" onClick={handleImportHealth}>
            {ti('❤️ Importer depuis Santé')}
          </button>
        </div>
      </section>

      <section className="cut-nutrition">
        {/* Même présentation que la prise de masse : trois cartes côte à côte */}
        <div className="bulk-macros">
          <article data-macro="protein">
            <span>{t('Protéines')}</span>
            <strong>{Math.round(totals.protein)} <small>/ {proteinGoal} {unitLabel('g')}</small></strong>
            <progress value={Math.min(totals.protein, proteinGoal)} max={proteinGoal || 1} aria-label={t('Progression des protéines')} />
          </article>
          <article data-macro="carbs" data-over={totals.carbs > carbMax || undefined}>
            <span>{t('Glucides')}</span>
            <strong>{Math.round(totals.carbs)} <small>/ {t('max')} {carbMax} {unitLabel('g')}</small></strong>
            <progress value={Math.min(totals.carbs, carbMax)} max={carbMax || 1} aria-label={t('Glucides')} />
          </article>
          <article data-macro="fat" data-over={totals.fat > fatGoal || undefined}>
            <span>{t('Lipides')}</span>
            <strong>{Math.round(totals.fat)} <small>/ {fatGoal} {unitLabel('g')}</small></strong>
            <progress value={Math.min(totals.fat, fatGoal)} max={fatGoal || 1} aria-label={t('Lipides')} />
          </article>
        </div>
        {pinned.length > 0 && <div className="bulk-macros cut-minerals">{pinned.map(item => item.card)}</div>}
        {hasMinerals(pinned) && <p className="macro-note">{mineralsNote}</p>}
        {(unpinned.length > 0 || quip) && (
          <details className="settings-group nutrition-details">
            <summary>{t('Détails nutritionnels')}</summary>
            <div className="settings-group-content">
              <div className="bulk-macros cut-minerals">{unpinned.map(item => item.card)}</div>
              {hasMinerals(unpinned) && <p className="macro-note">{mineralsNote}</p>}
              {quip && <p className="hero-quip" dir={isRtl(language) ? 'rtl' : 'ltr'}>{quip}</p>}
            </div>
          </details>
        )}
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
                              <strong>{foodDisplayName(entry.foodName, entry.foodSource)}</strong>
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
                            <button className="btn-icon" title={t('Modifier')} onClick={() => setEditingEntry(entry)} aria-label={t('Modifier')}><Icon name="pencil" /></button>
                            <button
                              className="btn-icon"
                              title={t('Supprimer')}
                              onClick={() => {
                                if (confirm(t('Supprimer cette entrée ?'))) {
                                  handleDeleteEntry(entry.id);
                                }
                              }}
                             aria-label={t('Supprimer')}><Icon name="trash" /></button>
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
