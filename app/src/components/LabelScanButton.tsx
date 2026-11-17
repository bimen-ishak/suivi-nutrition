import { useEffect, useMemo, useState } from 'react';
import { compressPhoto } from '../utils/photo';
import { LabelReadError, type LabelResult } from '../utils/labelReader';
import { getActiveKey, getProvider, analysePhotos } from '../utils/aiReader';
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
const MAX_NOTES = 500;

const describe = (result: LabelResult, fromText = false): string => {
  const parts: string[] = [];
  if (fromText) {
    parts.push(t('Estimation faite d’après ta description, donc approximative.'));
  } else if (result.estimated) {
    parts.push(t("Pas d'étiquette lisible : estimation faite d'après l'image, donc approximative."));
  } else {
    parts.push(t("Valeurs lues sur l'étiquette."));
  }
  if (result.weight !== undefined) {
    parts.push(`${result.estimated ? t('Poids estimé') : t('Poids lu sur la balance')} : ${result.weight} ${unitLabel(result.unit)}.`);
  }
  if (result.sodiumEstimated && result.potassiumEstimated) parts.push(t('Sodium et potassium estimés par l\'IA.'));
  else if (result.potassiumEstimated) parts.push(t('Potassium estimé par l\'IA.'));
  else if (result.sodiumEstimated) parts.push(t('Sodium estimé par l\'IA.'));
  if (result.barcode) parts.push(t('Code-barres trouvé : {code}.', { code: result.barcode }));
  parts.push(t("Vérifie avant d'enregistrer."));
  return parts.join(' ');
};

export function LabelScanButton({ onRead }: LabelScanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<File[]>([]);
  // Ce que la photo ne montre pas (huile, sauce, part mangée…) : envoyé à l'IA avec les photos
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const providerName = getProvider() === 'openrouter' ? t('OpenRouter et le fournisseur du modèle') : 'Google Gemini';
  const hasKey = getActiveKey() !== null;

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

  const description = notes.trim().slice(0, MAX_NOTES);
  const canSend = pending.length > 0 || description.length > 0;

  const analyse = async () => {
    const key = getActiveKey();
    if (!canSend || !key) return;

    setLoading(true);
    setMessage(null);
    try {
      const images = await Promise.all(pending.map(file => compressPhoto(file, PHOTO_SIZE, PHOTO_QUALITY)));
      const result = await analysePhotos(images, description);
      onRead(result);
      setPending([]);
      setNotes('');
      setMessage({ kind: 'ok', text: describe(result, images.length === 0) });
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
      {/* Décrire suffit ; une photo est facultative */}
      <label className="label-scan-notes">
        <span>{t('Décris ton repas à l’IA')}</span>
        <textarea
          rows={3}
          maxLength={MAX_NOTES}
          disabled={loading}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={t('Ex : 200 g de riz, un blanc de poulet grillé, 1 cuillère d’huile d’olive')}
        />
      </label>

      {pending.length > 0 && (
        <div className="label-scan-pending">
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
        </div>
      )}

      <div className="label-scan-actions">
        {canAddMore && (
          <label className={`btn btn-secondary label-scan-btn ${loading ? 'disabled' : ''}`}>
            {pending.length === 0 ? ti('📷 Ajouter une photo') : ti('📷 Une autre photo')}
            {fileInput}
          </label>
        )}
        <button type="button" className="btn btn-primary" disabled={loading || !canSend} onClick={analyse}>
          {loading ? ti('⏳ Analyse en cours...') : ti('✨ Analyser')}
        </button>
      </div>

      <p className="label-scan-tip">
        {t('Écris ce que tu as mangé, ajoute jusqu’à 3 photos (produit sur la balance, étiquette), ou les deux. Rien n’est envoyé à {provider} avant d’appuyer sur « Analyser ». Une connexion Internet est nécessaire.', { provider: providerName })}
      </p>
      {message && <p className={`label-scan-message ${message.kind}`}>{message.text}</p>}
    </div>
  );
}
