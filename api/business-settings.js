// -----------------------------------------------------------------------------
// DEPRECATED & NEUTRALIZED (security bypass closed).
// Duplicated /api/data?resource=business-settings without the admin guard.
// Now inert. Frontend is rewritten by src/lib/apiShim.ts.
// -----------------------------------------------------------------------------
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({ error: 'Gone. Use /api/data?resource=business-settings' });
}
