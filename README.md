# Jolly Engine — Jolly AI

A desktop browser/search project built with Electron. It includes the refreshed Jolly Engine search-home layout, browser navigation, search results, bookmarks, and a Jolly AI sidebar.

## Requirements

- Node.js 20+ (recommended)
- npm
- An OpenAI API key for AI answers
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

### OpenAI API

Set an API key in the Jolly Engine settings window, or set `OPENAI_API_KEY` before launching:

**Windows PowerShell**
```powershell
$env:OPENAI_API_KEY="your-openai-key"
npm start
```

**macOS / Linux**
```bash
OPENAI_API_KEY="your-openai-key" npm start
```

An API key is not included. OpenAI API usage may cost money and is separate from a ChatGPT subscription.

## Important limitations and security notes

- This is a functional starter project, not a full Chrome replacement.
- The in-app webpage uses an iframe. Many websites (including sites that set `X-Frame-Options` or restrictive Content Security Policy headers) refuse to load inside frames. Use the full Google Search link or open the site externally where needed. A production Electron browser should use Electron's `WebContentsView`/webview architecture with carefully configured permissions and navigation controls.
- The app uses Electron's webview to load ordinary websites and can read page text for summarization when the site allows it. Some sites may still block embedding, automation, or script access.
- API keys entered in settings are saved in this app's local storage for convenience. Do not distribute a build containing personal API keys. For a public release, route AI and search requests through your own backend or use the operating system's secure credential store.
- Do not disable Electron security protections to make arbitrary sites work.
- Search-based answers use the retrieved result snippets as evidence; the assistant does not claim to have read every linked webpage unless that page text was actually supplied.


## Deploying the website on Netlify

The Netlify website uses `netlify/functions/search.js` for search. Commit that file with the rest of the project. In Netlify, set the publish directory to the folder containing `index.html` and ensure Netlify Functions are enabled (the default `netlify/functions` folder is detected automatically). For full web results, add `BRAVE_SEARCH_API_KEY` under **Site configuration → Environment variables**, then redeploy. Without a Brave key, the function uses DuckDuckGo Instant Answer, which may return only a limited number of results. Never put API keys directly in public source files.
