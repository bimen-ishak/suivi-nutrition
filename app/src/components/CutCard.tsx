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
  proteinTarget,
  type IntakeDay,
  type WeightPoint
} from '../utils/cut';
import './CutCard.css';

const HISTORY_DAYS = 60;
const CHART_DAYS = 30;

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
  const chartStart = dateDaysAgo(CHART_DAYS);
  const chartPoints = trend.filter(p => p.date >= chartStart);

  return (
    <section className="cut-card">
      <h2>🔥 Ma sèche</h2>

      {!latest ? (
        <p className="cut-hint">
          Note ton poids chaque matin dans « Saisir ma dépense » : ta tendance apparaîtra ici.
        </p>
      ) : (
        <>
          <div className="cut-hero">
            <div>
              <span className="cut-label">Poids tendance</span>
              <strong>{number(latest.trend)} kg</strong>
            </div>
            <div>
              <span className="cut-label">Rythme</span>
              {rate ? (
                <strong>{signed(rate.kgPerWeek, 1)} kg/sem.</strong>
              ) : (
                <span className="cut-pending">Il faut 4 pesées sur 7 jours</span>
              )}
            </div>
          </div>

          {verdict && rate && (
            <p className={`cut-verdict ${verdict.level}`}>
              {verdict.message} ({signed(rate.percentPerWeek, 1)} % par semaine)
            </p>
          )}

          {chartPoints.length >= 2 && <WeightChart points={chartPoints} />}

          <dl className="cut-stats">
            <div>
              <dt>Dépense réelle</dt>
              <dd>
                {maintenance.value !== null
                  ? `${number(maintenance.value, 0)} kcal`
                  : `Encore ${maintenance.daysMissing} j`}
              </dd>
            </div>
            <div>
              <dt>Calories à viser</dt>
              <dd>
                {maintenance.value !== null
                  ? `${number(maintenance.value + getObjective(), 0)} kcal`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Moyenne 7 jours</dt>
              <dd>{week ? `${number(week.kcal, 0)} kcal` : '—'}</dd>
            </div>
            <div>
              <dt>Protéines 7 jours</dt>
              <dd>{week ? `${week.protein} / ${proteinTarget(latest.trend)} g` : '—'}</dd>
            </div>
          </dl>

          {maintenance.value === null && (
            <p className="cut-hint">
              Ta dépense réelle se calcule avec 14 jours de repas et de pesées. Elle sera souvent plus fiable que ta montre.
            </p>
          )}
        </>
      )}
    </section>
  );
}
