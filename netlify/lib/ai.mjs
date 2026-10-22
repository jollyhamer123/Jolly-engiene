import { generateAnswer } from './gemini.mjs';

export async function generateWithFallback(createGemini, createOpenAI, parameters) {
  try {
    return await generateAnswer(createGemini(), parameters);
  } catch (error) {
    const status = Number(error.status || error.code);
    // A separate Gateway provider can keep AI available when Gemini's key,
    // quota, model route, or service is unavailable. Invalid requests aren't retried.
    if (![401, 403, 404, 429, 500, 502, 503, 504].includes(status) && !/api key|timeout|timed out|fetch failed/i.test(error.message || '')) throw error;
    const response = await createOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: parameters.config.systemInstruction },
        ...parameters.contents.map(message => ({
          role: message.role === 'model' ? 'assistant' : 'user',
          content: message.parts.map(part => part.text || '').join('\n')
        }))
      ],
      max_tokens: parameters.config.maxOutputTokens
    }, { timeout: 20000, maxRetries: 0 });
    return { text: response.choices?.[0]?.message?.content || '' };
  }
}
