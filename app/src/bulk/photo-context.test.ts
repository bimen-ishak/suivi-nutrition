import { expect, it, vi } from 'vitest';
import { parseLabelResponse, readFoodPhotos } from '../utils/labelReader';
import { readPhotosWithOpenRouter } from '../utils/openRouterReader';

it('includes the user’s portion and preparation notes in both provider requests', async () => {
  const result = JSON.stringify({ mode: 'label', unit: 'g', kcal: 130, protein: 3, carbs: 28, fat: .3 });
  const context = '200 g, riz cuit';
  const geminiFetch = vi.fn(async (_url: string, _init: { body: string }) => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: result }] } }] }) }));
  const routerFetch = vi.fn(async (_url: string, _init: { body: string }) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: result } }] }) }));
  await readFoodPhotos(['data:image/jpeg;base64,test'], 'key', geminiFetch, context);
  await readPhotosWithOpenRouter(['data:image/jpeg;base64,test'], 'key', routerFetch, context);
  expect(JSON.parse(geminiFetch.mock.calls[0][1].body).contents[0].parts[0].text).toContain(context);
  expect(JSON.parse(routerFetch.mock.calls[0][1].body).messages[0].content[0].text).toContain(context);
});

it('normalizes total sugars for the consumed portion and leaves missing sugars unknown', () => {
  const raw = { mode: 'estimate', weight_g: 200, total_kcal: 260, total_protein: 6, total_carbs: 56, total_fat: .6 };
  expect(parseLabelResponse(JSON.stringify({ ...raw, total_sugars: 4 }))?.sugars).toBe(2);
  expect(parseLabelResponse(JSON.stringify(raw))?.sugars).toBeUndefined();
});
