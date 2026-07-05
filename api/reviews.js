// -----------------------------------------------------------------------------
// DEPRECATED & NEUTRALIZED (security bypass closed).
// Duplicated /api/data?resource=reviews WITHOUT the admin guard, exposing
// review MODERATION (pin/approve via PUT, DELETE) to anonymous callers. Now
// inert. Public review submission (POST) still works through the guarded
// consolidated route. Frontend rewritten by apiShim.ts.
// -----------------------------------------------------------------------------
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({ error: 'Gone. Use /api/data?resource=reviews' });
}
