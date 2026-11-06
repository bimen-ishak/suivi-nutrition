import './Navigation.css';

export type NavigationTab = 'today' | 'history' | 'photos' | 'library' | 'settings';

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="navigation">
      <button
        className={`nav-item ${activeTab === 'today' ? 'active' : ''}`}
        onClick={() => onTabChange('today')}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Aujourd'hui</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
      >
        <span className="nav-icon">📊</span>
        <span className="nav-label">Historique</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'photos' ? 'active' : ''}`}
        onClick={() => onTabChange('photos')}
      >
        <span className="nav-icon">📷</span>
        <span className="nav-label">Photos</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
        onClick={() => onTabChange('library')}
      >
        <span className="nav-icon">📚</span>
        <span className="nav-label">Bibliothèque</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
      >
        <span className="nav-icon">⚙️</span>
        <span className="nav-label">Paramètres</span>
      </button>
    </nav>
  );
}