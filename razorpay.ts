// Loads the Razorpay Checkout script once and resolves when it's ready.
let loaded = false;
let loadingPromise: Promise<boolean> | null = null;

export function loadRazorpay(): Promise<boolean> {
  if (loaded) return Promise.resolve(true);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve) => {
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) { loaded = true; resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => { loaded = true; resolve(true); };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return loadingPromise;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}
