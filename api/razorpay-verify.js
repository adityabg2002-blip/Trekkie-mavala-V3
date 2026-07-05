// -----------------------------------------------------------------------------
// DEPRECATED & NEUTRALIZED.
// Duplicated the signature-verify + booking-save flow now hardened in
// /api/payment (server re-pricing + NaN-safe casts). Now inert. Frontend
// rewritten to /api/payment?action=verify by apiShim.ts.
// -----------------------------------------------------------------------------
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({ error: 'Gone. Use /api/payment?action=verify' });
}
