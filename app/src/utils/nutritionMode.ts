export type NutritionMode = 'bulk' | 'cut';

const MODE_KEY = 'nutritionMode';

const MODE_ASSETS = {
  bulk: {
    favicon: 'koul-bulk-192.png',
    touchIcon: 'koul-bulk-192.png',
    manifest: 'bulk.webmanifest'
  },
  cut: {
    favicon: 'pwa-192x192.png',
    touchIcon: 'icone-ecran-accueil.png',
    manifest: 'manifest.webmanifest'
  }
} as const;

export function modePicture(mode: NutritionMode): string {
  return import.meta.env.BASE_URL + MODE_ASSETS[mode].touchIcon;
}

export function getNutritionMode(): NutritionMode {
  const requested = new URLSearchParams(location.search).get('mode');
  if (requested === 'bulk' || requested === 'cut') return requested;
  // La sèche reste l'espace par défaut : la prise de masse s'ouvre seulement si on l'a choisie
  try {
    return localStorage.getItem(MODE_KEY) === 'bulk' ? 'bulk' : 'cut';
  } catch {
    return 'cut';
  }
}

export function applyModeIcons(mode: NutritionMode): void {
  const { favicon, touchIcon, manifest } = MODE_ASSETS[mode];
  const links = { icon: favicon, 'apple-touch-icon': touchIcon, manifest };
  for (const [relation, file] of Object.entries(links)) {
    const link = document.querySelector<HTMLLinkElement>(`link[rel="${relation}"]`);
    const href = import.meta.env.BASE_URL + file;
    if (link && link.getAttribute('href') !== href) link.setAttribute('href', href);
  }
}

export function saveNutritionMode(mode: NutritionMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // The active mode can still change for this session.
  }
  const url = new URL(location.href);
  if (url.searchParams.has('mode')) {
    url.searchParams.set('mode', mode);
    history.replaceState(history.state, '', url);
  }
  applyModeIcons(mode);
}
