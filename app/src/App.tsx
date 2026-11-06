import { useState } from 'react';
import { Navigation, type NavigationTab } from './components/Navigation';
import { Today } from './pages/Today';
import { Library } from './pages/Library';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('today');

  return (
    <div className="app">
      <main className="app-main">
        {activeTab === 'today' && <Today />}
        {activeTab === 'library' && <Library />}
        {activeTab === 'history' && (
          <div className="placeholder-page">
            <h1>📊 Historique</h1>
            <p>En cours de développement...</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="placeholder-page">
            <h1>⚙️ Paramètres</h1>
            <p>En cours de développement...</p>
          </div>
        )}
      </main>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;