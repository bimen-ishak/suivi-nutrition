import { afterEach, expect, it } from 'vitest';
import { applyModeIcons, getNutritionMode, modePicture, saveNutritionMode } from './nutritionMode';

afterEach(() => {
  history.replaceState(null, '', '/');
  localStorage.removeItem('nutritionMode');
  for (const link of document.querySelectorAll('link[data-test-mode]')) link.remove();
});

it('opens a shortcut in its own mode and lets the user switch without losing other URL parameters', () => {
  localStorage.setItem('nutritionMode', 'bulk');
  history.replaceState(null, '', '/?mode=cut&source=shortcut');
  expect(getNutritionMode()).toBe('cut');

  saveNutritionMode('bulk');
  expect(location.search).toBe('?mode=bulk&source=shortcut');
  expect(localStorage.getItem('nutritionMode')).toBe('bulk');

  history.replaceState(null, '', '/?mode=unknown');
  expect(getNutritionMode()).toBe('bulk');
});

it('uses the original cutting photo and a separate bulking icon and manifest', () => {
  const addLink = (rel: string) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.dataset.testMode = '';
    document.head.append(link);
    return link;
  };
  const favicon = addLink('icon');
  const touchIcon = addLink('apple-touch-icon');
  const manifest = addLink('manifest');

  applyModeIcons('cut');
  expect(touchIcon.href).toBe(new URL(modePicture('cut'), location.origin).href);
  expect(favicon.href).toMatch(/pwa-192x192\.png$/);
  expect(manifest.href).toMatch(/\/manifest\.webmanifest$/);

  applyModeIcons('bulk');
  expect(touchIcon.href).toBe(new URL(modePicture('bulk'), location.origin).href);
  expect(favicon.href).toMatch(/koul-bulk-192\.png$/);
  expect(manifest.href).toMatch(/\/bulk\.webmanifest$/);
});
