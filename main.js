const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#ffffff',
    title: 'Jolly Engine',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Website and desktop share the same search service and private server credential.
ipcMain.handle('jolly:search', async (_event, payload = {}) => {
  const query = String(typeof payload === 'string' ? payload : payload.query || '').trim().slice(0, 500);
  if (!query) return { results: [], error: 'Enter something to search.' };
  try {
    const response = await fetch('https://jollynet.netlify.app/.netlify/functions/search?query=' + encodeURIComponent(query) + (payload.type === 'images' ? '&type=images' : ''), { signal: AbortSignal.timeout(25000) });
    if (!(response.headers.get('content-type') || '').includes('application/json')) return { results: [], error: 'Search is unavailable. Reload the website and check site visitor access.' };
    return await response.json();
  } catch { return { results: [], error: 'Search could not connect. Please try again.' }; }
});

ipcMain.handle('jolly:fact', async () => {
  try {
    const response = await fetch('https://jollynet.netlify.app/.netlify/functions/fact', { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return { error: 'Today’s fun fact is unavailable. Please try again.' };
    return await response.json();
  } catch { return { error: 'Today’s fun fact could not connect. Please try again.' }; }
});

// Desktop users share the same server-side AI credentials as website visitors.
ipcMain.handle('jolly:ask', async (_event, payload = {}) => {
  try {
    const response = await fetch('https://jollynet.netlify.app/.netlify/functions/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: payload.question, messages: payload.messages,
        sources: payload.sources, pageText: payload.pageText }),
      signal: AbortSignal.timeout(55000)
    });
    if ([401, 403].includes(response.status)) return { error: 'Site access protection is blocking AI requests. The site owner needs to allow public visitor access in Netlify.' };
    if (!(response.headers.get('content-type') || '').includes('application/json')) return { error: 'The AI endpoint is unavailable. Please publish the latest website version.' };
    const data = await response.json();
    return response.ok ? data : { error: data.error || 'Jolly AI is temporarily unavailable. Please try again.' };
  } catch {
    return { error: 'Could not reach Jolly AI. Please try again.' };
  }
});

ipcMain.handle('jolly:library', async (_event, payload = {}) => {
  if (!['history', 'bookmark'].includes(payload.kind) || !['GET', 'POST', 'DELETE'].includes(payload.method)) return { error: 'Invalid saved item request.' };
  const url = new URL('https://jollynet.netlify.app/.netlify/functions/library');
  url.searchParams.set('kind', payload.kind);
  if (payload.id) url.searchParams.set('id', String(payload.id));
  try {
    const response = await session.defaultSession.fetch(url.toString(), {
      method: payload.method,
      headers: { 'Content-Type': 'application/json', 'Origin': url.origin },
      credentials: 'include',
      ...(payload.body ? { body: JSON.stringify(payload.body) } : {})
    });
    if (!(response.headers.get('content-type') || '').includes('application/json')) return { error: 'Saved items cannot connect. Check site visitor access in Netlify.' };
    return await response.json();
  } catch { return { error: 'Saved items could not connect. Please try again.' }; }
});

ipcMain.handle('jolly:openExternal', async (_event, url) => {
  try {
    const parsed = new URL(String(url));
    if (!['https:', 'http:'].includes(parsed.protocol)) return { error: 'Only web links can be opened.' };
    await shell.openExternal(parsed.toString());
    return { ok: true };
  } catch {
    return { error: 'That link is not valid.' };
  }
});
