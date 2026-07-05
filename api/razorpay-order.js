// -----------------------------------------------------------------------------
// DEPRECATED & NEUTRALIZED (payment tampering bypass closed).
// This standalone order route trusted a client-supplied amount (allowing a
// "pay ₹1 for a ₹5000 trek" attack) and duplicated the hardened flow now in
// /api/payment. The consolidated route re-prices every order from the DB.
// Now inert. Frontend rewritten to /api/payment?action=order by apiShim.ts.
// -----------------------------------------------------------------------------
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({ error: 'Gone. Use /api/payment?action=order' });
}
