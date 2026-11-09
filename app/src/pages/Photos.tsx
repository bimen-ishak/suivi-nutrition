import { useEffect, useRef, useState } from 'react';
import type { DailyPhoto } from '../types';
import { deletePhoto, getAllPhotos, savePhoto } from '../db';
import { compressPhoto, localDateKey } from '../utils/photo';
import './Photos.css';
import { t, locale, isRtl } from '../i18n';

const SWIPE_DISTANCE = 50;

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

export function Photos() {
  const today = localDateKey();
  const [photos, setPhotos] = useState<DailyPhoto[]>([]);
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<DailyPhoto | null>(null);
  const touchStartX = useRef<number | null>(null);

  const loadPhotos = async () => {
    setPhotos(await getAllPhotos());
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const exists = photos.some(p => p.date === date);
    if (exists && !confirm(t('Remplacer la photo du {date} ?', { date: formatDate(date) }))) return;

    setSaving(true);
    try {
      const image = await compressPhoto(file);
      await savePhoto({ date, image, createdAt: new Date().toISOString() });
      await loadPhotos();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la photo:', error);
      alert(t('❌ Impossible d\'enregistrer cette photo'));
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
    const index = photos.findIndex(p => p.date === viewing.date);
    const older = photos[index + 1];
    const newer = photos[index - 1];

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

        <p>{formatDate(viewing.date)} · {photos.length - index} / {photos.length}</p>
      </div>
    );
  }

  const hasPhotoForDate = photos.some(p => p.date === date);

  return (
    <div className="photos-page">
      <h1>{t('📷 Photos')}</h1>

      <div className="photo-add">
        <label className="photo-date">
          {t('Jour')}
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value || today)}
          />
        </label>

        <label className={`photo-add-btn ${saving ? 'disabled' : ''}`}>
          {saving
            ? t('Enregistrement...')
            : hasPhotoForDate
              ? t('Remplacer la photo')
              : date === today ? t('+ Ajouter la photo du jour') : t('+ Ajouter la photo')}
          <input type="file" accept="image/*" onChange={handleFile} disabled={saving} hidden />
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="photos-empty">
          <span className="photos-empty-icon" aria-hidden="true">📷</span>
          <strong>{t('Aucune photo pour le moment')}</strong>
          <p>{t('Une photo par jour suffit pour voir ta sèche avancer.')}</p>
        </div>
      ) : (
        <div className="photos-grid">
          {photos.map(photo => (
            <button key={photo.date} className="photo-tile" onClick={() => setViewing(photo)}>
              <img src={photo.image} alt={`Photo du ${formatDate(photo.date)}`} loading="lazy" />
              <span>{formatDate(photo.date)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
