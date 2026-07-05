// -----------------------------------------------------------------------------
// DEPRECATED & NEUTRALIZED.
// Duplicated /api/data?resource=contact-messages. Now inert to keep the app
// under the Vercel Hobby 12-function limit. Frontend rewritten by apiShim.ts.
// -----------------------------------------------------------------------------
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({ error: 'Gone. Use /api/data?resource=contact-messages' });
}
