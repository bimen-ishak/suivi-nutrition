import { useState } from 'react';
import { Navigation, type NavigationTab } from './components/Navigation';
import { Today } from './pages/Today';
import { Library } from './pages/Library';
import { History } from './pages/History';
import { Photos } from './pages/Photos';
import { Settings } from './pages/Settings';
import { AddFood } from './pages/AddFood';
import { ToastHost } from './components/ToastHost';
import './App.css';
import './sport.css';
import { BulkPage } from './bulk/BulkPage';
import { t } from './i18n';
import { SettingsGroup } from './components/SettingsGroup';
import { CutSetup } from './components/CutSetup';
import { getProfile } from './utils/profile';

import { modePicture, saveNutritionMode, type NutritionMode } from './utils/nutritionMode';

function App({ initialMode }: { initialMode: NutritionMode }) {
  const [mode, setMode] = useState(initialMode);
  const [activeTab, setActiveTab] = useState<NavigationTab>('today');
  const [showAddFood, setShowAddFood] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(() => !getProfile());
  // Chaque appui sur la photo du haut ramène la prise de masse à son accueil
  const [bulkHome, setBulkHome] = useState(0);

  const goHome = () => {
    if (mode === 'bulk') {
      setBulkHome(count => count + 1);
    } else {
      setShowAddFood(false);
      setActiveTab('today');
    }
    window.scrollTo(0, 0);
  };

  const modes = [
    { id: 'bulk', label: t('Prise de masse') },
    { id: 'cut', label: t('Sèche') }
  ] as const;

  const changeMode = (next: NutritionMode) => {
    if (next === mode) return;
    saveNutritionMode(next);
    setActiveTab('today');
    setMode(next);
    window.scrollTo(0, 0);
  };

  const modeSettings = (onChange: (next: NutritionMode) => void) => (
    <SettingsGroup title={t('Mode de suivi')}>
      <div className="profile-switch" role="group" aria-label={t('Choisir ton espace')}>
        {modes.map(option => (
          <button key={option.id} aria-pressed={mode === option.id} onClick={() => onChange(option.id)}>
            {option.label}
          </button>
        ))}
      </div>
    </SettingsGroup>
  );

  return (
    <div className="nutrition-shell" data-mode={mode}>
      <header className="nutrition-header">
        <button type="button" className="nutrition-brand" onClick={goHome} aria-label={t('Retour à l’accueil')}>
          <img className="nutrition-mark" src={modePicture(mode)} alt="" /><span>KOUL</span>
        </button>
        <span className="nutrition-mode">{mode === 'bulk' ? modes[0].label : modes[1].label}</span>
      </header>
      {mode === 'bulk' ? <BulkPage homeSignal={bulkHome} renderModeSettings={canLeave => modeSettings(next => {
        if (next !== mode && canLeave()) changeMode(next);
      })} /> : needsProfile ? (
        <CutSetup onComplete={() => { setNeedsProfile(false); window.scrollTo(0, 0); }} />
      ) : showAddFood ? (
        <AddFood onComplete={() => setShowAddFood(false)} />
      ) : (
        <div className="app">
          <main className="app-main">
            {activeTab === 'today' && <Today onAddFood={() => setShowAddFood(true)} />}
            {activeTab === 'library' && <Library />}
            {activeTab === 'history' && <History />}
            {activeTab === 'photos' && <Photos />}
            {activeTab === 'settings' && <Settings modeSettings={modeSettings(changeMode)} />}
          </main>
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}
      {/* Toujours au même endroit de l'arbre : la bulle survit au passage d'un écran à l'autre */}
      <ToastHost />
    </div>
  );
}

export default App;
