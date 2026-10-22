import test from 'node:test';
import assert from 'node:assert/strict';
import search from '../netlify/functions/search.mjs';
import fact from '../netlify/functions/fact.mjs';

const request = (query = 'space') => new Request('https://example.com/.netlify/functions/search?query=' + encodeURIComponent(query));
const originalFetch = globalThis.fetch;
const originalNetlify = globalThis.Netlify;
test.afterEach(() => { globalThis.fetch = originalFetch; globalThis.Netlify = originalNetlify; });
test('rejects blank searches and unsupported methods', async () => {
  assert.equal((await search(request('  '))).status, 400);
  assert.equal((await search(new Request('https://example.com', { method: 'POST' }))).status, 405);
});
test('Brave returns normalized results with encoded query and server credential', async () => {
  globalThis.Netlify = { env: { get: () => 'test-credential' } };
  globalThis.fetch = async (url, options) => {
    assert.equal(url.searchParams.get('q'), 'stars & planets');
    assert.equal(options.headers['X-Subscription-Token'], 'test-credential');
    return Response.json({ web: { results: [{ title: 'Space', url: 'https://example.com', description: 'Stars' }] } });
  };
  const result = await (await search(request('stars & planets'))).json();
  assert.equal(result.provider, 'Brave Search');
  assert.equal(result.results[0].snippet, 'Stars');
});
test('Brave usage limit falls back without exposing provider error details', async () => {
  globalThis.Netlify = { env: { get: () => 'test-credential' } };
  globalThis.fetch = async url => url.hostname.includes('brave.com') ? Response.json({ message: 'private provider detail' }, { status: 429 }) : Response.json({ AbstractURL: 'https://example.com', AbstractText: 'An answer' });
  const response = await search(request());
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.provider, 'DuckDuckGo Instant Answer');
  assert.match(result.warning, /usage limit/);
  assert(!JSON.stringify(result).includes('private provider detail'));
});
test('missing Brave credential is reported with limited instant answers', async () => {
  globalThis.Netlify = { env: { get: () => undefined } };
  globalThis.fetch = async url => {
    assert.equal(url.hostname, 'api.duckduckgo.com');
    return Response.json({ RelatedTopics: [] });
  };
  const result = await (await search(request())).json();
  assert.match(result.warning, /not configured/);
  assert.equal(result.results.length, 0);
});
test('daily fact uses the daily endpoint and rejects unsafe source links', async () => {
  globalThis.fetch = async url => {
    assert.match(url, /facts\/today/);
    return Response.json({ text: 'A daily discovery.', source_url: 'javascript:alert(1)' });
  };
  const response = await fact(request());
  const data = await response.json();
  assert.equal(data.text, 'A daily discovery.');
  assert.equal(data.date, new Date().toISOString().slice(0, 10));
  assert.equal(data.source, 'https://uselessfacts.jsph.pl/');
});
test('daily fact provider failure returns a retryable error', async () => {
  globalThis.fetch = async () => { throw new Error('Network failure'); };
  assert.equal((await fact(request())).status, 502);
});
test('image search uses Brave image endpoint and filters unsafe URLs', async () => {
  globalThis.Netlify = { env: { get: () => 'test-credential' } };
  globalThis.fetch = async url => {
    assert.equal(url.pathname, '/res/v1/images/search');
    assert.equal(url.searchParams.get('safesearch'), 'strict');
    return Response.json({ results: [
      { title: 'Saturn', url: 'https://example.com/saturn', thumbnail: { src: 'https://example.com/thumb.jpg' } },
      { title: 'Unsafe', url: 'javascript:alert(1)', thumbnail: { src: 'https://example.com/thumb.jpg' } }
    ] });
  };
  const data = await (await search(new Request('https://example.com/search?query=Saturn&type=images'))).json();
  assert.equal(data.provider, 'Brave Images');
  assert.equal(data.results.length, 1);
  assert.equal(data.results[0].title, 'Saturn');
});
test('Brave image outage falls back to Commons with source pages', async () => {
  globalThis.Netlify = { env: { get: () => 'test-credential' } };
  globalThis.fetch = async url => url.hostname.includes('brave.com') ? Response.json({}, { status: 429 }) : Response.json({ query: { pages: { 1: { title: 'File:Saturn.jpg', imageinfo: [{ descriptionurl: 'https://commons.wikimedia.org/wiki/File:Saturn.jpg', thumburl: 'https://upload.wikimedia.org/saturn.jpg' }] } } } });
  const data = await (await search(new Request('https://example.com/search?query=Saturn&type=images'))).json();
  assert.equal(data.provider, 'Wikimedia Commons');
  assert.match(data.warning, /Brave Images is unavailable/);
  assert.equal(data.results[0].title, 'Saturn.jpg');
});
