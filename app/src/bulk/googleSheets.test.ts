import { expect, it, vi } from 'vitest';
import { dayRow, writeDay } from './googleSheets';
import { daySignature, type BulkMeal } from './store';

const sheet = { id: 'new-file', title: 'Nutrition', url: 'https://docs.google.com/spreadsheets/d/new-file/edit' };
const meal: BulkMeal = { id: 'a', date: '2026-11-10', time: '12:00', name: '=danger()', quantity: 100, unit: 'g', values: { kcal: 100, protein: 10, carbs: 5, fat: 2 }, estimated: true, notes: 'rice' };

const gridInfo = (columnCount = 13) => ({
  sheets: [{ properties: { title: 'Daily', sheetId: 0, gridProperties: { rowCount: 1000, columnCount } } }]
});

it('retries the same date at the same row after an uncertain write, with RAW cells', async () => {
  let rows: unknown[][] = []; let failOnce = true;
  const api = vi.fn(async (path: string, init?: RequestInit): Promise<unknown> => {
    if (path.includes('fields=')) return gridInfo();
    if (!init) return { values: structuredClone(rows) };
    const body = JSON.parse(String(init.body));
    if (decodeURIComponent(path).includes('A1:M1')) { rows[0] = body.values[0]; return {}; }
    rows[1] = body.values[0];
    if (failOnce) { failOnce = false; throw new Error('Lost response after server wrote it'); }
    return {};
  });
  await expect(writeDay(sheet, meal.date, [meal], { api })).rejects.toThrow('Lost response');
  const confirmation = await writeDay(sheet, meal.date, [{ ...meal, quantity: 200 }], { api, weightKg: 75.5 });
  expect(rows).toHaveLength(2);
  expect(rows[1][1]).toBe(200);
  expect(rows[1][12]).toBe(75.5);
  expect(confirmation.signature).toBe(daySignature([{ ...meal, quantity: 200 }], 75.5));
  const writes = api.mock.calls.filter(([, init]) => init?.method === 'PUT');
  expect(writes.every(([path]) => path.includes('valueInputOption=RAW'))).toBe(true);
  expect(writes.at(-1)![0]).toContain(encodeURIComponent('Daily!A2:M2'));
});

it('never overwrites an unrelated layout or duplicate date rows', async () => {
  const badLayout = vi.fn(async (path: string) => path.includes('fields=') ? gridInfo() : { values: [['My historical data']] });
  await expect(writeDay(sheet, meal.date, [meal], { api: badLayout })).rejects.toThrow(/structure/);
  expect(badLayout).toHaveBeenCalledTimes(2);
  let headers: unknown[] = [];
  await writeDay(sheet, meal.date, [meal], { api: async (path, init) => {
    if (path.includes('fields=')) return gridInfo();
    if (!init) return { values: [] };
    const row = JSON.parse(String(init.body)).values[0];
    if (row[0] === 'Date') headers = row;
    return {};
  } });
  const duplicate = vi.fn(async (path: string) => path.includes('fields=') ? gridInfo() : { values: [headers, [meal.date], [meal.date]] });
  await expect(writeDay(sheet, meal.date, [meal], { api: duplicate })).rejects.toThrow(/plusieurs/);
  expect(duplicate).toHaveBeenCalledTimes(2);
});

it('adds an optional weight column to older app sheets and updates the original date row', async () => {
  const legacyHeaders = ['Date', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Sugars recorded (g)', 'Sugar coverage', 'Foods', 'Notes', 'Entries', 'Updated at', 'Nutrition App v1'];
  const api = vi.fn(async (path: string, init?: RequestInit) => {
    if (path.includes('fields=')) return gridInfo(12);
    if (!init) return { values: [legacyHeaders, [meal.date]] };
    return {};
  });

  await writeDay(sheet, meal.date, [meal], { api, weightKg: 75 });
  const requests = api.mock.calls.filter(([, init]) => init?.body);
  expect(JSON.parse(String(requests[0][1]?.body)).requests).toEqual([
    { appendDimension: { sheetId: 0, dimension: 'COLUMNS', length: 1 } }
  ]);
  expect(JSON.parse(String(requests[1][1]?.body)).values[0]).toEqual([...legacyHeaders, 'Weight (kg)']);
  expect(decodeURIComponent(requests[2][0])).toContain('Daily!A2:M2');
  expect(JSON.parse(String(requests[2][1]?.body)).values[0][12]).toBe(75);
});

it('writes a zero day after its last meal is deleted and keeps unknown sugar blank', () => {
  const empty = dayRow(meal.date, [], 'now');
  expect(empty.slice(0, 6)).toEqual([meal.date, 0, 0, 0, 0, '']);
  expect(empty[9]).toBe(0);
  expect(dayRow(meal.date, [meal], 'now')[5]).toBe('');
  expect(dayRow(meal.date, [{ ...meal, values: { ...meal.values, sugars: 0 } }], 'now')[5]).toBe(0);
});

it('changes the pending signature for edits/deletions but not for record ordering', () => {
  const second = { ...meal, id: 'b', name: 'Milk' };
  expect(daySignature([meal, second])).toBe(daySignature([second, meal]));
  expect(daySignature([meal])).not.toBe(daySignature([{ ...meal, quantity: 200 }]));
  expect(daySignature([meal])).not.toBe(daySignature([]));
});

it('creates or relinks an app spreadsheet with file-only access and keeps tokens out of storage', async () => {
  vi.resetModules(); vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client'); vi.useFakeTimers(); localStorage.clear();
  const configs: { scope: string; client_id: string; callback: (value: { access_token: string; expires_in: number }) => void }[] = [];
  const revoke = vi.fn((_token: string, done: () => void) => done());
  window.google = { accounts: { oauth2: {
    initTokenClient: config => { configs.push(config); return { requestAccessToken: () => config.callback({ access_token: 'memory-only-token', expires_in: 3600 }) }; }, revoke
  } } };
  const fetcher = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response('{"spreadsheetId":"created-file"}', { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  const api = await import('./googleSheets');
  try {
    await api.connectGoogle();
    expect(configs[0].scope).toBe('https://www.googleapis.com/auth/drive.file');
    expect(api.googleConnected()).toBe(true);
    const created = await api.createHistorySheet();
    await api.createHistorySheet();
    expect(created.id).toBe('created-file');
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][0]).toBe('https://sheets.googleapis.com/v4/spreadsheets');
    expect(fetcher.mock.calls[0][1]?.method).toBe('POST');
    expect(localStorage.getItem('bulkHistorySheet')).not.toContain('memory-only-token');

    fetcher.mockClear();
    await expect(api.linkHistorySheet('https://docs.google.com.example/spreadsheets/d/old-file/edit')).rejects.toThrow(/lien/);
    expect(fetcher).not.toHaveBeenCalled();

    fetcher.mockResolvedValueOnce(new Response(JSON.stringify(gridInfo())));
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ values: [['Unrelated history']] })));
    await expect(api.linkHistorySheet('https://docs.google.com/spreadsheets/d/unrelated/edit')).rejects.toThrow(/structure/);
    expect(api.getHistorySheet()).toEqual(created);

    fetcher.mockClear();
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ ...gridInfo(), properties: { title: 'My KOUL history' } })));
    fetcher.mockResolvedValueOnce(new Response('{}'));
    const linked = await api.linkHistorySheet('https://docs.google.com/spreadsheets/d/old-file/edit?gid=0#gid=0');
    expect(linked).toEqual({ id: 'old-file', url: 'https://docs.google.com/spreadsheets/d/old-file/edit', title: 'My KOUL history' });
    expect(api.getHistorySheet()).toEqual(linked);
    expect(await api.createHistorySheet()).toEqual(linked);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.every(([url, init]) => String(url).includes('/old-file') && !init?.method)).toBe(true);
    expect(configs).toHaveLength(1);

    vi.advanceTimersByTime(3540_000);
    expect(api.googleConnected()).toBe(false);
  } finally {
    api.disconnectGoogle(); delete window.google;
    vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers();
  }
});
