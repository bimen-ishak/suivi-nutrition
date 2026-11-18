// Bilan d'une journée terminée : déficit réel, comparé à celui qui était visé

export type DayResultKind = 'goal' | 'deficit' | 'surplus';

export interface DayResult {
  eaten: number;
  burned: number;
  /** Déficit réel en kcal (brûlé − mangé) : positif = déficit */
  deficit: number;
  /** Déficit visé en kcal (positif), 0 pour un objectif de maintien */
  target: number;
  kind: DayResultKind;
}

/**
 * objective : l'objectif du jour tel qu'enregistré (négatif = déficit, ex. -500).
 * Un déficit plus petit que prévu reste une réussite : seul un excédent n'en est pas une.
 */
export function dayResult(eaten: number, burned: number, objective: number): DayResult {
  const deficit = Math.round(burned - eaten);
  const target = Math.max(0, -objective);
  const kind: DayResultKind = deficit <= 0 ? 'surplus' : deficit >= target ? 'goal' : 'deficit';
  return { eaten: Math.round(eaten), burned: Math.round(burned), deficit, target, kind };
}
