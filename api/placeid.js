export default async function handler(req, res) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const query = req.query.q || 'Nuvora Libertas Pretoria South Africa';
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${key}`;
  const r = await fetch(url);
  const d = await r.json();
  res.json(d);
}