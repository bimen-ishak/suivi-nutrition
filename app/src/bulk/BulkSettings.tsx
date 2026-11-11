import { SettingsGroup } from '../components/SettingsGroup';
import { GooglePanel } from './GooglePanel';
import { useState, type ReactNode } from 'react';
import { getLanguage, setLanguage, t, LANGUAGES, type Language } from '../i18n';
import { getTheme, setTheme } from '../utils/theme';
import { getApiKey, setApiKey, clearApiKey } from './ai';
import { getOpenRouterKey, setOpenRouterKey, clearOpenRouterKey, getProvider, setProvider, type Provider } from './ai';
import { bulkDb, downloadFile, getGoals, saveGoals, validBackup, validGoals, type BulkGoals } from './store';

export function BulkSettings({ goals, onChange, modeSettings, openGroup }: { goals: BulkGoals; onChange: () => void; modeSettings?: ReactNode; openGroup?: 'assistant' | 'history' | null }) {
  const [kcal, setKcal] = useState(String(goals.kcal));
  const [protein, setProtein] = useState(String(goals.protein));
  const [showSugars, setShowSugars] = useState(goals.showSugars);
  const [provider, setProviderState] = useState<Provider>(getProvider());
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(!!(provider === 'gemini' ? getApiKey() : getOpenRouterKey()));
  const [message, setMessage] = useState('');
  const [theme, setThemeState] = useState(getTheme());
  const [busy, setBusy] = useState(false);
  const save = () => {
    const next = { kcal: Number(kcal), protein: Number(protein), showSugars };
    if (!validGoals(next)) { setMessage(t('Entre des objectifs positifs.')); return; }
    try { saveGoals(next); onChange(); setMessage(t('Objectifs enregistrés.')); }
    catch { setMessage(t('Enregistrement impossible. Réessaie.')); }
  };
  return <div className="bulk-settings">
    <SettingsGroup title={t('Objectifs quotidiens')}>
      <div className="bulk-number-grid"><label>{t('Calories par jour')}<input type="number" min="1" value={kcal} onChange={e => setKcal(e.target.value)} /></label><label>{t('Protéines par jour (g)')}<input type="number" min="1" value={protein} onChange={e => setProtein(e.target.value)} /></label></div>
      <label className="bulk-check"><input type="checkbox" checked={showSugars} onChange={e => setShowSugars(e.target.checked)} />{t('Afficher les sucres')}</label>
      <button className="btn btn-primary" onClick={save}>{t('Enregistrer')}</button>
    </SettingsGroup>
    {modeSettings}
    <SettingsGroup title={t('Ton assistant repas')} open={openGroup === 'assistant' || undefined}><p className="bulk-muted">{t('La saisie libre et les photos utilisent ton assistant IA. Les valeurs peuvent aussi être saisies à la main, sans connexion.')}</p>
      <div className="bulk-tabs">{(['gemini', 'openrouter'] as const).map(p => <button key={p} aria-pressed={provider === p} onClick={() => { setProvider(p); setProviderState(p); setKey(''); setHasKey(!!(p === 'gemini' ? getApiKey() : getOpenRouterKey())); onChange(); }}>{p === 'gemini' ? 'Gemini' : 'OpenRouter'}</button>)}</div>
      <p className="bulk-muted">{t('Ton texte et les photos choisies partent au fournisseur seulement quand tu appuies sur Comprendre. Les tarifs et limites dépendent du service.')}</p>
      {hasKey ? <div className="bulk-inline"><span>{t('Clé enregistrée sur cet appareil')}</span><button className="btn btn-secondary" onClick={() => { if (provider === 'gemini') clearApiKey(); else clearOpenRouterKey(); setHasKey(false); onChange(); }}>{t('Supprimer la clé')}</button></div> : <div className="bulk-fields"><label>{t('Clé personnelle')}<input type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} /></label><a href={provider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://openrouter.ai/settings/keys'} target="_blank" rel="noopener noreferrer">{t('Créer une clé chez le fournisseur')}</a><button className="btn btn-secondary" disabled={!key.trim()} onClick={() => { if (provider === 'gemini') setApiKey(key); else setOpenRouterKey(key); setKey(''); setHasKey(true); onChange(); }}>{t('Enregistrer la clé')}</button></div>}
    </SettingsGroup>
    <SettingsGroup title={t('Historique et sauvegardes')} open={openGroup === 'history' || undefined}>
      <GooglePanel onChange={onChange} />
      <section className="settings-subsection"><h3>{t('Sauvegarde de ton espace')}</h3><p className="bulk-muted">{t('Sauvegarde tes repas, tes pesées et tes objectifs. Les clés IA sont exclues.')}</p><div className="bulk-inline">
      <button className="btn btn-secondary" disabled={busy} onClick={async () => {
        setBusy(true);
        try {
          const [meals, weights] = await bulkDb.transaction('r', [bulkDb.meals, bulkDb.weights], () =>
            Promise.all([bulkDb.meals.toArray(), bulkDb.weights.toArray()]));
          const backup = { type: 'nutrition-bulk', version: 1, goals: getGoals(), meals, weights };
          downloadFile(JSON.stringify(backup, null, 2), 'nutrition-bulk-backup.json', 'application/json');
        } catch { setMessage(t('Export impossible. Réessaie.')); }
        finally { setBusy(false); }
      }}>{t('Sauvegarder en JSON')}</button>
      <label className="btn btn-secondary">{t('Restaurer une sauvegarde')}<input type="file" accept=".json,application/json" disabled={busy} hidden onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
        setBusy(true);
        try {
          const backup: unknown = JSON.parse(await file.text());
          if (!validBackup(backup)) throw new Error('Invalid backup');
          if (!confirm(t('Restaurer les données de prise de masse depuis cette sauvegarde ?'))) return;
          // Check settings storage before touching the database. On DB failure, restore settings.
          const previous = getGoals(); saveGoals(backup.goals);
          try {
            await bulkDb.transaction('rw', [bulkDb.meals, bulkDb.syncMarks, bulkDb.weights], async () => {
              await bulkDb.meals.clear();
              await bulkDb.meals.bulkAdd(backup.meals);
              await bulkDb.syncMarks.clear();
              if (backup.weights) {
                await bulkDb.weights.clear();
                await bulkDb.weights.bulkAdd(backup.weights);
              }
            });
          }
          catch (error) { saveGoals(previous); throw error; }
          setKcal(String(backup.goals.kcal)); setProtein(String(backup.goals.protein)); setShowSugars(backup.goals.showSugars);
          onChange(); setMessage(t('Sauvegarde restaurée.'));
        } catch { setMessage(t('Restauration impossible. Vérifie le fichier et réessaie.')); }
        finally { setBusy(false); }
      }} /></label>
    </div></section>
    </SettingsGroup>
    <SettingsGroup title={t('Langue et apparence')}><label>{t('Langue')}<select value={getLanguage()} onChange={e => { setLanguage(e.target.value as Language); location.reload(); }}>{LANGUAGES.map(language => <option key={language.id} value={language.id}>{language.label}</option>)}</select></label><div className="bulk-tabs">{(['light', 'dark'] as const).map(value => <button key={value} aria-pressed={theme === value} onClick={() => { setTheme(value); setThemeState(value); }}>{value === 'light' ? t('Clair') : t('Sombre')}</button>)}</div></SettingsGroup>
    {message && <p role="status" className="bulk-notice">{message}</p>}
  </div>;
}
