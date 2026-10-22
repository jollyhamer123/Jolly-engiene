// Supported Gemini models: the alias follows Google's current Flash release.
export const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];

export async function generateAnswer(ai, parameters) {
  for (let index = 0; index < GEMINI_MODELS.length; index++) {
    try {
      return await ai.models.generateContent({ ...parameters, model: GEMINI_MODELS[index] });
    } catch (error) {
      // Only try another model when this model/route is unavailable. Retrying
      // authentication, quota, or malformed-request errors cannot fix them.
      if (Number(error.status || error.code) !== 404 || index === GEMINI_MODELS.length - 1) throw error;
    }
  }
}
