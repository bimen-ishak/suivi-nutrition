import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, getTheme, setTheme } from './theme';

describe('thème', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.head.innerHTML = '<meta name="theme-color" content="#F6F4EE" />';
  });

  it('démarre sur le thème sauge', () => {
    expect(getTheme()).toBe('sauge');
  });

  it('ignore une valeur inconnue', () => {
    localStorage.setItem('theme', 'violet');
    expect(getTheme()).toBe('sauge');
  });

  it('retient le thème Halloween', () => {
    setTheme('halloween');
    expect(getTheme()).toBe('halloween');
    expect(document.documentElement.dataset.theme).toBe('halloween');
  });

  it('adapte la couleur de la barre du téléphone', () => {
    applyTheme('halloween');
    const bar = document.querySelector('meta[name="theme-color"]');
    expect(bar?.getAttribute('content')).toBe('#F6EFE6');
  });
});
