import { useEffect, useMemo, useState } from 'react';
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
  const [pending, setPending] = useState<File[]>([]);
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const hasKey = getApiKey() !== null;

  const previews = useMemo(() => pending.map(file => URL.createObjectURL(file)), [pending]);
  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);

  // Une photo choisie n'est jamais envoyée toute seule : on la met d'abord en attente
  const addFiles = (files: FileList | null) => {
    const added = Array.from(files ?? []);
    if (added.length === 0) return;
    setMessage(null);
    setPending(current => [...current, ...added].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (index: number) => {
    setPending(current => current.filter((_, i) => i !== index));
  };

  const analyse = async () => {
    const key = getApiKey();
    if (pending.length === 0 || !key) return;

    setLoading(true);
    setMessage(null);
    try {
      const images = await Promise.all(pending.map(file => compressPhoto(file, PHOTO_SIZE, PHOTO_QUALITY)));
      const result = await readFoodPhotos(images, key);
      onRead(result);
      setPending([]);
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

  const canAddMore = pending.length < MAX_PHOTOS;
  const fileInput = (
    <input
      type="file"
      accept="image/*"
      multiple
      disabled={loading}
      onChange={(e) => {
        addFiles(e.target.files);
        e.target.value = '';
      }}
    />
  );

  return (
    <div className="label-scan">
      {pending.length === 0 ? (
        <>
          <label className={`btn btn-secondary label-scan-btn ${loading ? 'disabled' : ''}`}>
            {ti('📷 Photos du produit (IA)')}
            {fileInput}
          </label>
          <p className="label-scan-tip">
            {t('Jusqu\'à 3 photos : le produit sur la balance, et son étiquette ou son code-barres s\'il y en a. Sans étiquette, l\'IA estime les calories d\'après l\'image.')}
          </p>
        </>
      ) : (
        <div className="label-scan-pending">
          <p className="label-scan-ask">
            {canAddMore
              ? t('{n} photo prête sur {max}. Veux-tu en prendre une autre avant d\'envoyer ?', { n: pending.length, max: MAX_PHOTOS })
              : t('{n} photos prêtes (maximum). Tu peux envoyer.', { n: pending.length })}
          </p>
          <div className="label-scan-thumbs">
            {previews.map((url, index) => (
              <div key={url} className="label-scan-thumb">
                <img src={url} alt="" />
                {!loading && (
                  <button type="button" className="label-scan-remove" aria-label={t('Retirer')} onClick={() => removePhoto(index)}>×</button>
                )}
              </div>
            ))}
          </div>
          {canAddMore && (
            <label className={`btn btn-secondary label-scan-btn ${loading ? 'disabled' : ''}`}>
              {ti('📷 Prendre une autre photo')}
              {fileInput}
            </label>
          )}
          <button type="button" className="btn btn-primary" disabled={loading} onClick={analyse}>
            {loading ? ti('⏳ Analyse en cours...') : ti('✨ Envoyer pour analyse')}
          </button>
        </div>
      )}
      {message && <p className={`label-scan-message ${message.kind}`}>{message.text}</p>}
    </div>
  );
}
