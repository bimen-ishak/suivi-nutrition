import { useState } from 'react';
import type { TrendPoint } from '../utils/cut';
import { t, unitLabel, locale } from '../i18n';

interface WeightChartProps {
  points: TrendPoint[];
}

const WIDTH = 320;
const HEIGHT = 170;
const PAD = { top: 10, right: 12, bottom: 22, left: 34 };

const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000;
const kg = (value: number) => value.toLocaleString(locale(), { maximumFractionDigits: 1 });
const shortDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });

export function WeightChart({ points }: WeightChartProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const values = points.flatMap(p => [p.weight, p.trend]);
  const min = Math.floor(Math.min(...values) * 2) / 2 - 0.5;
  const max = Math.ceil(Math.max(...values) * 2) / 2 + 0.5;
  const firstDay = dayNumber(points[0].date);
  const span = Math.max(dayNumber(points[points.length - 1].date) - firstDay, 1);

  const x = (date: string) =>
    PAD.left + ((dayNumber(date) - firstDay) / span) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) =>
    PAD.top + ((max - value) / (max - min)) * (HEIGHT - PAD.top - PAD.bottom);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)} ${y(p.trend).toFixed(1)}`).join(' ');
  const baseline = HEIGHT - PAD.bottom;
  const area = `${line} L${x(points[points.length - 1].date).toFixed(1)} ${baseline} L${x(points[0].date).toFixed(1)} ${baseline} Z`;
  const active = points[selected ?? points.length - 1];

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const pointerX = ((e.clientX - box.left) / box.width) * WIDTH;
    let nearest = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.date) - pointerX) < Math.abs(x(points[nearest].date) - pointerX)) nearest = i;
    });
    setSelected(nearest);
  };

  return (
    <div className="weight-chart">
      <p className="weight-readout">
        <strong>{shortDate(active.date)}</strong> · {t('pesée')} {kg(active.weight)} {unitLabel('kg')} · {t('tendance')} {kg(active.trend)} {unitLabel('kg')}
      </p>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={t('Poids du {from} au {to} : tendance de {a} à {b} kg', { from: shortDate(points[0].date), to: shortDate(active.date), a: kg(points[0].trend), b: kg(points[points.length - 1].trend) })}
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
      >
        <defs>
          <linearGradient id="weight-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="chart-area-top" />
            <stop offset="1" className="chart-area-bottom" />
          </linearGradient>
        </defs>

        {[max, min].map(value => (
          <g key={value}>
            <line className="chart-grid" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(value)} y2={y(value)} />
            <text className="chart-label" x={PAD.left - 6} y={y(value) + 4} textAnchor="end">{kg(value)}</text>
          </g>
        ))}

        <text className="chart-label" x={PAD.left} y={HEIGHT - 4}>{shortDate(points[0].date)}</text>
        <text className="chart-label" x={WIDTH - PAD.right} y={HEIGHT - 4} textAnchor="end">
          {shortDate(points[points.length - 1].date)}
        </text>

        <line className="chart-cursor" x1={x(active.date)} x2={x(active.date)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />

        {points.map(p => (
          <circle key={p.date} className="chart-dot" cx={x(p.date)} cy={y(p.weight)} r={4} />
        ))}
        <path d={area} fill="url(#weight-area)" />
        <path className="chart-trend" d={line} />
        <circle className="chart-active" cx={x(active.date)} cy={y(active.trend)} r={5} />
      </svg>

      <div className="chart-legend">
        <span><i className="legend-line" /> {t('Tendance')}</span>
        <span><i className="legend-dot" /> {t('Pesées')}</span>
      </div>
    </div>
  );
}
