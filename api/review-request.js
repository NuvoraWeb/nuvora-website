export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://nuvoraweb.co.za");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token, clientName, clientEmail, businessName } = req.body;
  if (token !== process.env.DASHBOARD_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  const reviewLink = "https://g.page/r/ChIJjdTpT3xflR4Rfzd06XcMsr0/review";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Nuvora <info@nuvoraweb.co.za>",
        to: [clientEmail],
        subject: `How was your experience with Nuvora, ${clientName}?`,
        html: `
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#fff;">
            <div style="margin-bottom:32px;"><span style="font-weight:700;font-size:20px;color:#062B23;">nu</span><span style="font-weight:700;font-size:20px;color:#0A0A0A;">vora</span></div>
            <h2 style="font-size:22px;font-weight:700;color:#0A0A0A;margin-bottom:12px;">How did we do, ${clientName}?</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin-bottom:24px;">Thank you for choosing Nuvora to build your digital presence${businessName ? " for " + businessName : ""}. We hope you're already seeing results.</p>
            <p style="color:#555;font-size:15px;line-height:1.6;margin-bottom:32px;">If you're happy with what we built, it would mean the world to us if you could take 60 seconds to leave a Google review. It helps other South African businesses find us and trust us.</p>
            <a href="${reviewLink}" style="display:inline-block;padding:14px 32px;background:#1A9B72;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:32px;">Leave a Google review &#8594;</a>
            <p style="color:#999;font-size:13px;line-height:1.6;">It only takes a minute and makes a huge difference. Thank you in advance!</p>
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
            <p style="color:#bbb;font-size:12px;">Nuvora · nuvoraweb.co.za · Pretoria, South Africa</p>
          </div>
        `
      })
    });
    const data = await r.json();
    res.json({ success: true, id: data.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}