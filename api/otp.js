// -----------------------------------------------------------------------------
// DEPRECATED & NEUTRALIZED (security bypass closed).
// This standalone OTP route had NO rate-limiting/cooldown and duplicated the
// hardened flow in /api/auth. Leaving it live allowed OTP-send spam that could
// hammer the mobile_otps table. Now inert. The frontend is rewritten to
// /api/auth?action=<send|verify|register|resolve> by src/lib/apiShim.ts, which
// enforces cooldowns + an hourly cap.
// -----------------------------------------------------------------------------
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({ error: 'Gone. Use /api/auth?action=send|verify|register|resolve' });
}
