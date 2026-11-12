import { foodDisplayName } from '../data/genericFoods';
import { useState, useEffect, type CSSProperties, type ReactNode } from 'react';
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
      <section className="hero-card ring-dash" data-over-budget={excess > 0 || undefined} style={{
        '--completion': `${completion}%`,
        '--cut-excess': `${Math.min(100, 100 * excess / (budget ? budget / 2 : 500))}%`,
      } as CSSProperties}>
        {(dailySummary?.weight || dailySummary?.sleepDuration) && (
        <div className="hero-top bulk-hero-top">
            <div className="secondary-data">
              {dailySummary.weight && (
                <span className="data-badge"><Icon name="scale" />{dailySummary.weight} {unitLabel('kg')}</span>
              )}
              {dailySummary.sleepDuration && (
                <span className="data-badge"><Icon name="moon" />{dailySummary.sleepDuration}{unitLabel('h')}</span>
              )}
            </div>
        </div>
        )}

        {/* Tableau à anneaux : calories à gauche, grand anneau à droite, puis les trois macros */}
        <div className="ring-dash-top">
          <div className="ring-dash-text">
            <span className="ring-dash-label">{t('Calories')}</span>
            {excess > 0 ? (
              <>
                <div className="cut-calorie-alert" role="status">
                  <strong dir="ltr">+{excess.toLocaleString(locale(), { maximumFractionDigits: 1 })}</strong>
                  <span>{t('kcal au-dessus de la limite')}</span>
                </div>
                <p className="ring-dash-sub">{totals.caloriesEaten} / {budget} {unitLabel('kcal')}</p>
              </>
            ) : remaining !== null ? (
              <p className="ring-dash-left">
                <strong>{remaining.toLocaleString(locale(), { maximumFractionDigits: 1 })}</strong>
                <span>{t('kcal restantes')}</span>
              </p>
            ) : (
              <p className="ring-dash-sub">{t('Saisis ta dépense pour voir ton objectif.')}</p>
            )}
            {budget !== null && (
              <dl className="ring-dash-stats">
                <div><dt>{t('Objectif')}</dt><dd>{budget}</dd></div>
                <div>
                  <dt>{t('Dépense')}</dt>
                  <dd>
                    {day.value}
                    {estimated ? <small>{t('prévue')}</small> : dailySummary?.caloriesBurnedProvisional ? <small>{t('provisoire')}</small> : null}
                  </dd>
                </div>
              </dl>
            )}
            {estimated && burned ? (
              <p className="ring-dash-sub">{t('Santé pour l’instant : {n} kcal', { n: burned })}</p>
            ) : null}
          </div>
          <Ring className="ring-dash-big" value={totals.caloriesEaten} max={budget ?? 0} color="var(--ring-kcal)">
            <strong>{totals.caloriesEaten}</strong>
            <small>{budget !== null ? `${budget} ${unitLabel('kcal')}` : unitLabel('kcal')}</small>
          </Ring>
        </div>
        {budget !== null && (
          <progress className="bulk-sr-only" value={Math.min(totals.caloriesEaten, budget)} max={budget || 1} aria-label={t('Progression des calories')} />
        )}

        <div className="ring-dash-macros">
          {([
            ['protein', t('Protéines'), totals.protein, proteinGoal, false],
            ['carbs', t('Glucides'), totals.carbs, carbMax, true],
            ['fat', t('Lipides'), totals.fat, fatGoal, true],
          ] as const).map(([key, label, value, goal, isLimit]) => (
            <figure key={key} data-macro={key} data-over={(isLimit && value > goal) || undefined}>
              <figcaption>{label}</figcaption>
              <Ring value={value} max={goal} color={`var(--ring-${key})`}>
                <strong>{Math.round(value)}{unitLabel('g')}</strong>
                <small>{isLimit && key === 'carbs' ? `${t('max')} ` : ''}{goal}{unitLabel('g')}</small>
              </Ring>
            </figure>
          ))}
        </div>

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

/** Anneau épais à bouts arrondis, avec le texte au centre */
function Ring({ value, max, color, className, children }: {
  value: number;
  max: number;
  color: string;
  className?: string;
  children: ReactNode;
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const over = max > 0 && value > max;
  const length = 2 * Math.PI * 38;
  return (
    <div className={`ring${className ? ` ${className}` : ''}`} data-over={over || undefined}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring-bg" cx="50" cy="50" r="38" />
        {ratio > 0 && (
          <circle
            className="ring-arc"
            cx="50" cy="50" r="38"
            style={{ stroke: over ? undefined : color }}
            strokeDasharray={`${ratio * length} ${length}`}
            transform="rotate(-90 50 50)"
          />
        )}
      </svg>
      <span className="ring-center">{children}</span>
    </div>
  );
}
