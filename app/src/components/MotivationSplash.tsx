import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { daysUntil, getGoalDate, getMotivationPhoto, nextQuote, QUOTE_AUTHOR } from '../utils/motivation';
import { t } from '../i18n';
import './MotivationSplash.css';

// Durée avant l'ouverture de l'app : plus longue pour les longues phrases
const BASE_MS = 6000;
const LONG_QUOTE_MS = 8500;
const LEAVE_MS = 800;
// Un appui plus court que ça passe l'écran ; plus long, c'est une pause tant que le doigt reste posé
const HOLD_MS = 250;

/** Écran plein, à chaque ouverture : la photo, une phrase et les jours restants */
export function MotivationSplash({ today, onDone }: { today: string; onDone: () => void }) {
  const [quote] = useState(nextQuote);
  const [photo] = useState(getMotivationPhoto);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const goal = getGoalDate();
  const days = goal ? daysUntil(goal, today) : null;
  const duration = quote.length > 60 ? LONG_QUOTE_MS : BASE_MS;

  // Le compte à rebours garde le temps restant, pour reprendre là où la pause l'a arrêté
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const pressedAt = useRef<number | null>(null);
  const leavingRef = useRef(false);

  const leave = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    window.clearTimeout(timer.current);
    setPaused(false);
    setLeaving(true);
    window.setTimeout(() => doneRef.current(), LEAVE_MS);
  }, []);

  const run = useCallback(() => {
    startedAt.current = Date.now();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(leave, Math.max(0, remaining.current - LEAVE_MS));
  }, [leave]);

  useEffect(() => {
    run();
    return () => window.clearTimeout(timer.current);
  }, [run]);

  const press = () => {
    if (leavingRef.current) return;
    pressedAt.current = Date.now();
    // Pause tout de suite : la barre et les animations s'arrêtent sous le doigt
    window.clearTimeout(timer.current);
    remaining.current -= Date.now() - startedAt.current;
    setPaused(true);
  };

  const release = () => {
    if (pressedAt.current === null || leavingRef.current) return;
    const held = Date.now() - pressedAt.current;
    pressedAt.current = null;
    if (held < HOLD_MS) {
      leave();
      return;
    }
    setPaused(false);
    run();
  };

  return (
    <div
      className="motivation-splash"
      data-leaving={leaving || undefined}
      data-paused={paused || undefined}
      style={{ '--splash-ms': `${duration}ms` } as CSSProperties}
      role="dialog"
      aria-label={t('Motivation du jour')}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onContextMenu={event => event.preventDefault()}
    >
      {photo && <img className="motivation-photo" src={photo} alt="" draggable={false} />}
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
        <span className="motivation-skip">{paused ? t('En pause') : t('Touche pour continuer, garde le doigt pour mettre en pause')}</span>
      </div>
      <div className="motivation-progress" aria-hidden="true"><span /></div>
    </div>
  );
}
