// Netlify serverless search endpoint for Jolly Engine.
// Set BRAVE_SEARCH_API_KEY in Netlify Site configuration > Environment variables
// for full web results. Without it, DuckDuckGo instant answers are used as a limited fallback.
exports.handler = async (event) => {
  const query = String(event.queryStringParameters?.query || '').trim().slice(0, 500);
  if (!query) return json(400, { results: [], error: 'Enter something to search.' });

  const braveKey = String(process.env.BRAVE_SEARCH_API_KEY || '').trim();
  if (braveKey) {
    try {
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('count', '10');
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Subscription-Token': braveKey }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return json(response.status, { results: [], error: data.message || `Brave Search returned HTTP ${response.status}. Check the BRAVE_SEARCH_API_KEY setting.` });
      }
      const results = (data.web?.results || []).map((item) => ({
        title: item.title || item.url,
        url: item.url,
        snippet: item.description || ''
      })).filter((item) => item.url);
      return json(200, { results, provider: 'Brave Search' });
    } catch (error) {
      return json(502, { results: [], error: `Web search failed: ${error.message}` });
    }
  }

  try {
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('no_html', '1');
    url.searchParams.set('skip_disambig', '1');
    const response = await fetch(url, { headers: { 'User-Agent': 'JollyEngine/1.0' } });
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
      error: results.length ? null : 'No instant-answer results were found. Add BRAVE_SEARCH_API_KEY in Netlify environment variables for full web search.'
    });
  } catch (error) {
    return json(502, { results: [], error: `Search request failed: ${error.message}` });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}
