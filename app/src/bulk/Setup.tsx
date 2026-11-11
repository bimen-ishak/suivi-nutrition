import { useState } from 'react';
import { t } from '../i18n';
import { getGoals, saveGoals, validGoals } from './store';
import { getActiveKey, getProvider, setProvider, setApiKey, setOpenRouterKey, type Provider } from './ai';
import { GooglePanel } from './GooglePanel';

export function Setup({ onComplete, onSettings }: { onComplete: () => void; onSettings?: () => void }) {
  const [step, setStep] = useState(1);
  const [kcal, setKcal] = useState(String(getGoals().kcal));
  const [protein, setProtein] = useState(String(getGoals().protein));
  const [provider, chooseProvider] = useState<Provider>(getProvider());
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(() => !!getActiveKey());
  const [error, setError] = useState('');
  const finish = () => {
    try { localStorage.setItem('bulkSetupComplete', '1'); onComplete(); }
    catch { setError(t('Enregistrement impossible. Réessaie.')); }
  };
  return <div className="bulk-page bulk-setup">
    <p className="bulk-eyebrow">{t('TON JOURNAL, À TA FAÇON')}</p>
    <h1>{t('Quelques réglages, puis c’est parti.')}</h1>
    <p className="bulk-muted">{t('Écris comme tu parles. Ajoute une photo si tu veux. Tu valides toujours avant l’enregistrement.')}</p>
    <ol className="bulk-steps"><li aria-current={step === 1 ? 'step' : undefined}>{t('Objectifs')}</li><li aria-current={step === 2 ? 'step' : undefined}>{t('Intelligence artificielle')}</li><li aria-current={step === 3 ? 'step' : undefined}>Google Sheets</li></ol>
    {step === 1 && <section className="bulk-panel"><h2>{t('Tes objectifs')}</h2><div className="bulk-number-grid"><label>{t('Calories par jour')}<input type="number" min="1" value={kcal} onChange={e => setKcal(e.target.value)} /></label><label>{t('Protéines par jour (g)')}<input type="number" min="1" value={protein} onChange={e => setProtein(e.target.value)} /></label></div><button className="btn btn-primary" onClick={() => {
      const goals = { ...getGoals(), kcal: Number(kcal), protein: Number(protein) };
      if (!validGoals(goals)) { setError(t('Entre des objectifs positifs.')); return; }
      try { saveGoals(goals); setError(''); setStep(2); } catch { setError(t('Enregistrement impossible. Réessaie.')); }
    }}>{t('Continuer')}</button></section>}
    {step === 2 && <section className="bulk-panel"><h2>{t('Choisis ton assistant')}</h2><p className="bulk-muted">{t('Gemini ou OpenRouter comprend tes textes et tes photos. Il faut la clé de ce service, même si tu utilises déjà son application de chat.')}</p><div className="bulk-tabs">{(['gemini', 'openrouter'] as const).map(p => <button key={p} aria-pressed={provider === p} onClick={() => { try { setProvider(p); chooseProvider(p); setHasKey(!!getActiveKey()); setKey(''); setError(''); } catch { setError(t('Enregistrement impossible. Réessaie.')); } }}>{p === 'gemini' ? 'Gemini' : 'OpenRouter'}</button>)}</div>
      {!hasKey ? <><label>{t('Clé personnelle')}<input type="password" value={key} onChange={e => setKey(e.target.value)} autoComplete="off" /></label><a href={provider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://openrouter.ai/settings/keys'} target="_blank" rel="noopener noreferrer">{t('Créer une clé chez le fournisseur')}</a><button className="btn btn-secondary" disabled={!key.trim()} onClick={() => { try { if (provider === 'gemini') setApiKey(key); else setOpenRouterKey(key); setKey(''); setHasKey(true); } catch { setError(t('Enregistrement impossible. Réessaie.')); } }}>{t('Enregistrer la clé')}</button></> : <p className="bulk-notice">{t('Clé enregistrée. Elle sera utilisée au premier envoi ; elle n’a pas encore été testée ici.')}</p>}
      <p className="bulk-muted">{t('Ton texte et les photos choisies partent au fournisseur seulement quand tu appuies sur Comprendre. Les tarifs et limites dépendent du service.')}</p>
      <div className="bulk-inline"><button className="back-btn" onClick={() => setStep(1)}>{t('Retour')}</button><button className="btn btn-primary" onClick={() => { setError(''); setStep(3); }}>{hasKey ? t('Continuer') : t('Commencer en saisie manuelle')}</button></div>
    </section>}
    {step === 3 && <><GooglePanel /><p className="bulk-muted">{t('Google est facultatif. Tes repas sont sauvegardés sur cet appareil avant toute synchronisation. Une copie JSON reste utile si tu changes d’appareil.')}</p><div className="bulk-inline"><button className="back-btn" onClick={() => setStep(2)}>{t('Retour')}</button><button className="btn btn-primary" onClick={finish}>{t('Ouvrir mon journal')}</button></div></>}
    {onSettings && <button className="back-btn" onClick={onSettings}>{t('Réglages')}</button>}
    {error && <p className="bulk-error" role="alert">{error}</p>}
  </div>;
}
