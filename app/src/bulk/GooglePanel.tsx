import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { connectGoogle, createHistorySheet, disconnectGoogle, getHistorySheet, googleConfigured, googleConnected } from './googleSheets';

export function GooglePanel({ onChange, compact = false }: { onChange?: () => void; compact?: boolean }) {
  const [sheet, setSheet] = useState(getHistorySheet);
  const [connected, setConnected] = useState(googleConnected);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const update = () => { setSheet(getHistorySheet()); setConnected(googleConnected()); };
    window.addEventListener('bulk-google-state', update);
    return () => window.removeEventListener('bulk-google-state', update);
  }, []);
  // Pendant les réglages de départ : une phrase courte, sans le détail
  if (compact && !googleConfigured()) return <section className="bulk-panel setup-card">
    <p className="setup-lead">{t('Google Sheets arrive bientôt. Tu peux passer cette étape.')}</p>
    <button className="btn btn-secondary" disabled>{t('Connecter Google et créer mon fichier')}</button>
  </section>;
  return <section className="bulk-panel">
    <div className="bulk-section-head"><h2>Google Sheets</h2><span className="bulk-status">{connected ? t('Google connecté') : t('Google non connecté')}</span></div>
    {!compact && <p className="bulk-muted">{t('Ton journal reste dans l’application. Google Sheets reçoit une copie quand tu envoies une journée. Un nouveau fichier sera créé pour toi ; ton ancien historique reste intact.')}</p>}
    {sheet && <p><a href={sheet.url} target="_blank" rel="noopener noreferrer">{t('Ouvrir mon nouveau tableau')}</a></p>}
    {!googleConfigured() && <p className="bulk-notice">{t('Le raccordement Google de cette application doit encore être activé. Tu peux déjà enregistrer tes repas, faire une sauvegarde et exporter ton historique.')}</p>}
    <div className="bulk-inline">
      <button className="btn btn-secondary" disabled={!googleConfigured() || busy} onClick={async () => {
        setBusy(true); setError('');
        try { await connectGoogle(); if (!getHistorySheet()) await createHistorySheet(); onChange?.(); }
        catch (e) { setError(e instanceof Error ? e.message : t('Connexion Google indisponible. Réessaie avec Internet.')); }
        finally { setBusy(false); }
      }}>{busy ? t('Connexion en cours…') : sheet ? t('Reconnecter Google') : t('Connecter Google et créer mon fichier')}</button>
      {connected && <button className="back-btn" onClick={() => { disconnectGoogle(); onChange?.(); }}>{t('Déconnecter Google')}</button>}
    </div>
    {error && <p role="alert" className="bulk-error">{error}</p>}
  </section>;
}
