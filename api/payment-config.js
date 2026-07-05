// This endpoint has been intentionally disabled.
// Payment gateway keys are managed ONLY through secure server environment
// variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) and can never be viewed or
// edited from the website or the admin panel. This is the safest configuration.
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(410).json({ error: 'Disabled. Keys are managed via secure server environment only.' });
}
