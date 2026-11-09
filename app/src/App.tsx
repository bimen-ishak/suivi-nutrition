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

function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('today');
  const [showAddFood, setShowAddFood] = useState(false);

  return (
    <>
      {showAddFood ? (
        <AddFood onComplete={() => setShowAddFood(false)} />
      ) : (
        <div className="app">
          <main className="app-main">
            {activeTab === 'today' && <Today onAddFood={() => setShowAddFood(true)} />}
            {activeTab === 'library' && <Library />}
            {activeTab === 'history' && <History />}
            {activeTab === 'photos' && <Photos />}
            {activeTab === 'settings' && <Settings />}
          </main>
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}
      {/* Toujours au même endroit de l'arbre : la bulle survit au passage d'un écran à l'autre */}
      <ToastHost />
    </>
  );
}

export default App;
