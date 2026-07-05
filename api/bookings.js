// -----------------------------------------------------------------------------
// DEPRECATED & NEUTRALIZED (security bypass closed).
// This standalone route duplicated /api/data?resource=bookings WITHOUT the
// admin JWT route-guard, so it allowed unauthenticated mutations. It also
// pushed the project over the Vercel Hobby 12-function limit. It is now an inert
// stub. All traffic is transparently rewritten to the consolidated, guarded
// endpoint by src/lib/apiShim.ts.
// -----------------------------------------------------------------------------
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({ error: 'Gone. Use /api/data?resource=bookings' });
}
