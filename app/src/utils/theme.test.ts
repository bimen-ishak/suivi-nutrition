import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, getTheme, setTheme } from './theme';

describe('thème', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.head.innerHTML = '<meta name="theme-color" content="#161B17" />';
  });

  it('démarre sur le thème clair', () => {
    expect(getTheme()).toBe('light');
  });

  it('ignore une valeur inconnue, comme l\'ancien thème Halloween', () => {
    localStorage.setItem('theme', 'halloween');
    expect(getTheme()).toBe('light');
  });

  it('retient le thème sombre', () => {
    setTheme('dark');
    expect(getTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('adapte la couleur de la barre du téléphone', () => {
    applyTheme('dark');
    const bar = document.querySelector('meta[name="theme-color"]');
    expect(bar?.getAttribute('content')).toBe('#000000');
  });
});
