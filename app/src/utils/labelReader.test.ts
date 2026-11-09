import { describe, it, expect, vi } from 'vitest';
import { parseLabelResponse, readLabel, readFoodPhotos, LabelReadError } from './labelReader';

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
        potassium_mg: 400,
        potassium_source: 'label'
      })
    );
    expect(result).toEqual({
      estimated: false,
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

describe('parseLabelResponse : code-barres', () => {
  const base = { kcal: 100, protein: 1, carbs: 1, fat: 1 };

  it('garde un EAN-13 valide', () => {
    expect(parseLabelResponse(JSON.stringify({ ...base, barcode: '3017620422003' }))?.barcode).toBe('3017620422003');
  });

  it('garde un EAN-8 et un UPC-A valides', () => {
    expect(parseLabelResponse(JSON.stringify({ ...base, barcode: '96385074' }))?.barcode).toBe('96385074');
    expect(parseLabelResponse(JSON.stringify({ ...base, barcode: '036000291452' }))?.barcode).toBe('036000291452');
  });

  it('nettoie les espaces écrits dans le code', () => {
    expect(parseLabelResponse(JSON.stringify({ ...base, barcode: '3 017620 422003' }))?.barcode).toBe('3017620422003');
  });

  it('écarte un code dont la clé de contrôle est fausse', () => {
    expect(parseLabelResponse(JSON.stringify({ ...base, barcode: '3017620422004' }))?.barcode).toBeUndefined();
  });

  it('écarte un code de longueur impossible', () => {
    expect(parseLabelResponse(JSON.stringify({ ...base, barcode: '12345' }))?.barcode).toBeUndefined();
  });
});

describe('parseLabelResponse : poids et estimation', () => {
  it('lit le poids affiché sur la balance quand il y a une étiquette', () => {
    const result = parseLabelResponse('{"kcal":450,"protein":10,"carbs":50,"fat":20,"weight_g":85}');
    expect(result).toMatchObject({ weight: 85, estimated: false });
  });

  it('convertit une estimation de repas en valeurs pour 100 g', () => {
    const result = parseLabelResponse(
      JSON.stringify({ mode: 'estimate', total_kcal: 600, total_protein: 30, total_carbs: 60, total_fat: 25, weight_g: 300 })
    );
    expect(result).toMatchObject({ estimated: true, weight: 300, kcal: 200, protein: 10, carbs: 20 });
    expect(result?.fat).toBeCloseTo(8.3, 1);
  });

  it("marque le potassium comme estimé quand il ne vient pas de l'étiquette", () => {
    const result = parseLabelResponse('{"kcal":120,"protein":3,"carbs":20,"fat":2,"potassium_mg":300,"potassium_source":"estimate"}');
    expect(result).toMatchObject({ potassium: 300, potassiumEstimated: true });
  });

  it("ne marque pas le potassium lu sur l'étiquette comme estimé", () => {
    const result = parseLabelResponse('{"kcal":120,"protein":3,"carbs":20,"fat":2,"potassium_mg":300,"potassium_source":"label"}');
    expect(result?.potassiumEstimated).toBeUndefined();
  });

  it("estime aussi le potassium d'un repas photographié, ramené à 100 g", () => {
    const result = parseLabelResponse(
      JSON.stringify({ mode: 'estimate', total_kcal: 600, total_protein: 30, total_carbs: 60, total_fat: 25, total_potassium_mg: 900, weight_g: 300 })
    );
    expect(result).toMatchObject({ potassium: 300, potassiumEstimated: true });
  });

  it("estime le sodium quand ni le sel ni le sodium ne sont écrits", () => {
    const result = parseLabelResponse('{"kcal":120,"protein":3,"carbs":20,"fat":2,"sodium_mg":250,"sodium_source":"estimate"}');
    expect(result).toMatchObject({ sodium: 250, sodiumEstimated: true });
  });

  it("garde le sel de l'étiquette et ignore un sodium estimé en plus", () => {
    const result = parseLabelResponse('{"kcal":120,"protein":3,"carbs":20,"fat":2,"salt_g":1.2,"sodium_mg":480,"sodium_source":"estimate"}');
    expect(result?.salt).toBe(1.2);
    expect(result?.sodium).toBeUndefined();
    expect(result?.sodiumEstimated).toBeUndefined();
  });

  it("estime aussi le sodium d'un repas photographié, ramené à 100 g", () => {
    const result = parseLabelResponse(
      JSON.stringify({ mode: 'estimate', total_kcal: 600, total_protein: 30, total_carbs: 60, total_fat: 25, total_sodium_mg: 1500, weight_g: 300 })
    );
    expect(result).toMatchObject({ sodium: 500, sodiumEstimated: true });
  });

  it('refuse une estimation sans poids', () => {
    const result = parseLabelResponse(JSON.stringify({ mode: 'estimate', total_kcal: 600, total_protein: 30, total_carbs: 60, total_fat: 25 }));
    expect(result).toBeNull();
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

  it('envoie plusieurs photos dans la même demande', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ kcal: 450, protein: 10, carbs: 50, fat: 20 }));
    await readFoodPhotos([image, 'data:image/jpeg;base64,REVG'], 'ma-cle', fetchMock);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const images = body.contents[0].parts.filter((part: { inline_data?: unknown }) => part.inline_data);
    expect(images).toHaveLength(2);
    expect(images[1].inline_data.data).toBe('REVG');
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
