// Pin a stable supported release so alias changes cannot break Jolly AI.
export const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

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
