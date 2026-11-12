import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { connectGoogle, createHistorySheet, disconnectGoogle, getHistorySheet, googleConfigured, googleConnected, linkHistorySheet } from './googleSheets';

export function GooglePanel({ onChange, compact = false }: { onChange?: () => void; compact?: boolean }) {
  const [sheet, setSheet] = useState(getHistorySheet);
  const [connected, setConnected] = useState(googleConnected);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [link, setLink] = useState('');
  useEffect(() => {
    const update = () => { setSheet(getHistorySheet()); setConnected(googleConnected()); };
    window.addEventListener('bulk-google-state', update);
    return () => window.removeEventListener('bulk-google-state', update);
  }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Connexion Google indisponible. Réessaie avec Internet.'));
    } finally {
      setBusy(false);
    }
  }
  // Pendant les réglages de départ : une phrase courte, sans le détail
  if (compact && !googleConfigured()) return <section className="bulk-panel setup-card">
    <p className="setup-lead">{t('Google Sheets arrive bientôt. Tu peux passer cette étape.')}</p>
    <button className="btn btn-secondary" disabled>{t('Connecter Google et créer mon fichier')}</button>
  </section>;
  return <section className="bulk-panel">
    <div className="bulk-section-head"><h2>Google Sheets</h2><span className="bulk-status">{connected ? t('Google connecté') : t('Google non connecté')}</span></div>
    {!compact && <p className="bulk-muted">{t('Ton journal reste dans l’application. Google Sheets reçoit une copie quand tu envoies une journée.')}</p>}
    {sheet && <p><a href={sheet.url} target="_blank" rel="noopener noreferrer">{t('Ouvrir mon tableau')}</a></p>}
    {!googleConfigured() && <p className="bulk-notice">{t('Le raccordement Google de cette application doit encore être activé. Tu peux déjà enregistrer tes repas, faire une sauvegarde et exporter ton historique.')}</p>}
    <div className="bulk-inline">
      <button className="btn btn-secondary" disabled={!googleConfigured() || busy} onClick={() => run(async () => {
        await connectGoogle();
        if (!getHistorySheet()) await createHistorySheet();
      })}>{sheet ? t('Reconnecter Google') : t('Connecter Google et créer mon fichier')}</button>
      {googleConfigured() && <button className="btn btn-secondary" type="button" disabled={busy} aria-expanded={showLink} onClick={() => {
        setShowLink(!showLink);
        setError('');
      }}>{t('Utiliser mon tableau existant')}</button>}
      {connected && <button className="back-btn" disabled={busy} onClick={() => { disconnectGoogle(); onChange?.(); }}>{t('Déconnecter Google')}</button>}
    </div>
    {showLink && <form className="bulk-fields" onSubmit={event => {
      event.preventDefault();
      void run(async () => {
        await linkHistorySheet(link);
        setShowLink(false);
        setLink('');
      });
    }}>
      <label>{t('Lien de mon tableau KOUL')}
        <input type="url" dir="ltr" autoCapitalize="none" autoComplete="off" spellCheck={false} required disabled={busy} value={link} onChange={event => setLink(event.target.value)} />
      </label>
      <p className="bulk-muted">{t('Colle le lien d’un tableau créé par KOUL et utilise le même compte Google.')}</p>
      <button type="submit" className="btn btn-secondary" disabled={busy || !link.trim()}>{t('Associer ce tableau')}</button>
    </form>}
    {busy && <p role="status" className="bulk-muted">{t('Connexion en cours…')}</p>}
    {error && <p role="alert" className="bulk-error">{error}</p>}
  </section>;
}
