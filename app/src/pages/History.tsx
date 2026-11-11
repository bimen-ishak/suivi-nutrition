import { foodDisplayName } from '../data/genericFoods';
import { useState, useEffect } from 'react';
import { getCutHistoryDay, getJournalEntriesByDate, getDailySummary, recalculateDailySummary, updateDailySummary, updateJournalEntry, deleteJournalEntry, putJournalEntry, setImportedDayKcal } from '../db';
import { EditJournalModal } from '../components/EditJournalModal';
import { DailySummaryModal } from '../components/DailySummaryModal';
import type { JournalEntry, DailySummary } from '../types';
import { ONE_OFF_FOOD_ID } from '../types';
import { CutCard } from '../components/CutCard';
import { importedDayToView } from '../utils/cut';
import './History.css';
import { t, tn, unitLabel, macroLetter, locale, displayUnit, ltr } from '../i18n';
import { ti, Icon } from '../components/Icon';
import { WeeklySummary } from '../components/WeeklySummary';
import { localDateKey, localDateKeys } from '../utils/photo';

// Une journée de craquage non comptée vaut au moins ce total
const BINGE_MIN_KCAL = 4500;

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
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState('');
  const [bingePicking, setBingePicking] = useState(false);
  const [bingeDate, setBingeDate] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const dates = localDateKeys(30);

      const daysData: DayData[] = [];
      for (const date of dates) {
        const [summary, totals, history] = await Promise.all([
          getDailySummary(date),
          recalculateDailySummary(date),
          getCutHistoryDay(date)
        ]);

        const { entries } = totals;

        // Un jour sans repas dans l'app peut venir d'un historique importé
        const imported = entries.length === 0 && history ? importedDayToView(history) : null;

        // Ne garder que les jours avec des données
        if (entries.length > 0 || summary || imported) {
          daysData.push({
            date,
            entries,
            summary: summary && imported?.summary
              ? { ...imported.summary, ...summary, caloriesBurned: summary.caloriesBurned ?? imported.summary.caloriesBurned }
              : summary ?? imported?.summary,
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

  const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat(locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const shortWeekday = (dateStr: string) =>
    new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(new Date(dateStr + 'T12:00:00')).replace('.', '');

  const dayNumber = (dateStr: string) => Number(dateStr.slice(8, 10));

  const isToday = (dateStr: string) => dateStr === localDateKey();
  const hasIntake = (day: DayData) => day.entries.length > 0 || !!day.imported?.hasCalories;
  const getNetBalance = (day: DayData) => {
    if (!day.summary?.caloriesBurned || !hasIntake(day)) return null;
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

  const adjustmentId = (date: string) => `ajustement-${date}`;

  // Fixe le total de calories d'un jour : tout le reste (Ma sèche, bilan) se recalcule seul
  const applyDayTotal = async (date: string, target: number, label: string) => {
    const [entries, history] = await Promise.all([getJournalEntriesByDate(date), getCutHistoryDay(date)]);
    if (entries.length === 0 && history) {
      await setImportedDayKcal(date, target);
      return;
    }
    const others = entries.filter(e => e.id !== adjustmentId(date));
    const base = others.reduce((sum, e) => sum + e.kcal, 0);
    const diff = target - base;
    if (diff === 0) {
      await deleteJournalEntry(adjustmentId(date));
      return;
    }
    const now = new Date().toISOString();
    await putJournalEntry({
      id: adjustmentId(date),
      date,
      time: '12:00',
      meal: 'Repas',
      foodId: ONE_OFF_FOOD_ID,
      foodName: label,
      foodSource: 'estimation',
      quantity: 1,
      unit: 'g',
      kcal: diff,
      protein: 0,
      carbs: 0,
      fat: 0,
      createdAt: now,
      updatedAt: now
    });
  };

  const saveTotal = async (day: DayData) => {
    const target = Math.round(parseFloat(totalInput));
    if (!Number.isFinite(target) || target < 0) return;
    await applyDayTotal(day.date, target, 'Ajustement manuel');
    await loadHistory();
    setEditingTotal(false);
  };

  // Craquage non compté : le jour passe à 4 500 kcal, ou garde son total s'il est déjà plus haut
  const markBinge = async (date: string) => {
    const [entries, history] = await Promise.all([getJournalEntriesByDate(date), getCutHistoryDay(date)]);
    const current = entries.length === 0 && history
      ? history.kcal ?? 0
      : entries.reduce((sum, e) => sum + e.kcal, 0);
    if (current < BINGE_MIN_KCAL) await applyDayTotal(date, BINGE_MIN_KCAL, 'Journée de craquage');
    await loadHistory();
    setBingePicking(false);
    setSelectedDate(date);
  };

  const localDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().split('T')[0];
  };

  const handleSaveEntry = async (updated: JournalEntry) => {
    await updateJournalEntry(updated.id, updated);
    await loadHistory();
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteJournalEntry(id);
    await loadHistory();
    setEditingEntry(null);
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading">{t('Chargement...')}</div>
      </div>
    );
  }

  // Vue détaillée d'un jour
  if (selectedDate) {
    const day = days.find(d => d.date === selectedDate);
    if (!day) return null;

    const mealGroups = groupEntriesByMeal(day.entries);
    const net = getNetBalance(day);

    // Saisie à la main de la dépense, du poids ou du sommeil d'un jour passé
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

    if (editingTotal) {
      return (
        <div className="history-page">
          <div className="history-header">
            <button className="back-btn" onClick={() => setEditingTotal(false)}>{t('← Retour')}</button>
            <h1>{t('Corriger les calories mangées')}</h1>
          </div>
          <div className="day-balance-card">
            <p className="total-edit-hint">
              {t('Entre le total de la journée. Le reste (bilan, Ma sèche) se recalcule tout seul.')}
            </p>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              autoFocus
              value={totalInput}
              onChange={(e) => setTotalInput(e.target.value)}
              placeholder={t('kcal mangées')}
            />
            <button className="btn btn-primary day-edit-btn" onClick={() => saveTotal(day)}>{t('Enregistrer')}</button>
          </div>
        </div>
      );
    }

    if (editingSummary) {
      return (
        <DailySummaryModal
          date={day.date}
          existingSummary={day.summary ?? null}
          onSave={async (summary) => {
            await updateDailySummary(summary);
            await loadHistory();
            setEditingSummary(false);
          }}
          onCancel={() => setEditingSummary(false)}
        />
      );
    }

    return (
      <div className="history-page">
        <div className="history-header">
          <button className="back-btn" onClick={() => setSelectedDate(null)}>
            {t('← Retour')}
          </button>
          <h1>{formatDateLong(day.date)}</h1>
        </div>

        {/* Carte bilan */}
        <div className="day-balance-card">
          <h2>{t('Bilan')}</h2>
          <div className="day-stats">
            <div className="stat">
              <span className="stat-value">
                {hasIntake(day) ? day.totals.caloriesEaten : '—'}
              </span>
              <span className="stat-label">{t('kcal mangées')}</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {day.summary?.caloriesBurned ?? '?'}
              </span>
              <span className="stat-label">{t('kcal brûlées')}</span>
            </div>
            <div className="stat">
              <span className={`stat-value ${net !== null ? (net < 0 ? 'negative' : 'positive') : ''}`}>
                {net !== null ? ltr(`${net > 0 ? '+' : ''}${net}`) : '?'}
              </span>
              <span className="stat-label">{t('bilan net (kcal)')}</span>
            </div>
          </div>

          <div className="day-macros">
            <div className="macro-stat">
              <span className="macro-label">{t('Protéines')}</span>
              <span className="macro-value">{Math.round(day.totals.protein * 10) / 10}{unitLabel('g')}</span>
            </div>
            <div className="macro-stat">
              <span className="macro-label">{t('Glucides')}</span>
              <span className="macro-value">{Math.round(day.totals.carbs * 10) / 10}{unitLabel('g')}</span>
            </div>
            <div className="macro-stat">
              <span className="macro-label">{t('Lipides')}</span>
              <span className="macro-value">{Math.round(day.totals.fat * 10) / 10}{unitLabel('g')}</span>
            </div>
          </div>

          {(day.summary?.weight || day.summary?.sleepDuration) && (
            <div className="day-extra">
              {day.summary.weight && <span><Icon name="scale" />{day.summary.weight} {unitLabel('kg')}</span>}
              {day.summary.sleepDuration && <span><Icon name="moon" />{day.summary.sleepDuration}{unitLabel('h')}</span>}
            </div>
          )}

          <button
            className="btn btn-secondary day-edit-btn"
            onClick={() => {
              setTotalInput(hasIntake(day) ? String(day.totals.caloriesEaten) : '');
              setEditingTotal(true);
            }}
          >
            {ti('✏️ Corriger les calories mangées')}
          </button>
          {day.totals.caloriesEaten < BINGE_MIN_KCAL && (
            <button className="btn btn-secondary day-edit-btn" onClick={() => markBinge(day.date)}>
              {t('Journée de craquage ({n} kcal min.)', { n: BINGE_MIN_KCAL })}
            </button>
          )}
          <button className="btn btn-primary day-edit-btn" onClick={() => setEditingSummary(true)}>
            {day.summary?.caloriesBurned ? ti('✏️ Modifier le bilan') : ti('📊 Saisir ma dépense')}
          </button>
        </div>

        {/* Aliments par repas */}
        <div className="day-foods-card">
          <h2>{t('Aliments ({n})', { n: day.entries.length })}</h2>
          {day.imported && (
            <p className="imported-note">
              {t('Journée importée : les calories et les macros sont gardées, sans le détail des repas.')}
            </p>
          )}
          {Object.entries(mealGroups).map(([meal, entries]) => (
            <div key={meal} className="meal-group">
              <h3 className="meal-name">{t(meal)}</h3>
              {entries.map(entry => (
                <div key={entry.id} className="history-entry">
                  <span className="entry-time">{entry.time}</span>
                  <div className="entry-info">
                    <strong>{entry.id.startsWith('ajustement-') ? t(entry.foodName) : foodDisplayName(entry.foodName, entry.foodSource)}</strong>
                    {!entry.id.startsWith('ajustement-') && (
                      <span className="entry-qty">{entry.quantity}{displayUnit(entry.unit)}</span>
                    )}
                  </div>
                  <span className="entry-kcal">{ltr(`${entry.kcal}`)} {unitLabel('kcal')}</span>
                  <button
                    className="entry-action"
                    aria-label={t('Modifier')}
                    onClick={() => {
                      if (entry.id.startsWith('ajustement-')) {
                        setTotalInput(String(day.totals.caloriesEaten));
                        setEditingTotal(true);
                      } else {
                        setEditingEntry(entry);
                      }
                    }}
                  ><Icon name="pencil" /></button>
                  <button
                    className="entry-action"
                    aria-label={t('Supprimer')}
                    onClick={() => {
                      if (window.confirm(t('Supprimer cet aliment ?'))) handleDeleteEntry(entry.id);
                    }}
                  ><Icon name="trash" /></button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const weekDates = new Set(localDateKeys(7));
  const week = days.reduce((result, day) => {
    if (!weekDates.has(day.date)) return result;
    const net = getNetBalance(day);
    if (net === null) return result;
    return {
      count: result.count + 1,
      net: result.net + net,
      provisional: result.provisional || !!day.summary?.caloriesBurnedProvisional
    };
  }, { count: 0, net: 0, provisional: false });
  const weekLabel = week.net < 0 ? t('Déficit moyen') : week.net > 0 ? t('Excédent moyen') : t('Bilan moyen');

  // Vue liste des jours
  return (
    <div className="history-page">
      <div className="history-header">
        <h1>{ti('📊 Historique')}</h1>
      </div>

      <WeeklySummary count={week.count} metrics={[
        { label: weekLabel, value: week.count ? Math.abs(week.net / week.count) : null, unit: unitLabel('kcal') }
      ]} note={week.provisional
        ? t('Alimentation et dépense renseignées. Certaines dépenses sont estimées.')
        : t('Seuls les jours avec alimentation et dépense sont comptés.')} />

      <div className="binge-card">
        {bingePicking ? (
          <>
            <p className="total-edit-hint">
              {t("Choisis le jour du craquage. Il comptera au moins {n} kcal, même si tu n'as rien noté.", { n: BINGE_MIN_KCAL })}
            </p>
            <input
              type="date"
              value={bingeDate}
              min={localDate(29)}
              max={localDate(0)}
              onChange={(e) => setBingeDate(e.target.value)}
            />
            <div className="binge-actions">
              <button className="btn btn-secondary" onClick={() => setBingePicking(false)}>{t('Annuler')}</button>
              <button className="btn btn-primary" disabled={!bingeDate} onClick={() => markBinge(bingeDate)}>{t('Valider')}</button>
            </div>
          </>
        ) : (
          <button
            className="btn btn-secondary binge-open"
            onClick={() => {
              setBingeDate(localDate(1));
              setBingePicking(true);
            }}
          >
            {t('Noter une journée de craquage')}
          </button>
        )}
      </div>

      {days.length === 0 ? (
        <div className="empty-history">
          <p>{t('Aucune donnée enregistrée')}</p>
          <p className="hint">{t('Ajoute des aliments depuis l\'onglet Aujourd\'hui')}</p>
        </div>
      ) : (
        <div className="days-list">
          {days.map(day => {
            const net = getNetBalance(day);
            return (
              <button
                type="button"
                key={day.date}
                className={`day-card ${isToday(day.date) ? 'today' : ''}`}
                onClick={() => setSelectedDate(day.date)}
              >
                <span className="day-badge">
                  <span className="day-badge-weekday">{shortWeekday(day.date)}</span>
                  <span className="day-badge-number">{dayNumber(day.date)}</span>
                </span>
                <span className="day-main">
                  <span className="day-kcal">
                    {hasIntake(day) ? `${day.totals.caloriesEaten} ${unitLabel('kcal')}` : t('Repas non renseignés')}
                  </span>
                  <span className="day-sub">
                    {hasIntake(day) &&
                      `${macroLetter('P')} ${Math.round(day.totals.protein)} · ${macroLetter('G')} ${Math.round(day.totals.carbs)} · ${macroLetter('L')} ${Math.round(day.totals.fat)}`}
                    {day.summary?.weight && (
                      <>
                        {hasIntake(day) && ' · '}
                        <span className="day-weight"><Icon name="scale" />{day.summary.weight} {unitLabel('kg')}</span>
                      </>
                    )}
                  </span>
                  <span className="day-count">
                    {isToday(day.date) && `${t("Aujourd'hui")} · `}
                    {day.imported ? t('importé') : tn('{n} aliment', '{n} aliments', day.entries.length, { n: day.entries.length })}
                  </span>
                </span>
                {net !== null && (
                  <span className={`day-net ${net < 0 ? 'negative' : 'positive'}`}>
                    {ltr(`${net > 0 ? '+' : ''}${net}`)}
                    <small>{t('kcal net')}</small>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <CutCard />
    </div>
  );
}
