// API path shim — transparently rewrites the old per-resource API paths to the
// new consolidated serverless functions (data / payment / auth), so we stay
// within Vercel Hobby's 12-function limit without rewriting every component.
//
// Old path                    -> New path
//   /api/treks                -> /api/data?resource=treks
//   /api/razorpay-order       -> /api/payment?action=order
//   /api/otp   (body.action)  -> /api/auth?action=<action>
//   /api/upload               -> /api/auth?action=upload
//
// Installed once at startup by importing this file in main.tsx.

const DATA_RESOURCES = new Set([
  'treks', 'tours', 'gallery', 'reviews', 'faqs', 'bookings',
  'contact-messages', 'site-content', 'business-settings', 'hikers',
  'admin-config', 'trek-bookings', 'paid-bookings',
]);

function rewrite(url: string, init?: RequestInit): { url: string; init?: RequestInit } {
  try {
    // Only touch same-origin /api/* calls
    const isApi = url.startsWith('/api/');
    if (!isApi) return { url, init };

    // Split path and existing query
    const [pathPart, queryPart] = url.split('?');
    const seg = pathPart.replace('/api/', '');

    // paid-bookings -> trek-bookings (same table/stats)
    if (seg === 'paid-bookings') {
      const q = queryPart ? '&' + queryPart : '';
      return { url: `/api/data?resource=trek-bookings${q}`, init };
    }

    if (DATA_RESOURCES.has(seg)) {
      const q = queryPart ? '&' + queryPart : '';
      return { url: `/api/data?resource=${seg}${q}`, init };
    }

    // Razorpay
    if (seg === 'razorpay-order') return { url: '/api/payment?action=order', init };
    if (seg === 'razorpay-verify') return { url: '/api/payment?action=verify', init };
    if (seg === 'razorpay-webhook') return { url: '/api/payment?action=webhook', init };

    // Upload
    if (seg === 'upload') return { url: '/api/auth?action=upload', init };

    // OTP / mobile auth — action is inside the JSON body
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

let installed = false;
export function installApiShim() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      const { url, init: newInit } = rewrite(input, init);
      return original(url, newInit);
    }
    return original(input as any, init);
  };
}
