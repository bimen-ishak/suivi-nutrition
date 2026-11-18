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
import { dayResult, type DayResult } from '../utils/dayResult';
import { getBingePeriods, inBingePeriod } from '../utils/bingePeriods';

const DEFAULT_PROTEIN_GOAL = 150;
const DEFAULT_CARB_LIMIT = 250;
const DEFAULT_FAT_GOAL = 70;
const RESULT_SEEN_KEY = 'dayResultSeen';
const DISMISSED_KEY = 'dismissedMissingBurned';

interface TodayProps {
  onAddFood: () => void;
  /** Jour affiché (AAAA-MM-JJ) ; null = aujourd'hui */
  viewDate?: string | null;
  onViewDate?: (date: string | null) => void;
}

export function Today({ onAddFood, viewDate = null, onViewDate }: TodayProps) {
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
  // Bilan d'hier, montré une fois au matin quand la journée est complète (mangé et brûlé)
  const [yesterdayResult, setYesterdayResult] = useState<DayResult | null>(null);
  const [resultSeen, setResultSeen] = useState(() => {
    try {
      return localStorage.getItem(RESULT_SEEN_KEY);
    } catch {
      return null;
    }
  });
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY);
    } catch {
      return null;
    }
  });
  // Jour dont on saisit le bilan à la main : aujourd'hui, ou hier quand la dépense manque
  const [summaryDate, setSummaryDate] = useState<string | null>(null);
  // Semaine en cours, du lundi au dimanche : calories mangées et dépense connue de chaque jour
  const [week, setWeek] = useState<WeekDay[]>([]);

  const [today, yesterday] = localDateKeys(2);
  // Jour affiché : aujourd'hui, ou un jour passé choisi dans la bande de la semaine
  const shown = viewDate && viewDate < today ? viewDate : today;
  const isPast = shown !== today;
  const [pinnedMetrics] = useState(getPinnedCutMetrics);

  useEffect(() => {
    loadTodayData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  // Recharger les données quand le composant redevient visible
  useEffect(() => {
    const handleFocus = () => {
      loadTodayData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

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
        getJournalEntriesByDate(shown),
        getDailySummary(shown),
        recalculateDailySummary(shown),
        getWeightsSince(twoWeeksAgo),
        getJournalEntriesByDate(yesterday),
        getDailySummary(yesterday),
        getCutHistoryDay(yesterday)
      ]);

      const ateYesterday = yesterdayEntries.length > 0 || (yesterdayHistory?.kcal ?? 0) > 0;
      const knowsBurned = !!yesterdayDaily?.caloriesBurned || !!yesterdayHistory?.burned;
      setYesterdaySummary(yesterdayDaily ?? null);
      setYesterdayMissing(!isPast && ateYesterday && !knowsBurned);

      // Bilan d'hier : seulement une journée complète, hors période de craquage, avec une dépense définitive
      const eatenYesterday = yesterdayEntries.length > 0
        ? yesterdayEntries.reduce((sum, entry) => sum + entry.kcal, 0)
        : yesterdayHistory?.kcal ?? 0;
      const burnedYesterday = yesterdayDaily?.caloriesBurned ?? yesterdayHistory?.burned ?? 0;
      const complete = eatenYesterday > 0 && burnedYesterday > 0 && !yesterdayDaily?.caloriesBurnedProvisional;
      setYesterdayResult(complete && !inBingePeriod(yesterday, getBingePeriods())
        ? dayResult(eatenYesterday, burnedYesterday, getObjective())
        : null);

      const latestTrend = getWeightTrend(weights).at(-1)?.trend;
      setTrendWeight(latestTrend);
      setJournalEntries(entries);
      setDailySummary(summary || null);
      setTotals(calculatedTotals);
      setWeek(await loadWeek(currentWeek(today)));
    } catch (error) {
      console.error('Erreur lors du chargement des données du jour:', error);
    }
  };

  const formatDay = (dateStr: string) =>
    new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${dateStr}T12:00:00`));

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
    const modalDate = summaryDate ?? shown;
    return (
      <DailySummaryModal
        date={modalDate}
        existingSummary={modalDate === shown ? dailySummary : yesterdaySummary}
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
  const showResult = !isPast && yesterdayResult !== null && resultSeen !== yesterday;
  const closeResult = () => {
    setResultSeen(yesterday);
    try {
      localStorage.setItem(RESULT_SEEN_KEY, yesterday);
    } catch {
      // Sans stockage, le bilan reviendra à la prochaine ouverture : rien de grave
    }
  };
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
        <h1 className="bulk-sr-only">{formatDate(shown)}</h1>
        <WeekStrip
          days={week}
          today={today}
          selected={shown}
          budgetFor={burned => {
            const value = burned ?? profile?.burn;
            return value ? Math.max(value + objective, 0) : null;
          }}
          todayEaten={totals.caloriesEaten}
          todayBudget={budget}
          onSelect={date => onViewDate?.(date === today ? null : date)}
        />
      </div>

      {/* Bilan d'hier : bravo pour tout déficit, même plus petit que prévu */}
      {showResult && yesterdayResult && (
        <section className="day-result" data-kind={yesterdayResult.kind} role="status">
          <div className="day-result-head">
            <span className="day-result-icon"><Icon name={yesterdayResult.kind === 'surplus' ? 'leaf' : yesterdayResult.kind === 'goal' ? 'star' : 'target'} /></span>
            <div>
              <p className="day-result-title">
                {yesterdayResult.kind === 'goal'
                  ? t('Bravo, objectif atteint hier !')
                  : yesterdayResult.kind === 'deficit'
                    ? t('Bravo, tu étais en déficit hier !')
                    : t('Pas de déficit hier')}
              </p>
              <p className="day-result-big" dir="ltr">
                {yesterdayResult.kind === 'surplus'
                  ? t('+{n} kcal', { n: -yesterdayResult.deficit })
                  : t('−{n} kcal', { n: yesterdayResult.deficit })}
              </p>
            </div>
            <button type="button" className="day-result-close" aria-label={t('Fermer')} onClick={closeResult}>×</button>
          </div>
          <p className="day-result-text">
            {yesterdayResult.kind === 'goal'
              ? t('Tu as tenu ton déficit de {goal} kcal. Continue comme ça.', { goal: yesterdayResult.target })
              : yesterdayResult.kind === 'deficit'
                ? t('Un peu moins que les {goal} kcal visés, mais chaque jour en déficit te rapproche du but.', { goal: yesterdayResult.target })
                : t('Tu as mangé un peu plus que ce que tu as brûlé. Aujourd’hui, on repart.')}
          </p>
          <dl className="day-result-stats">
            <div><dt>{t('Mangé')}</dt><dd>{yesterdayResult.eaten}</dd></div>
            <div><dt>{t('Brûlé')}</dt><dd>{yesterdayResult.burned}</dd></div>
            <div><dt>{yesterdayResult.kind === 'surplus' ? t('Excédent') : t('Déficit')}</dt><dd>{Math.abs(yesterdayResult.deficit)}</dd></div>
          </dl>
        </section>
      )}

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

        {/* Bilan en grande barre : mangé en grand, une barre épaisse, puis restant et dépense */}
        <div className="kcal-bar" data-over={excess > 0 || undefined}>
          <div className="kcal-bar-head">
            <span className="kcal-bar-label">{isPast ? formatDay(shown) : t('Aujourd’hui')}</span>
            {isPast && (
              <button type="button" className="kcal-bar-back" onClick={() => onViewDate?.(null)}>
                {t('Revenir à aujourd’hui')}
              </button>
            )}
          </div>
          <p className="kcal-bar-eaten">
            <strong>{totals.caloriesEaten}</strong>
            {budget !== null && <span>/ {budget} {unitLabel('kcal')}</span>}
            {budget === null && <span>{unitLabel('kcal')}</span>}
          </p>
          {budget !== null && (
            <div className="kcal-bar-track" aria-hidden="true">
              <span style={{ width: `${completion}%` }} />
            </div>
          )}
          <div className="kcal-bar-foot">
            {excess > 0 ? (
              <span className="kcal-bar-left" role="status">
                <strong dir="ltr">+{excess.toLocaleString(locale(), { maximumFractionDigits: 1 })}</strong>{' '}
                <span>{t('kcal au-dessus de la limite')}</span>
              </span>
            ) : remaining !== null ? (
              <span className="kcal-bar-left">
                <strong>{remaining.toLocaleString(locale(), { maximumFractionDigits: 1 })}</strong> {t('restantes')}
              </span>
            ) : (
              <span>{t('Saisis ta dépense pour voir ton objectif.')}</span>
            )}
            {day.value ? (
              <span className="kcal-bar-burn">
                {t('dépense')} <strong>{day.value}</strong>
                {estimated ? <small>{t('prévue')}</small> : dailySummary?.caloriesBurnedProvisional ? <small>{t('provisoire')}</small> : null}
              </span>
            ) : null}
          </div>
          {estimated && burned ? (
            <p className="kcal-bar-note">{t('Santé pour l’instant : {n} kcal', { n: burned })}</p>
          ) : null}
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
                <small>/ {goal}{unitLabel('g')}</small>
              </Ring>
            </figure>
          ))}
        </div>

        <div className="action-row">
          <button className="btn btn-secondary" onClick={() => openSummary(shown)}>
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

interface WeekDay {
  date: string;
  eaten: number;
  burned?: number;
}

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Les sept jours de la semaine (lundi → dimanche) qui contient ce jour */
function currentWeek(today: string): string[] {
  const start = new Date(`${today}T12:00:00`);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return dateKey(day);
  });
}

async function loadWeek(dates: string[]): Promise<WeekDay[]> {
  return Promise.all(dates.map(async date => {
    const [entries, summary, history] = await Promise.all([
      getJournalEntriesByDate(date),
      getDailySummary(date),
      getCutHistoryDay(date),
    ]);
    const logged = entries.reduce((sum, entry) => sum + entry.kcal, 0);
    return {
      date,
      eaten: entries.length ? logged : history?.kcal ?? 0,
      burned: summary?.caloriesBurned ?? history?.burned,
    };
  }));
}

/** Bande de la semaine : un petit anneau par jour, le jour affiché rempli */
function WeekStrip({ days, today, selected, budgetFor, todayEaten, todayBudget, onSelect }: {
  days: WeekDay[];
  today: string;
  selected: string;
  budgetFor: (burned?: number) => number | null;
  todayEaten: number;
  todayBudget: number | null;
  onSelect?: (date: string) => void;
}) {
  if (!days.length) return null;
  const letter = new Intl.DateTimeFormat(locale(), { weekday: 'narrow' });
  const full = new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
  const length = 2 * Math.PI * 21;
  return (
    <ol className="week-strip">
      {days.map(day => {
        const isToday = day.date === today;
        const isSelected = day.date === selected;
        // Le jour affiché utilise les totaux à jour de la page ; les autres, ceux de la semaine
        const eaten = isSelected ? todayEaten : day.eaten;
        const budget = isSelected ? todayBudget : budgetFor(day.burned);
        const ratio = budget ? Math.min(1, eaten / budget) : 0;
        const over = !!budget && eaten > budget;
        const date = new Date(`${day.date}T12:00:00`);
        return (
          <li
            key={day.date}
            data-today={isSelected || undefined}
            data-real-today={isToday || undefined}
            data-future={day.date > today || undefined}
            data-over={over || undefined}
          >
            <button
              type="button"
              aria-label={`${full.format(date)}${eaten ? ` · ${Math.round(eaten)} ${unitLabel('kcal')}` : ''}`}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              // Un appui affiche ce jour sur l'accueil ; les jours à venir ne s'ouvrent pas
              disabled={day.date > today}
              onClick={() => onSelect?.(day.date)}
            >
            <svg viewBox="0 0 50 50" aria-hidden="true">
              <circle className="week-bg" cx="25" cy="25" r="21" />
              {ratio > 0 && !isSelected && (
                <circle
                  className="week-arc"
                  cx="25" cy="25" r="21"
                  strokeDasharray={`${ratio * length} ${length}`}
                  transform="rotate(-90 25 25)"
                />
              )}
            </svg>
            <span aria-hidden="true">{letter.format(date)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
