import { useState } from 'react';
import type { DailyPhoto } from '../types';
import { localDateKey } from '../utils/photo';
import './PhotoCalendar.css';
import { t, locale, isRtl } from '../i18n';

interface PhotoCalendarProps {
  photos: DailyPhoto[];
  initialDate?: string;
  saving: boolean;
  /** Une photo a été choisie pour ce jour */
  onPick: (file: File, date: string) => void;
  /** Le jour est marqué « pas de photo » */
  onSkip: (date: string) => void;
  /** Le marquage « pas de photo » est retiré */
  onClear: (date: string) => void;
  onClose: () => void;
}

const MONTH_START = (date: string) => new Date(`${date.slice(0, 7)}-01T12:00:00`);

export function PhotoCalendar({ photos, initialDate, saving, onPick, onSkip, onClear, onClose }: PhotoCalendarProps) {
  const today = localDateKey();
  const [month, setMonth] = useState(() => MONTH_START(initialDate ?? today));
  const [selected, setSelected] = useState<string | null>(initialDate ?? null);

  const byDate = new Map(photos.map(p => [p.date, p]));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // La semaine commence le lundi
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const isCurrentMonth = localDateKey(month).slice(0, 7) === today.slice(0, 7);

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale(), { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i, 12))
  );
  const title = new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(month);
  const dayKey = (day: number) => localDateKey(new Date(year, monthIndex, day, 12));

  const shiftMonth = (delta: number) => setMonth(new Date(year, monthIndex + delta, 1, 12));

  const rtl = isRtl();
  const selectedPhoto = selected ? byDate.get(selected) : undefined;
  const hasRealPhoto = !!selectedPhoto && !selectedPhoto.skipped;
  const isSkipped = selectedPhoto?.skipped === true;
  const selectedLabel = selected
    ? new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(`${selected}T12:00:00`)
      )
    : '';

  return (
    <div className="photo-calendar-page">
      <div className="photo-calendar-header">
        <button className="back-btn" onClick={onClose}>{t('← Retour')}</button>
        <h1>{t('Choisis le jour')}</h1>
      </div>

      <div className="photo-calendar">
        <div className="photo-calendar-nav">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label={t('Mois précédent')}>
            {rtl ? '›' : '‹'}
          </button>
          <strong>{title}</strong>
          <button type="button" onClick={() => shiftMonth(1)} disabled={isCurrentMonth} aria-label={t('Mois suivant')}>
            {rtl ? '‹' : '›'}
          </button>
        </div>

        <div className="photo-calendar-grid">
          {weekdays.map((w, i) => (
            <span key={i} className="photo-calendar-weekday">{w}</span>
          ))}
          {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const key = dayKey(day);
            const entry = byDate.get(key);
            const state = entry ? (entry.skipped ? 'skipped' : 'photo') : 'empty';
            return (
              <button
                key={key}
                type="button"
                disabled={key > today}
                className={`photo-calendar-day ${state} ${selected === key ? 'selected' : ''} ${key === today ? 'today' : ''}`}
                onClick={() => setSelected(key)}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="photo-calendar-legend">
          <span><i className="dot photo" />{t('Photo enregistrée')}</span>
          <span><i className="dot skipped" />{t('Pas de photo ce jour-là')}</span>
        </div>
      </div>

      {selected && (
        <div className="photo-calendar-actions">
          <strong>{selectedLabel}</strong>
          <label className={`btn btn-primary ${saving ? 'disabled' : ''}`}>
            {saving ? t('Enregistrement...') : hasRealPhoto ? t('Remplacer la photo') : t('Choisir la photo')}
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={saving}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) onPick(file, selected);
              }}
            />
          </label>
          {isSkipped ? (
            <button className="btn btn-secondary" onClick={() => onClear(selected)}>{t('Annuler')}</button>
          ) : !hasRealPhoto ? (
            <button className="btn btn-secondary" onClick={() => onSkip(selected)}>{t('Pas de photo ce jour-là')}</button>
          ) : null}
        </div>
      )}
    </div>
  );
}
