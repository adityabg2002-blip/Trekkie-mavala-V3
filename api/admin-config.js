// DECOMMISSIONED.
// Plain-text admin ID / passcode validation has been removed for security.
// Admin identity is now handled by Supabase Auth (JWT + role:"admin" claim),
// verified server-side by requireAdmin() in db-client.js.
export default function handler(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(410).json({ error: 'Removed. Admin auth is handled by Supabase Auth (JWT role claim).' });
}
