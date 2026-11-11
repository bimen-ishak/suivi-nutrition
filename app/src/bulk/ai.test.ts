import { beforeEach, expect, it } from 'vitest';
import { clearApiKey, getActiveKey, getProvider, setApiKey, setProvider } from './ai';

beforeEach(() => localStorage.clear());
it('defaults to Gemini and never reads or overwrites cutting credentials', () => {
  localStorage.setItem('geminiApiKey', 'cut-key');
  localStorage.setItem('aiProvider', 'openrouter');
  expect(getProvider()).toBe('gemini');
  expect(getActiveKey()).toBeNull();
  setApiKey(' bulk-key ');
  expect(getActiveKey()).toBe('bulk-key');
  expect(localStorage.getItem('geminiApiKey')).toBe('cut-key');
  setProvider('gemini'); clearApiKey();
  expect(getActiveKey()).toBeNull();
  expect(localStorage.getItem('aiProvider')).toBe('openrouter');
});
