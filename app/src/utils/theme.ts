export type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'theme';

// Couleur de la barre d'état du téléphone, alignée sur le fond de chaque thème
const BAR_COLORS: Record<ThemeName, string> = {
  light: '#EEF1F5',
  dark: '#0F1319'
};

export function getTheme(): ThemeName {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
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
