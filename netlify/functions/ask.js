exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  if (!process.env.OPENAI_API_KEY) {
    return { statusCode: 503, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "AI is not configured" }) };
  }
  try {
    const payload = JSON.parse(event.body || "{}");
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: "You are Jolly AI, the helpful assistant inside Jolly Engine. Be accurate, clear, and honest. You do not have live web access unless source material is supplied." }, ...messages.slice(-10)],
        temperature: 0.4
      })
    });
    const data = await response.json();
    if (!response.ok) return { statusCode: response.status, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: data.error?.message || "AI provider request failed" }) };
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: data.choices?.[0]?.message?.content || "No answer returned." }) };
  } catch (error) {
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Server error" }) };
  }
};
