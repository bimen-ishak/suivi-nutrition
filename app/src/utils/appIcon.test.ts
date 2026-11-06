import { describe, it, expect } from 'vitest';
import { squareCrop } from './appIcon';

describe('squareCrop', () => {
  it('centre le carré sur une photo en hauteur', () => {
    expect(squareCrop(3000, 4000)).toEqual({ x: 0, y: 500, size: 3000 });
  });

  it('centre le carré sur une photo en largeur', () => {
    expect(squareCrop(4000, 3000)).toEqual({ x: 500, y: 0, size: 3000 });
  });

  it('garde une photo déjà carrée', () => {
    expect(squareCrop(1000, 1000)).toEqual({ x: 0, y: 0, size: 1000 });
  });
});
