import { describe, it, expect, beforeEach } from 'vitest';
import { t, tn, locale, isRtl, getLanguage, setLanguage, applyDirection, unitLabel, macroLetter } from './index';

describe('t', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
  });

  it('renvoie le texte français tel quel par défaut', () => {
    expect(t('Aujourd\'hui')).toBe('Aujourd\'hui');
  });

  it('remplace les variables entre accolades', () => {
    expect(t('Il te reste {n} kcal', { n: 260 })).toBe('Il te reste 260 kcal');
  });

  it('laisse une variable inconnue visible plutôt que de la perdre', () => {
    expect(t('Bonjour {nom}', {})).toBe('Bonjour {nom}');
  });

  it('traduit en arabe égyptien quand la langue est choisie', () => {
    setLanguage('ar-EG');
    expect(t('Aujourd\'hui')).toBe('النهارده');
  });

  it('retombe sur le français quand une traduction manque', () => {
    setLanguage('ar-EG');
    expect(t('Phrase sans traduction')).toBe('Phrase sans traduction');
  });

  it('remplace aussi les variables dans la traduction', () => {
    setLanguage('ar-EG');
    expect(t('sur {days} j', { days: 30 })).toBe('على 30 يوم');
  });
});

describe('tn : pluriels', () => {
  beforeEach(() => localStorage.clear());

  it('choisit le singulier ou le pluriel en français', () => {
    expect(tn('{n} aliment', '{n} aliments', 1, { n: 1 })).toBe('1 aliment');
    expect(tn('{n} aliment', '{n} aliments', 3, { n: 3 })).toBe('3 aliments');
    expect(tn('{n} aliment', '{n} aliments', 0, { n: 0 })).toBe('0 aliment');
  });

  it('applique les formes arabes : un, deux, quelques-uns, beaucoup', () => {
    setLanguage('ar-EG');
    expect(tn('{n} aliment', '{n} aliments', 1, { n: 1 })).toBe('أكلة واحدة');
    expect(tn('{n} aliment', '{n} aliments', 2, { n: 2 })).toBe('أكلتين');
    expect(tn('{n} aliment', '{n} aliments', 5, { n: 5 })).toBe('5 أكلات');
    expect(tn('{n} aliment', '{n} aliments', 15, { n: 15 })).toBe('15 أكلة');
  });
});

describe('langue et direction', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
  });

  it('est le français par défaut', () => {
    expect(getLanguage()).toBe('fr');
  });

  it('retombe sur le français si la valeur enregistrée est inconnue', () => {
    localStorage.setItem('language', 'klingon');
    expect(getLanguage()).toBe('fr');
  });

  it('écrit l\'arabe de droite à gauche', () => {
    expect(isRtl('ar-EG')).toBe(true);
    expect(isRtl('fr')).toBe(false);
  });

  it('donne le bon format de dates et de nombres, avec des chiffres occidentaux en arabe', () => {
    expect(locale()).toBe('fr-FR');
    setLanguage('ar-EG');
    expect(locale()).toBe('ar-EG-u-nu-latn');
  });

  it('règle la direction de la page', () => {
    setLanguage('ar-EG');
    applyDirection();
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar-EG');
    setLanguage('fr');
    applyDirection();
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });
});

describe('unités et initiales', () => {
  beforeEach(() => localStorage.clear());

  it('garde les unités françaises par défaut', () => {
    expect(unitLabel('kcal')).toBe('kcal');
    expect(unitLabel('g')).toBe('g');
    expect(macroLetter('P')).toBe('P');
  });

  it('donne les unités et initiales en arabe égyptien', () => {
    setLanguage('ar-EG');
    expect(unitLabel('kcal')).toBe('سعرة');
    expect(unitLabel('kg')).toBe('كجم');
    expect(unitLabel('h')).toBe('س');
    expect(macroLetter('G')).toBe('ك');
  });
});
