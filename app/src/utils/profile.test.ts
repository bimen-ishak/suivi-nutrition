import { afterEach, describe, expect, it } from 'vitest';
import { basalMetabolism, dayExpenditure, getProfile, macroTargets, proposePlan, saveProfile, validBody, validPlan, type CutProfile } from './profile';

const man: CutProfile = { sex: 'male', age: 25, height: 180, weight: 80, eat: 1900, burn: 2400 };

afterEach(() => localStorage.removeItem('cutProfile'));

describe('profil de sèche', () => {
  it('calcule le métabolisme de base avec Mifflin-St Jeor', () => {
    expect(basalMetabolism(man)).toBe(1810);
    expect(basalMetabolism({ ...man, sex: 'female' })).toBe(1640);
  });

  it('suit le poids actuel plutôt que celui du questionnaire', () => {
    expect(basalMetabolism(man, 75)).toBe(1760);
  });

  it('propose de manger un peu au-dessus du métabolisme et de brûler le déficit en plus', () => {
    expect(proposePlan(1900, 500)).toEqual({ eat: 2000, burn: 2500 });
    expect(proposePlan(1810, 300)).toEqual({ eat: 1900, burn: 2200 });
  });

  it('garde la dépense prévue tant que la dépense Santé du jour est partielle', () => {
    expect(dayExpenditure(1200, true, 2500)).toEqual({ value: 2500, estimated: true });
    expect(dayExpenditure(3100, true, 2500)).toEqual({ value: 3100, estimated: false });
  });

  it('prend la dépense réelle d’une journée terminée, même plus basse', () => {
    expect(dayExpenditure(2400, false, 2500)).toEqual({ value: 2400, estimated: false });
    expect(dayExpenditure(undefined, false, 2500)).toEqual({ value: 2500, estimated: true });
    expect(dayExpenditure(1200, true, null)).toEqual({ value: 1200, estimated: false });
    expect(dayExpenditure(undefined, false, null)).toEqual({ value: null, estimated: false });
  });

  it('donne les protéines, les lipides et le reste en glucides', () => {
    expect(macroTargets(80, 2000)).toEqual({ protein: 160, fat: 65, carbs: 195 });
  });

  it('garde au moins 40 g de lipides et jamais de glucides négatifs', () => {
    expect(macroTargets(45, 600)).toEqual({ protein: 90, fat: 40, carbs: 0 });
  });

  it('retombe sur le plafond de glucides sans calories connues', () => {
    expect(macroTargets(80, null).carbs).toBe(240);
  });

  it('enregistre et relit le profil, et ignore un ancien profil incomplet', () => {
    saveProfile(man);
    expect(getProfile()).toEqual(man);
    localStorage.setItem('cutProfile', JSON.stringify({ sex: 'male', age: 25, height: 180, weight: 80, activity: 'moderate', pace: 'normal' }));
    expect(getProfile()).toBeNull();
  });

  it('refuse des valeurs impossibles', () => {
    expect(validBody(man)).toBe(true);
    expect(validBody({ ...man, height: 18 })).toBe(false);
    expect(validBody({ ...man, age: 4 })).toBe(false);
    expect(validPlan(2000, 2500)).toBe(true);
    expect(validPlan(200, 2500)).toBe(false);
  });
});
