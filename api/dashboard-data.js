export default async function handler(req, res) {
  // Simple token auth
  const { token } = req.query;
  if (token !== process.env.DASHBOARD_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = {};

  // 1. Leads from Supabase
  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const leadsRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/leads?select=id,name,email,business,created_at&order=created_at.desc`,
      { headers: { 'apikey': process.env.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}` } }
    );
    const leads = await leadsRes.json();
    const thisMonthLeads = leads.filter(l => l.created_at >= firstOfMonth);
    results.leads = {
      total: leads.length,
      thisMonth: thisMonthLeads.length,
      recent: leads.slice(0, 5)
    };
  } catch (e) {
    results.leads = { error: e.message };
  }

  // 2. Emails from Resend
  try {
    const emailsRes = await fetch('https://api.resend.com/emails?limit=100', {
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` }
    });
    const emailData = await emailsRes.json();
    const emails = emailData.data || [];
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisMonth = emails.filter(e => e.created_at >= firstOfMonth);
    results.emails = {
      total: emails.length,
      thisMonth: thisMonth.length
    };
  } catch (e) {
    results.emails = { error: e.message };
  }

  // 3. Google Reviews
  try {
    const placeId = 'ChIJjdTpT3xflR4Rfzd06XcMsr0';
    const gRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    const gData = await gRes.json();
    const place = gData.result || {};
    results.reviews = {
      rating: place.rating || 0,
      total: place.user_ratings_total || 0,
      recent: (place.reviews || []).slice(0, 3).map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text?.slice(0, 150),
        time: r.relative_time_description
      }))
    };
  } catch (e) {
    results.reviews = { error: e.message };
  }

  res.json(results);
}