# Jolly Engine — Jolly AI

A desktop browser/search project built with Electron. It includes the refreshed Jolly Engine search-home layout, browser navigation, search results, a closable tab bar, private history and bookmarks, and a dedicated Jolly AI page.

## Requirements

- Node.js 20+ (recommended)
- npm
- Shared Gemini AI is served by the Netlify backend; visitors need no API key
- A Brave Search API key for comprehensive web search (optional but recommended)

## Run it

1. Install Node.js from https://nodejs.org/
2. Open a terminal in this folder.
3. Run:

   ```bash
   npm install
   npm start
   ```

## Configure real web search and AI

### Brave Search (recommended for actual web result listings)

Create a Brave Search API key at https://brave.com/search/api/ . Set it before starting Jolly Engine:

**Windows PowerShell**
```powershell
$env:BRAVE_SEARCH_API_KEY="your-brave-key"
npm start
```

**macOS / Linux**
```bash
BRAVE_SEARCH_API_KEY="your-brave-key" npm start
```

Without this key, Jolly uses DuckDuckGo's public Instant Answer API, which is limited and is not a full search-results API. The interface also offers a Google Search link.

### Shared Gemini AI

All AI features use `netlify/functions/ask.mjs`, including the desktop app, which calls the hosted backend. Visitors do not enter keys or choose models. The function uses the supported `gemini-flash-latest` alias through Netlify AI Gateway by default. If that model returns 404, it tries `gemini-3.1-flash-lite`. Authentication and usage-limit errors are reported without retrying another model.

To use your own Gemini API key, set `GEMINI_API_KEY` privately in the Netlify project's environment variables with Functions scope, then redeploy. The Google SDK automatically uses the configured key instead of gateway credentials. Never place keys in HTML, source files, or desktop builds. No key is included in this repository.

## Important limitations and security notes

- This is a functional starter project, not a full Chrome replacement.
- The in-app webpage uses an iframe. Many websites (including sites that set `X-Frame-Options` or restrictive Content Security Policy headers) refuse to load inside frames. Use the full Google Search link or open the site externally where needed. A production Electron browser should use Electron's `WebContentsView`/webview architecture with carefully configured permissions and navigation controls.
- The app uses Electron's webview to load ordinary websites and can read page text for summarization when the site allows it. Some sites may still block embedding, automation, or script access.
- Do not disable Electron security protections to make arbitrary sites work.
- Search-based answers use the retrieved result snippets as evidence; the assistant does not claim to have read every linked webpage unless that page text was actually supplied.


## Deploying the website on Netlify

The Netlify website uses `netlify/functions/search.js` for search. Commit that file with the rest of the project. In Netlify, set the publish directory to the folder containing `index.html` and ensure Netlify Functions are enabled (the default `netlify/functions` folder is detected automatically). For full web results, add `BRAVE_SEARCH_API_KEY` under **Site configuration → Environment variables**, then redeploy. Without a Brave key, the function uses DuckDuckGo Instant Answer, which may return only a limited number of results. Never put API keys directly in public source files.


## Tabs, history, and bookmarks

The tab bar supports creating, switching, and closing Jolly tabs. Closing the final tab opens a fresh home tab. Back and forward follow each tab's searches and AI questions. On the website, third-party websites open in separate browser tabs because many sites block embedding; their links still appear in Jolly history and can be bookmarked. Electron continues to open pages in its embedded webview.

History and bookmarks use Netlify Database with generated migrations. An anonymous, HttpOnly browser cookie isolates each visitor's records without signup. Saved items remain available in that browser while the cookie exists; clearing cookies removes access. The History and Bookmarks menus support opening and removing items, and history can be cleared. Records are never shared between visitors. The interface shows the 200 most recent records in each list; history retains its most recent 200 entries.

If AI shows a visitor-access error, reload to refresh any site protection session. For public AI access, a project owner or developer with access can set the project's visitor access to Public in the Netlify dashboard. An HTML 401 response occurs before the Gemini function runs; changing an API key does not remove site access protection. AI now explains these errors separately from provider usage limits, timeouts, and missing server configuration.
