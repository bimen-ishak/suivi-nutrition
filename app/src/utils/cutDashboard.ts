export const CUT_DETAIL_METRICS = [
  { id: 'carbs', label: 'Glucides' },
  { id: 'fat', label: 'Lipides' },
  { id: 'sodium', label: 'Sodium' },
  { id: 'potassium', label: 'Potassium' }
] as const;

type CutDetailMetric = typeof CUT_DETAIL_METRICS[number]['id'];
const STORAGE_KEY = 'cutPinnedMetrics';

export function getPinnedCutMetrics(): CutDetailMetric[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (Array.isArray(stored)) {
      return CUT_DETAIL_METRICS.map(metric => metric.id).filter(id => stored.includes(id));
    }
  } catch {
    // Older or unavailable preferences default to the compact dashboard.
  }
  return [];
}

export function savePinnedCutMetrics(metrics: CutDetailMetric[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
}
