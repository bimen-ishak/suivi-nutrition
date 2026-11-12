import { useState } from 'react';
import { getGoals, saveGoals, validGoals } from '../bulk/store';
import { applyDirection, getLanguage, LANGUAGES, setLanguage, t } from '../i18n';
import type { NutritionMode } from '../utils/nutritionMode';
import { getObjective, setObjective } from '../utils/objective';

export function WelcomeSetup({ initialMode, onComplete }: {
  initialMode: NutritionMode;
  onComplete: (mode: NutritionMode) => void;
}) {
  const [language, setSelectedLanguage] = useState(getLanguage);
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState<'preferences' | 'goals'>('preferences');
  const [kcal, setKcal] = useState(() => String(getGoals().kcal));
  const [protein, setProtein] = useState(() => String(getGoals().protein));
  const [objective, setObjectiveInput] = useState(() => String(getObjective()));
  const [error, setError] = useState('');

  return <main className="bulk-page bulk-setup welcome-setup">
    <h1>{step === 'preferences' ? t('Bienvenue dans KOUL') : t('Objectifs quotidiens')}</h1>
    {step === 'preferences' ? (
      <section className="bulk-panel setup-card">
        <h2>{t('Langue')}</h2>
        <div className="profile-switch" role="group" aria-label={t('Langue')}>
          {LANGUAGES.map(option => (
            <button type="button" key={option.id} aria-pressed={language === option.id} onClick={() => {
              try {
                setLanguage(option.id);
                applyDirection();
                setSelectedLanguage(option.id);
                setError('');
              } catch { setError(t('Enregistrement impossible. Réessaie.')); }
            }}>{option.label}</button>
          ))}
        </div>
        <h2>{t('Mode de suivi')}</h2>
        <div className="profile-switch" role="group" aria-label={t('Choisir ton espace')}>
          <button type="button" aria-pressed={mode === 'cut'} onClick={() => setMode('cut')}>{t('Sèche')}</button>
          <button type="button" aria-pressed={mode === 'bulk'} onClick={() => setMode('bulk')}>{t('Prise de masse')}</button>
        </div>
        <button className="btn btn-primary setup-next" onClick={() => { setError(''); setStep('goals'); }}>{t('Continuer')}</button>
      </section>
    ) : (
      <form className="bulk-panel setup-card" onSubmit={event => {
        event.preventDefault();
        const goals = { ...getGoals(), kcal: Number(kcal), protein: Number(protein) };
        const deficit = Number(objective);
        if (mode === 'bulk' && !validGoals(goals)) {
          setError(t('Entre des objectifs positifs.'));
          return;
        }
        if (mode === 'cut' && (!objective.trim() || !Number.isSafeInteger(deficit))) {
          setError(t('Entre un objectif calorique valide.'));
          return;
        }
        try {
          if (mode === 'bulk') saveGoals(goals);
          else setObjective(deficit);
          localStorage.setItem('bulkSetupComplete', '1');
          onComplete(mode);
        } catch { setError(t('Enregistrement impossible. Réessaie.')); }
      }}>
        <p>{t('Tu peux modifier tes objectifs plus tard dans les réglages.')}</p>
        {mode === 'bulk' ? (
          <div className="bulk-number-grid">
            <label>{t('Calories par jour')}<input type="number" min="1" step="any" required value={kcal} onChange={e => setKcal(e.target.value)} /></label>
            <label>{t('Protéines par jour (g)')}<input type="number" min="1" step="any" required value={protein} onChange={e => setProtein(e.target.value)} /></label>
          </div>
        ) : (
          <label>{t('Déficit calorique quotidien souhaité (en kcal, négatif = déficit).')}
            <input type="number" step="1" required value={objective} onChange={e => setObjectiveInput(e.target.value)} />
          </label>
        )}
        <div className="setup-actions">
          <button className="back-btn" type="button" onClick={() => { setError(''); setStep('preferences'); }}>{t('Retour')}</button>
          <button className="btn btn-primary" type="submit">{t('Ouvrir mon journal')}</button>
        </div>
      </form>
    )}
    {error && <p className="bulk-error" role="alert">{error}</p>}
  </main>;
}
