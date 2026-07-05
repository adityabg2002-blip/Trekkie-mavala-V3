// -----------------------------------------------------------------------------
// DEPRECATED & NEUTRALIZED.
// Duplicated the webhook handler now hardened in /api/payment (idempotent
// reconciliation + 500-on-DB-failure so Razorpay retries). Now inert.
//
// IMPORTANT: point your Razorpay Dashboard webhook URL at the consolidated
// endpoint instead:  https://YOUR-SITE/api/payment?action=webhook
// -----------------------------------------------------------------------------
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-razorpay-signature');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({ error: 'Gone. Use /api/payment?action=webhook' });
}
