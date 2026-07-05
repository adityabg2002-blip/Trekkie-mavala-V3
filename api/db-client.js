// -----------------------------------------------------------------------------
// Supabase client factory (security-hardened)
// -----------------------------------------------------------------------------
// SECURITY MODEL:
//   * `supabase` (default export)  -> initialised with the ANON key. It respects
//     Row-Level Security (RLS). This is what every request handler should use by
//     default so a bug in one route can never silently bypass table policies.
//   * `supabaseAdmin`              -> initialised with the SERVICE_ROLE key. It
//     BYPASSES RLS entirely. Import it ONLY where a genuine administrative
//     bypass is unavoidable (creating auth users, verifying admin JWT claims,
//     server-trusted payment writes). Never expose it to a user-supplied code
//     path without first verifying an admin JWT.
//   * `userClient(token)`          -> a per-request client scoped to a signed-in
//     user's JWT, so RLS policies evaluate `auth.uid()` correctly.
// -----------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Auto-restore a paused/hibernating database when a 5xx surfaces.
const resilientFetch = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.ok && res.status >= 500) triggerRestore();
  return res;
};

// Default, RLS-respecting client (ANON key). Use this everywhere by default.
const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: resilientFetch },
});

// Privileged client (SERVICE ROLE key). BYPASSES RLS. Use sparingly.
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: resilientFetch },
});

// Build a client bound to a specific user's access token so RLS sees auth.uid().
export function userClient(accessToken) {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: resilientFetch,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}

// -----------------------------------------------------------------------------
// Shared admin-guard utility
// -----------------------------------------------------------------------------
// Extracts the Bearer token, verifies it with Supabase, and confirms the user
// carries `role: "admin"` in either app_metadata (preferred, set from the
// Supabase Dashboard / service role) or user_metadata. Returns the user object
// on success, or null on any failure. The caller decides the HTTP status.
export async function requireAdmin(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return { user: null, reason: 'missing_token' };

  // Verify the JWT using the privileged client (does not trust client claims).
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return { user: null, reason: 'invalid_token' };

  const u = data.user;
  const role = u.app_metadata?.role || u.user_metadata?.role;

  // Primary: trusted role claim set from the Supabase Dashboard.
  let isAdmin =
    role === 'admin' ||
    u.app_metadata?.roles?.includes?.('admin') ||
    u.app_metadata?.claims_admin === true;

  // Fallback: an explicit email allow-list via env (ADMIN_EMAILS, comma-sep).
  // Useful when you cannot edit app_metadata yet. Remove once roles are tagged.
  if (!isAdmin && process.env.ADMIN_EMAILS) {
    const allow = process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (u.email && allow.includes(u.email.toLowerCase())) isAdmin = true;
  }

  if (!isAdmin) return { user: u, reason: 'not_admin' };
  return { user: u, reason: null };
}

export default supabase;
