import { describe, expect, it } from 'vitest';
import { dayResult } from './dayResult';

describe('bilan de la journée', () => {
  it('objectif atteint quand le déficit réel égale ou dépasse celui visé', () => {
    expect(dayResult(1900, 2400, -500)).toMatchObject({ deficit: 500, target: 500, kind: 'goal' });
    expect(dayResult(1700, 2400, -500).kind).toBe('goal');
  });

  it('félicite un déficit plus petit que prévu', () => {
    // Prévu : manger 1900, brûler 2400. Réel : 1600 mangées, 2100 brûlées → toujours 500 de déficit
    expect(dayResult(1600, 2100, -500).kind).toBe('goal');
    expect(dayResult(1900, 2100, -500)).toMatchObject({ deficit: 200, kind: 'deficit' });
  });

  it('signale un excédent sans le confondre avec un déficit', () => {
    expect(dayResult(2600, 2400, -500)).toMatchObject({ deficit: -200, kind: 'surplus' });
    expect(dayResult(2400, 2400, -500).kind).toBe('surplus');
  });

  it('un objectif de maintien compte tout déficit comme atteint', () => {
    expect(dayResult(2000, 2100, 0).kind).toBe('goal');
  });
});
