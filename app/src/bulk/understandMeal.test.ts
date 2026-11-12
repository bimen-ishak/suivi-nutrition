import { beforeEach, expect, it, vi } from 'vitest';
import { parseMealUnderstanding, understandMeal } from './understandMeal';
import { setApiKey, setOpenRouterKey, setProvider } from './ai';

const response = { items: [{ name: 'Milk', quantity: 100, unit: 'ml', values: { kcal: 60, protein: 3, carbs: 5, fat: 3, sugars: null }, source: 'estimate' }], assumptions: ['Assumed whole milk'] };
beforeEach(() => { localStorage.clear(); setApiKey('test-key'); });
it('accepts a reviewed portion schema while preserving unknown sugar', () => {
  expect(parseMealUnderstanding(JSON.stringify(response)).items[0]).toMatchObject({ name: 'Milk', quantity: 100, unit: 'ml', estimated: true });
  expect(parseMealUnderstanding(JSON.stringify(response)).items[0].values.sugars).toBeUndefined();
});
it('rejects partial foods, implausible values and null numeric data instead of silently dropping food', () => {
  for (const item of [
    { ...response.items[0], quantity: 0 },
    { ...response.items[0], values: { kcal: 300 } },
    { ...response.items[0], values: { ...response.items[0].values, kcal: 5000 } },
    { ...response.items[0], values: { ...response.items[0].values, protein: null } }
  ]) expect(() => parseMealUnderstanding(JSON.stringify({ items: [response.items[0], item] }))).toThrow();
});
it('represents a clarification without manufacturing foods', () => {
  expect(parseMealUnderstanding('{"items":[],"question":"How much rice?"}')).toEqual({ items: [], assumptions: [], question: 'How much rice?' });
});
it('combines sandwich ingredients into one portion and keeps the drink separate', () => {
  const bread = { name: 'Bread', quantity: 60, unit: 'g', values: { kcal: 250, protein: 10, carbs: 50, fat: 2, sugars: 4 }, source: 'label' };
  const potatoes = { name: 'Potatoes', quantity: 90, unit: 'g', values: { kcal: 100, protein: 5, carbs: 20, fat: 1, sugars: null } };
  const result = parseMealUnderstanding(JSON.stringify({
    items: [{ name: 'Potato sandwich', ingredients: [bread, potatoes] }, response.items[0]],
  }));
  expect(result.items.map(item => item.name)).toEqual(['Potato sandwich', 'Milk']);
  expect(result.items[0]).toMatchObject({ quantity: 150, unit: 'g', estimated: true });
  expect(result.items[0].values.kcal * 1.5).toBeCloseTo(240);
  expect(result.items[0].values.protein * 1.5).toBeCloseTo(10.5);
  expect(result.items[0].values.sugars).toBeUndefined();
  expect(result.assumptions[0]).toMatch(/Bread \(60 g\).*Potatoes \(90 g\)/);
});
it('sends casual text to Gemini without requiring an image', async () => {
  const fetcher = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(response) }] } }] }), { status: 200 }));
  const result = await understandMeal('100 melk', [], '', fetcher);
  expect(result.items[0].quantity).toBe(100);
  const body = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
  expect(body.contents[0].parts).toHaveLength(1);
  expect(body.contents[0].parts[0].text).toContain('100 melk');
  expect(body.contents[0].parts[0].text).toContain('PER 100');
});
it('sends text and optional images together to OpenRouter', async () => {
  setProvider('openrouter'); setOpenRouterKey('router-key');
  const fetcher = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(response) } }] }), { status: 200 }));
  await understandMeal('أكلت نص الطبق', ['data:image/jpeg;base64,abc'], '', fetcher);
  const body = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
  expect(body.messages[0].content.map((p: { type: string }) => p.type)).toEqual(['text', 'image_url']);
  expect(body.messages[0].content[0].text).toContain('أكلت نص الطبق');
});
it('rejects denied credentials and invalid model output without producing entries', async () => {
  await expect(understandMeal('milk', [], '', vi.fn(async () => new Response('{}', { status: 401 })))).rejects.toThrow(/clé/);
  await expect(understandMeal('milk', [], '', vi.fn(async () => new Response('{"candidates":[]}', { status: 200 })))).rejects.toThrow(/incomplet/);
});
