// API path shim — transparently rewrites the old per-resource API paths to the
// new consolidated serverless functions (data / payment / auth), so we stay
// within Vercel Hobby's 12-function limit without rewriting every component.
//
// It ALSO auto-attaches the signed-in admin's Supabase JWT as a Bearer token on
// mutating (POST/PUT/DELETE) requests, so the hardened backend route-guard can
// verify `role: "admin"` without every component having to add the header.
//
// Old path                    -> New path
//   /api/treks                -> /api/data?resource=treks
//   /api/razorpay-order       -> /api/payment?action=order
//   /api/otp   (body.action)  -> /api/auth?action=<action>
//   /api/upload               -> /api/auth?action=upload
import supabase from './supabase';

const DATA_RESOURCES = new Set([
  'treks', 'tours', 'gallery', 'reviews', 'faqs', 'bookings',
  'contact-messages', 'site-content', 'business-settings', 'hikers',
  'trek-bookings', 'paid-bookings',
]);

// Cache the latest access token so we can attach it synchronously-ish.
let cachedToken: string | null = null;
export function setApiToken(token: string | null) { cachedToken = token; }

function rewrite(url: string, init?: RequestInit): { url: string; init?: RequestInit } {
  try {
    const isApi = url.startsWith('/api/');
    if (!isApi) return { url, init };

    const [pathPart, queryPart] = url.split('?');
    const seg = pathPart.replace('/api/', '');

    if (seg === 'paid-bookings') {
      const q = queryPart ? '&' + queryPart : '';
      return { url: `/api/data?resource=trek-bookings${q}`, init };
    }
    if (DATA_RESOURCES.has(seg)) {
      const q = queryPart ? '&' + queryPart : '';
      return { url: `/api/data?resource=${seg}${q}`, init };
    }
    if (seg === 'razorpay-order') return { url: '/api/payment?action=order', init };
    if (seg === 'razorpay-verify') return { url: '/api/payment?action=verify', init };
    if (seg === 'razorpay-webhook') return { url: '/api/payment?action=webhook', init };
    if (seg === 'upload') return { url: '/api/auth?action=upload', init };
    if (seg === 'otp') {
      let action = '';
      try {
        if (init?.body && typeof init.body === 'string') action = JSON.parse(init.body).action || '';
      } catch { /* ignore */ }
      return { url: `/api/auth${action ? `?action=${action}` : ''}`, init };
    }
    return { url, init };
  } catch {
    return { url, init };
  }
}

// Some GET endpoints return PII and are admin-guarded server-side, so their
// GETs must also carry the admin token when a session exists.
const ADMIN_GET_URLS = [
  '/api/data?resource=trek-bookings',
  '/api/data?resource=contact-messages',
];

// Attach the admin Bearer token to mutating API requests (and to the small set
// of admin-only GETs above) when we have a session.
async function withAuth(url: string, init?: RequestInit): Promise<RequestInit | undefined> {
  const method = (init?.method || 'GET').toUpperCase();
  if (!url.startsWith('/api/')) return init;
  const isAdminGet = method === 'GET' && ADMIN_GET_URLS.some((u) => url.startsWith(u));
  if ((method === 'GET' && !isAdminGet) || method === 'OPTIONS') return init;

  // Prefer a live session token; fall back to the cached one.
  let token = cachedToken;
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token || token;
  } catch { /* ignore */ }
  if (!token) return init;

  const headers = new Headers(init?.headers || {});
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

let installed = false;
export function installApiShim() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      const { url, init: newInit } = rewrite(input, init);
      const authed = await withAuth(url, newInit);
      return original(url, authed);
    }
    return original(input as any, init);
  };
}
