import { useState, type ReactNode } from 'react';
import { exportAllData, importAllData, importHistory, getAllJournalEntries, getAllDailySummaries } from '../db';
import { exportToExcel } from '../utils/excelExport';
import { getObjective, setObjective } from '../utils/objective';
import { getTheme, setTheme, type ThemeName } from '../utils/theme';
import { getApiKey, setApiKey, clearApiKey } from '../utils/labelReader';
import { getOpenRouterKey, setOpenRouterKey, clearOpenRouterKey, getProvider, setProvider, type Provider } from '../utils/aiReader';
import { t, locale, getLanguage, setLanguage, LANGUAGES } from '../i18n';
import './Settings.css';
import { ti, Icon } from '../components/Icon';
import { SettingsGroup } from '../components/SettingsGroup';
import { CUT_DETAIL_METRICS, getPinnedCutMetrics, savePinnedCutMetrics } from '../utils/cutDashboard';
import { CutSetup } from '../components/CutSetup';
import { basalMetabolism, getProfile } from '../utils/profile';
import { daysUntil, getGoalDate, setGoalDate, getMotivationPhoto, setMotivationPhoto } from '../utils/motivation';
import { compressPhoto, localDateKey } from '../utils/photo';

const THEMES: { name: ThemeName; label: ReactNode }[] = [
  { name: 'light', label: ti('☀️ Clair') },
  { name: 'dark', label: ti('🌙 Sombre') }
];

export function Settings({ modeSettings }: { modeSettings?: ReactNode }) {
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem('lastBackupDate')
  );
  const [objective, setObjectiveState] = useState<number>(getObjective());
  const [pinnedMetrics, setPinnedMetrics] = useState(getPinnedCutMetrics);
  const [theme, setThemeState] = useState<ThemeName>(getTheme());
  const language = getLanguage();
  const [provider, setProviderState] = useState<Provider>(getProvider());
  const [hasApiKey, setHasApiKey] = useState(getApiKey() !== null);
  const [hasOpenRouterKey, setHasOpenRouterKey] = useState(getOpenRouterKey() !== null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<'7d' | '30d' | 'all'>('all');
  const [profile, setProfileState] = useState(getProfile);
  const [redoProfile, setRedoProfile] = useState(false);

  const handleBackup = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `suivi-nutrition-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = new Date().toLocaleString(locale());
      setLastBackup(now);
      localStorage.setItem('lastBackupDate', now);
      alert(t('Sauvegarde téléchargée avec succès !'));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(t('Erreur lors de la sauvegarde'));
    } finally {
      setExporting(false);
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    // Pas de filtre : un fichier reçu par WhatsApp ou Mail peut perdre son extension .json et resterait grisé
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!confirm(t('Restaurer cette sauvegarde remplacera TOUTES les données actuelles. Continuer ?'))) {
        return;
      }

      setImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validation basique
        if (!data.foods || !data.journal || !Array.isArray(data.foods)) {
          throw new Error('Format de fichier invalide');
        }

        await importAllData(data);
        alert(t('Données restaurées avec succès ! Recharge la page.'));
        window.location.reload();
      } catch (error) {
        console.error('Erreur lors de la restauration:', error);
        alert(t('Erreur: fichier invalide ou corrompu'));
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleImportHistory = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const data = JSON.parse(await file.text());
        if (data.type !== 'suivi-nutrition-historique' || !Array.isArray(data.cutHistory) || !Array.isArray(data.photos)) {
          throw new Error('Format de fichier invalide');
        }

        const result = await importHistory(data);
        alert(t('{days} jours ajoutés à Ma sèche et {photos} photos ajoutées.', { days: result.days, photos: result.photos }));
      } catch (error) {
        console.error('Erreur lors de l\'import de l\'historique:', error);
        alert(t('Ce fichier n\'est pas un historique à importer'));
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleSaveKey = () => {
    setApiKey(apiKeyInput);
    setApiKeyInput('');
    setHasApiKey(true);
  };

  const handleRemoveKey = () => {
    clearApiKey();
    setHasApiKey(false);
  };

  const handleSaveOpenRouterKey = () => {
    setOpenRouterKey(apiKeyInput);
    setApiKeyInput('');
    setHasOpenRouterKey(true);
  };

  const handleRemoveOpenRouterKey = () => {
    clearOpenRouterKey();
    setHasOpenRouterKey(false);
  };

  const chooseProvider = (next: Provider) => {
    setProvider(next);
    setProviderState(next);
    setApiKeyInput('');
  };

  const handleSaveObjective = () => {
    savePinnedCutMetrics(pinnedMetrics);
    setObjective(objective);
    alert(t('Objectif enregistré !'));
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const [journal, summaries] = await Promise.all([
        getAllJournalEntries(),
        getAllDailySummaries()
      ]);
      await exportToExcel(journal, summaries, exportPeriod);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert(t('Erreur lors de l\'export Excel'));
    } finally {
      setExporting(false);
    }
  };

  if (redoProfile) {
    return (
      <CutSetup
        onCancel={() => setRedoProfile(false)}
        onComplete={() => {
          setProfileState(getProfile());
          setObjectiveState(getObjective());
          setRedoProfile(false);
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>{ti('⚙️ Paramètres')}</h1>
      </div>

      <SettingsGroup title={t('Objectifs de sèche')}>
        <div className="goal-blocks">
          <section className="goal-block">
            <h3>{t('Ton plan')}</h3>
            {profile ? (
              <>
                <p className="goal-hint">
                  {t('{sex}, {age} ans, {height} cm, {weight} kg', {
                    sex: profile.sex === 'male' ? t('Homme') : t('Femme'),
                    age: profile.age,
                    height: profile.height,
                    weight: profile.weight
                  })}
                </p>
                <dl className="goal-stats">
                  <div><dt>{t('Métabolisme de base')}</dt><dd>{basalMetabolism(profile)}</dd></div>
                  <div><dt>{t('À manger')}</dt><dd>{profile.eat}</dd></div>
                  <div><dt>{t('À brûler')}</dt><dd>{profile.burn}</dd></div>
                </dl>
              </>
            ) : (
              <p className="goal-hint">{t('Réponds à quelques questions pour calculer tes calories et tes macros.')}</p>
            )}
            <button className="btn btn-secondary goal-wide" onClick={() => setRedoProfile(true)}>
              {profile ? t('Refaire le questionnaire') : t('Calculer mes objectifs')}
            </button>
          </section>

          <section className="goal-block">
            <h3>{t('Déficit par jour')}</h3>
            <p className="goal-hint">{t('Déficit calorique quotidien souhaité (en kcal, négatif = déficit).')}</p>
            <label className="goal-number">
              <input
                type="number"
                inputMode="numeric"
                value={objective}
                onChange={(e) => setObjectiveState(parseInt(e.target.value) || 0)}
                step={50}
                aria-label={t('Objectif calorique')}
              />
              <span>{t('kcal/jour')}</span>
            </label>
            <div className="goal-presets" role="group" aria-label={t('Déficit par jour')}>
              {[-1000, -750, -500, -250, 0].map(preset => (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={objective === preset}
                  onClick={() => setObjectiveState(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </section>

          <MotivationSettings />

          <section className="goal-block">
            <h3>{t('À afficher sur l’accueil')}</h3>
            <div className="goal-chips">
              {CUT_DETAIL_METRICS.map(({ id, label }) => (
                <label key={id} className="goal-chip">
                  <input type="checkbox" checked={pinnedMetrics.includes(id)} onChange={event => {
                    const checked = event.target.checked;
                    setPinnedMetrics(current => checked ? [...current, id] : current.filter(metric => metric !== id));
                  }} />
                  <span>{t(label)}</span>
                </label>
              ))}
            </div>
          </section>

          <button className="btn btn-primary goal-wide goal-save" onClick={handleSaveObjective}>{t('Enregistrer')}</button>
        </div>
      </SettingsGroup>

      {modeSettings}

      <SettingsGroup title={t('Assistant photo')}>
        <p className="section-desc">
          {t("Prends en photo un produit ou ton assiette : l'IA remplit les valeurs pour toi. Choisis laquelle utiliser.")}
          {' '}{t('L’analyse IA est facultative : elle envoie les photos au fournisseur choisi et nécessite Internet. Le suivi manuel reste hors ligne.')}
        </p>
        <div className="objective-presets">
          <button
            className={`preset-btn ${provider === 'openrouter' ? 'active' : ''}`}
            aria-pressed={provider === 'openrouter'}
            onClick={() => chooseProvider('openrouter')}
          >
            {t('OpenRouter (gratuit)')}
          </button>
          <button
            className={`preset-btn ${provider === 'gemini' ? 'active' : ''}`}
            aria-pressed={provider === 'gemini'}
            onClick={() => chooseProvider('gemini')}
          >
            {t('Gemini (gratuit)')}
          </button>
        </div>

        {provider === 'openrouter' ? (
          <>
            <p className="section-desc">
              {t("OpenRouter donne accès à des IA gratuites qui lisent les images (environ 50 lectures par jour). Il faut un compte gratuit, sans carte bancaire, et une clé créée sur")}{' '}
              <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer">openrouter.ai</a>.
            </p>
            <p className="section-desc">
              {t('La clé reste sur ce téléphone, et n\'est pas dans tes sauvegardes. Seules les photos sont envoyées à OpenRouter, et seulement quand tu lances une lecture.')}
            </p>
            {hasOpenRouterKey ? (
              <>
                <p className="key-status">{ti('✅ Clé enregistrée sur ce téléphone')}</p>
                <button className="btn btn-secondary btn-block" onClick={handleRemoveOpenRouterKey}>
                  {ti('🗑️ Supprimer la clé')}
                </button>
              </>
            ) : (
              <>
                <input
                  type="password"
                  className="key-input"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={t('Colle ta clé ici')}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label={t('Clé OpenRouter')}
                />
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleSaveOpenRouterKey}
                  disabled={apiKeyInput.trim() === ''}
                >
                  {t('Enregistrer la clé')}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <p className="section-desc">
              {t("L'IA Gemini de Google demande une clé gratuite, créée sur")}{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">{t('Google AI Studio')}</a>
              {' '}{t('avec ton compte Google.')}
            </p>
            <p className="section-desc">
              {t('La clé reste sur ce téléphone, et n\'est pas dans tes sauvegardes. Seules les photos d\'étiquettes sont envoyées à Google, et seulement quand tu lances une lecture.')}
            </p>
            {hasApiKey ? (
              <>
                <p className="key-status">{ti('✅ Clé enregistrée sur ce téléphone')}</p>
                <button className="btn btn-secondary btn-block" onClick={handleRemoveKey}>
                  {ti('🗑️ Supprimer la clé')}
                </button>
              </>
            ) : (
              <>
                <input
                  type="password"
                  className="key-input"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={t('Colle ta clé ici')}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label={t('Clé Google AI Studio')}
                />
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleSaveKey}
                  disabled={apiKeyInput.trim() === ''}
                >
                  {t('Enregistrer la clé')}
                </button>
              </>
            )}
          </>
        )}

      </SettingsGroup>

      <SettingsGroup title={t('Historique et sauvegardes')}>
        <section className="settings-subsection">
          <h3>{ti('💾 Sauvegarde et restauration')}</h3>
          <p className="section-desc">
            {t('Sauvegarde tes données en JSON pour les protéger contre la perte (effacement Safari après 7 jours d\'inactivité).')}
          </p>

          {lastBackup && (
            <p className="last-backup">{t('Dernière sauvegarde :')} {lastBackup}</p>
          )}

          <div className="settings-buttons">
            <button
              className="btn btn-primary btn-block"
              onClick={handleBackup}
              disabled={exporting}
            >
              {exporting ? ti('⏳ Export en cours...') : ti('📥 Sauvegarder toutes mes données (JSON)')}
            </button>
            <button
              className="btn btn-secondary btn-block"
              onClick={handleRestore}
              disabled={importing}
            >
              {importing ? ti('⏳ Import en cours...') : ti('📤 Restaurer mes données (JSON)')}
            </button>
          </div>
        </section>
        <section className="settings-subsection">
          <h3>{ti('📊 Export Excel')}</h3>
          <p className="section-desc">
            {t('Exporte tes données au format .xlsx compatible avec ton tableau existant (3 feuilles : Bilan quotidien, Journal, Photos).')}
          </p>
          <div className="period-selector">
            <button
              className={`period-btn ${exportPeriod === '7d' ? 'active' : ''}`}
              onClick={() => setExportPeriod('7d')}
            >
              {t('7 derniers jours')}
            </button>
            <button
              className={`period-btn ${exportPeriod === '30d' ? 'active' : ''}`}
              onClick={() => setExportPeriod('30d')}
            >
              {t('30 derniers jours')}
            </button>
            <button
              className={`period-btn ${exportPeriod === 'all' ? 'active' : ''}`}
              onClick={() => setExportPeriod('all')}
            >
              {t('Tout')}
            </button>
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={handleExportExcel}
            disabled={exporting}
          >
            {exporting ? ti('⏳ Export en cours...') : ti('📥 Exporter en Excel (.xlsx)')}
          </button>
        </section>
        <section className="settings-subsection">
          <h3>{ti('📥 Importer mon historique')}</h3>
          <p className="section-desc">
            {t('Ajoute tes anciennes journées à Ma sèche et tes anciennes photos. Ton journal et tes données actuelles ne changent pas.')}
          </p>
          <button className="btn btn-secondary btn-block" onClick={handleImportHistory} disabled={importing}>
            {importing ? ti('⏳ Import en cours...') : ti('📥 Choisir le fichier')}
          </button>
        </section>
      </SettingsGroup>

      <SettingsGroup title={t('Langue et apparence')}>
        <section className="settings-subsection">
          <h3>{ti('🎨 Thème')}</h3>
          <p className="section-desc">{t('Choisis l\'ambiance de l\'application.')}</p>
          <div className="objective-presets">
            {THEMES.map(({ name, label }) => (
              <button
                key={name}
                className={`preset-btn ${theme === name ? 'active' : ''}`}
                aria-pressed={theme === name}
                onClick={() => {
                  setTheme(name);
                  setThemeState(name);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
        <section className="settings-subsection">
          <h3>{t('Langue')}</h3>
          <p className="section-desc">
            {t('Langue de l’application et des messages.')}
          </p>
          <div className="objective-presets">
            {LANGUAGES.map(({ id, label }) => (
              <button
                key={id}
                className={`preset-btn ${language === id ? 'active' : ''}`}
                aria-pressed={language === id}
                onClick={() => {
                  setLanguage(id);
                  // Recharge la page : tous les textes et le sens d'écriture changent d'un coup
                  window.location.reload();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </SettingsGroup>

      <SettingsGroup title={t('Informations')}>
        <div className="info-list">
          <div className="info-item">
            <span className="info-label">{t('Version')}</span>
            <span className="info-value">1.0.0</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t('Base générique')}</span>
            <span className="info-value">{t('~150 aliments hors ligne')}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t('Stockage')}</span>
            <span className="info-value">{t('Suivi local ; analyse IA en ligne (facultative)')}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t('Coût')}</span>
            <span className="info-value">{t('0 € — aucun serveur')}</span>
          </div>
        </div>

      </SettingsGroup>
    </div>
  );
}

/** Date à tenir sans craquer, et photo montrée avec une phrase à chaque ouverture */
function MotivationSettings() {
  const [goal, setGoal] = useState(getGoalDate);
  const [photo, setPhoto] = useState(getMotivationPhoto);
  const [error, setError] = useState('');
  const today = localDateKey(new Date());

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      const image = await compressPhoto(file, 900, 0.8);
      if (!setMotivationPhoto(image)) {
        setError(t('Plus assez de place sur le téléphone pour cette photo.'));
        return;
      }
      setPhoto(image);
    } catch {
      setError(t('Impossible de lire cette photo. Essaie une autre.'));
    }
  };

  const days = goal ? daysUntil(goal, today) : null;

  return (
    <section className="goal-block">
      <h3>{t('Date à tenir sans craquer')}</h3>
      <p className="goal-hint">{t('Jusqu’à cette date, une photo et une phrase t’accueillent à chaque ouverture de l’app.')}</p>
      <div className="goal-date">
        <input
          type="date"
          min={today}
          value={goal ?? ''}
          aria-label={t('Date à tenir sans craquer')}
          onChange={event => {
            const value = event.target.value || null;
            setGoalDate(value);
            setGoal(value);
          }}
        />
        {goal && (
          <button type="button" className="goal-clear" aria-label={t('Retirer')} onClick={() => { setGoalDate(null); setGoal(null); }}>×</button>
        )}
      </div>
      {days !== null && days >= 0 && (
        <p className="goal-countdown">
          {days === 0 ? t('C’est le jour J. Tiens bon.') : t('Encore {n} jours sans craquer', { n: days })}
        </p>
      )}

      {photo ? (
        <div className="goal-photo-set">
          <img src={photo} alt={t('Photo de motivation')} />
          <div className="goal-photo-actions">
            <label className="btn btn-secondary">
              {t('Changer la photo')}
              <input type="file" accept="image/*" hidden onChange={event => { void choosePhoto(event.target.files?.[0]); event.target.value = ''; }} />
            </label>
            <button type="button" className="goal-link" onClick={() => { setMotivationPhoto(null); setPhoto(null); }}>
              {t('Retirer la photo')}
            </button>
          </div>
        </div>
      ) : (
        <label className="goal-photo-empty">
          <Icon name="camera" />
          <strong>{t('Choisir la photo de motivation')}</strong>
          <small>{t('La photo reste sur ton téléphone, elle n’est envoyée nulle part.')}</small>
          <input type="file" accept="image/*" hidden onChange={event => { void choosePhoto(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
      )}
      {error && <p className="goal-error" role="alert">{error}</p>}
    </section>
  );
}
