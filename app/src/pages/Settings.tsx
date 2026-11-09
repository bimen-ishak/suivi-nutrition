import { useState, type ReactNode } from 'react';
import { exportAllData, importAllData, importHistory, getAllJournalEntries, getAllDailySummaries } from '../db';
import { exportToExcel } from '../utils/excelExport';
import { getObjective, setObjective } from '../utils/objective';
import { getTheme, setTheme, type ThemeName } from '../utils/theme';
import { getApiKey, setApiKey, clearApiKey } from '../utils/labelReader';
import { t, locale, getLanguage, setLanguage, type Language } from '../i18n';
import './Settings.css';
import { ti } from '../components/Icon';

const LANGUAGES: { name: Language; label: ReactNode }[] = [
  { name: 'fr', label: '🇫🇷 Français' },
  { name: 'ar-EG', label: '🇪🇬 عربي مصري' }
];

const THEMES: { name: ThemeName; label: ReactNode }[] = [
  { name: 'sauge', label: ti('🎯 Cobalt') },
  { name: 'halloween', label: ti('🎃 Halloween') }
];

export function Settings() {
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem('lastBackupDate')
  );
  const [objective, setObjectiveState] = useState<number>(getObjective());
  const [theme, setThemeState] = useState<ThemeName>(getTheme());
  const language = getLanguage();
  const [hasApiKey, setHasApiKey] = useState(getApiKey() !== null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<'7d' | '30d' | 'all'>('all');

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

  const handleSaveObjective = () => {
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

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>{ti('⚙️ Paramètres')}</h1>
      </div>

      {/* Section Sauvegarde */}
      <div className="settings-section">
        <h2>{ti('💾 Sauvegarde et restauration')}</h2>
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
      </div>

      {/* Section Export Excel */}
      <div className="settings-section">
        <h2>{ti('📊 Export Excel')}</h2>
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
      </div>

      {/* Section Objectif */}
      <div className="settings-section">
        <h2>{ti('🎯 Objectif calorique')}</h2>
        <p className="section-desc">
          {t('Déficit calorique quotidien souhaité (en kcal, négatif = déficit).')}
        </p>
        <div className="objective-input">
          <input
            type="number"
            value={objective}
            onChange={(e) => setObjectiveState(parseInt(e.target.value) || 0)}
            step={50}
          />
          <span className="unit">{t('kcal/jour')}</span>
          <button className="btn btn-primary" onClick={handleSaveObjective}>
            {t('Enregistrer')}
          </button>
        </div>
        <div className="objective-presets">
          {[-1000, -750, -500, -250, 0].map(preset => (
            <button
              key={preset}
              className={`preset-btn ${objective === preset ? 'active' : ''}`}
              onClick={() => setObjectiveState(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Section Thème */}
      <div className="settings-section">
        <h2>{ti('🎨 Thème')}</h2>
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
      </div>

      {/* Section Langue des messages drôles */}
      <div className="settings-section">
        <h2>{ti('😏 Messages drôles')}</h2>
        <p className="section-desc">
          {t('L\'app te charrie gentiment quand tu ajoutes un aliment ou dépasses ton budget. Choisis la langue de ses phrases.')}
        </p>
        <div className="objective-presets">
          {LANGUAGES.map(({ name, label }) => (
            <button
              key={name}
              className={`preset-btn ${language === name ? 'active' : ''}`}
              aria-pressed={language === name}
              onClick={() => {
                setLanguage(name);
                // Recharge la page : tous les textes et le sens d'écriture changent d'un coup
                window.location.reload();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Lecture d'étiquette */}
      <div className="settings-section">
        <h2>{ti('🤖 Lecture d\'étiquette')}</h2>
        <p className="section-desc">
          {t("Prends en photo le tableau nutritionnel d'un produit : l'IA Gemini de Google remplit les valeurs pour toi. Il faut une clé gratuite, créée sur")}{' '}
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
      </div>

      {/* Section Import */}
      <div className="settings-section">
        <h2>{ti('📥 Importer mon historique')}</h2>
        <p className="section-desc">
          {t('Ajoute tes anciennes journées à Ma sèche et tes anciennes photos. Ton journal et tes données actuelles ne changent pas.')}
        </p>
        <button className="btn btn-secondary btn-block" onClick={handleImportHistory} disabled={importing}>
          {importing ? ti('⏳ Import en cours...') : ti('📥 Choisir le fichier')}
        </button>
      </div>

      {/* Section Infos */}
      <div className="settings-section">
        <h2>{t('ℹ️ Informations')}</h2>
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
            <span className="info-value">{t('100% local (IndexedDB)')}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t('Coût')}</span>
            <span className="info-value">{t('0 € — aucun serveur')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
