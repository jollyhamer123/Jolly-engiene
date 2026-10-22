import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWithFallback } from '../netlify/lib/ai.mjs';

const parameters = { contents: [{ role: 'model', parts: [{ text: 'Earlier answer' }] }, { role: 'user', parts: [{ text: 'Hello?' }] }], config: { systemInstruction: 'Be helpful.', maxOutputTokens: 4096 } };
for (const status of [401, 403, 429, 503]) {
  test(`Gemini ${status} uses a separate Gateway provider and preserves context`, async () => {
    const gemini = () => ({ models: { generateContent() { throw Object.assign(new Error('Unavailable'), { status }); } } });
    const openai = () => ({ chat: { completions: { async create(payload, options) {
      assert.equal(payload.model, 'gpt-4.1-mini');
      assert.deepEqual(payload.messages.map(m => m.role), ['system', 'assistant', 'user']);
      assert.equal(payload.messages[2].content, 'Hello?');
      assert.equal(options.maxRetries, 0);
      return { choices: [{ message: { content: 'Hello!' } }] };
    } } } });
    assert.equal((await generateWithFallback(gemini, openai, parameters)).text, 'Hello!');
  });
}
test('successful Gemini response does not invoke fallback', async () => {
  assert.equal((await generateWithFallback(() => ({ models: { async generateContent() { return { text: 'Hi' }; } } }), () => { throw new Error('Unexpected fallback'); }, parameters)).text, 'Hi');
});
test('malformed provider request is not retried', async () => {
  await assert.rejects(generateWithFallback(() => ({ models: { generateContent() { throw Object.assign(new Error('Bad request'), { status: 400 }); } } }), () => { throw new Error('Unexpected fallback'); }, parameters), { status: 400 });
});
