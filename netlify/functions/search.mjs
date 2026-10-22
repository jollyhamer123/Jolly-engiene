import { searchImages } from '../lib/images.mjs';

export default async (request) => {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  const query = String(new URL(request.url).searchParams.get('query') || '').trim().slice(0, 500);
  if (!query) return json(400, { results: [], error: 'Enter something to search.' });

  if (new URL(request.url).searchParams.get('type') === 'images') return searchImages(query);

  const braveKey = String(Netlify.env.get('BRAVE_SEARCH_API_KEY') || '').trim();
  let warning = '';
  if (braveKey) {
    try {
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('count', '10');
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { Accept: 'application/json', 'X-Subscription-Token': braveKey }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error('Brave unavailable');
        error.status = response.status;
        throw error;
      }
      const results = (data.web?.results || []).map((item) => ({
        title: item.title || item.url,
        url: item.url,
        snippet: item.description || ''
      })).filter((item) => item.url);
      return json(200, { results, provider: 'Brave Search' });
    } catch (error) {
      warning = error.status === 429 ? 'Brave Search has reached its usage limit. Showing limited instant answers.' : [401, 403].includes(error.status) ? 'Brave Search rejected the server credential. Showing limited instant answers.' : 'Brave Search is temporarily unavailable. Showing limited instant answers.';
    }
  }

  try {
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('no_html', '1');
    url.searchParams.set('skip_disambig', '1');
    const response = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'JollyEngine/1.0' } });
    if (!response.ok) throw new Error(`DuckDuckGo returned HTTP ${response.status}`);
    const data = await response.json();
    const results = [];
    if (data.AbstractURL) results.push({ title: data.Heading || query, url: data.AbstractURL, snippet: data.AbstractText || 'Instant answer' });
    for (const topic of (data.RelatedTopics || [])) {
      if (topic.Text && topic.FirstURL) results.push({ title: topic.Text.split(' - ')[0], url: topic.FirstURL, snippet: topic.Text });
      else if (topic.Topics) for (const sub of topic.Topics) {
        if (sub.Text && sub.FirstURL) results.push({ title: sub.Text.split(' - ')[0], url: sub.FirstURL, snippet: sub.Text });
      }
    }
    return json(200, {
      results: results.slice(0, 10),
      provider: 'DuckDuckGo Instant Answer',
      warning: warning || 'Full web search is not configured. Showing limited instant answers.',
      error: results.length ? null : 'No instant-answer results were found. Add BRAVE_SEARCH_API_KEY in Netlify environment variables for full web search.'
    });
  } catch (error) {
    return json(502, { results: [], error: 'Search and instant answers are temporarily unavailable. Please try again.' });
  }
};

function json(statusCode, body) {
  return Response.json(body, { status: statusCode, headers: { 'Cache-Control': 'no-store' } });
}
