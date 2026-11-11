const MAX_SIZE = 1280;
const JPEG_QUALITY = 0.75;

/** Date du jour à l'heure locale, au format YYYY-MM-DD */
export function localDateKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function localDateKeys(count: number, end = new Date()): string[] {
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(end);
    date.setDate(date.getDate() - offset);
    return localDateKey(date);
  });
}

/** Réduit une photo pour limiter la place prise sur le téléphone et dans les sauvegardes */
export async function compressPhoto(file: File, maxSize = MAX_SIZE, quality = JPEG_QUALITY): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas indisponible');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
