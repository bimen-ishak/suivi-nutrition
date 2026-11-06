// Tests unitaires pour les fonctions de calcul
import { describe, it, expect } from 'vitest';
import {
  calculateSodiumFromSalt,
  convertPortionToGrams,
  calculateNutrition,
  calculateTare,
  calculateRemaining,
  calculateSleepDuration,
  calculateDailyBalance,
  generateCalculationDescription,
  checkMacroConsistency
} from './calculations';
import type { Food, Portion } from '../types';

describe('Calculs de nutrition', () => {
  describe('calculateSodiumFromSalt', () => {
    it('1.2g sel = 480mg sodium', () => {
      expect(calculateSodiumFromSalt(1.2)).toBe(480);
    });

    it('0.5g sel = 200mg sodium', () => {
      expect(calculateSodiumFromSalt(0.5)).toBe(200);
    });

    it('0g sel = 0mg sodium', () => {
      expect(calculateSodiumFromSalt(0)).toBe(0);
    });

    it('Arrondi correct pour 1.23g sel = 492mg sodium', () => {
      expect(calculateSodiumFromSalt(1.23)).toBe(492);
    });
  });

  describe('convertPortionToGrams', () => {
    const portions: Portion[] = [
      { name: 'biscuit', grams: 5 },
      { name: 'portion', grams: 25 },
      { name: 'bol', grams: 100 }
    ];

    it('4 biscuits × 5g = 20g', () => {
      expect(convertPortionToGrams(4, 'biscuit', portions)).toBe(20);
    });

    it('2 portions × 25g = 50g', () => {
      expect(convertPortionToGrams(2, 'portion', portions)).toBe(50);
    });

    it('1 bol × 100g = 100g', () => {
      expect(convertPortionToGrams(1, 'bol', portions)).toBe(100);
    });

    it('Portion inconnue retourne null', () => {
      expect(convertPortionToGrams(3, 'inconnu', portions)).toBeNull();
    });

    it('Insensible à la casse', () => {
      expect(convertPortionToGrams(2, 'BISCUIT', portions)).toBe(10);
      expect(convertPortionToGrams(2, 'Biscuit', portions)).toBe(10);
    });

    it('Quantité 0 retourne 0', () => {
      expect(convertPortionToGrams(0, 'biscuit', portions)).toBe(0);
    });
  });

  describe('calculateNutrition', () => {
    const food: Food = {
      id: 'test-1',
      name: 'Test Food',
      kcal_per_100g: 442,
      protein: 28.2,
      carbs: 44.6,
      fat: 17.4,
      sodium: 8,
      potassium: 500,
      source: 'étiquette',
      portions: [],
      frequency: 0,
      lastUsed: '',
      createdAt: '',
      updatedAt: ''
    };

    it('100g = valeurs pour 100g', () => {
      const result = calculateNutrition(food, 100);
      expect(result.kcal).toBe(442);
      expect(result.protein).toBe(28.2);
      expect(result.carbs).toBe(44.6);
      expect(result.fat).toBe(17.4);
      expect(result.sodium).toBe(8);
      expect(result.potassium).toBe(500);
    });

    it('50g = moitié des valeurs', () => {
      const result = calculateNutrition(food, 50);
      expect(result.kcal).toBe(221);
      expect(result.protein).toBe(14.1);
      expect(result.carbs).toBe(22.3);
      expect(result.fat).toBe(8.7);
      expect(result.sodium).toBe(4);
      expect(result.potassium).toBe(250);
    });

    it('30g = 30% des valeurs', () => {
      const result = calculateNutrition(food, 30);
      expect(result.kcal).toBe(133);
      expect(result.protein).toBe(8.5);
      expect(result.carbs).toBe(13.4);
      expect(result.fat).toBe(5.2);
    });

    it('Sans sodium ni potassium', () => {
      const foodNoNaK: Food = { ...food, sodium: undefined, potassium: undefined };
      const result = calculateNutrition(foodNoNaK, 100);
      expect(result.sodium).toBeUndefined();
      expect(result.potassium).toBeUndefined();
    });
  });

  describe('calculateTare', () => {
    it('Bol 200g - céréales 100g = 100g de lait', () => {
      expect(calculateTare(200, 100)).toBe(100);
    });

    it('Bol 350g - pain 69g = 281g', () => {
      expect(calculateTare(350, 69)).toBe(281);
    });
  });

  describe('calculateRemaining', () => {
    it('675g pesés - 119g os/peau = 556g mangés', () => {
      expect(calculateRemaining(675, 119)).toBe(556);
    });

    it('118g pomme - 19g reste = 99g mangés', () => {
      expect(calculateRemaining(118, 19)).toBe(99);
    });

    it('500g servis - 0g reste = 500g mangés', () => {
      expect(calculateRemaining(500, 0)).toBe(500);
    });
  });

  describe('calculateSleepDuration', () => {
    it('23h30 → 7h00 = 7.5h', () => {
      expect(calculateSleepDuration('23:30', '07:00')).toBe(7.5);
    });

    it('22h00 → 6h00 = 8h', () => {
      expect(calculateSleepDuration('22:00', '06:00')).toBe(8);
    });

    it('00h00 → 8h00 = 8h', () => {
      expect(calculateSleepDuration('00:00', '08:00')).toBe(8);
    });

    it('23h00 → 23h00 (même heure) = 0h', () => {
      expect(calculateSleepDuration('23:00', '23:00')).toBe(0);
    });

    it('20h00 → 6h30 = 10.5h', () => {
      expect(calculateSleepDuration('20:00', '06:30')).toBe(10.5);
    });
  });

  describe('calculateDailyBalance', () => {
    it('Repos 1700 + activité 500 - objectif 500 - mangé 1400 = il reste 300 kcal à manger', () => {
      const result = calculateDailyBalance(1400, 2200, -500);
      expect(result.net).toBe(-800);
      expect(result.remainingToObjective).toBe(-300);
      expect(result.message).toBe('Il te reste 300 kcal à manger pour atteindre -500 kcal');
    });

    it('Dépense 2200 et mangé 1900 : il faut brûler 200 kcal de plus pour atteindre -500', () => {
      const result = calculateDailyBalance(1900, 2200, -500);
      expect(result.net).toBe(-300);
      expect(result.remainingToObjective).toBe(200);
      expect(result.message).toBe('Il faut brûler 200 kcal de plus pour atteindre -500 kcal');
    });

    it('Mangé 2000, brûlé 2200, objectif -500 = il faut brûler 300 kcal de plus', () => {
      const result = calculateDailyBalance(2000, 2200, -500);
      expect(result.net).toBe(-200);
      expect(result.remainingToObjective).toBe(300);
      expect(result.message).toBe('Il faut brûler 300 kcal de plus pour atteindre -500 kcal');
    });

    it('Objectif par défaut -500', () => {
      const result = calculateDailyBalance(1800, 2300);
      // mangé 1800, brûlé 2300, net = -500, objectif = -500 → remaining = 0
      expect(result.remainingToObjective).toBe(0);
      expect(result.message).toBe('Objectif atteint exactement !');
    });
  });

  describe('generateCalculationDescription', () => {
    it('Tare : 200g - 100g = 100g (tare)', () => {
      expect(generateCalculationDescription('tare', [200, 100])).toBe('200 g − 100 g = 100 g (tare)');
    });

    it('Différence : 350g - 69g = 281g (différence)', () => {
      expect(generateCalculationDescription('difference', [350, 69])).toBe('350 g − 69 g = 281 g (différence)');
    });

    it('Restes : 675g - 119g = 556g mangés (restes)', () => {
      expect(generateCalculationDescription('remaining', [675, 119])).toBe('675 g − 119 g = 556 g mangés (restes)');
    });
  });

  describe('checkMacroConsistency', () => {
    it('Valeurs cohérentes : lipides 17.4×9 + glucides 44.6×4 + protéines 28.2×4 ≈ 442 kcal', () => {
      const result = checkMacroConsistency(442, 28.2, 44.6, 17.4);
      expect(result.consistent).toBe(true);
      expect(result.calculatedKcal).toBe(448); // 156.6 + 178.4 + 112.8 = 447.8 ≈ 448
      expect(result.diffPercent).toBeLessThanOrEqual(10);
    });

    it('Valeurs incohérentes (écart > 10%)', () => {
      const result = checkMacroConsistency(400, 28.2, 44.6, 17.4);
      expect(result.consistent).toBe(false);
      expect(result.diffPercent).toBeGreaterThan(10);
    });

    it('Kcal = 0', () => {
      const result = checkMacroConsistency(0, 10, 10, 10);
      expect(result.consistent).toBe(false);
      expect(result.diffPercent).toBe(100);
    });
  });
});