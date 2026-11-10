import { describe, expect, it, vi } from 'vitest';
import { readPhotosWithOpenRouter, OPENROUTER_MODELS } from './openRouterReader';
import { LabelReadError } from './labelReader';

const image = 'data:image/jpeg;base64,QUJD';

const okResponse = (text: string) => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content: text } }] })
});

describe('readPhotosWithOpenRouter', () => {
  it('envoie les photos avec la liste de modèles gratuits et la clé', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: { body: string; headers: Record<string, string> }) =>
      okResponse('{"mode":"label","unit":"g","kcal":120,"protein":3,"carbs":20,"fat":2}')
    );
    await readPhotosWithOpenRouter([image, image], 'sk-or-test', fetchMock as never);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer sk-or-test');
    const body = JSON.parse(init.body);
    expect(body.models).toEqual(OPENROUTER_MODELS);
    expect(body.messages[0].content.map((part: { type: string }) => part.type)).toEqual(['text', 'image_url', 'image_url']);
    expect(body.messages[0].content[1].image_url.url).toBe(image);
  });

  it('lit la réponse JSON entourée de balises de code', async () => {
    const fetchMock = vi.fn(async () =>
      okResponse('```json\n{"mode":"label","unit":"g","kcal":452,"protein":9.5,"carbs":62,"fat":17,"potassium_mg":400,"potassium_source":"label"}\n```')
    );
    const result = await readPhotosWithOpenRouter([image], 'k', fetchMock as never);
    expect(result).toMatchObject({ kcal: 452, potassium: 400, estimated: false });
  });

  it("explique une limite gratuite atteinte (429)", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 429, json: async () => ({}) }));
    await expect(readPhotosWithOpenRouter([image], 'k', fetchMock as never)).rejects.toThrow(/Limite gratuite/);
  });

  it("signale une erreur envoyée avec un code 200", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ error: { code: 401 } }) }));
    await expect(readPhotosWithOpenRouter([image], 'k', fetchMock as never)).rejects.toThrow(/Clé refusée/);
  });

  it('signale une réponse sans valeurs exploitables', async () => {
    const fetchMock = vi.fn(async () => okResponse('Désolé.'));
    await expect(readPhotosWithOpenRouter([image], 'k', fetchMock as never)).rejects.toBeInstanceOf(LabelReadError);
  });
});
