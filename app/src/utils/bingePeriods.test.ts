import { afterEach, describe, expect, it } from 'vitest';
import { addBingePeriod, afterLastBinge, getBingePeriods, inBingePeriod, removeBingePeriod, withoutBinges } from './bingePeriods';
import { estimateMaintenance } from './cut';

afterEach(() => localStorage.removeItem('bingePeriods'));

describe('périodes de craquage', () => {
  it('enregistre une période, remet les dates dans l’ordre et la retire', () => {
    addBingePeriod('2026-11-07', '2026-11-03');
    expect(getBingePeriods()).toEqual([{ start: '2026-11-03', end: '2026-11-07' }]);
    removeBingePeriod({ start: '2026-11-03', end: '2026-11-07' });
    expect(getBingePeriods()).toEqual([]);
  });

  it('ignore un stockage abîmé', () => {
    localStorage.setItem('bingePeriods', '{"oops":1}');
    expect(getBingePeriods()).toEqual([]);
  });

  it('reconnaît les jours de la période, bornes comprises', () => {
    const periods = [{ start: '2026-11-03', end: '2026-11-05' }];
    expect(inBingePeriod('2026-11-03', periods)).toBe(true);
    expect(inBingePeriod('2026-11-05', periods)).toBe(true);
    expect(inBingePeriod('2026-11-06', periods)).toBe(false);
    expect(inBingePeriod('2026-11-08', periods, 3)).toBe(true);
    expect(inBingePeriod('2026-11-09', periods, 3)).toBe(false);
  });

  it('retire les calories de la période et les pesées jusqu’à 3 jours après', () => {
    const periods = [{ start: '2026-11-03', end: '2026-11-05' }];
    const weights = ['2026-11-02', '2026-11-04', '2026-11-07', '2026-11-09'].map(date => ({ date, weight: 80 }));
    const intakes = ['2026-11-02', '2026-11-04', '2026-11-07'].map(date => ({ date, kcal: 2000, protein: 150 }));
    const result = withoutBinges(weights, intakes, periods);
    expect(result.weights.map(w => w.date)).toEqual(['2026-11-02', '2026-11-09']);
    expect(result.intakes.map(i => i.date)).toEqual(['2026-11-02', '2026-11-07']);
  });

  it('attend un nouvel intervalle cohérent avant de réestimer la dépense', () => {
    const periods = [{ start: '2026-11-10', end: '2026-11-12' }];
    const dates = Array.from({ length: 29 }, (_, index) => `2026-11-${String(index + 1).padStart(2, '0')}`);
    const weights = dates.map(date => ({ date, weight: date < '2026-11-16' ? 85 : 80 }));
    const intakes = dates.map(date => ({ date, kcal: 2000, protein: 150 }));
    const early = afterLastBinge(weights.slice(0, 20), intakes.slice(0, 20), periods);
    expect(estimateMaintenance(early.weights, early.intakes).value).toBeNull();

    const resumed = afterLastBinge(weights, intakes, periods);
    expect(resumed.weights[0].date).toBe('2026-11-16');
    expect(resumed.intakes[0].date).toBe('2026-11-16');
    expect(estimateMaintenance(resumed.weights, resumed.intakes).value).toBe(2000);
  });
});
