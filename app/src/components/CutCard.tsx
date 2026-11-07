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

const HISTORY_DAYS = 60;
const MAINTENANCE_DAYS_NEEDED = 14;
const RANGES = [
  { days: 7, label: '7 j' },
  { days: 30, label: '30 j' },
  { days: 60, label: '60 j' }
];

const dateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const number = (value: number, digits = 1) =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: digits });

const signed = (value: number, digits: number) =>
  `${value > 0 ? '+' : ''}${number(value, digits)}`;

export function CutCard() {
  const [weights, setWeights] = useState<WeightPoint[]>([]);
  const [intakes, setIntakes] = useState<IntakeDay[]>([]);
  const [range, setRange] = useState(30);

  useEffect(() => {
    const since = dateDaysAgo(HISTORY_DAYS);
    Promise.all([getWeightsSince(since), getDailyIntakesSince(since)]).then(([w, i]) => {
      setWeights(w);
      setIntakes(i);
    });
  }, []);

  // La journée en cours n'est pas finie : elle fausserait les moyennes
  const today = dateDaysAgo(0);
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
        <h2>🔥 Ma sèche</h2>
        {latest && (
          <div className="range-tabs" role="group" aria-label="Période du graphique">
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
          Note ton poids chaque matin dans « Saisir ma dépense » : ta tendance apparaîtra ici.
        </p>
      ) : (
        <>
          <div className="cut-hero">
            <div>
              <span className="cut-label">Poids tendance</span>
              <strong className="cut-weight">
                {number(latest.trend)}
                <small> kg</small>
              </strong>
            </div>
            {change && (
              <span className={`cut-delta ${change.kg <= 0 ? 'down' : 'up'}`}>
                {signed(change.kg, 1)} kg
                <small>sur {change.days} j</small>
              </span>
            )}
          </div>

          {chartPoints.length >= 2 ? (
            <WeightChart points={chartPoints} />
          ) : (
            <p className="cut-hint">Pas assez de pesées sur cette période pour tracer la courbe.</p>
          )}

          {rate && verdict ? (
            <div className="cut-pace">
              <div className="pace-head">
                <span className="cut-label">Rythme de perte</span>
                <strong>
                  {signed(rate.kgPerWeek, 1)} kg/sem · {signed(rate.percentPerWeek, 1)} %
                </strong>
              </div>
              <div
                className="pace-gauge"
                role="img"
                aria-label={`Rythme de ${number(Math.abs(rate.percentPerWeek))} % par semaine, la zone idéale va de 0,5 à 1 %`}
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
            <p className="cut-hint">Il faut 4 pesées sur au moins 7 jours pour afficher ton rythme.</p>
          )}

          <div className="cut-tiles">
            <div className="cut-tile">
              <span className="cut-label">Dépense réelle</span>
              <strong>
                {maintenance.value !== null ? `${number(maintenance.value, 0)} kcal` : '—'}
              </strong>
            </div>
            <div className="cut-tile">
              <span className="cut-label">Calories à viser</span>
              <strong>
                {maintenance.value !== null
                  ? `${number(maintenance.value + getObjective(), 0)} kcal`
                  : '—'}
              </strong>
            </div>
            <div className="cut-tile">
              <span className="cut-label">Moyenne 7 jours</span>
              <strong>{week ? `${number(week.kcal, 0)} kcal` : '—'}</strong>
            </div>
            <div className="cut-tile">
              <span className="cut-label">Protéines 7 jours</span>
              <strong>{week ? `${week.protein} / ${proteinTarget(latest.trend)} g` : '—'}</strong>
            </div>
          </div>

          {maintenance.value === null && (
            <div className="cut-learning">
              <div className="learning-head">
                <span>Calcul de ta dépense réelle</span>
                <strong>encore {maintenance.daysMissing} j</strong>
              </div>
              <div className="learning-track">
                <div className="learning-fill" style={{ width: `${Math.max(maintenanceProgress, 4)}%` }} />
              </div>
              <p className="cut-hint">
                Elle se calcule avec 14 jours de repas et de pesées, et sera souvent plus fiable que ta montre.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
