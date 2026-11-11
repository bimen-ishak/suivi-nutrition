// Questionnaire de la sèche : 3 étapes pour adapter calories et macros à la personne
import { useEffect, useState } from 'react';
import { t, unitLabel } from '../i18n';
import { getWeightsSince } from '../db';
import { setObjective } from '../utils/objective';
import {
  PACE_DEFICITS, estimatedExpenditure, getProfile, macroTargets, saveProfile, validProfile,
  type Activity, type CutProfile, type Pace, type Sex
} from '../utils/profile';

const ACTIVITIES: { id: Activity; label: string; hint: string }[] = [
  { id: 'sedentary', label: 'Sédentaire', hint: 'Travail assis, peu de marche, pas de sport.' },
  { id: 'light', label: 'Un peu actif', hint: 'Marche régulière ou sport 1 à 2 fois par semaine.' },
  { id: 'moderate', label: 'Sportif', hint: 'Sport 3 à 5 fois par semaine.' },
  { id: 'very', label: 'Très actif', hint: 'Sport presque tous les jours ou travail physique.' }
];

const PACES: { id: Pace; label: string; hint: string }[] = [
  { id: 'gentle', label: 'Doux', hint: 'Environ 300 kcal de déficit par jour. Plus facile à tenir.' },
  { id: 'normal', label: 'Normal', hint: 'Environ 500 kcal de déficit par jour. Le repère courant.' },
  { id: 'fast', label: 'Rapide', hint: 'Environ 750 kcal de déficit par jour. Plus dur, à surveiller.' }
];

export function CutSetup({ onComplete, onCancel }: { onComplete: () => void; onCancel?: () => void }) {
  const saved = getProfile();
  const [step, setStep] = useState(1);
  const [sex, setSex] = useState<Sex | null>(saved?.sex ?? null);
  const [age, setAge] = useState(saved ? String(saved.age) : '');
  const [height, setHeight] = useState(saved ? String(saved.height) : '');
  const [weight, setWeight] = useState(saved ? String(saved.weight) : '');
  const [activity, setActivity] = useState<Activity>(saved?.activity ?? 'light');
  const [pace, setPace] = useState<Pace>(saved?.pace ?? 'normal');
  const [error, setError] = useState('');

  // Le dernier poids noté dans l'app pré-remplit le champ
  useEffect(() => {
    if (saved) return;
    const since = new Date(Date.now() - 60 * 86_400_000).toISOString().split('T')[0];
    getWeightsSince(since)
      .then(points => {
        const latest = [...points].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
        if (latest) setWeight(current => current || String(latest.weight));
      })
      .catch(() => undefined);
  }, []);

  const profile: CutProfile | null = sex
    ? { sex, age: Number(age), height: Number(height), weight: Number(weight.replace(',', '.')), activity, pace }
    : null;

  const checkStepOne = () => {
    if (!profile || !validProfile(profile)) {
      setError(t('Vérifie tes réponses : âge entre 15 et 100 ans, taille en cm, poids en kg.'));
      return;
    }
    setError('');
    setStep(2);
  };

  const finish = () => {
    if (!profile || !validProfile(profile)) return;
    try {
      saveProfile(profile);
      setObjective(PACE_DEFICITS[profile.pace]);
      onComplete();
    } catch {
      setError(t('Enregistrement impossible. Réessaie.'));
    }
  };

  const expenditure = profile && validProfile(profile) ? estimatedExpenditure(profile) : null;
  const budget = expenditure !== null ? Math.max(expenditure + PACE_DEFICITS[pace], 0) : null;
  const targets = profile && budget !== null ? macroTargets(profile.weight, budget) : null;

  return (
    <div className="bulk-page bulk-setup cut-setup">
      <p className="bulk-eyebrow">{t('TA SÈCHE, À TA MESURE')}</p>
      <h1>{t('Quelques questions pour calculer tes objectifs.')}</h1>
      <p className="bulk-muted">{t('Tes réponses restent sur ce téléphone. Tu pourras les changer dans les réglages.')}</p>
      <ol className="bulk-steps">
        <li aria-current={step === 1 ? 'step' : undefined}>{t('Toi')}</li>
        <li aria-current={step === 2 ? 'step' : undefined}>{t('Ton activité')}</li>
        <li aria-current={step === 3 ? 'step' : undefined}>{t('Ton rythme')}</li>
      </ol>

      {step === 1 && (
        <section className="bulk-panel">
          <h2>{t('Toi')}</h2>
          <div className="bulk-tabs" role="group" aria-label={t('Sexe')}>
            <button aria-pressed={sex === 'male'} onClick={() => setSex('male')}>{t('Homme')}</button>
            <button aria-pressed={sex === 'female'} onClick={() => setSex('female')}>{t('Femme')}</button>
          </div>
          <div className="bulk-number-grid cut-setup-grid">
            <label>{t('Âge')}<input type="number" inputMode="numeric" min="15" max="100" value={age} onChange={e => setAge(e.target.value)} /></label>
            <label>{t('Taille (cm)')}<input type="number" inputMode="numeric" min="120" max="230" value={height} onChange={e => setHeight(e.target.value)} /></label>
            <label>{t('Poids (kg)')}<input type="number" inputMode="decimal" step="0.1" min="35" max="300" value={weight} onChange={e => setWeight(e.target.value)} /></label>
          </div>
          <button className="btn btn-primary" disabled={!sex || !age || !height || !weight} onClick={checkStepOne}>{t('Continuer')}</button>
        </section>
      )}

      {step === 2 && (
        <section className="bulk-panel">
          <h2>{t('Ton activité')}</h2>
          <div className="cut-setup-choices">
            {ACTIVITIES.map(option => (
              <button key={option.id} className="cut-setup-choice" aria-pressed={activity === option.id} onClick={() => setActivity(option.id)}>
                <strong>{t(option.label)}</strong>
                <span>{t(option.hint)}</span>
              </button>
            ))}
          </div>
          <div className="bulk-inline">
            <button className="back-btn" onClick={() => setStep(1)}>{t('Retour')}</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>{t('Continuer')}</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="bulk-panel">
          <h2>{t('Ton rythme')}</h2>
          <div className="cut-setup-choices">
            {PACES.map(option => (
              <button key={option.id} className="cut-setup-choice" aria-pressed={pace === option.id} onClick={() => setPace(option.id)}>
                <strong>{t(option.label)}</strong>
                <span>{t(option.hint)}</span>
              </button>
            ))}
          </div>
          {expenditure !== null && budget !== null && targets && (
            <div className="cut-setup-result">
              <p>{t('Dépense estimée : {n} kcal par jour.', { n: expenditure })}</p>
              <dl>
                <div><dt>{t('Calories')}</dt><dd>{budget} <small>{unitLabel('kcal')}</small></dd></div>
                <div><dt>{t('Protéines')}</dt><dd>{targets.protein} <small>{unitLabel('g')}</small></dd></div>
                <div><dt>{t('Lipides')}</dt><dd>{targets.fat} <small>{unitLabel('g')}</small></dd></div>
                <div><dt>{t('Glucides')}</dt><dd>{targets.carbs} <small>{unitLabel('g')}</small></dd></div>
              </dl>
              <p className="bulk-muted">
                {t('Si tu importes ta dépense depuis Santé ou la saisis à la main, ce chiffre réel remplace l’estimation.')}
                {' '}{t('Ce sont des repères généraux, pas un avis médical.')}
              </p>
            </div>
          )}
          <div className="bulk-inline">
            <button className="back-btn" onClick={() => setStep(2)}>{t('Retour')}</button>
            <button className="btn btn-primary" onClick={finish}>{t('C’est parti')}</button>
          </div>
        </section>
      )}

      {onCancel && <button className="back-btn" onClick={onCancel}>{t('Annuler')}</button>}
      {error && <p className="bulk-error" role="alert">{error}</p>}
    </div>
  );
}
