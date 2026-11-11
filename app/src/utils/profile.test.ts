import { afterEach, describe, expect, it } from 'vitest';
import { basalMetabolism, dayExpenditure, estimatedExpenditure, getProfile, macroTargets, saveProfile, validProfile, type CutProfile } from './profile';

const man: CutProfile = { sex: 'male', age: 25, height: 180, weight: 80, activity: 'moderate', pace: 'normal' };

afterEach(() => localStorage.removeItem('cutProfile'));

describe('profil de sèche', () => {
  it('calcule le métabolisme de base avec Mifflin-St Jeor', () => {
    expect(basalMetabolism(man)).toBe(1805);
    expect(basalMetabolism({ ...man, sex: 'female' })).toBe(1639);
  });

  it("multiplie par le niveau d'activité et arrondit à 10 kcal", () => {
    expect(estimatedExpenditure(man)).toBe(2800);
    expect(estimatedExpenditure({ ...man, activity: 'sedentary' })).toBe(2170);
  });

  it('suit le poids actuel plutôt que celui du questionnaire', () => {
    expect(estimatedExpenditure(man, 75)).toBeLessThan(estimatedExpenditure(man));
  });

  it('donne les protéines, les lipides et le reste en glucides', () => {
    expect(macroTargets(80, 2300)).toEqual({ protein: 160, fat: 65, carbs: 270 });
  });

  it('garde au moins 40 g de lipides et jamais de glucides négatifs', () => {
    expect(macroTargets(45, 600)).toEqual({ protein: 90, fat: 40, carbs: 0 });
  });

  it('retombe sur le plafond de glucides sans calories connues', () => {
    expect(macroTargets(80, null).carbs).toBe(240);
  });

  it("garde l'estimation tant que la dépense Santé du jour est partielle", () => {
    expect(dayExpenditure(1200, true, 2800)).toEqual({ value: 2800, estimated: true });
    expect(dayExpenditure(3100, true, 2800)).toEqual({ value: 3100, estimated: false });
  });

  it('prend la dépense réelle d’une journée terminée, même plus basse', () => {
    expect(dayExpenditure(2400, false, 2800)).toEqual({ value: 2400, estimated: false });
    expect(dayExpenditure(undefined, false, 2800)).toEqual({ value: 2800, estimated: true });
    expect(dayExpenditure(1200, true, null)).toEqual({ value: 1200, estimated: false });
    expect(dayExpenditure(undefined, false, null)).toEqual({ value: null, estimated: false });
  });

  it('ne donne plus 0 g de glucides après un import Santé à midi', () => {
    const { value } = dayExpenditure(1200, true, 2800);
    expect(macroTargets(80, value! - 500).carbs).toBe(270);
  });

  it('enregistre et relit le profil, et ignore un profil abîmé', () => {
    saveProfile(man);
    expect(getProfile()).toEqual(man);
    localStorage.setItem('cutProfile', '{"sex":"x"}');
    expect(getProfile()).toBeNull();
  });

  it('refuse des valeurs impossibles', () => {
    expect(validProfile(man)).toBe(true);
    expect(validProfile({ ...man, height: 18 })).toBe(false);
    expect(validProfile({ ...man, age: 4 })).toBe(false);
  });
});
