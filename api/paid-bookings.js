// -----------------------------------------------------------------------------
// DEPRECATED & NEUTRALIZED.
// Duplicated the paid-booking list (PII) without an admin guard. Now inert.
// apiShim.ts rewrites /api/paid-bookings -> /api/data?resource=trek-bookings.
// -----------------------------------------------------------------------------
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({ error: 'Gone. Use /api/data?resource=trek-bookings' });
}
