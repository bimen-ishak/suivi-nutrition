import { expect, it } from 'vitest';
import { newId } from './id';

it('creates valid distinct UUIDs when randomUUID is unavailable on local HTTP', () => {
  const source = { getRandomValues: crypto.getRandomValues.bind(crypto) };
  const first = newId(source), second = newId(source);
  expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(first).not.toBe(second);
});
