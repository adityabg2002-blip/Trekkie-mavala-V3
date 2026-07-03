// Refunds are intentionally handled directly from the Razorpay Dashboard
// (Transactions -> Refund) for safety, rather than exposing a refund API in the
// app. This endpoint is disabled.
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(410).json({ error: 'Disabled. Issue refunds from the Razorpay Dashboard.' });
}
