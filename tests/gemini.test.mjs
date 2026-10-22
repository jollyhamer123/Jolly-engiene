import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAnswer, GEMINI_MODELS } from '../netlify/lib/gemini.mjs';

function client(responses) {
  const calls = [];
  return { calls, models: { async generateContent(parameters) {
    calls.push(parameters);
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return next;
  } } };
}
function failure(status) { return Object.assign(new Error('Provider request failed'), { status }); }

test('uses the current Flash alias and preserves the question and configuration', async () => {
  const ai = client([{ text: 'Hello' }]);
  const parameters = { contents: 'Hello?', config: { maxOutputTokens: 4096 } };
  assert.deepEqual(await generateAnswer(ai, parameters), { text: 'Hello' });
  assert.deepEqual(ai.calls, [{ ...parameters, model: GEMINI_MODELS[0] }]);
});

test('recovers from an unavailable model using a supported fallback', async () => {
  const ai = client([failure(404), { text: 'An answer' }]);
  assert.equal((await generateAnswer(ai, { contents: 'Question' })).text, 'An answer');
  assert.deepEqual(ai.calls.map(call => call.model), GEMINI_MODELS);
  assert(ai.calls.every(call => call.contents === 'Question'));
});

test('reports failure if both supported models are unavailable', async () => {
  const ai = client([failure(404), failure(404)]);
  await assert.rejects(generateAnswer(ai, {}), { status: 404 });
  assert.equal(ai.calls.length, 2);
});

for (const status of [400, 401, 403, 429, 500]) {
  test(`does not retry provider error ${status}`, async () => {
    const ai = client([failure(status)]);
    await assert.rejects(generateAnswer(ai, {}), { status });
    assert.equal(ai.calls.length, 1);
  });
}
