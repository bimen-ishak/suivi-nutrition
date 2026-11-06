import { OBJECTIVE_DEFAULT } from '../types';

const STORAGE_KEY = 'calorieObjective';

/**
 * Lit l'objectif calorique sauvegardé dans localStorage.
 * Retourne OBJECTIVE_DEFAULT (-500) si rien n'est enregistré.
 */
export function getObjective(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return OBJECTIVE_DEFAULT;
  const parsed = parseInt(stored, 10);
  return Number.isNaN(parsed) ? OBJECTIVE_DEFAULT : parsed;
}

/**
 * Sauvegarde l'objectif calorique dans localStorage.
 */
export function setObjective(value: number): void {
  localStorage.setItem(STORAGE_KEY, value.toString());
}

/**
 * Écoute les changements d'objectif (même onglet ou autre onglet).
 * Retourne une fonction de désinscription.
 */
export function onObjectiveChange(callback: (objective: number) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      callback(getObjective());
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
