import './CalorieRing.css';
import type { CSSProperties } from 'react';
import { locale, t } from '../i18n';

interface CalorieRingProps {
  eaten: number;
  budget: number;
  provisional?: boolean;
}

const RADIUS = 66;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ eaten, budget, provisional }: CalorieRingProps) {
  const remaining = Math.round((budget - eaten) * 10) / 10;
  const over = remaining < 0;
  const progress = budget > 0 ? Math.max(0, Math.min(eaten / budget, 1)) : 1;
  const excess = Math.min(1, Math.max(0, -remaining) / (budget > 0 ? budget / 2 : 500));
  const label = over ? t('kcal au-dessus de la limite') : remaining === 0 ? t('Limite du jour atteinte') : t('kcal restantes');

  return (
    <div className={`calorie-ring${over ? ' over' : ''}`} style={{
      '--budget-use': `${progress * 100}%`,
      '--budget-over': `${excess * 100}%`
    } as CSSProperties}>
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle className="ring-track" cx="80" cy="80" r={RADIUS} />
        <circle
          className="ring-progress"
          cx="80"
          cy="80"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <div className="ring-center" role="status">
        <strong className="ring-value">{Math.abs(remaining).toLocaleString(locale(), { maximumFractionDigits: 1 })}</strong>
        <span className="ring-label">{label}</span>
        {provisional && <span className="ring-goal">{t('Estimation')}</span>}
      </div>
    </div>
  );
}
