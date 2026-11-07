import { describe, it, expect } from 'vitest';
import { parseHealthText, applyHealthToSummary } from './health';

describe('parseHealthText', () => {
  it('lit le poids et la dépense avec des virgules françaises', () => {
    expect(parseHealthText('poids: 83,2\nrepos: 1 850\nactives: 540,5')).toEqual({
      weight: 83.2,
      rest: 1850,
      activity: 540.5
    });
  });

  it('accepte = et des espaces insécables', () => {
    expect(parseHealthText('poids=83.2\nrepos=1 850')).toEqual({ weight: 83.2, rest: 1850 });
  });

  it('ignore la casse et les unités', () => {
    expect(parseHealthText('Poids : 83,2 kg\nACTIVES : 540 kcal')).toEqual({ weight: 83.2, activity: 540 });
  });

  it('lit une dépense totale donnée directement', () => {
    expect(parseHealthText('brule: 2390')).toEqual({ burned: 2390 });
  });

  it('refuse un poids absurde', () => {
    expect(parseHealthText('poids: 8320')).toEqual({});
  });

  it('renvoie un objet vide pour un texte étranger', () => {
    expect(parseHealthText('https://exemple.fr')).toEqual({});
    expect(parseHealthText('')).toEqual({});
  });
});

describe('applyHealthToSummary', () => {
  const now = '2026-11-07T10:00:00.000Z';

  it('crée le bilan du jour avec le poids et la somme repos + actives', () => {
    const summary = applyHealthToSummary(undefined, '2026-11-07', { weight: 83.2, rest: 1850, activity: 540 }, now);
    expect(summary).toMatchObject({
      date: '2026-11-07',
      weight: 83.2,
      caloriesBurned: 2390,
      caloriesRest: 1850,
      caloriesActivity: 540,
      caloriesBurnedProvisional: true,
      createdAt: now,
      updatedAt: now
    });
  });

  it('garde ce qui était déjà saisi et ne touche pas à ce que Santé ne donne pas', () => {
    const existing = { date: '2026-11-07', sleepDuration: 7.5, notes: 'ok', createdAt: 'avant', updatedAt: 'avant' };
    const summary = applyHealthToSummary(existing, '2026-11-07', { weight: 83 }, now);
    expect(summary).toMatchObject({ sleepDuration: 7.5, notes: 'ok', weight: 83, createdAt: 'avant', updatedAt: now });
    expect(summary.caloriesBurned).toBeUndefined();
  });

  it('compte le repos seul quand Santé n\'a encore aucune calorie active', () => {
    const summary = applyHealthToSummary(undefined, '2026-11-07', parseHealthText('Poids : 83\nRepos : 570,16\nActives : '), now);
    expect(summary).toMatchObject({ weight: 83, caloriesBurned: 570, caloriesRest: 570.16, caloriesBurnedProvisional: true });
    expect(summary.caloriesActivity).toBeUndefined();
  });

  it('utilise la dépense totale donnée directement', () => {
    expect(applyHealthToSummary(undefined, '2026-11-07', { burned: 2390 }, now).caloriesBurned).toBe(2390);
  });

  it('n\'invente pas de dépense avec seulement les calories actives', () => {
    const summary = applyHealthToSummary(undefined, '2026-11-07', { activity: 540 }, now);
    expect(summary.caloriesBurned).toBeUndefined();
    expect(summary.caloriesActivity).toBe(540);
  });
});
