import { useState } from 'react';
import { compressPhoto } from '../utils/photo';
import { getApiKey, readLabel, LabelReadError, type LabelResult } from '../utils/labelReader';
import './LabelScanButton.css';

interface LabelScanButtonProps {
  onRead: (result: LabelResult) => void;
}

// Une étiquette est petite : on garde plus de détails que pour une photo de journée
const LABEL_PHOTO_SIZE = 1600;
const LABEL_PHOTO_QUALITY = 0.85;

export function LabelScanButton({ onRead }: LabelScanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const hasKey = getApiKey() !== null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const key = getApiKey();
    if (!key) return;

    setLoading(true);
    setMessage(null);
    try {
      const image = await compressPhoto(file, LABEL_PHOTO_SIZE, LABEL_PHOTO_QUALITY);
      const result = await readLabel(image, key);
      onRead(result);
      setMessage({ kind: 'ok', text: 'Valeurs lues. Vérifie-les avant d\'enregistrer.' });
    } catch (error) {
      console.error('Erreur de lecture de l\'étiquette:', error);
      setMessage({
        kind: 'error',
        text: error instanceof LabelReadError ? error.message : 'Impossible de lire cette photo. Réessaie.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasKey) {
    return (
      <p className="label-scan-hint">
        🤖 Pour remplir tout seul depuis une photo de l'étiquette, ajoute ta clé gratuite dans Paramètres → Lecture d'étiquette.
      </p>
    );
  }

  return (
    <div className="label-scan">
      <label className={`btn btn-secondary label-scan-btn ${loading ? 'disabled' : ''}`}>
        {loading ? '⏳ Lecture en cours...' : '📷 Lire l\'étiquette avec l\'IA'}
        <input
          type="file"
          accept="image/*"
          disabled={loading}
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      {message && <p className={`label-scan-message ${message.kind}`}>{message.text}</p>}
    </div>
  );
}
