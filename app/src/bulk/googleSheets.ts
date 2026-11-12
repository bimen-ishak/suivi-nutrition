import { t } from '../i18n';
import { daySignature, totalValues, type BulkMeal } from './store';

export interface HistorySheet { id: string; url: string; title: string }
type Token = { access_token: string; expires_in: number; error?: string };
type GoogleIdentity = { accounts: { oauth2: {
  initTokenClient: (config: { client_id: string; scope: string; callback: (token: Token) => void; error_callback: () => void }) => { requestAccessToken: (options: { prompt: string }) => void };
  revoke: (token: string, callback: () => void) => void;
} } };
declare global { interface Window { google?: GoogleIdentity } }

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const HEADERS = ['Date', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Sugars recorded (g)', 'Sugar coverage', 'Foods', 'Notes', 'Entries', 'Updated at', 'Nutrition App v1', 'Weight (kg)'];
let accessToken = '';
let expiresAt = 0;
let tokenExpiryTimer: ReturnType<typeof setTimeout> | undefined;
let loadingScript: Promise<void> | null = null;
let syncing = false;
const changed = () => window.dispatchEvent(new Event('bulk-google-state'));
export const googleConfigured = () => !!CLIENT_ID?.trim();
export const googleConnected = () => !!accessToken && Date.now() < expiresAt;
export function getHistorySheet(): HistorySheet | null {
  try {
    const sheet = JSON.parse(localStorage.getItem('bulkHistorySheet') ?? 'null');
    if (!sheet || typeof sheet.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(sheet.id)) return null;
    return { id: sheet.id, url: `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`, title: typeof sheet.title === 'string' ? sheet.title : 'Nutrition' };
  } catch { return null; }
}
function loadIdentity(): Promise<void> {
  if (window.google?.accounts.oauth2) return Promise.resolve();
  if (loadingScript) return loadingScript;
  loadingScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    const timeout = setTimeout(() => { script.remove(); loadingScript = null; reject(new Error(t('Connexion Google indisponible. Réessaie avec Internet.'))); }, 15000);
    script.onload = () => {
      clearTimeout(timeout);
      if (!window.google?.accounts.oauth2) { loadingScript = null; reject(new Error(t('Connexion Google indisponible. Réessaie avec Internet.'))); return; }
      resolve();
    };
    script.onerror = () => { clearTimeout(timeout); script.remove(); loadingScript = null; reject(new Error(t('Connexion Google indisponible. Réessaie avec Internet.'))); };
    document.head.appendChild(script);
  });
  return loadingScript;
}
export async function connectGoogle(): Promise<void> {
  if (!CLIENT_ID) throw new Error(t('La connexion Google doit être configurée pour cette application.'));
  await loadIdentity();
  await new Promise<void>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPE,
      callback: token => {
        if (token.error || !token.access_token) { reject(new Error(t('Autorisation Google refusée. Ton journal local reste disponible.'))); return; }
        accessToken = token.access_token; expiresAt = Date.now() + Math.max(0, token.expires_in - 60) * 1000;
        clearTimeout(tokenExpiryTimer);
        tokenExpiryTimer = setTimeout(() => { accessToken = ''; expiresAt = 0; changed(); }, Math.max(0, expiresAt - Date.now()));
        changed(); resolve();
      }, error_callback: () => reject(new Error(t('Connexion Google annulée ou bloquée. Réessaie.')))
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
}
export function disconnectGoogle() {
  clearTimeout(tokenExpiryTimer);
  if (accessToken) window.google?.accounts.oauth2.revoke(accessToken, () => {});
  accessToken = ''; expiresAt = 0; changed();
}

async function request(path: string, init: RequestInit = {}, fetcher: typeof fetch = fetch): Promise<unknown> {
  if (!googleConnected()) throw new Error(t('Reconnecte Google pour envoyer les modifications.'));
  let response: Response;
  try {
    response = await fetcher(`${BASE}${path}`, { ...init, signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
  } catch {
    throw new Error(t('Google Sheets n’a pas confirmé l’enregistrement. Tes données restent sur cet appareil.'));
  }
  if (!response.ok) {
    if (response.status === 401) { accessToken = ''; expiresAt = 0; changed(); }
    throw new Error(response.status === 401 ? t('Reconnecte Google pour envoyer les modifications.') : t('Google Sheets n’a pas confirmé l’enregistrement. Tes données restent sur cet appareil.'));
  }
  return response.json();
}
function saveHistorySheet(id: string, title: string): HistorySheet {
  const sheet = { id, title, url: `https://docs.google.com/spreadsheets/d/${id}/edit` };
  localStorage.setItem('bulkHistorySheet', JSON.stringify(sheet));
  changed();
  return sheet;
}

export async function createHistorySheet(): Promise<HistorySheet> {
  const existing = getHistorySheet();
  if (existing) return existing;
  const title = `Nutrition · ${new Date().toLocaleDateString()}`;
  const result = await request('', { method: 'POST', body: JSON.stringify({ properties: { title }, sheets: [{ properties: { title: 'Daily', gridProperties: { rowCount: 1000, columnCount: HEADERS.length, frozenRowCount: 1 } } }] }) }) as { spreadsheetId?: string };
  if (!result.spreadsheetId) throw new Error(t('Google n’a pas renvoyé le lien du nouveau fichier.'));
  return saveHistorySheet(result.spreadsheetId, title);
}

const badLayout = () => new Error(t('La structure du tableau a changé. Aucun contenu n’a été écrasé.'));

async function readDailySheet(sheetPath: string, api: typeof request) {
  const info = await api(`${sheetPath}?fields=properties(title),sheets(properties)`) as {
    properties?: { title?: string };
    sheets?: { properties?: { title: string; sheetId: number; gridProperties?: { rowCount: number; columnCount: number } } }[];
  };
  const daily = info.sheets?.find(item => item.properties?.title === 'Daily')?.properties;
  const grid = daily?.gridProperties;
  if (!daily || !grid || grid.columnCount < 12 || grid.rowCount < 1) throw badLayout();

  const lastColumn = grid.columnCount < HEADERS.length ? 'L' : 'M';
  const data = await api(`${sheetPath}/values/${encodeURIComponent(`Daily!A1:${lastColumn}`)}`) as { values?: unknown[][] };
  const rows = data.values ?? [];
  const header = rows[0];
  const current = JSON.stringify(header) === JSON.stringify(HEADERS);
  const legacy = header && JSON.stringify(header.slice(0, 12)) === JSON.stringify(HEADERS.slice(0, 12))
    && rows.every(row => row[12] === undefined || row[12] === '');
  if (header && !current && !legacy) throw badLayout();
  return { daily, grid, rows, current, title: info.properties?.title ?? 'Nutrition' };
}

export async function linkHistorySheet(link: string): Promise<HistorySheet> {
  const url = URL.canParse(link) ? new URL(link) : null;
  const match = url?.origin === 'https://docs.google.com' && url.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/edit)?\/?$/);
  if (!match) throw new Error(t('Colle le lien de ton fichier Google Sheets.'));

  if (!googleConnected()) await connectGoogle();
  const id = match[1];
  const { title } = await readDailySheet(`/${id}`, request);
  return saveHistorySheet(id, title);
}

export function dayRow(date: string, meals: BulkMeal[], updatedAt: string, weightKg?: number): (string | number)[] {
  const day = meals.filter(meal => meal.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const total = totalValues(day);
  return [date, total.kcal, total.protein, total.carbs, total.fat,
    day.some(m => m.values.sugars !== undefined) ? total.sugars ?? 0 : '',
    `${day.filter(m => m.values.sugars !== undefined).length}/${day.length}`,
    day.map(m => `${m.time} ${m.name}: ${m.quantity} ${m.unit}${m.estimated ? ' (estimated)' : ''}`).join('\n'),
    day.map(m => m.notes).filter(Boolean).join('\n'), day.length, updatedAt, 'v1', weightKg ?? ''];
}

/** Read before writing: retry updates the same date, including after an uncertain response. */
export async function writeDay(
  sheet: HistorySheet, date: string, meals: BulkMeal[],
  { weightKg, api = request }: { weightKg?: number; api?: typeof request } = {}
) {
  if (syncing) throw new Error(t('Une synchronisation est déjà en cours.'));
  syncing = true;
  try {
    const sheetPath = `/${encodeURIComponent(sheet.id)}`;
    const prefix = `${sheetPath}/values/`;
    const { daily, grid, rows, current } = await readDailySheet(sheetPath, api);

    const matches = rows.map((row, index) => row[0] === date ? index + 1 : -1).filter(row => row > 1);
    if (matches.length > 1) throw new Error(t('Cette date existe plusieurs fois dans le tableau. Corrige les doublons avant de réessayer.'));
    const updatedAt = new Date().toISOString();
    const row = matches[0] ?? Math.max(2, rows.length + 1);
    const extensions = [];
    if (grid.columnCount < HEADERS.length) {
      extensions.push({ appendDimension: { sheetId: daily.sheetId, dimension: 'COLUMNS', length: HEADERS.length - grid.columnCount } });
    }
    if (row > grid.rowCount) {
      extensions.push({ appendDimension: { sheetId: daily.sheetId, dimension: 'ROWS', length: 1000 } });
    }
    if (extensions.length) {
      await api(`${sheetPath}:batchUpdate`, { method: 'POST', body: JSON.stringify({ requests: extensions }) });
    }
    if (!current) {
      await api(`${prefix}${encodeURIComponent('Daily!A1:M1')}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values: [HEADERS] }) });
    }
    await api(`${prefix}${encodeURIComponent(`Daily!A${row}:M${row}`)}?valueInputOption=RAW`, {
      method: 'PUT', body: JSON.stringify({ values: [dayRow(date, meals, updatedAt, weightKg)] })
    });
    return { date, spreadsheetId: sheet.id, signature: daySignature(meals.filter(m => m.date === date), weightKg), syncedAt: updatedAt };
  } finally { syncing = false; }
}
