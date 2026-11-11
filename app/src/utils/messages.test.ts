import { describe, it, expect, beforeEach } from 'vitest';
import { MESSAGES, pickMessage, getLanguage, setLanguage, isRtl, type MessageEvent } from './messages';

const EVENTS = Object.keys(MESSAGES.fr) as MessageEvent[];
const ARABIC = /[؀-ۿ]/;

describe('messages drôles', () => {
  beforeEach(() => localStorage.clear());

  it('couvre les mêmes événements en français et en arabe égyptien', () => {
    expect(Object.keys(MESSAGES['ar-EG']).sort()).toEqual([...EVENTS].sort());
    expect(Object.keys(MESSAGES.en).sort()).toEqual([...EVENTS].sort());
  });

  it('propose au moins 3 variantes par événement dans chaque langue', () => {
    for (const event of EVENTS) {
      expect(MESSAGES.fr[event].length, `fr ${event}`).toBeGreaterThanOrEqual(3);
      expect(MESSAGES['ar-EG'][event].length, `ar ${event}`).toBeGreaterThanOrEqual(3);
      expect(MESSAGES.en[event].length, `en ${event}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('écrit les messages arabes en lettres arabes', () => {
    for (const event of EVENTS) {
      for (const message of MESSAGES['ar-EG'][event]) expect(message).toMatch(ARABIC);
    }
  });

  it('n\'a pas deux fois la même phrase pour un événement', () => {
    for (const language of ['fr', 'ar-EG', 'en'] as const) {
      for (const event of EVENTS) {
        const list = MESSAGES[language][event];
        expect(new Set(list).size, `${language} ${event}`).toBe(list.length);
      }
    }
  });

  it('choisit toujours la même phrase pour une même graine', () => {
    expect(pickMessage('overBudget', 'fr', '2026-11-09')).toBe(pickMessage('overBudget', 'fr', '2026-11-09'));
  });

  it('peut donner des phrases différentes selon la graine', () => {
    const picks = new Set(Array.from({ length: 20 }, (_, i) => pickMessage('newFood', 'fr', `jour-${i}`)));
    expect(picks.size).toBeGreaterThan(1);
  });

  it('renvoie toujours une phrase de la bonne langue', () => {
    expect(MESSAGES.en.newFood).toContain(pickMessage('newFood', 'en'));
    expect(MESSAGES.fr.newFood).toContain(pickMessage('newFood', 'fr'));
    expect(MESSAGES['ar-EG'].newFood).toContain(pickMessage('newFood', 'ar-EG'));
  });
});

describe('langue des messages', () => {
  beforeEach(() => localStorage.clear());

  it('est le français par défaut', () => {
    expect(getLanguage()).toBe('fr');
  });

  it('garde le choix de l\'utilisateur', () => {
    setLanguage('ar-EG');
    expect(getLanguage()).toBe('ar-EG');
  });

  it('revient au français si la valeur enregistrée est inconnue', () => {
    localStorage.setItem('language', 'klingon');
    expect(getLanguage()).toBe('fr');
  });

  it('écrit l\'arabe de droite à gauche', () => {
    expect(isRtl('ar-EG')).toBe(true);
    expect(isRtl('fr')).toBe(false);
  });
});
