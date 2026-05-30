// api/review-gate.js
// Google Review Filtering Gate
// 4-5 stars → redirect to Google review page
// 1-3 stars → capture feedback privately, notify owner via email

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://nuvoraweb.co.za');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { stars, feedback, clientName, clientEmail, businessName } = req.body;

  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Invalid star rating' });
  }

  const GOOGLE_REVIEW_URL = 'https://g.page/r/ChIJjdTpT3xflR4Rfzd06XcMsr0/review';

  // Happy customer (4-5 stars) → send to Google
  if (stars >= 4) {
    // Optionally log positive feedback to Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        await fetch(`${process.env.SUPABASE_URL}/rest/v1/review_feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            stars,
            type: 'positive',
            client_name: clientName || null,
            client_email: clientEmail || null,
            business_name: businessName || null,
            created_at: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.error('Supabase log error:', e);
      }
    }

    return res.status(200).json({ action: 'redirect', url: GOOGLE_REVIEW_URL });
  }

  // Unhappy customer (1-3 stars) → capture privately
  const results = { saved: false, notified: false };

  // Save to Supabase
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const sbRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/review_feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          stars,
          type: 'negative',
          feedback: feedback || null,
          client_name: clientName || null,
          client_email: clientEmail || null,
          business_name: businessName || null,
          created_at: new Date().toISOString(),
        }),
      });
      results.saved = sbRes.ok;
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }

  // Notify owner by email
  if (process.env.RESEND_API_KEY) {
    try {
      const starEmoji = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Nuvora Reviews <info@nuvoraweb.co.za>',
          to: [process.env.LEAD_NOTIFY_EMAIL || 'info@nuvoraweb.co.za'],
          subject: `⚠️ ${stars}-star private feedback received${clientName ? ' from ' + clientName : ''}`,
          html: `
            <div style="font-family:-apple-system,Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#fff;">
              <div style="margin-bottom:24px;"><span style="font-weight:700;font-size:18px;color:#062B23;">nu</span><span style="font-weight:700;font-size:18px;color:#0A0A0A;">vora</span></div>
              <div style="background:#FFF3CD;border:1px solid #FFCB6B;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                <div style="font-weight:700;font-size:16px;color:#856404;margin-bottom:4px;">⚠️ Private feedback intercepted</div>
                <div style="font-size:13px;color:#856404;">This review was captured before reaching Google. Take action to resolve the issue.</div>
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
                <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#999;width:120px;">Rating</td><td style="padding:10px 0;color:#0A0A0A;font-weight:700;font-size:16px;">${starEmoji} (${stars}/5)</td></tr>
                <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#999;">Name</td><td style="padding:10px 0;color:#0A0A0A;font-weight:600;">${clientName || '—'}</td></tr>
                <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#999;">Email</td><td style="padding:10px 0;color:#0A0A0A;font-weight:600;">${clientEmail || '—'}</td></tr>
                <tr style="border-bottom:1px solid #eee;"><td style="padding:10px 0;color:#999;">Business</td><td style="padding:10px 0;color:#0A0A0A;font-weight:600;">${businessName || '—'}</td></tr>
                <tr><td style="padding:10px 0;color:#999;vertical-align:top;">Feedback</td><td style="padding:10px 0;color:#0A0A0A;">${feedback || 'No feedback provided'}</td></tr>
              </table>
              ${clientEmail ? `<a href="mailto:${clientEmail}" style="display:inline-block;background:#062B23;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600;font-size:14px;">Reply to ${clientName || 'customer'}</a>` : ''}
              <p style="color:#999;font-size:12px;margin-top:24px;">Received ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
            </div>
          `,
        }),
      });
      results.notified = true;
    } catch (e) {
      console.error('Resend error:', e);
    }
  }

  return res.status(200).json({ action: 'thankyou', results });
}
