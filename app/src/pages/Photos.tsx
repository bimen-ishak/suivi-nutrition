import { useEffect, useRef, useState } from 'react';
import type { DailyPhoto } from '../types';
import { deletePhoto, getAllPhotos, savePhoto } from '../db';
import { compressPhoto, localDateKey } from '../utils/photo';
import './Photos.css';

const SWIPE_DISTANCE = 50;

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', {
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
    if (exists && !confirm(`Remplacer la photo du ${formatDate(date)} ?`)) return;

    setSaving(true);
    try {
      const image = await compressPhoto(file);
      await savePhoto({ date, image, createdAt: new Date().toISOString() });
      await loadPhotos();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la photo:', error);
      alert('❌ Impossible d\'enregistrer cette photo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (photo: DailyPhoto) => {
    if (!confirm(`Supprimer la photo du ${formatDate(photo.date)} ?`)) return;
    await deletePhoto(photo.date);
    setViewing(null);
    await loadPhotos();
  };

  if (viewing) {
    // La liste va de la plus récente à la plus ancienne
    const index = photos.findIndex(p => p.date === viewing.date);
    const older = photos[index + 1];
    const newer = photos[index - 1];

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const distance = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (distance > SWIPE_DISTANCE && older) setViewing(older);
      if (distance < -SWIPE_DISTANCE && newer) setViewing(newer);
    };

    return (
      <div className="photo-viewer">
        <div className="photo-viewer-bar">
          <button onClick={() => setViewing(null)}>← Retour</button>
          <button className="photo-delete" onClick={() => handleDelete(viewing)}>Supprimer</button>
        </div>

        <div
          className="photo-stage"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={handleTouchEnd}
        >
          <img src={viewing.image} alt={`Photo du ${formatDate(viewing.date)}`} />
          {older && (
            <button className="photo-arrow left" onClick={() => setViewing(older)} aria-label="Photo précédente">‹</button>
          )}
          {newer && (
            <button className="photo-arrow right" onClick={() => setViewing(newer)} aria-label="Photo suivante">›</button>
          )}
        </div>

        <p>{formatDate(viewing.date)} · {photos.length - index} / {photos.length}</p>
      </div>
    );
  }

  const hasPhotoForDate = photos.some(p => p.date === date);

  return (
    <div className="photos-page">
      <h1>📷 Photos</h1>

      <div className="photo-add">
        <label className="photo-date">
          Jour
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value || today)}
          />
        </label>

        <label className={`photo-add-btn ${saving ? 'disabled' : ''}`}>
          {saving
            ? 'Enregistrement...'
            : hasPhotoForDate
              ? 'Remplacer la photo'
              : date === today ? '+ Ajouter la photo du jour' : '+ Ajouter la photo'}
          <input type="file" accept="image/*" onChange={handleFile} disabled={saving} hidden />
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="photos-empty">
          <span className="photos-empty-icon" aria-hidden="true">📷</span>
          <strong>Aucune photo pour le moment</strong>
          <p>Une photo par jour suffit pour voir ta sèche avancer.</p>
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
