const webUrl = value => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
};
const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function searchImages(query) {
  const key = Netlify.env.get('BRAVE_SEARCH_API_KEY')?.trim();
  let warning = '';
  if (key) {
    try {
      const url = new URL('https://api.search.brave.com/res/v1/images/search');
      url.searchParams.set('q', query);
      url.searchParams.set('count', '30');
      url.searchParams.set('safesearch', 'strict');
      const response = await fetch(url, { headers: { Accept: 'application/json', 'X-Subscription-Token': key }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Brave images unavailable');
      const data = await response.json();
      const results = (data.results || []).map(item => ({ title: item.title || 'Image', url: webUrl(item.url), thumbnail: webUrl(item.thumbnail?.src || item.properties?.url), image: webUrl(item.properties?.url), source: item.source || '' })).filter(item => item.url && item.thumbnail);
      return reply({ results, provider: 'Brave Images' });
    } catch { warning = 'Brave Images is unavailable. Showing Wikimedia Commons images.'; }
  } else warning = 'Showing Wikimedia Commons images. Full Brave image search requires server configuration.';
  try {
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    for (const [key, value] of Object.entries({ action: 'query', format: 'json', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '24', prop: 'imageinfo', iiprop: 'url', iiurlwidth: '600' })) url.searchParams.set(key, value);
    const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'JollyEngine/1.0 (image search)' }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Commons unavailable');
    const data = await response.json();
    if (data.error) throw new Error('Commons search failed');
    const results = Object.values(data.query?.pages || {}).sort((a,b) => (a.index || 0)-(b.index || 0)).map(item => {
      const image = item.imageinfo?.[0];
      return { title: (item.title || 'Image').replace(/^File:/, ''), url: webUrl(image?.descriptionurl), thumbnail: webUrl(image?.thumburl || image?.url), image: webUrl(image?.url), source: 'Wikimedia Commons' };
    }).filter(item => item.url && item.thumbnail);
    return reply({ results, provider: 'Wikimedia Commons', warning });
  } catch { return reply({ results: [], error: 'Image search is temporarily unavailable. Please try again.' }, 502); }
}
