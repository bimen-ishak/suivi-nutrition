import { useEffect, useState } from 'react';
import { getDailyIntakesSince, getWeightsSince } from '../db';
import { WeightChart } from './WeightChart';
import { getObjective } from '../utils/objective';
import {
  averageIntake,
  estimateMaintenance,
  getRateVerdict,
  getWeeklyRate,
  getWeightTrend,
  paceGaugePosition,
  proteinTarget,
  weightChange,
  type IntakeDay,
  type WeightPoint
} from '../utils/cut';
import './CutCard.css';
import { t, unitLabel, locale, ltr } from '../i18n';
import { ti, Icon } from './Icon';
import { addBingePeriod, getBingePeriods, removeBingePeriod, withoutBinges, WATER_DAYS_AFTER, type BingePeriod } from '../utils/bingePeriods';

const HISTORY_DAYS = 60;
const MAINTENANCE_DAYS_NEEDED = 14;
const RANGES = [
  { days: 7, label: t('7 j') },
  { days: 30, label: t('30 j') },
  { days: 60, label: t('60 j') }
];

const dateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const number = (value: number, digits = 1) =>
  value.toLocaleString(locale(), { maximumFractionDigits: digits });

const signed = (value: number, digits: number) =>
  ltr(`${value > 0 ? '+' : ''}${number(value, digits)}`);

export function CutCard() {
  const [allWeights, setWeights] = useState<WeightPoint[]>([]);
  const [allIntakes, setIntakes] = useState<IntakeDay[]>([]);
  const [range, setRange] = useState(30);
  const [periods, setPeriods] = useState<BingePeriod[]>(getBingePeriods);
  const [declaring, setDeclaring] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  useEffect(() => {
    const since = dateDaysAgo(HISTORY_DAYS);
    Promise.all([getWeightsSince(since), getDailyIntakesSince(since)]).then(([w, i]) => {
      setWeights(w);
      setIntakes(i);
    });
  }, []);

  // Les jours de craquage, mal comptés, ne faussent pas les calculs
  const { weights, intakes } = withoutBinges(allWeights, allIntakes, periods);

  // La journée en cours n'est pas finie : elle fausserait les moyennes
  const today = dateDaysAgo(0);
  const shortDate = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  const saveDeclaredPeriod = () => {
    if (!periodStart || !periodEnd) return;
    setPeriods(addBingePeriod(periodStart, periodEnd));
    setDeclaring(false);
  };
  const pastIntakes = intakes.filter(day => day.date < today);

  const trend = getWeightTrend(weights);
  const latest = trend[trend.length - 1];
  const rate = getWeeklyRate(weights);
  const verdict = rate ? getRateVerdict(rate.percentPerWeek) : null;
  const maintenance = estimateMaintenance(weights, pastIntakes);
  const week = averageIntake(pastIntakes.filter(day => day.date >= dateDaysAgo(7)));
  const chartStart = dateDaysAgo(range);
  const chartPoints = trend.filter(p => p.date >= chartStart);
  const change = weightChange(chartPoints);
  const maintenanceProgress = ((MAINTENANCE_DAYS_NEEDED - maintenance.daysMissing) / MAINTENANCE_DAYS_NEEDED) * 100;

  return (
    <section className="cut-card">
      <div className="cut-head">
        <h2>{ti('🔥 Ma sèche')}</h2>
        {latest && (
          <div className="range-tabs" role="group" aria-label={t('Période du graphique')}>
            {RANGES.map(({ days, label }) => (
              <button
                key={days}
                className={range === days ? 'active' : ''}
                aria-pressed={range === days}
                onClick={() => setRange(days)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!latest ? (
        <p className="cut-hint">
          {t('Note ton poids chaque matin dans « Saisir ma dépense » : ta tendance apparaîtra ici.')}
        </p>
      ) : (
        <>
          <div className="cut-hero">
            <div>
              <span className="cut-label">{t('Poids tendance')}</span>
              <strong className="cut-weight">
                {number(latest.trend)}
                <small> {t('kg')}</small>
              </strong>
            </div>
            {change && (
              <span className={`cut-delta ${change.kg <= 0 ? 'down' : 'up'}`}>
                {signed(change.kg, 1)} {unitLabel('kg')}
                <small>{t('sur {days} j', { days: change.days })}</small>
              </span>
            )}
          </div>

          {chartPoints.length >= 2 ? (
            <WeightChart points={chartPoints} />
          ) : (
            <p className="cut-hint">{t('Pas assez de pesées sur cette période pour tracer la courbe.')}</p>
          )}

          {rate && verdict ? (
            <div className="cut-pace">
              <div className="pace-head">
                <span className="cut-label">{t('Rythme de perte')}</span>
                <strong>
                  {signed(rate.kgPerWeek, 1)} {t('kg/sem')} · {signed(rate.percentPerWeek, 1)} %
                </strong>
              </div>
              <div
                className="pace-gauge"
                role="img"
                aria-label={t('Rythme de {rate} % par semaine, la zone idéale va de 0,5 à 1 %', { rate: number(Math.abs(rate.percentPerWeek)) })}
              >
                <div className="pace-zone" />
                <div
                  className={`pace-marker ${verdict.level}`}
                  style={{ left: `${paceGaugePosition(rate.percentPerWeek)}%` }}
                />
              </div>
              <div className="pace-scale" aria-hidden="true">
                <span>0 %</span>
                <span>0,5</span>
                <span>1</span>
                <span>1,5 %</span>
              </div>
              <p className={`cut-verdict ${verdict.level}`}>{verdict.message}</p>
            </div>
          ) : (
            <p className="cut-hint">{t('Il faut 4 pesées sur au moins 7 jours pour afficher ton rythme.')}</p>
          )}

          <div className="cut-tiles">
            <div className="cut-tile">
              <span className="cut-label">{t('Dépense réelle')}</span>
              <strong>
                {maintenance.value !== null ? `${number(maintenance.value, 0)} ${unitLabel('kcal')}` : '—'}
              </strong>
            </div>
            <div className="cut-tile">
              <span className="cut-label">{t('Calories à viser')}</span>
              <strong>
                {maintenance.value !== null
                  ? `${number(maintenance.value + getObjective(), 0)} ${unitLabel('kcal')}`
                  : '—'}
              </strong>
            </div>
            <div className="cut-tile">
              <span className="cut-label">{t('Moyenne 7 jours')}</span>
              <strong>{week ? `${number(week.kcal, 0)} ${unitLabel('kcal')}` : '—'}</strong>
            </div>
            <div className="cut-tile">
              <span className="cut-label">{t('Protéines 7 jours')}</span>
              <strong>{week ? `${week.protein} / ${proteinTarget(latest.trend)} ${unitLabel('g')}` : '—'}</strong>
            </div>
          </div>

          {maintenance.value === null && (
            <div className="cut-learning">
              <div className="learning-head">
                <span>{t('Calcul de ta dépense réelle')}</span>
                <strong>{t('encore {days} j', { days: maintenance.daysMissing })}</strong>
              </div>
              <div className="learning-track">
                <div className="learning-fill" style={{ width: `${Math.max(maintenanceProgress, 4)}%` }} />
              </div>
              <p className="cut-hint">
                {t('Elle se calcule avec 14 jours de repas et de pesées, et sera souvent plus fiable que ta montre.')}
              </p>
            </div>
          )}
        </>
      )}

      {/* Période de craquage : ces jours sortent des calculs, sans rien effacer */}
      <div className="cut-binge">
        {periods.length > 0 && (
          <ul className="binge-periods">
            {periods.map(period => (
              <li key={`${period.start}-${period.end}`}>
                <span>
                  {period.start === period.end
                    ? t('Craquage le {date}', { date: shortDate(period.start) })
                    : t('Craquage du {start} au {end}', { start: shortDate(period.start), end: shortDate(period.end) })}
                </span>
                <button
                  className="entry-action"
                  aria-label={t('Supprimer')}
                  onClick={() => {
                    if (window.confirm(t('Remettre ces jours dans les calculs de Ma sèche ?'))) setPeriods(removeBingePeriod(period));
                  }}
                ><Icon name="trash" /></button>
              </li>
            ))}
          </ul>
        )}
        {declaring ? (
          <div className="binge-form">
            <div className="binge-dates">
              <label><span>{t('Du')}</span><input type="date" value={periodStart} max={today} onChange={e => setPeriodStart(e.target.value)} /></label>
              <label><span>{t('Au')}</span><input type="date" value={periodEnd} max={today} onChange={e => setPeriodEnd(e.target.value)} /></label>
            </div>
            <p className="cut-hint">
              {t('Ces jours ne comptent plus dans Ma sèche, ni les pesées des {n} jours suivants, le temps que l’eau parte. Rien n’est effacé.', { n: WATER_DAYS_AFTER })}
            </p>
            <div className="binge-buttons">
              <button className="btn btn-secondary" onClick={() => setDeclaring(false)}>{t('Annuler')}</button>
              <button className="btn btn-primary" disabled={!periodStart || !periodEnd} onClick={saveDeclaredPeriod}>{t('Valider')}</button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-secondary binge-declare"
            onClick={() => {
              setPeriodStart(dateDaysAgo(1));
              setPeriodEnd(dateDaysAgo(1));
              setDeclaring(true);
            }}
          >
            {t('Déclarer une période de craquage')}
          </button>
        )}
      </div>
    </section>
  );
}
