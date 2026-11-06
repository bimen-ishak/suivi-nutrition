// Icône de l'app choisie par l'utilisateur : la photo reste sur le téléphone, jamais dans le code publié
const STORAGE_KEY = 'appIcon';
const ICON_SIZE = 180; // taille attendue par iOS pour l'écran d'accueil
const JPEG_QUALITY = 0.9;

/** Plus grand carré centré dans une image */
export function squareCrop(width: number, height: number): { x: number; y: number; size: number } {
  const size = Math.min(width, height);
  return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size };
}

/** Recadre une photo en carré de 180 px */
export async function photoToIcon(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const { x, y, size } = squareCrop(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas indisponible');
    context.drawImage(image, x, y, size, size, 0, 0, ICON_SIZE, ICON_SIZE);

    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function getAppIcon(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function touchIconLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    document.head.appendChild(link);
  }
  return link;
}

/** Applique l'icône choisie, pour qu'iOS la prenne à l'ajout à l'écran d'accueil */
export function setAppIcon(dataUrl: string): void {
  localStorage.setItem(STORAGE_KEY, dataUrl);
  touchIconLink().href = dataUrl;
}

/** Revient à l'icône par défaut */
export function clearAppIcon(): void {
  localStorage.removeItem(STORAGE_KEY);
  const link = touchIconLink();
  link.href = `${import.meta.env.BASE_URL}apple-touch-icon.png`;
}
