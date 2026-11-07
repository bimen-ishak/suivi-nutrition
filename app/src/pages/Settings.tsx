import { useState } from 'react';
import { exportAllData, importAllData, importHistory, getAllJournalEntries, getAllDailySummaries } from '../db';
import { exportToExcel } from '../utils/excelExport';
import { getObjective, setObjective } from '../utils/objective';
import { getTheme, setTheme, type ThemeName } from '../utils/theme';
import './Settings.css';

const THEMES: { name: ThemeName; label: string }[] = [
  { name: 'sauge', label: '🌿 Sauge' },
  { name: 'halloween', label: '🎃 Halloween' }
];

export function Settings() {
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem('lastBackupDate')
  );
  const [objective, setObjectiveState] = useState<number>(getObjective());
  const [theme, setThemeState] = useState<ThemeName>(getTheme());
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

      const now = new Date().toLocaleString('fr-FR');
      setLastBackup(now);
      localStorage.setItem('lastBackupDate', now);
      alert('✅ Sauvegarde téléchargée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
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

      if (!confirm('⚠️ Restaurer cette sauvegarde remplacera TOUTES les données actuelles. Continuer ?')) {
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
        alert('✅ Données restaurées avec succès ! Recharge la page.');
        window.location.reload();
      } catch (error) {
        console.error('Erreur lors de la restauration:', error);
        alert('❌ Erreur: fichier invalide ou corrompu');
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
        alert(`✅ ${result.days} jours ajoutés à Ma sèche et ${result.photos} photos ajoutées.`);
      } catch (error) {
        console.error('Erreur lors de l\'import de l\'historique:', error);
        alert('❌ Ce fichier n\'est pas un historique à importer');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleSaveObjective = () => {
    setObjective(objective);
    alert('✅ Objectif enregistré !');
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
      alert('❌ Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Paramètres</h1>
      </div>

      {/* Section Sauvegarde */}
      <div className="settings-section">
        <h2>💾 Sauvegarde et restauration</h2>
        <p className="section-desc">
          Sauvegarde tes données en JSON pour les protéger contre la perte (effacement Safari après 7 jours d'inactivité).
        </p>

        {lastBackup && (
          <p className="last-backup">Dernière sauvegarde : {lastBackup}</p>
        )}

        <div className="settings-buttons">
          <button
            className="btn btn-primary btn-block"
            onClick={handleBackup}
            disabled={exporting}
          >
            {exporting ? '⏳ Export en cours...' : '📥 Sauvegarder toutes mes données (JSON)'}
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={handleRestore}
            disabled={importing}
          >
            {importing ? '⏳ Import en cours...' : '📤 Restaurer mes données (JSON)'}
          </button>
        </div>
      </div>

      {/* Section Export Excel */}
      <div className="settings-section">
        <h2>📊 Export Excel</h2>
        <p className="section-desc">
          Exporte tes données au format .xlsx compatible avec ton tableau existant (3 feuilles : Bilan quotidien, Journal, Photos).
        </p>
        <div className="period-selector">
          <button
            className={`period-btn ${exportPeriod === '7d' ? 'active' : ''}`}
            onClick={() => setExportPeriod('7d')}
          >
            7 derniers jours
          </button>
          <button
            className={`period-btn ${exportPeriod === '30d' ? 'active' : ''}`}
            onClick={() => setExportPeriod('30d')}
          >
            30 derniers jours
          </button>
          <button
            className={`period-btn ${exportPeriod === 'all' ? 'active' : ''}`}
            onClick={() => setExportPeriod('all')}
          >
            Tout
          </button>
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={handleExportExcel}
          disabled={exporting}
        >
          {exporting ? '⏳ Export en cours...' : '📥 Exporter en Excel (.xlsx)'}
        </button>
      </div>

      {/* Section Objectif */}
      <div className="settings-section">
        <h2>🎯 Objectif calorique</h2>
        <p className="section-desc">
          Déficit calorique quotidien souhaité (en kcal, négatif = déficit).
        </p>
        <div className="objective-input">
          <input
            type="number"
            value={objective}
            onChange={(e) => setObjectiveState(parseInt(e.target.value) || 0)}
            step={50}
          />
          <span className="unit">kcal/jour</span>
          <button className="btn btn-primary" onClick={handleSaveObjective}>
            Enregistrer
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
        <h2>🎨 Thème</h2>
        <p className="section-desc">Choisis l'ambiance de l'application.</p>
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

      {/* Section Import */}
      <div className="settings-section">
        <h2>📥 Importer mon historique</h2>
        <p className="section-desc">
          Ajoute tes anciennes journées à Ma sèche et tes anciennes photos. Ton journal et tes données actuelles ne changent pas.
        </p>
        <button className="btn btn-secondary btn-block" onClick={handleImportHistory} disabled={importing}>
          {importing ? '⏳ Import en cours...' : '📥 Choisir le fichier'}
        </button>
      </div>

      {/* Section Infos */}
      <div className="settings-section">
        <h2>ℹ️ Informations</h2>
        <div className="info-list">
          <div className="info-item">
            <span className="info-label">Version</span>
            <span className="info-value">1.0.0</span>
          </div>
          <div className="info-item">
            <span className="info-label">Base générique</span>
            <span className="info-value">~150 aliments hors ligne</span>
          </div>
          <div className="info-item">
            <span className="info-label">Stockage</span>
            <span className="info-value">100% local (IndexedDB)</span>
          </div>
          <div className="info-item">
            <span className="info-label">Coût</span>
            <span className="info-value">0 € — aucun serveur</span>
          </div>
        </div>
      </div>
    </div>
  );
}
