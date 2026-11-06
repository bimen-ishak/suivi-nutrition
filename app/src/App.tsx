import { useState } from 'react';
import { Navigation, type NavigationTab } from './components/Navigation';
import { Today } from './pages/Today';
import { Library } from './pages/Library';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { AddFood } from './pages/AddFood';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('today');
  const [showAddFood, setShowAddFood] = useState(false);

  if (showAddFood) {
    return <AddFood onComplete={() => setShowAddFood(false)} />;
  }

  return (
    <div className="app">
      <main className="app-main">
        {activeTab === 'today' && <Today onAddFood={() => setShowAddFood(true)} />}
        {activeTab === 'library' && <Library />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <Settings />}
      </main>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;