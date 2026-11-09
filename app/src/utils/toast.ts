// Petites bulles de message qui survivent au changement d'écran
type Listener = (text: string) => void;

const listeners = new Set<Listener>();

export function showToast(text: string): void {
  listeners.forEach(listener => listener(text));
}

export function onToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
