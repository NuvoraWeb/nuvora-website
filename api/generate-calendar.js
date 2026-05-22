// --- CORS ---
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://nuvoraweb.co.za');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { token, biz, industry, month } = req.body;
  if (token !== process.env.DASHBOARD_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  const prompt = `You are a South African social media manager. Create a 30-day social media content calendar for "${biz}", a ${industry} business in South Africa.\n\nReturn ONLY a valid JSON array of exactly 30 objects. No markdown, no explanation, just the raw JSON array. Each object must have: day (integer 1-30), type (promo|edu|engage|story), platform (Facebook|Instagram|Both), copy (2-4 sentences with emojis and 2-3 SA-relevant hashtags), imagePrompt (one sentence describing ideal image).\n\nMix: 8 promo, 8 edu, 8 engage, 6 story. Make content specific to ${industry} in South Africa.`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 8000, messages: [{ role: "user", content: prompt }] })
    });
    const data = await r.json();
    const text = data.content[0].text.replace(/```json|```/g, "").trim();
    const posts = JSON.parse(text);
    res.json({ posts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}