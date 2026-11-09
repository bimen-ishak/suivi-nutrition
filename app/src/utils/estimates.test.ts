import { describe, it, expect } from 'vitest';
import { estimateMissingValues, needsEstimate } from './estimates';

describe('estimateMissingValues', () => {
  it('reprend les macros d\'un aliment connu de la base générique', () => {
    const result = estimateMissingValues('Banane', 89);
    expect(result.basis).toBe('generic');
    expect(result.matchedName).toBe('Banane');
    expect(result.carbs).toBeCloseTo(23, 0);
    expect(result.protein).toBeCloseTo(1.1, 1);
    expect(result.potassium).toBeGreaterThan(0);
  });

  it('adapte les macros aux calories données', () => {
    const result = estimateMissingValues('Banane', 178);
    expect(result.carbs).toBeCloseTo(46, 0);
  });

  it('ignore la casse et les accents', () => {
    expect(estimateMissingValues('peche', 39).matchedName).toBe('Pêche');
    expect(estimateMissingValues('POMME', 52).matchedName).toBe('Pomme');
  });

  it('trouve l\'aliment dans un nom plus long', () => {
    expect(estimateMissingValues('Pomme golden Lidl', 52).matchedName).toBe('Pomme');
  });

  it('retombe sur une répartition moyenne quand rien ne correspond', () => {
    const result = estimateMissingValues('Truc mystère', 400);
    expect(result.basis).toBe('average');
    expect(result.matchedName).toBeUndefined();
    expect(result.protein).toBeCloseTo(15, 0);
    expect(result.carbs).toBeCloseTo(50, 0);
    expect(result.fat).toBeCloseTo(15.6, 1);
    expect(result.potassium).toBeGreaterThan(0);
  });

  it('renvoie des zéros pour un aliment sans calories', () => {
    const result = estimateMissingValues('Eau', 0);
    expect(result).toMatchObject({ protein: 0, carbs: 0, fat: 0 });
  });
});

describe('needsEstimate', () => {
  it('propose une estimation quand les calories existent sans macros', () => {
    expect(needsEstimate({ kcal: 300, protein: '', carbs: '', fat: '', potassium: '' })).toBe(true);
  });

  it('propose une estimation quand seul le potassium manque', () => {
    expect(needsEstimate({ kcal: 300, protein: '10', carbs: '40', fat: '8', potassium: '' })).toBe(true);
  });

  it('ne propose rien quand tout est rempli', () => {
    expect(needsEstimate({ kcal: 300, protein: '10', carbs: '40', fat: '8', potassium: '200' })).toBe(false);
  });

  it('ne propose rien sans calories', () => {
    expect(needsEstimate({ kcal: 0, protein: '', carbs: '', fat: '', potassium: '' })).toBe(false);
  });
});
