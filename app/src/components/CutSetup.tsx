// Questionnaire de la sèche : le corps, le déficit voulu, puis un plan « manger / brûler » modifiable
import { useEffect, useState } from 'react';
import { t, unitLabel } from '../i18n';
import { getWeightsSince } from '../db';
import { setObjective } from '../utils/objective';
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
      <p className="bulk-eyebrow">{t('TA SÈCHE, À TA MESURE')}</p>
      <h1>{t('Quelques questions pour calculer tes objectifs.')}</h1>
      <p className="bulk-muted">{t('Tes réponses restent sur ce téléphone. Tu pourras les changer dans les réglages.')}</p>
      <ol className="bulk-steps">
        <li aria-current={step === 1 ? 'step' : undefined}>{t('Toi')}</li>
        <li aria-current={step === 2 ? 'step' : undefined}>{t('Ta sèche')}</li>
        <li aria-current={step === 3 ? 'step' : undefined}>{t('Ton plan')}</li>
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
          <button className="btn btn-primary" disabled={!sex || !age || !height || !weight} onClick={checkBody}>{t('Continuer')}</button>
        </section>
      )}

      {step === 2 && bmr !== null && (
        <section className="bulk-panel">
          <h2>{t('Ta sèche')}</h2>
          <div className="cut-setup-result">
            <p>{t('Ton métabolisme de base : {n} kcal par jour.', { n: bmr })}</p>
            <p className="bulk-muted">{t('C’est ce que ton corps brûle au repos, sans bouger.')}</p>
          </div>
          <label className="cut-setup-field">
            {t('Tu veux être en sèche de combien de kcal par jour ?')}
            <input type="number" inputMode="numeric" min="0" max="1500" step="50" value={deficit} onChange={e => setDeficit(e.target.value)} />
          </label>
          <div className="bulk-tabs">
            {DEFICIT_PRESETS.map(preset => (
              <button key={preset} aria-pressed={Number(deficit) === preset} onClick={() => setDeficit(String(preset))}>{preset} {unitLabel('kcal')}</button>
            ))}
          </div>
          <div className="bulk-inline">
            <button className="back-btn" onClick={() => setStep(1)}>{t('Retour')}</button>
            <button className="btn btn-primary" onClick={checkDeficit}>{t('Continuer')}</button>
          </div>
        </section>
      )}

      {step === 3 && bmr !== null && (
        <section className="bulk-panel">
          <h2>{t('Ton plan')}</h2>
          <p className="bulk-muted">{t('Voici ce qu’on te propose. Tu peux changer les deux chiffres.')}</p>
          <div className="bulk-number-grid">
            <label>{t('À manger (kcal/jour)')}<input type="number" inputMode="numeric" step="50" value={eat} onChange={e => setEat(e.target.value)} /></label>
            <label>{t('À brûler (kcal/jour)')}<input type="number" inputMode="numeric" step="50" value={burn} onChange={e => setBurn(e.target.value)} /></label>
          </div>
          {planReady && (
            <div className="cut-setup-result">
              <p>
                {planDeficit > 0
                  ? t('Déficit : {n} kcal par jour.', { n: planDeficit })
                  : t('Pas de déficit : tu manges autant ou plus que ce que tu brûles.')}
              </p>
              {eatValue < bmr && (
                <p className="cut-setup-warning">{t('Tu manges moins que ton métabolisme de base ({n} kcal). Ce n’est pas conseillé.', { n: bmr })}</p>
              )}
              {targets && (
                <dl>
                  <div><dt>{t('Protéines')}</dt><dd>{targets.protein} <small>{unitLabel('g')}</small></dd></div>
                  <div><dt>{t('Lipides')}</dt><dd>{targets.fat} <small>{unitLabel('g')}</small></dd></div>
                  <div><dt>{t('Glucides')}</dt><dd>{targets.carbs} <small>{unitLabel('g')}</small></dd></div>
                </dl>
              )}
              <p className="bulk-muted">
                {t('Si tu importes ta dépense depuis Santé ou la saisis à la main, ce chiffre réel remplace l’estimation.')}
                {' '}{t('Ce sont des repères généraux, pas un avis médical.')}
              </p>
            </div>
          )}
          <div className="bulk-inline">
            <button className="back-btn" onClick={() => setStep(2)}>{t('Retour')}</button>
            <button className="btn btn-primary" disabled={!planReady} onClick={finish}>{t('C’est parti')}</button>
          </div>
        </section>
      )}

      {onCancel && <button className="back-btn" onClick={onCancel}>{t('Annuler')}</button>}
      {error && <p className="bulk-error" role="alert">{error}</p>}
    </div>
  );
}
