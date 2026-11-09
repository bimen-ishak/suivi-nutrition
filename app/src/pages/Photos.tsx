import { useEffect, useRef, useState } from 'react';
import type { DailyPhoto } from '../types';
import { deletePhoto, getAllPhotos, savePhoto } from '../db';
import { compressPhoto } from '../utils/photo';
import './Photos.css';
import { t, locale, isRtl } from '../i18n';
import { ti, Icon } from '../components/Icon';
import { PhotoCalendar } from '../components/PhotoCalendar';

const SWIPE_DISTANCE = 50;

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

export function Photos() {
  const [photos, setPhotos] = useState<DailyPhoto[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<DailyPhoto | null>(null);
  const touchStartX = useRef<number | null>(null);

  const loadPhotos = async () => {
    setPhotos(await getAllPhotos());
  };

  // Seules les vraies photos s'ouvrent dans la visionneuse
  const realPhotos = photos.filter(p => !p.skipped);
  const markSkipped = async (day: string) => {
    await savePhoto({ date: day, image: '', skipped: true, createdAt: new Date().toISOString() });
    await loadPhotos();
  };

  const clearSkipped = async (day: string) => {
    await deletePhoto(day);
    await loadPhotos();
  };

  const openCalendar = (day?: string) => {
    setCalendarDate(day);
    setCalendarOpen(true);
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const saveFileForDate = async (file: File, targetDate: string) => {
    const exists = photos.some(p => p.date === targetDate && !p.skipped);
    if (exists && !confirm(t('Remplacer la photo du {date} ?', { date: formatDate(targetDate) }))) return;

    setSaving(true);
    try {
      const image = await compressPhoto(file);
      const photo = { date: targetDate, image, createdAt: new Date().toISOString() };
      await savePhoto(photo);
      await loadPhotos();
      setViewing(current => (current && current.date === targetDate ? photo : current));
      setCalendarOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la photo:', error);
      alert(t('Impossible d\'enregistrer cette photo'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (photo: DailyPhoto) => {
    if (!confirm(t('Supprimer la photo du {date} ?', { date: formatDate(photo.date) }))) return;
    await deletePhoto(photo.date);
    setViewing(null);
    await loadPhotos();
  };

  if (viewing) {
    // La liste va de la plus récente à la plus ancienne
    const index = realPhotos.findIndex(p => p.date === viewing.date);
    const older = realPhotos[index + 1];
    const newer = realPhotos[index - 1];

    // En arabe, on lit de droite à gauche : la photo suivante est à gauche, comme les pages d'un livre
    const leftTarget = isRtl() ? newer : older;
    const rightTarget = isRtl() ? older : newer;

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const distance = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (distance > SWIPE_DISTANCE && leftTarget) setViewing(leftTarget);
      if (distance < -SWIPE_DISTANCE && rightTarget) setViewing(rightTarget);
    };

    return (
      <div className="photo-viewer">
        <div className="photo-viewer-bar">
          <button onClick={() => setViewing(null)}>{t('← Retour')}</button>
          <label className={`photo-replace ${saving ? 'disabled' : ''}`}>
            {saving ? t('Enregistrement...') : t('Remplacer cette photo')}
            <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) saveFileForDate(file, viewing.date);
              }} disabled={saving} hidden />
          </label>
          <button className="photo-delete" onClick={() => handleDelete(viewing)}>{t('Supprimer')}</button>
        </div>

        <div
          className="photo-stage"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={handleTouchEnd}
        >
          <img src={viewing.image} alt={t('Photo du {date}', { date: formatDate(viewing.date) })} />
          {leftTarget && (
            <button
              className="photo-arrow left"
              onClick={() => setViewing(leftTarget)}
              aria-label={leftTarget === older ? t('Photo précédente') : t('Photo suivante')}
            >
              ‹
            </button>
          )}
          {rightTarget && (
            <button
              className="photo-arrow right"
              onClick={() => setViewing(rightTarget)}
              aria-label={rightTarget === older ? t('Photo précédente') : t('Photo suivante')}
            >
              ›
            </button>
          )}
        </div>

        <p>{formatDate(viewing.date)} · {realPhotos.length - index} / {realPhotos.length}</p>
      </div>
    );
  }

  if (calendarOpen) {
    return (
      <PhotoCalendar
        photos={photos}
        initialDate={calendarDate}
        saving={saving}
        onPick={saveFileForDate}
        onSkip={async (day) => { await markSkipped(day); setCalendarOpen(false); }}
        onClear={async (day) => { await clearSkipped(day); setCalendarOpen(false); }}
        onClose={() => setCalendarOpen(false)}
      />
    );
  }

  return (
    <div className="photos-page">
      <h1>{ti('📷 Photos')}</h1>

      <div className="photo-add">
        <button className="photo-add-btn" onClick={() => openCalendar()}>
          {t('+ Ajouter une photo')}
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="photos-empty">
          <span className="photos-empty-icon" aria-hidden="true"><Icon name="camera" /></span>
          <strong>{t('Aucune photo pour le moment')}</strong>
          <p>{t('Une photo par jour suffit pour voir ta sèche avancer.')}</p>
        </div>
      ) : (
        <div className="photos-grid">
          {photos.map(photo =>
            photo.skipped ? (
              <button key={photo.date} className="photo-slot skipped" onClick={() => openCalendar(photo.date)}>
                <span className="photo-slot-body">
                  <strong>{t('Pas de photo ce jour-là')}</strong>
                </span>
                <span>{formatDate(photo.date)}</span>
              </button>
            ) : (
              <button key={photo.date} className="photo-tile" onClick={() => setViewing(photo)}>
                <img src={photo.image} alt={t('Photo du {date}', { date: formatDate(photo.date) })} loading="lazy" />
                <span>{formatDate(photo.date)}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
