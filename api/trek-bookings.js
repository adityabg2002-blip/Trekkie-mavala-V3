// -----------------------------------------------------------------------------
// DEPRECATED & NEUTRALIZED (security bypass closed).
// Duplicated /api/data?resource=trek-bookings WITHOUT the admin guard, exposing
// paid-booking PII and an unguarded status PUT. Now inert. Frontend rewritten by
// apiShim.ts (which attaches the admin JWT).
// -----------------------------------------------------------------------------
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({ error: 'Gone. Use /api/data?resource=trek-bookings' });
}
