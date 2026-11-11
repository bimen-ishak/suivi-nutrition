import { newId } from './id';
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { WeeklySummary } from '../components/WeeklySummary';
import { t, unitLabel, locale } from '../i18n';
import { localDateKey, localDateKeys } from '../utils/photo';
import { BulkSettings } from './BulkSettings';
import { BulkWeightEntry } from './BulkWeightEntry';
import { MealEditor } from './MealEditor';
import { bulkDb, dailyCsv, downloadFile, getGoals, portionValues, totalValues, daySignature, type SyncMark, type BulkMeal, type BulkWeight } from './store';
import './bulk.css';
import { Setup } from './Setup';
import { getHistorySheet, googleConnected, writeDay } from './googleSheets';

type View = 'today' | 'history' | 'settings' | 'day';
const newMeal = (date: string): BulkMeal => ({ id: newId(), date, time: new Date().toTimeString().slice(0, 5), name: '', quantity: 0, unit: 'g', values: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, estimated: true, notes: '' });
export function BulkPage({ renderModeSettings }: { renderModeSettings?: (canLeave: () => boolean) => ReactNode }) {
  const [setupComplete, setSetupComplete] = useState(() => { try { return localStorage.getItem('bulkSetupComplete') === '1'; } catch { return false; } });
  const [marks, setMarks] = useState<SyncMark[]>([]);
  const [sheet, setSheet] = useState(getHistorySheet);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<View>('today');
  const [settingsGroup, setSettingsGroup] = useState<'assistant' | 'history' | null>(null);
  const [today, setToday] = useState(localDateKey);
  const [historyDate, setHistoryDate] = useState(localDateKey);
  const [meals, setMeals] = useState<BulkMeal[]>([]);
  const [weights, setWeights] = useState<BulkWeight[]>([]);
  const [goals, setGoals] = useState(getGoals);
  const [editor, setEditor] = useState<BulkMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = useCallback(() => bulkDb.transaction('r', [bulkDb.meals, bulkDb.syncMarks, bulkDb.weights], () =>
    Promise.all([bulkDb.meals.toArray(), bulkDb.syncMarks.toArray(), bulkDb.weights.toArray()]))
    .then(([savedMeals, syncMarks, savedWeights]) => {
      setMeals(savedMeals);
      setMarks(syncMarks);
      setWeights(savedWeights);
      setGoals(getGoals());
      setError('');
    })
    .catch(() => setError(t('Impossible de charger ton journal. Réessaie.')))
    .finally(() => setLoading(false)), []);
  useEffect(() => {
    void refresh();
    const focus = () => { void refresh(); };
    const googleChanged = () => setSheet(getHistorySheet());
    window.addEventListener('focus', focus);
    window.addEventListener('bulk-google-state', googleChanged);
    return () => { window.removeEventListener('focus', focus); window.removeEventListener('bulk-google-state', googleChanged); };
  }, [refresh]);
  useEffect(() => {
    let timer: number;
    const updateDate = () => {
      window.clearTimeout(timer);
      const now = new Date();
      setToday(localDateKey(now));
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      timer = window.setTimeout(updateDate, midnight.getTime() - now.getTime());
    };
    updateDate();
    window.addEventListener('focus', updateDate);
    document.addEventListener('visibilitychange', updateDate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', updateDate);
      document.removeEventListener('visibilitychange', updateDate);
    };
  }, []);
  const date = view === 'today' ? editor?.date ?? today : historyDate;
  const weightByDate = new Map(weights.map(weight => [weight.date, weight.kg]));
  const weightKg = weightByDate.get(date);
  const dayMeals = meals.filter(m => m.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const totals = totalValues(dayMeals);
  const remaining = goals.kcal - totals.kcal;
  const historyMeals = new Map<string, BulkMeal[]>();
  if (view === 'history') {
    for (const meal of meals) {
      const entries = historyMeals.get(meal.date);
      if (entries) entries.push(meal);
      else historyMeals.set(meal.date, [meal]);
    }
  }
  const dates = [...new Set([...historyMeals.keys(), ...weightByDate.keys(), ...marks.map(m => m.date)])].sort().reverse();
  const recentDays = view === 'history' ? localDateKeys(7).flatMap(day => {
    const entries = historyMeals.get(day);
    return entries ? [totalValues(entries)] : [];
  }) : [];
  const week = recentDays.reduce((sum, day) => ({
    kcal: sum.kcal + day.kcal,
    protein: sum.protein + day.protein
  }), { kcal: 0, protein: 0 });
  const recent = [...meals].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).filter((m, index, all) => all.findIndex(v => v.name === m.name) === index).slice(0, 4);
  const format = (n: number) => n.toLocaleString(locale(), { maximumFractionDigits: 1 });
  const formatDate = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  const canLeave = () => !editor || confirm(t('Quitter la saisie sans enregistrer ?'));
  const openDay = (day: string, next: 'today' | 'day') => {
    if (editor && day !== editor.date) {
      if (!canLeave()) return;
      setEditor(null);
    }
    if (next === 'day') setHistoryDate(day);
    setView(next);
    setNotice('');
  };
  const mark = marks.find(m => m.date === date && m.spreadsheetId === sheet?.id);
  const synced = !!mark && mark.signature === daySignature(dayMeals, weightKg);
  const sync = async () => {
    if (!sheet || !googleConnected()) { setSettingsGroup('history'); setView('settings'); return; }
    setSending(true); setNotice('');
    try {
      const confirmation = await writeDay(sheet, date, dayMeals, { weightKg });
      await bulkDb.syncMarks.put(confirmation);
      await refresh();
      setNotice(t('Google Sheets a confirmé l’enregistrement de cette journée.'));
    } catch (e) { setNotice(e instanceof Error ? e.message : t('Synchronisation impossible. Tes repas restent sur cet appareil.')); }
    finally { setSending(false); }
  };
  if (!setupComplete && view !== 'settings') return <Setup
    onComplete={() => { setSetupComplete(true); void refresh(); }}
    onSettings={() => setView('settings')}
  />;
  const completion = Math.min(100, totals.kcal / goals.kcal * 100);
  const pages = [
    { id: 'today', label: t('Aujourd’hui'), icon: 'flame' },
    { id: 'history', label: t('Historique'), icon: 'book' },
    { id: 'settings', label: t('Réglages'), icon: 'sliders' }
  ] as const;

  return <div className="bulk-page">
    <nav className="bulk-main-tabs" aria-label={t('Navigation prise de masse')}>
      {pages.filter(page => setupComplete || page.id !== 'history').map(page => (
        <button key={page.id} aria-pressed={view === page.id || (view === 'day' && page.id === 'history')} onClick={() => {
          setSettingsGroup(null);
          if (page.id === 'today') {
            const currentDate = localDateKey();
            setToday(currentDate);
            openDay(currentDate, 'today');
          }
          else { setNotice(''); setView(page.id); }
        }}>
          <Icon name={page.icon} />{page.label}
        </button>
      ))}
    </nav>
    <header className="bulk-heading">
      <h1>{view === 'day' ? formatDate(date) : view === 'history' ? t('Ton historique') : view === 'settings' ? t('Tes réglages') : t('Ton journal du jour')}</h1>
      {view === 'today' && <time className="bulk-muted" dateTime={date}>{formatDate(date)}</time>}
      {view === 'day' && <button className="back-btn" onClick={() => { setNotice(''); setView('history'); }}>{t('Retour à l’historique')}</button>}
    </header>
    {error && <div role="alert" className="bulk-notice">{error}<button className="back-btn" onClick={refresh}>{t('Réessayer')}</button></div>}
    {notice && <p role="status" className="bulk-notice">{notice}</p>}
    <div hidden={view !== 'today' && view !== 'day'}>
      {(view === 'today' || view === 'day') && !editor && !loading && !error && (
        <BulkWeightEntry key={date} date={date} weightKg={weightKg} onChange={refresh} />
      )}
      <div className={`bulk-dashboard${editor ? ' is-editing' : ''}`}>
        <div className="bulk-summary">
          <section className="bulk-hero" data-over-budget={remaining < 0 || undefined}>
            <div className="bulk-hero-top">
              <span><Icon name="flame" />{t('Calories mangées')}</span>
            </div>
            <div className="bulk-hero-body">
              <div>
                <div className="bulk-calories"><strong>{format(totals.kcal)}</strong><span>/ {format(goals.kcal)} {unitLabel('kcal')}</span></div>
                <p className={remaining < 0 ? 'bulk-over-budget' : undefined}>{remaining > 0 ? t('Encore {n} kcal pour ton objectif.', { n: format(remaining) }) : remaining === 0 ? t('Objectif du jour atteint.') : t('{n} kcal au-dessus de ton objectif.', { n: format(-remaining) })}</p>
              </div>
              <div className="bulk-energy-ring" aria-hidden="true" style={{ '--completion': `${completion}%` } as CSSProperties}>{Math.floor(completion)}%</div>
            </div>
            <progress className="bulk-sr-only" value={Math.min(totals.kcal, goals.kcal)} max={goals.kcal} aria-label={t('Progression des calories')} />
          </section>
          <div className="bulk-macros">
            <article><span>{t('Protéines')}</span><strong>{format(totals.protein)} <small>/ {goals.protein} {unitLabel('g')}</small></strong><progress value={Math.min(totals.protein, goals.protein)} max={goals.protein} aria-label={t('Progression des protéines')} /></article>
            <article><span>{t('Glucides')}</span><strong>{format(totals.carbs)} <small>{unitLabel('g')}</small></strong></article>
            <article><span>{t('Lipides')}</span><strong>{format(totals.fat)} <small>{unitLabel('g')}</small></strong></article>
            {goals.showSugars && <article><span>{t('Sucres')}</span><strong>{dayMeals.some(meal => meal.values.sugars !== undefined) ? format(totals.sugars ?? 0) : '—'} <small>{unitLabel('g')}</small></strong><small>{t('Seulement les valeurs renseignées.')}</small></article>}
          </div>
        </div>
        <div className="bulk-log">
          {editor ? <MealEditor key={editor.id} initial={editor} onCancel={() => setEditor(null)} onSettings={() => { setSettingsGroup('assistant'); setView('settings'); }} onSave={async entries => {
            await bulkDb.transaction('rw', bulkDb.meals, () => bulkDb.meals.bulkPut(entries));
            setEditor(null);
            await refresh();
            setNotice(t('Repas enregistré sur cet appareil.'));
          }}>
            {recent.length > 0 && <div className="bulk-recent">
              <h3>{t('À refaire ?')}</h3>
              <div>{recent.map(meal => <button key={meal.id} type="button" onClick={() => setEditor({
                ...meal, id: newId(), date: editor.date, time: editor.time, values: { ...meal.values }
              })}>{meal.name}<span aria-hidden="true">＋</span></button>)}</div>
            </div>}
          </MealEditor> : <>
            <button className="btn btn-primary bulk-add" disabled={loading || !!error} onClick={() => { setEditor(newMeal(date)); setNotice(''); }}>{t('+ Ajouter un repas')}</button>
            <section className="bulk-journal">
              <div className="bulk-section-head"><h2>{t('Tes repas')}</h2><span>{dayMeals.length}</span></div>
              {loading && <p className="bulk-muted">{t('Chargement…')}</p>}
              {!loading && dayMeals.length === 0 && <div className="bulk-empty"><Icon name="book" /><p>{t('Écris par exemple : 100 lait et 2 œufs. Une photo est facultative.')}</p></div>}
              {dayMeals.map(meal => {
                const values = portionValues(meal);
                return <article key={meal.id} className="bulk-meal">
                  <div><span className="bulk-muted">{meal.time} · {meal.quantity} {unitLabel(meal.unit)} · {meal.estimated ? t('Estimation') : t('Étiquette')}</span><h3>{meal.name}</h3><p>{format(values.protein)} {unitLabel('g')} {t('Protéines')} · {format(values.carbs)} {unitLabel('g')} {t('Glucides')} · {format(values.fat)} {unitLabel('g')} {t('Lipides')}</p></div>
                  <div className="bulk-meal-end"><strong>{format(values.kcal)} <small>{unitLabel('kcal')}</small></strong><div><button onClick={() => setEditor(meal)}>{t('Modifier')}</button><button onClick={async () => {
                    if (!confirm(t('Supprimer ce repas ?'))) return;
                    try { await bulkDb.meals.delete(meal.id); await refresh(); }
                    catch { setError(t('Suppression impossible. Réessaie.')); }
                  }}>{t('Supprimer')}</button></div></div>
                </article>;
              })}
            </section>
            {view === 'day' && sheet && <section className="bulk-sync-bar">
              <div><strong>{synced ? t('Synchronisé avec Google Sheets') : mark ? t('Modifications à envoyer') : t('Enregistré sur cet appareil')}</strong></div>
              <button className="btn btn-secondary" disabled={sending || loading || !!error || synced} onClick={sync}>{sending ? t('Envoi en cours…') : t('Envoyer cette journée')}</button>
            </section>}
          </>}
        </div>
      </div>
    </div>
    {view === 'history' && (
      <div className="bulk-history">
        <WeeklySummary count={recentDays.length} metrics={[
          { label: t('Calories moyennes'), value: recentDays.length ? week.kcal / recentDays.length : null, unit: unitLabel('kcal') },
          { label: t('Protéines moyennes'), value: recentDays.length ? week.protein / recentDays.length : null, unit: unitLabel('g') }
        ]} />
        <section className="bulk-panel">
          <form className="bulk-date-row" onSubmit={event => {
            event.preventDefault();
            const day = new FormData(event.currentTarget).get('day');
            if (typeof day === 'string' && day) openDay(day, 'day');
          }}>
            <label>{t('Choisir une date')}<input type="date" name="day" required max={today} /></label>
            <button className="btn btn-secondary" type="submit">{t('Ouvrir la journée')}</button>
          </form>
          {dates.length === 0 && <p className="bulk-empty">{t('Tes journées apparaîtront ici après ton premier repas ou ta première pesée.')}</p>}
          {dates.map(day => {
            const entries = historyMeals.get(day) ?? [];
            const sum = totalValues(entries);
            const recordedWeight = weightByDate.get(day);
            const uploaded = marks.some(item => item.date === day && item.spreadsheetId === sheet?.id && item.signature === daySignature(entries, recordedWeight));
            return <button className="bulk-history-row" key={day} onClick={() => openDay(day, 'day')}>
              <span>
                {formatDate(day)}
                {recordedWeight !== undefined && <small>{recordedWeight.toLocaleString(locale(), { maximumFractionDigits: 2 })} {unitLabel('kg')}</small>}
                {sheet && <small>{uploaded ? t('Synchronisé') : t('Local')}</small>}
              </span>
              <strong>{entries.length ? `${format(sum.kcal)} ${unitLabel('kcal')}` : '—'}</strong>
              <span>{entries.length ? `${format(sum.protein)} ${unitLabel('g')}` : '—'} <small>{t('Protéines')}</small></span>
            </button>;
          })}
        </section>
        <button className="btn btn-secondary" disabled={!meals.length && !weights.length} onClick={() => downloadFile(dailyCsv(meals, weights), 'nutrition-bulk-history.csv', 'text/csv;charset=utf-8')}><Icon name="download" />{t('Exporter en CSV')}</button>
      </div>
    )}
    <div hidden={view !== 'settings'}><BulkSettings goals={goals} openGroup={settingsGroup} onChange={() => { void refresh(); }} modeSettings={renderModeSettings?.(canLeave)} /></div>
  </div>;
}
