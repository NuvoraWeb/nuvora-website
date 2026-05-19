// api/lead.js — Vercel serverless function
// Set SUPABASE_URL, SUPABASE_ANON_KEY, MAKE_WEBHOOK_URL in Vercel env vars

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, business, industry, package: pkg, message, source } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const leadData = {
    name, email,
    phone: phone || null,
    business: business || null,
    industry: industry || null,
    package_interest: pkg || null,
    message: message || null,
    source: source || 'website',
    created_at: new Date().toISOString(),
  };

  const results = { supabase: null, webhook: null };

  // --- Save to Supabase ---
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const sbRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(leadData),
      });
      results.supabase = sbRes.ok ? 'saved' : 'error';
    } catch (e) {
      results.supabase = 'error';
      console.error('Supabase error:', e);
    }
  }

  // --- Trigger Make.com webhook ---
  if (process.env.MAKE_WEBHOOK_URL) {
    try {
      await fetch(process.env.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      results.webhook = 'triggered';
    } catch (e) {
      results.webhook = 'error';
      console.error('Make webhook error:', e);
    }
  }

  return res.status(200).json({ success: true, results });
}
