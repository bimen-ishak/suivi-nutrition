import './MacroCard.css';
import { t, unitLabel } from '../i18n';

export type MacroKind = 'protein' | 'carbs' | 'fat' | 'sodium' | 'potassium';

interface MacroCardProps {
  label: string;
  kind: MacroKind;
  value: number;
  goal: number;
  unit: string;
  /** Un plafond à ne pas dépasser, et non un objectif à atteindre */
  isLimit?: boolean;
  wide?: boolean;
}

export function MacroCard({ label, kind, value, goal, unit, isLimit = false, wide = false }: MacroCardProps) {
  const over = isLimit && value > goal;
  const percent = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;

  return (
    <div className={`macro-card ${wide ? 'wide' : ''}`}>
      <span className="macro-card-label">{label}</span>
      <div className="macro-card-figures">
        <span className={`macro-card-value ${over ? 'over' : ''}`}>{Math.round(value)}</span>
        <span className="macro-card-goal">
          / {isLimit ? `${t('max')} ` : ''}{goal} {unitLabel(unit as 'g' | 'mg')}
        </span>
      </div>
      <div className="macro-card-track">
        <div
          className={`macro-card-fill fill-${kind} ${over ? 'over' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
