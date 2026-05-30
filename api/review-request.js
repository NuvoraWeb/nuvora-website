// api/review-request.js
// Sends a review request email to a client.
// The link goes to /review?name=...&email=...&business=... (the star-gate funnel)
// instead of directly to Google.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://nuvoraweb.co.za");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token, clientName, clientEmail, businessName } = req.body;
  if (token !== process.env.DASHBOARD_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  // Build the funnel URL with context pre-filled
  const baseUrl = "https://nuvoraweb.co.za/review";
  const params = new URLSearchParams();
  if (clientName) params.set("name", clientName);
  if (clientEmail) params.set("email", clientEmail);
  if (businessName) params.set("business", businessName);
  const reviewFunnelUrl = `${baseUrl}?${params.toString()}`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "Nuvora <info@nuvoraweb.co.za>",
        to: [clientEmail],
        subject: `How was your experience with Nuvora, ${clientName}?`,
        html: `
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#fff;">
            <div style="margin-bottom:32px;"><span style="font-weight:700;font-size:20px;color:#062B23;">nu</span><span style="font-weight:700;font-size:20px;color:#0A0A0A;">vora</span></div>
            <h2 style="font-size:22px;font-weight:700;color:#0A0A0A;margin-bottom:12px;">How did we do, ${clientName}?</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin-bottom:24px;">Thank you for choosing Nuvora to build your digital presence${businessName ? " for " + businessName : ""}. We hope you're already seeing results.</p>
            <p style="color:#555;font-size:15px;line-height:1.6;margin-bottom:28px;">We'd love to hear your honest feedback. It only takes 30 seconds:</p>
            <!-- Star rating buttons in email -->
            <div style="text-align:center;margin-bottom:28px;">
              <p style="font-size:13px;color:#999;margin-bottom:12px;">Tap to rate your experience:</p>
              <div style="display:inline-flex;gap:8px;">
                <a href="${reviewFunnelUrl}&stars=1" style="font-size:28px;text-decoration:none;color:#F5B800;">★</a>
                <a href="${reviewFunnelUrl}&stars=2" style="font-size:28px;text-decoration:none;color:#F5B800;">★★</a>
                <a href="${reviewFunnelUrl}&stars=3" style="font-size:28px;text-decoration:none;color:#F5B800;">★★★</a>
                <a href="${reviewFunnelUrl}&stars=4" style="font-size:28px;text-decoration:none;color:#F5B800;">★★★★</a>
                <a href="${reviewFunnelUrl}&stars=5" style="font-size:28px;text-decoration:none;color:#F5B800;">★★★★★</a>
              </div>
            </div>
            <div style="text-align:center;">
              <a href="${reviewFunnelUrl}" style="display:inline-block;padding:14px 32px;background:#1A9B72;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Share your experience →</a>
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
            <p style="color:#bbb;font-size:12px;">Nuvora · nuvoraweb.co.za · South Africa</p>
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
