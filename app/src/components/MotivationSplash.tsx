import { useEffect, useState, type CSSProperties } from 'react';
import { daysUntil, getGoalDate, getMotivationPhoto, nextQuote, QUOTE_AUTHOR } from '../utils/motivation';
import { t } from '../i18n';
import './MotivationSplash.css';

// Durée avant l'ouverture de l'app : plus longue pour les longues phrases ; un appui la raccourcit
const BASE_MS = 6000;
const LONG_QUOTE_MS = 8500;
const LEAVE_MS = 800;

/** Écran plein, à chaque ouverture : la photo, une phrase et les jours restants */
export function MotivationSplash({ today, onDone }: { today: string; onDone: () => void }) {
  const [quote] = useState(nextQuote);
  const [photo] = useState(getMotivationPhoto);
  const [leaving, setLeaving] = useState(false);
  const goal = getGoalDate();
  const days = goal ? daysUntil(goal, today) : null;
  const duration = quote.length > 60 ? LONG_QUOTE_MS : BASE_MS;

  useEffect(() => {
    const leave = window.setTimeout(() => setLeaving(true), duration - LEAVE_MS);
    const done = window.setTimeout(onDone, duration);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, [onDone, duration]);

  const skip = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onDone, LEAVE_MS);
  };

  return (
    <div
      className="motivation-splash"
      data-leaving={leaving || undefined}
      style={{ '--splash-ms': `${duration}ms` } as CSSProperties}
      role="dialog"
      aria-label={t('Motivation du jour')}
      onClick={skip}
    >
      {photo && <img className="motivation-photo" src={photo} alt="" />}
      <div className="motivation-shade" />
      <div className="motivation-text">
        {days !== null && (
          <p className="motivation-count">
            {days === 0
              ? t('C’est le jour J. Tiens bon.')
              : t('Encore {n} jours sans craquer', { n: days })}
          </p>
        )}
        <blockquote dir="ltr">
          <p>« {quote} »</p>
          <footer>— {QUOTE_AUTHOR}</footer>
        </blockquote>
        <span className="motivation-skip">{t('Touche pour continuer')}</span>
      </div>
      <div className="motivation-progress" aria-hidden="true"><span /></div>
    </div>
  );
}
