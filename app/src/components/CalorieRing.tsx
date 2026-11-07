import './CalorieRing.css';

interface CalorieRingProps {
  eaten: number;
  /** Calories à ne pas dépasser aujourd'hui, ou null tant que la dépense est inconnue */
  budget: number | null;
}

const RADIUS = 66;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ eaten, budget }: CalorieRingProps) {
  const progress = budget && budget > 0 ? Math.min(eaten / budget, 1) : 0;
  const over = budget !== null && eaten > budget;

  return (
    <div
      className="calorie-ring"
      role="img"
      aria-label={budget !== null ? `${eaten} kcal mangées sur ${budget}` : `${eaten} kcal mangées`}
    >
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle className="ring-track" cx="80" cy="80" r={RADIUS} />
        <circle
          className={`ring-progress ${over ? 'over' : ''}`}
          cx="80"
          cy="80"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-value">{eaten}</span>
        <span className="ring-label">kcal mangées</span>
        {budget !== null && <span className="ring-goal">sur {budget}</span>}
      </div>
    </div>
  );
}
