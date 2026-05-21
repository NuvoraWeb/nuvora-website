// api/lead.js — Vercel serverless function
// Saves lead to Supabase, triggers Make.com webhook, and sends 5-email nurture sequence via Resend

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, business, industry, package: pkg, message, source } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const firstName = name ? name.split(' ')[0] : 'there';

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

  const results = { supabase: null, webhook: null, emails: [] };

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

  // --- Send nurture email sequence via Resend ---
  if (process.env.RESEND_API_KEY) {
    const now = new Date();

    const emails = [
      {
        delay: 0, // immediate
        subject: `We got your message, ${firstName}`,
        html: `
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#fff;">
            <div style="margin-bottom:24px;"><span style="font-weight:700;font-size:18px;color:#062B23;">nu</span><span style="font-weight:700;font-size:18px;color:#0A0A0A;">vora</span></div>
            <h2 style="font-weight:700;font-size:22px;letter-spacing:-0.5px;color:#0A0A0A;margin-bottom:12px;">We got your message, ${firstName}.</h2>
            <p style="color:#666;line-height:1.7;margin-bottom:16px;">Thank you for reaching out to Nuvora. We have received your enquiry and someone from our team will be in touch within 24 hours.</p>
            <p style="color:#666;line-height:1.7;margin-bottom:16px;">While you wait, here is what happens next:</p>
            <ul style="color:#666;line-height:1.8;padding-left:20px;margin-bottom:24px;">
              <li>We will review your enquiry and prepare a personalised response</li>
              <li>We will send you a tailored recommendation based on your business needs</li>
              <li>If you would like to skip the wait, you can book a free 30-minute discovery call directly</li>
            </ul>
            <a href="https://calendly.com/nuvoramain/30min" style="display:inline-block;background:#1A9B72;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px;">Book a free discovery call</a>
            <p style="color:#999;font-size:12px;line-height:1.6;">Nuvora · AI Website Studio · South Africa<br>info@nuvoraweb.co.za · nuvoraweb.co.za</p>
          </div>
        `
      },
      {
        delay: 2 * 24 * 60 * 60 * 1000, // 2 days
        subject: `Why most SA websites don't generate leads (and how to fix it)`,
        html: `
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#fff;">
            <div style="margin-bottom:24px;"><span style="font-weight:700;font-size:18px;color:#062B23;">nu</span><span style="font-weight:700;font-size:18px;color:#0A0A0A;">vora</span></div>
            <h2 style="font-weight:700;font-size:22px;letter-spacing:-0.5px;color:#0A0A0A;margin-bottom:12px;">Hey ${firstName}, here is something worth knowing.</h2>
            <p style="color:#666;line-height:1.7;margin-bottom:16px;">Most South African business websites share the same problem — they are beautiful brochures that do absolutely nothing when no one is looking at them.</p>
            <p style="color:#666;line-height:1.7;margin-bottom:16px;">No lead capture. No automated follow-up. No way to book a call at 11pm when a prospect is ready to buy.</p>
            <p style="color:#666;line-height:1.7;margin-bottom:16px;">The businesses growing fastest right now have one thing in common: their websites work while they sleep.</p>
            <a href="https://nuvoraweb.co.za/nuvora-blog-2.html" style="display:inline-block;background:#062B23;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px;">Read: How to turn your site into a 24/7 lead machine</a>
            <p style="color:#666;line-height:1.7;margin-bottom:24px;">If you would like to see exactly what this looks like for a business like yours, book a free 30-minute call and we will show you.</p>
            <a href="https://calendly.com/nuvoramain/30min" style="display:inline-block;background:#1A9B72;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px;">Book a free call</a>
            <p style="color:#999;font-size:12px;line-height:1.6;">Nuvora · info@nuvoraweb.co.za · <a href="https://nuvoraweb.co.za" style="color:#1A9B72;">nuvoraweb.co.za</a></p>
          </div>
        `
      },
      {
        delay: 5 * 24 * 60 * 60 * 1000, // 5 days
        subject: `How Bloom Events got 3× more enquiries in 6 weeks`,
        html: `
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#fff;">
            <div style="margin-bottom:24px;"><span style="font-weight:700;font-size:18px;color:#062B23;">nu</span><span style="font-weight:700;font-size:18px;color:#0A0A0A;">vora</span></div>
            <h2 style="font-weight:700;font-size:22px;letter-spacing:-0.5px;color:#0A0A0A;margin-bottom:12px;">A quick story, ${firstName}.</h2>
            <p style="color:#666;line-height:1.7;margin-bottom:16px;">Bloom Events is a Johannesburg wedding and events company. Before Nuvora, they had a decent website — but it was silent. No leads coming in automatically. No follow-up system. Just a site that sat there waiting.</p>
            <p style="color:#666;line-height:1.7;margin-bottom:16px;">Six weeks after launching with Nuvora's Growth package, here is what changed:</p>
            <div style="background:#EAF7F2;border-radius:12px;padding:20px;margin-bottom:20px;">
              <div style="display:flex;gap:24px;flex-wrap:wrap;">
                <div><div style="font-weight:700;font-size:24px;color:#1A9B72;">3.2×</div><div style="font-size:12px;color:#666;">More enquiries per month</div></div>
                <div><div style="font-weight:700;font-size:24px;color:#1A9B72;">4.9★</div><div style="font-size:12px;color:#666;">Google rating</div></div>
                <div><div style="font-weight:700;font-size:24px;color:#1A9B72;">48hr</div><div style="font-size:12px;color:#666;">From brief to live site</div></div>
              </div>
            </div>
            <p style="color:#666;line-height:1.7;margin-bottom:24px;">The difference was not magic. It was a system — automated lead capture, smart review filtering, and a follow-up sequence that converts enquiries into bookings without any manual effort.</p>
            <p style="color:#666;line-height:1.7;margin-bottom:24px;">We can build the same system for ${business || 'your business'}. Want to see how?</p>
            <a href="https://calendly.com/nuvoramain/30min" style="display:inline-block;background:#1A9B72;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px;">Book a free 30-min call</a>
            <p style="color:#999;font-size:12px;">Nuvora · info@nuvoraweb.co.za · <a href="https://nuvoraweb.co.za" style="color:#1A9B72;">nuvoraweb.co.za</a></p>
          </div>
        `
      },
      {
        delay: 9 * 24 * 60 * 60 * 1000, // 9 days
        subject: `Is Nuvora right for my business?`,
        html: `
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#fff;">
            <div style="margin-bottom:24px;"><span style="font-weight:700;font-size:18px;color:#062B23;">nu</span><span style="font-weight:700;font-size:18px;color:#0A0A0A;">vora</span></div>
            <h2 style="font-weight:700;font-size:22px;letter-spacing:-0.5px;color:#0A0A0A;margin-bottom:12px;">Honest answers to the questions we get asked most.</h2>
            <p style="color:#666;line-height:1.7;margin-bottom:20px;">Hey ${firstName}. We know making a decision like this takes thought. Here are the three things most people wonder about before getting started.</p>
            <div style="border-left:3px solid #1A9B72;padding-left:16px;margin-bottom:20px;">
              <p style="font-weight:600;color:#0A0A0A;margin-bottom:6px;">"Is it really worth the monthly cost?"</p>
              <p style="color:#666;line-height:1.7;font-size:14px;">One new client per month from your website pays for the entire Nuvora subscription — usually many times over. Most clients see their first conversion within 30 days.</p>
            </div>
            <div style="border-left:3px solid #1A9B72;padding-left:16px;margin-bottom:20px;">
              <p style="font-weight:600;color:#0A0A0A;margin-bottom:6px;">"Can I not just build it myself?"</p>
              <p style="color:#666;line-height:1.7;font-size:14px;">You could — but a DIY site typically takes weeks, lacks automation, and often looks it. Nuvora delivers a professional, fully automated system in 48 hours, maintained and updated monthly.</p>
            </div>
            <div style="border-left:3px solid #1A9B72;padding-left:16px;margin-bottom:24px;">
              <p style="font-weight:600;color:#0A0A0A;margin-bottom:6px;">"What if I want to cancel?"</p>
              <p style="color:#666;line-height:1.7;font-size:14px;">Cancel anytime with 30 days notice. No lock-in, no penalty. We are confident enough in our results to never need a long-term contract.</p>
            </div>
            <p style="color:#666;line-height:1.7;margin-bottom:24px;">Still have questions? Book a free call and we will answer everything honestly — no pressure, no pitch.</p>
            <a href="https://calendly.com/nuvoramain/30min" style="display:inline-block;background:#1A9B72;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px;">Get honest answers on a free call</a>
            <p style="color:#999;font-size:12px;">Nuvora · info@nuvoraweb.co.za · <a href="https://nuvoraweb.co.za" style="color:#1A9B72;">nuvoraweb.co.za</a></p>
          </div>
        `
      },
      {
        delay: 14 * 24 * 60 * 60 * 1000, // 14 days
        subject: `Last thing from us (for now)`,
        html: `
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#fff;">
            <div style="margin-bottom:24px;"><span style="font-weight:700;font-size:18px;color:#062B23;">nu</span><span style="font-weight:700;font-size:18px;color:#0A0A0A;">vora</span></div>
            <h2 style="font-weight:700;font-size:22px;letter-spacing:-0.5px;color:#0A0A0A;margin-bottom:12px;">Hey ${firstName}, this is the last email from us for now.</h2>
            <p style="color:#666;line-height:1.7;margin-bottom:16px;">We have reached out a few times over the past two weeks because we genuinely believe we can make a real difference for ${business || 'your business'}.</p>
            <p style="color:#666;line-height:1.7;margin-bottom:16px;">If the timing is not right, no hard feelings at all — we will leave you alone from here.</p>
            <p style="color:#666;line-height:1.7;margin-bottom:20px;">But if you are still curious, here is where things stand:</p>
            <div style="background:#062B23;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="color:rgba(255,255,255,0.7);font-size:13px;margin-bottom:8px;letter-spacing:1px;text-transform:uppercase;">Founding Client Offer</p>
              <p style="color:#fff;font-weight:600;font-size:15px;margin-bottom:4px;">We are still onboarding our first 10 founding clients at launch pricing — no setup fee, locked-in monthly rate.</p>
              <p style="color:rgba(255,255,255,0.5);font-size:13px;">Once those 10 spots are filled, pricing moves to standard rates and the setup fee applies.</p>
            </div>
            <a href="https://nuvoraweb.co.za/#packages" style="display:inline-block;background:#1A9B72;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:12px;">View packages and get started</a>
            <br>
            <a href="https://calendly.com/nuvoramain/30min" style="display:inline-block;background:#fff;color:#062B23;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px;border:1px solid #ddd;">Book a free 30-min call instead</a>
            <p style="color:#999;font-size:12px;">Nuvora · info@nuvoraweb.co.za · <a href="https://nuvoraweb.co.za" style="color:#1A9B72;">nuvoraweb.co.za</a><br>You received this because you enquired via nuvoraweb.co.za.</p>
          </div>
        `
      }
    ];

    for (const emailData of emails) {
      try {
        const scheduledAt = new Date(now.getTime() + emailData.delay).toISOString();
        const body = {
          from: 'Nuvora <onboarding@resend.dev>',
          to: [email],
          subject: emailData.subject,
          html: emailData.html,
        };
        if (emailData.delay > 0) {
          body.scheduled_at = scheduledAt;
        }
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify(body),
        });
        const emailResult = await emailRes.json();
        results.emails.push({ delay: emailData.delay, status: emailRes.ok ? 'scheduled' : 'error', id: emailResult.id });
      } catch (e) {
        results.emails.push({ delay: emailData.delay, status: 'error' });
        console.error('Resend error:', e);
      }
    }
  }

  return res.status(200).json({ success: true, results });
}
