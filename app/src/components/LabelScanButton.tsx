import { useState } from 'react';
import { compressPhoto } from '../utils/photo';
import { getApiKey, readFoodPhotos, LabelReadError, type LabelResult } from '../utils/labelReader';
import './LabelScanButton.css';
import { t, unitLabel } from '../i18n';
import { ti } from './Icon';

interface LabelScanButtonProps {
  onRead: (result: LabelResult) => void;
}

// Une étiquette est petite : on garde plus de détails que pour une photo de journée
const PHOTO_SIZE = 1600;
const PHOTO_QUALITY = 0.85;
const MAX_PHOTOS = 3;

const describe = (result: LabelResult): string => {
  const parts: string[] = [];
  if (result.estimated) {
    parts.push(t("Pas d'étiquette lisible : estimation faite d'après l'image, donc approximative."));
  } else {
    parts.push(t("Valeurs lues sur l'étiquette."));
  }
  if (result.weight !== undefined) {
    parts.push(`${result.estimated ? t('Poids estimé') : t('Poids lu sur la balance')} : ${result.weight} ${unitLabel(result.unit)}.`);
  }
  if (result.barcode) parts.push(t('Code-barres trouvé : {code}.', { code: result.barcode }));
  parts.push(t("Vérifie avant d'enregistrer."));
  return parts.join(' ');
};

export function LabelScanButton({ onRead }: LabelScanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const hasKey = getApiKey() !== null;

  const handleFiles = async (files: FileList | null) => {
    const selected = Array.from(files ?? []).slice(0, MAX_PHOTOS);
    const key = getApiKey();
    if (selected.length === 0 || !key) return;

    setLoading(true);
    setMessage(null);
    try {
      const images = await Promise.all(selected.map(file => compressPhoto(file, PHOTO_SIZE, PHOTO_QUALITY)));
      const result = await readFoodPhotos(images, key);
      onRead(result);
      setMessage({ kind: 'ok', text: describe(result) });
    } catch (error) {
      console.error('Erreur de lecture des photos:', error);
      setMessage({
        kind: 'error',
        text: error instanceof LabelReadError ? error.message : t('Impossible de lire ces photos. Réessaie.')
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasKey) {
    return (
      <p className="label-scan-hint">
        {ti('🤖 Pour remplir tout seul depuis des photos du produit, ajoute ta clé gratuite dans Paramètres → Lecture d\'étiquette.')}
      </p>
    );
  }

  return (
    <div className="label-scan">
      <label className={`btn btn-secondary label-scan-btn ${loading ? 'disabled' : ''}`}>
        {loading ? ti('⏳ Analyse en cours...') : ti('📷 Photos du produit (IA)')}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={loading}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
      <p className="label-scan-tip">
        {t('Jusqu\'à 3 photos : le produit sur la balance, et son étiquette ou son code-barres s\'il y en a. Sans étiquette, l\'IA estime les calories d\'après l\'image.')}
      </p>
      {message && <p className={`label-scan-message ${message.kind}`}>{message.text}</p>}
    </div>
  );
}
