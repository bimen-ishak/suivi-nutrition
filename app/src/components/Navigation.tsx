import type { ReactNode } from 'react';
import './Navigation.css';
import { t } from '../i18n';

export type NavigationTab = 'today' | 'history' | 'photos' | 'library' | 'settings';

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

// Icônes en trait fin : elles prennent la couleur du texte, donc celle du thème
const ICONS: Record<NavigationTab, ReactNode> = {
  today: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  history: (
    <>
      <path d="M5 20V10" />
      <path d="M12 20V5" />
      <path d="M19 20v-7" />
    </>
  ),
  photos: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.2-2h5.6L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  library: (
    <>
      <path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z" />
      <path d="M6 18a2 2 0 0 1 2-2h10" />
      <path d="M10 8h5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9" />
      <path d="M17 7h3" />
      <circle cx="15" cy="7" r="2" />
      <path d="M4 17h3" />
      <path d="M11 17h9" />
      <circle cx="9" cy="17" r="2" />
    </>
  )
};

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const items: { tab: NavigationTab; label: string }[] = [
    { tab: 'today', label: t('Aujourd\'hui') },
    { tab: 'history', label: t('Historique') },
    { tab: 'photos', label: t('Photos') },
    { tab: 'library', label: t('Bibliothèque') },
    { tab: 'settings', label: t('Paramètres') }
  ];

  return (
    <nav className="navigation">
      {items.map(({ tab, label }) => (
        <button
          key={tab}
          className={`nav-item ${activeTab === tab ? 'active' : ''}`}
          aria-current={activeTab === tab ? 'page' : undefined}
          onClick={() => onTabChange(tab)}
        >
          <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {ICONS[tab]}
          </svg>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
