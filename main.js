const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('node:path');

const SEARCH_API = 'https://api.search.brave.com/res/v1/web/search';

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

ipcMain.handle('jolly:search', async (_event, payload) => {
  const query = typeof payload === 'string' ? payload : payload?.query;
  const suppliedKey = typeof payload === 'object' ? String(payload?.apiKey || '') : '';
  const q = String(query || '').trim().slice(0, 500);
  if (!q) return { results: [], error: 'Enter something to search.' };

  // Brave Search API returns real web results. If no key is configured, use
  // DuckDuckGo's public instant-answer endpoint as a limited fallback.
  const braveKey = suppliedKey || process.env.BRAVE_SEARCH_API_KEY;
  if (braveKey) {
    try {
      const url = new URL(SEARCH_API);
      url.searchParams.set('q', q);
      url.searchParams.set('count', '10');
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey }
      });
      if (!response.ok) throw new Error(`Brave Search returned HTTP ${response.status}`);
      const data = await response.json();
      const results = (data.web?.results || []).map(r => ({
        title: r.title || r.url,
        url: r.url,
        snippet: r.description || ''
      })).filter(r => r.url);
      return { results, provider: 'Brave Search' };
    } catch (e) {
      return { results: [], error: `Web search failed: ${e.message}. Check BRAVE_SEARCH_API_KEY.` };
    }
  }

  try {
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('no_html', '1');
    url.searchParams.set('skip_disambig', '1');
    const response = await fetch(url, { headers: { 'User-Agent': 'JollyEngine/1.0' } });
    if (!response.ok) throw new Error(`DuckDuckGo returned HTTP ${response.status}`);
    const data = await response.json();
    const results = [];
    if (data.AbstractURL) results.push({
      title: data.Heading || q, url: data.AbstractURL,
      snippet: data.AbstractText || 'Instant answer'
    });
    for (const topic of (data.RelatedTopics || [])) {
      if (topic.Text && topic.FirstURL) {
        results.push({ title: topic.Text.split(' - ')[0], url: topic.FirstURL, snippet: topic.Text });
      } else if (topic.Topics) {
        for (const sub of topic.Topics) {
          if (sub.Text && sub.FirstURL) results.push({
            title: sub.Text.split(' - ')[0], url: sub.FirstURL, snippet: sub.Text
          });
        }
      }
    }
    return {
      results: results.slice(0, 10),
      provider: 'DuckDuckGo Instant Answer',
      error: results.length ? null :
        'DuckDuckGo instant answers did not return general web listings. Add a Brave Search API key for full web search, or use the Google Search link below.'
    };
  } catch (e) {
    return { results: [], error: `Search request failed: ${e.message}` };
  }
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
