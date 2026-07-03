// Creates a Razorpay order on the server. The Key SECRET stays here (server env)
// and is NEVER sent to the browser or stored in the database.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Payment gateway not configured' });

    const { amount, notes } = req.body; // amount in rupees
    const rupees = Number(amount);
    if (!rupees || rupees < 1) return res.status(400).json({ error: 'Invalid amount' });

    const payload = {
      amount: Math.round(rupees * 100), // paise
      currency: 'INR',
      receipt: 'rcpt_' + Date.now(),
      notes: notes || {},
    };

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify(payload),
    });
    const order = await rp.json();
    if (!rp.ok) {
      console.error('Razorpay order error:', order);
      return res.status(400).json({ error: order.error?.description || 'Failed to create order' });
    }

    // Only the public Key ID is returned to the browser (needed to open checkout).
    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch (err) {
    console.error('razorpay-order error:', err);
    res.status(500).json({ error: err.message });
  }
}
