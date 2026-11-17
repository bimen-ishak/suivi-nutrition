import { afterEach, describe, expect, it } from 'vitest';
import { daysUntil, getGoalDate, MOTIVATION_QUOTES, nextQuote, setGoalDate, shouldShowMotivation } from './motivation';

afterEach(() => localStorage.clear());

describe('motivation de la sèche', () => {
  it('compte les jours jusqu’à la date à tenir', () => {
    expect(daysUntil('2026-12-01', '2026-11-17')).toBe(14);
    expect(daysUntil('2026-11-17', '2026-11-17')).toBe(0);
    expect(daysUntil('2026-11-10', '2026-11-17')).toBe(-7);
  });

  it('ne s’affiche qu’avec une date à venir ou du jour', () => {
    expect(shouldShowMotivation('2026-11-17')).toBe(false);
    setGoalDate('2026-12-01');
    expect(getGoalDate()).toBe('2026-12-01');
    expect(shouldShowMotivation('2026-11-17')).toBe(true);
    expect(shouldShowMotivation('2026-12-02')).toBe(false);
    setGoalDate(null);
    expect(getGoalDate()).toBeNull();
  });

  it('ne répète jamais la phrase de la dernière ouverture', () => {
    let previous = nextQuote();
    for (let i = 0; i < 20; i++) {
      const quote = nextQuote();
      expect(MOTIVATION_QUOTES).toContain(quote);
      expect(quote).not.toBe(previous);
      previous = quote;
    }
  });
});
