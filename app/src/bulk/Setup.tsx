import { useState } from 'react';
import { t } from '../i18n';
import { getGoals, saveGoals, validGoals } from './store';
import { getActiveKey, getProvider, setProvider, setApiKey, setOpenRouterKey, type Provider } from './ai';
import { GooglePanel } from './GooglePanel';
import { SetupProgress } from '../components/SetupProgress';

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
    <h1>{t('Tes réglages')}</h1>
    <SetupProgress step={step} labels={[t('Objectifs'), t('Assistant IA'), 'Google Sheets']} />
    {step === 1 && <section className="bulk-panel setup-card">
      <div className="setup-plan">
        <label><span>{t('Calories')}</span><input type="number" min="1" aria-label={t('Calories par jour')} value={kcal} onChange={e => setKcal(e.target.value)} /><small>{t('kcal / jour')}</small></label>
        <label><span>{t('Protéines')}</span><input type="number" min="1" aria-label={t('Protéines par jour (g)')} value={protein} onChange={e => setProtein(e.target.value)} /><small>{t('g / jour')}</small></label>
      </div>
      <button className="btn btn-primary setup-next" onClick={() => {
        const goals = { ...getGoals(), kcal: Number(kcal), protein: Number(protein) };
        if (!validGoals(goals)) { setError(t('Entre des objectifs positifs.')); return; }
        try { saveGoals(goals); setError(''); setStep(2); } catch { setError(t('Enregistrement impossible. Réessaie.')); }
      }}>{t('Continuer')}</button>
    </section>}
    {step === 2 && <section className="bulk-panel setup-card">
      <p className="setup-lead">{t('Facultatif : l’IA lit tes textes et tes photos.')}</p>
      <div className="setup-toggle">{(['gemini', 'openrouter'] as const).map(p => <button key={p} aria-pressed={provider === p} onClick={() => { try { setProvider(p); chooseProvider(p); setHasKey(!!getActiveKey()); setKey(''); setError(''); } catch { setError(t('Enregistrement impossible. Réessaie.')); } }}>{p === 'gemini' ? 'Gemini' : 'OpenRouter'}</button>)}</div>
      {!hasKey ? <div className="setup-key">
        <label><span>{t('Clé personnelle')}</span><input type="password" value={key} onChange={e => setKey(e.target.value)} autoComplete="off" /></label>
        <div className="setup-key-actions">
          <a href={provider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://openrouter.ai/settings/keys'} target="_blank" rel="noopener noreferrer">{t('Créer une clé')}</a>
          <button className="btn btn-secondary" disabled={!key.trim()} onClick={() => { try { if (provider === 'gemini') setApiKey(key); else setOpenRouterKey(key); setKey(''); setHasKey(true); } catch { setError(t('Enregistrement impossible. Réessaie.')); } }}>{t('Enregistrer la clé')}</button>
        </div>
      </div> : <p className="setup-badge">{t('Clé enregistrée')}</p>}
      <div className="setup-actions"><button className="back-btn" onClick={() => setStep(1)}>{t('Retour')}</button><button className="btn btn-primary" onClick={() => { setError(''); setStep(3); }}>{hasKey ? t('Continuer') : t('Commencer en saisie manuelle')}</button></div>
    </section>}
    {step === 3 && <>
      <GooglePanel compact />
      <div className="setup-actions"><button className="back-btn" onClick={() => setStep(2)}>{t('Retour')}</button><button className="btn btn-primary" onClick={finish}>{t('Ouvrir mon journal')}</button></div>
    </>}
    {onSettings && <button className="back-btn setup-cancel" onClick={onSettings}>{t('Réglages')}</button>}
    {error && <p className="bulk-error" role="alert">{error}</p>}
  </div>;
}
