// Questionnaire de la sèche : le corps, le déficit voulu, puis un plan « manger / brûler » modifiable
import { useEffect, useState } from 'react';
import { t, unitLabel } from '../i18n';
import { getWeightsSince } from '../db';
import { setObjective } from '../utils/objective';
import { SetupProgress } from './SetupProgress';
import {
  DEFICIT_PRESETS, basalMetabolism, macroTargets, proposePlan, saveProfile, validBody, validPlan,
  type Sex
} from '../utils/profile';

// Réponses déjà données, même d'une ancienne version du questionnaire, pour pré-remplir
function previousAnswers(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem('cutProfile');
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

const asText = (value: unknown) => (typeof value === 'number' ? String(value) : '');

export function CutSetup({ onComplete, onCancel }: { onComplete: () => void; onCancel?: () => void }) {
  const [saved] = useState(previousAnswers);
  const [step, setStep] = useState(1);
  const [sex, setSex] = useState<Sex | null>(saved.sex === 'male' || saved.sex === 'female' ? saved.sex : null);
  const [age, setAge] = useState(asText(saved.age));
  const [height, setHeight] = useState(asText(saved.height));
  const [weight, setWeight] = useState(asText(saved.weight));
  const savedDeficit = typeof saved.eat === 'number' && typeof saved.burn === 'number' ? saved.burn - saved.eat : 500;
  const [deficit, setDeficit] = useState(String(savedDeficit));
  const [eat, setEat] = useState(asText(saved.eat));
  const [burn, setBurn] = useState(asText(saved.burn));
  const [error, setError] = useState('');

  // Le dernier poids noté dans l'app pré-remplit le champ
  useEffect(() => {
    if (saved.weight) return;
    const since = new Date(Date.now() - 60 * 86_400_000).toISOString().split('T')[0];
    getWeightsSince(since)
      .then(points => {
        const latest = [...points].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
        if (latest) setWeight(current => current || String(latest.weight));
      })
      .catch(() => undefined);
  }, []);

  const body = sex
    ? { sex, age: Number(age), height: Number(height), weight: Number(weight.replace(',', '.')) }
    : null;
  const bmr = body && validBody(body) ? basalMetabolism(body) : null;
  const eatValue = Number(eat);
  const burnValue = Number(burn);
  const planDeficit = burnValue - eatValue;
  const planReady = bmr !== null && validPlan(eatValue, burnValue);

  const checkBody = () => {
    if (!body || !validBody(body)) {
      setError(t('Vérifie tes réponses : âge entre 15 et 100 ans, taille en cm, poids en kg.'));
      return;
    }
    setError('');
    setStep(2);
  };

  // Le déficit choisi donne une proposition, que la personne peut ensuite ajuster
  const checkDeficit = () => {
    const value = Number(deficit);
    if (bmr === null || !Number.isFinite(value) || value < 0 || value > 1500) {
      setError(t('Choisis un déficit entre 0 et 1500 kcal.'));
      return;
    }
    const plan = proposePlan(bmr, Math.round(value));
    setEat(String(plan.eat));
    setBurn(String(plan.burn));
    setError('');
    setStep(3);
  };

  const finish = () => {
    if (!body || !planReady) {
      setError(t('Vérifie ton plan : entre 800 et 6000 kcal à manger, et au moins 800 kcal à brûler.'));
      return;
    }
    try {
      saveProfile({ ...body, eat: eatValue, burn: burnValue });
      setObjective(eatValue - burnValue);
      onComplete();
    } catch {
      setError(t('Enregistrement impossible. Réessaie.'));
    }
  };

  const targets = body && planReady ? macroTargets(body.weight, eatValue) : null;

  return (
    <div className="bulk-page bulk-setup cut-setup">
      <h1>{t('Calculons tes objectifs')}</h1>
      <SetupProgress step={step} labels={[t('Toi'), t('Ta sèche'), t('Ton plan')]} />

      {step === 1 && (
        <section className="bulk-panel setup-card">
          <div className="setup-toggle" role="group" aria-label={t('Sexe')}>
            <button aria-pressed={sex === 'male'} onClick={() => setSex('male')}>{t('Homme')}</button>
            <button aria-pressed={sex === 'female'} onClick={() => setSex('female')}>{t('Femme')}</button>
          </div>
          <div className="setup-fields">
            <label><span>{t('Âge')}</span><input type="number" inputMode="numeric" min="15" max="100" placeholder="25" value={age} onChange={e => setAge(e.target.value)} /><small>{t('ans')}</small></label>
            <label><span>{t('Taille')}</span><input type="number" inputMode="numeric" min="120" max="230" placeholder="175" value={height} onChange={e => setHeight(e.target.value)} /><small>{t('cm')}</small></label>
            <label><span>{t('Poids')}</span><input type="number" inputMode="decimal" step="0.1" min="35" max="300" placeholder="75" value={weight} onChange={e => setWeight(e.target.value)} /><small>{unitLabel('kg')}</small></label>
          </div>
          <button className="btn btn-primary setup-next" disabled={!sex || !age || !height || !weight} onClick={checkBody}>{t('Continuer')}</button>
        </section>
      )}

      {step === 2 && bmr !== null && (
        <section className="bulk-panel setup-card">
          <div className="setup-figure">
            <span>{t('Métabolisme de base')}</span>
            <strong>{bmr} <small>{unitLabel('kcal')}</small></strong>
            <em>{t('brûlées au repos, chaque jour')}</em>
          </div>
          <label className="setup-question">
            <span>{t('Ton déficit par jour')}</span>
            <input type="number" inputMode="numeric" min="0" max="1500" step="50" value={deficit} onChange={e => setDeficit(e.target.value)} />
          </label>
          <div className="setup-chips">
            {DEFICIT_PRESETS.map(preset => (
              <button key={preset} aria-pressed={Number(deficit) === preset} onClick={() => setDeficit(String(preset))}>{preset}</button>
            ))}
          </div>
          <div className="setup-actions">
            <button className="back-btn" onClick={() => setStep(1)}>{t('Retour')}</button>
            <button className="btn btn-primary" onClick={checkDeficit}>{t('Continuer')}</button>
          </div>
        </section>
      )}

      {step === 3 && bmr !== null && (
        <section className="bulk-panel setup-card">
          <div className="setup-plan">
            <label><span>{t('Manger')}</span><input type="number" inputMode="numeric" step="50" value={eat} onChange={e => setEat(e.target.value)} /><small>{t('kcal / jour')}</small></label>
            <label><span>{t('Brûler')}</span><input type="number" inputMode="numeric" step="50" value={burn} onChange={e => setBurn(e.target.value)} /><small>{t('kcal / jour')}</small></label>
          </div>
          {planReady && (
            <>
              <p className={`setup-badge${planDeficit > 0 ? '' : ' is-off'}`}>
                {planDeficit > 0 ? t('Déficit de {n} kcal', { n: planDeficit }) : t('Pas de déficit')}
              </p>
              {eatValue < bmr && <p className="setup-warning">{t('Sous ton métabolisme de base : déconseillé.')}</p>}
              {targets && (
                <div className="setup-macros">
                  <div><strong>{targets.protein}{unitLabel('g')}</strong><span>{t('Protéines')}</span></div>
                  <div><strong>{targets.carbs}{unitLabel('g')}</strong><span>{t('Glucides')}</span></div>
                  <div><strong>{targets.fat}{unitLabel('g')}</strong><span>{t('Lipides')}</span></div>
                </div>
              )}
            </>
          )}
          <div className="setup-actions">
            <button className="back-btn" onClick={() => setStep(2)}>{t('Retour')}</button>
            <button className="btn btn-primary" disabled={!planReady} onClick={finish}>{t('C’est parti')}</button>
          </div>
          <p className="setup-footnote">{t('Repères généraux, pas un avis médical.')}</p>
        </section>
      )}

      {onCancel && <button className="back-btn setup-cancel" onClick={onCancel}>{t('Annuler')}</button>}
      {error && <p className="bulk-error" role="alert">{error}</p>}
    </div>
  );
}
