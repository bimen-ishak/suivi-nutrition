export type ThemeName = 'sauge' | 'halloween';

const STORAGE_KEY = 'theme';

// Couleur de la barre d'état du téléphone, alignée sur le fond de chaque thème
const BAR_COLORS: Record<ThemeName, string> = {
  sauge: '#F6F4EE',
  halloween: '#F6EFE6'
};

export function getTheme(): ThemeName {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'halloween' ? 'halloween' : 'sauge';
  } catch {
    return 'sauge';
  }
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', BAR_COLORS[theme]);
}

export function setTheme(theme: ThemeName): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Stockage indisponible : le thème vaut pour cette session seulement
  }
  applyTheme(theme);
}
