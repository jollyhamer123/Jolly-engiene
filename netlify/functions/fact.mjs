// The provider selects one fact per day; no visitor data is stored.
export default async (request) => {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  try {
    const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/today?language=en', {
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('Daily fact unavailable');
    const data = await response.json();
    if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('Empty fact');
    let source = 'https://uselessfacts.jsph.pl/';
    try {
      const url = new URL(data.source_url);
      if (['https:', 'http:'].includes(url.protocol)) source = url.href;
    } catch {}
    return Response.json({ text: data.text, source, date: new Date().toISOString().slice(0, 10) }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch {
    return Response.json({ error: 'Today’s fun fact is unavailable. Please try again.' }, {
      status: 502, headers: { 'Cache-Control': 'no-store' }
    });
  }
};
