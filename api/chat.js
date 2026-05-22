// api/chat.js — Vercel serverless function
// Set ANTHROPIC_API_KEY in your Vercel environment variables

// --- CORS ---
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://nuvoraweb.co.za');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  const SYSTEM_PROMPT = `You are Nuvora's AI assistant — friendly, concise, and knowledgeable about Nuvora's services.

Nuvora is a South African AI website studio that builds and manages digital systems for SMEs.

PACKAGES:
- Presence: R1,499/mo — 5-page site, SSL hosting, WhatsApp form, Google Business, 2 updates/month
- Growth: R3,499/mo — Everything in Presence + lead capture, CRM, email automation, Google review filtering, AI chatbot, 5 updates/month
- Dominance: R6,999/mo — Everything in Growth + unlimited pages, AI video/image content, social calendar, performance dashboard, quarterly strategy call

KEY FACTS:
- No setup fees, cancel anytime with 30 days notice
- First draft delivered in 48 hours
- Rand pricing only, billed via Paystack
- Based in South Africa, serving clients nationwide
- Stack: Vercel, Supabase, Make.com, Resend, Higgsfield AI, Paystack, Cloudflare

INDUSTRIES: Weddings & Events, Fashion & Retail, Construction, Hospitality, Beauty & Wellness, Professional Services

YOUR JOB:
- Answer questions about services, pricing, and how it works
- Help visitors choose the right package
- Collect their name, email, and business name if they want a quote
- Be warm but concise — 2-3 sentences max per reply
- If someone is ready to enquire, direct them to the contact form or say you'll collect their details
- Never make up information not listed above

When collecting lead info, say: "Great — I'll need a few quick details to get you a quote. What's your name, email address, and business name?"`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic API error:', err);
      return res.status(500).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "Sorry, I didn't catch that — could you rephrase?";
    return res.status(200).json({ reply: text });

  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
