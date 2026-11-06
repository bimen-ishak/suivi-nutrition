import { describe, it, expect } from 'vitest';
import {
  averageIntake,
  estimateMaintenance,
  getRateVerdict,
  getWeeklyRate,
  getWeightTrend,
  importedDayToView,
  mergeIntakes,
  mergeWeights,
  proteinTarget
} from './cut';

// Journées consécutives depuis le 1er octobre 2026
const day = (n: number) => {
  const date = new Date(Date.UTC(2026, 9, 1 + n));
  return date.toISOString().split('T')[0];
};

const weights = (count: number, start: number, perDay: number) =>
  Array.from({ length: count }, (_, i) => ({ date: day(i), weight: start + perDay * i }));

describe('getWeightTrend', () => {
  it('lisse les pesées sur 7 jours', () => {
    const trend = getWeightTrend([
      { date: day(0), weight: 82 },
      { date: day(1), weight: 84 },
      { date: day(2), weight: 83 }
    ]);
    expect(trend.map(p => p.trend)).toEqual([82, 83, 83]);
  });

  it('ignore les pesées de plus de 7 jours', () => {
    const trend = getWeightTrend([
      { date: day(0), weight: 90 },
      { date: day(7), weight: 80 }
    ]);
    expect(trend[1].trend).toBe(80);
  });

  it('remet les pesées dans l\'ordre des dates', () => {
    const trend = getWeightTrend([
      { date: day(1), weight: 81 },
      { date: day(0), weight: 83 }
    ]);
    expect(trend.map(p => p.date)).toEqual([day(0), day(1)]);
  });
});

describe('getWeeklyRate', () => {
  it('mesure une perte régulière', () => {
    const rate = getWeeklyRate(weights(14, 84, -0.1));
    expect(rate?.kgPerWeek).toBeCloseTo(-0.7, 2);
    expect(rate?.percentPerWeek).toBeCloseTo(-0.84, 1);
  });

  it('ne se laisse pas tromper par une pesée isolée', () => {
    const points = weights(14, 84, -0.1);
    points[13] = { ...points[13], weight: points[13].weight + 1.5 };
    const rate = getWeeklyRate(points);
    expect(rate?.kgPerWeek).toBeLessThan(-0.3);
  });

  it('attend au moins 4 pesées', () => {
    expect(getWeeklyRate(weights(3, 84, -0.1))).toBeNull();
  });

  it('attend au moins 7 jours d\'écart', () => {
    expect(getWeeklyRate(weights(6, 84, -0.1))).toBeNull();
  });
});

describe('getRateVerdict', () => {
  it('alerte au-delà de 1 % par semaine', () => {
    expect(getRateVerdict(-1.2).level).toBe('warning');
  });

  it('valide un rythme entre 0,5 et 1 %', () => {
    expect(getRateVerdict(-0.7).level).toBe('success');
  });

  it('signale un rythme doux', () => {
    expect(getRateVerdict(-0.3).level).toBe('neutral');
  });

  it('signale un plateau', () => {
    expect(getRateVerdict(0).level).toBe('warning');
    expect(getRateVerdict(0.2).level).toBe('warning');
  });
});

describe('estimateMaintenance', () => {
  const intakes = (count: number, kcal: number) =>
    Array.from({ length: count }, (_, i) => ({ date: day(i), kcal, protein: 150 }));

  it('déduit la dépense du poids et de ce qui est mangé', () => {
    // 0,1 kg perdu par jour = 770 kcal de déficit quotidien
    const result = estimateMaintenance(weights(21, 84, -0.1), intakes(21, 2000));
    expect(result.value).toBe(2770);
  });

  it('retrouve la dépense quand le poids est stable', () => {
    const result = estimateMaintenance(weights(21, 82, 0), intakes(21, 2500));
    expect(result.value).toBe(2500);
  });

  it('ignore les journées mal remplies', () => {
    const days = intakes(21, 2000);
    days[3] = { ...days[3], kcal: 300 };
    const result = estimateMaintenance(weights(21, 82, 0), days);
    expect(result.value).toBe(2000);
  });

  it('indique ce qu\'il manque quand il y a trop peu de données', () => {
    const result = estimateMaintenance(weights(5, 82, 0), intakes(5, 2000));
    expect(result.value).toBeNull();
    expect(result.daysMissing).toBe(9);
  });
});

describe('mergeWeights', () => {
  it('ajoute les pesées importées', () => {
    const merged = mergeWeights(
      [{ date: day(0), weight: 83 }, { date: day(1) }],
      [{ date: day(2), weight: 82 }]
    );
    expect(merged).toEqual([{ date: day(0), weight: 83 }, { date: day(2), weight: 82 }]);
  });

  it('garde la pesée de l\'app si les deux existent', () => {
    const merged = mergeWeights([{ date: day(0), weight: 83 }], [{ date: day(0), weight: 82 }]);
    expect(merged).toEqual([{ date: day(0), weight: 82 }]);
  });
});

describe('mergeIntakes', () => {
  it('ajoute les totaux importés', () => {
    const merged = mergeIntakes([{ date: day(0), kcal: 2000, protein: 120 }], []);
    expect(merged).toEqual([{ date: day(0), kcal: 2000, protein: 120 }]);
  });

  it('garde le journal de l\'app si les deux existent', () => {
    const merged = mergeIntakes(
      [{ date: day(0), kcal: 2000, protein: 120 }],
      [{ date: day(0), kcal: 1800, protein: 100 }]
    );
    expect(merged).toEqual([{ date: day(0), kcal: 1800, protein: 100 }]);
  });

  it('ignore une journée importée sans calories', () => {
    expect(mergeIntakes([{ date: day(0), weight: 83 }], [])).toEqual([]);
  });
});

describe('importedDayToView', () => {
  it('reprend les calories, les macros et la dépense d\'un jour importé', () => {
    const view = importedDayToView({
      date: day(0), weight: 82.5, kcal: 2450, protein: 123.6, carbs: 291.7, fat: 89.3, burned: 2919
    });
    expect(view.hasCalories).toBe(true);
    expect(view.totals).toEqual({ caloriesEaten: 2450, protein: 123.6, carbs: 291.7, fat: 89.3 });
    expect(view.summary).toMatchObject({ date: day(0), weight: 82.5, caloriesBurned: 2919 });
  });

  it('signale un jour sans calories', () => {
    const view = importedDayToView({ date: day(0), weight: 83.2 });
    expect(view.hasCalories).toBe(false);
    expect(view.totals.caloriesEaten).toBe(0);
    expect(view.summary).toMatchObject({ weight: 83.2 });
  });

  it('ne crée pas de bilan sans poids ni dépense', () => {
    const view = importedDayToView({ date: day(0), kcal: 2000, protein: 100 });
    expect(view.summary).toBeUndefined();
    expect(view.totals).toEqual({ caloriesEaten: 2000, protein: 100, carbs: 0, fat: 0 });
  });
});

describe('proteinTarget', () => {
  it('vise 2 g par kilo, arrondi à 5 g', () => {
    expect(proteinTarget(82.4)).toBe(165);
  });
});

describe('averageIntake', () => {
  it('fait la moyenne des journées remplies', () => {
    const result = averageIntake([
      { date: day(0), kcal: 2000, protein: 100 },
      { date: day(1), kcal: 2400, protein: 140 },
      { date: day(2), kcal: 200, protein: 10 }
    ]);
    expect(result).toEqual({ days: 2, kcal: 2200, protein: 120 });
  });

  it('renvoie null sans journée remplie', () => {
    expect(averageIntake([])).toBeNull();
  });
});
