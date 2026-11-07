import { describe, it, expect, vi } from 'vitest';
import { parseLabelResponse, readLabel, LabelReadError } from './labelReader';

describe('parseLabelResponse', () => {
  it('lit un JSON de valeurs pour 100 g', () => {
    const result = parseLabelResponse(
      JSON.stringify({
        name: 'Muesli croustillant',
        brand: 'Lidl',
        unit: 'g',
        kcal: 452,
        protein: 9.5,
        carbs: 62,
        sugars: 18,
        fat: 17,
        fiber: 7.2,
        salt_g: 0.1,
        sodium_mg: null,
        potassium_mg: 400
      })
    );
    expect(result).toEqual({
      name: 'Muesli croustillant',
      brand: 'Lidl',
      unit: 'g',
      kcal: 452,
      protein: 9.5,
      carbs: 62,
      sugars: 18,
      fat: 17,
      fiber: 7.2,
      salt: 0.1,
      potassium: 400
    });
  });

  it('retire les balises de code autour du JSON', () => {
    const result = parseLabelResponse('```json\n{"unit":"ml","kcal":42,"protein":0,"carbs":10,"fat":0}\n```');
    expect(result).toMatchObject({ unit: 'ml', kcal: 42, carbs: 10 });
  });

  it('accepte des nombres écrits avec une virgule', () => {
    const result = parseLabelResponse('{"kcal":"450","protein":"12,5","carbs":50,"fat":20}');
    expect(result?.protein).toBe(12.5);
  });

  it('prend le sodium en mg quand le sel est absent', () => {
    const result = parseLabelResponse('{"kcal":100,"protein":1,"carbs":1,"fat":1,"salt_g":null,"sodium_mg":320}');
    expect(result).toMatchObject({ sodium: 320 });
    expect(result?.salt).toBeUndefined();
  });

  it('écarte les valeurs impossibles pour 100 g', () => {
    const result = parseLabelResponse('{"kcal":4520,"protein":150,"carbs":62,"fat":17}');
    expect(result?.kcal).toBeUndefined();
    expect(result?.protein).toBeUndefined();
    expect(result?.carbs).toBe(62);
  });

  it('prend g quand l\'unité est inconnue', () => {
    expect(parseLabelResponse('{"unit":"oz","kcal":100}')?.unit).toBe('g');
  });

  it('renvoie null sans aucune valeur utile ou avec un texte invalide', () => {
    expect(parseLabelResponse('{"name":"Paquet","kcal":null}')).toBeNull();
    expect(parseLabelResponse('désolé, je ne vois pas')).toBeNull();
  });
});

const okResponse = (payload: object) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] })
});

describe('readLabel', () => {
  const image = 'data:image/jpeg;base64,QUJD';

  it('envoie la photo avec la clé dans l\'en-tête, jamais dans l\'adresse', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ unit: 'g', kcal: 450, protein: 10, carbs: 50, fat: 20 }));
    const result = await readLabel(image, 'ma-cle', fetchMock);

    expect(result.kcal).toBe(450);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).not.toContain('ma-cle');
    expect(options.headers['x-goog-api-key']).toBe('ma-cle');
    const body = JSON.parse(options.body);
    expect(body.contents[0].parts[1].inline_data).toEqual({ mime_type: 'image/jpeg', data: 'QUJD' });
  });

  it('essaie le modèle suivant quand le premier n\'existe plus', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce(okResponse({ kcal: 300, protein: 5, carbs: 40, fat: 10 }));
    const result = await readLabel(image, 'ma-cle', fetchMock);
    expect(result.kcal).toBe(300);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('explique une clé refusée', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });
    await expect(readLabel(image, 'mauvaise', fetchMock)).rejects.toThrow(/clé/i);
  });

  it('explique un quota dépassé', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    await expect(readLabel(image, 'ma-cle', fetchMock)).rejects.toThrow(/limite|quota/i);
  });

  it('prévient quand rien n\'est lisible sur la photo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ kcal: null }));
    await expect(readLabel(image, 'ma-cle', fetchMock)).rejects.toBeInstanceOf(LabelReadError);
  });
});
