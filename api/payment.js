// Consolidated Razorpay API — order creation, payment verification, and webhook,
// all in one serverless function (Vercel Hobby 12-function limit).
// Usage:
//   POST /api/payment?action=order    -> create order
//   POST /api/payment?action=verify   -> verify signature + save booking
//   POST /api/payment?action=webhook  -> Razorpay server-to-server callback
import crypto from 'crypto';
import supabase from './db-client.js';

// Webhook must read the RAW body to verify its signature, so we disable the
// automatic body parser and read the stream ourselves only for that action.
export const config = { api: { bodyParser: false } };

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-razorpay-signature');
}

function readRaw(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = (req.query.action || '').toString();

  try {
    const raw = await readRaw(req);

    if (action === 'webhook') return webhook(raw, req, res);

    const body = raw ? JSON.parse(raw) : {};
    if (action === 'order') return createOrder(body, res);
    if (action === 'verify') return verifyPayment(body, res);
    return res.status(400).json({ error: 'Unknown action: ' + action });
  } catch (err) {
    console.error('payment API error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ---------- CREATE ORDER ----------
async function createOrder(body, res) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return res.status(500).json({ error: 'Payment gateway not configured' });

  const rupees = Number(body.amount);
  if (!rupees || rupees < 1) return res.status(400).json({ error: 'Invalid amount' });

  const payload = {
    amount: Math.round(rupees * 100),
    currency: 'INR',
    receipt: 'rcpt_' + Date.now(),
    notes: body.notes || {},
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
  return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
}

// ---------- VERIFY PAYMENT ----------
async function verifyPayment(body, res) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return res.status(500).json({ error: 'Payment gateway not configured' });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking } = body;
  const expected = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');

  if (expected !== razorpay_signature) {
    await supabase.from('trek_bookings').insert({
      full_name: booking?.full_name, mobile: booking?.mobile, age: booking?.age ? Number(booking.age) : null,
      gender: booking?.gender, city: booking?.city, trek_name: booking?.trek_name,
      amount: booking?.amount ? Number(booking.amount) : null, razorpay_order_id, razorpay_payment_id,
      payment_status: 'Failed',
    });
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }

  const { data, error } = await supabase.from('trek_bookings').insert({
    full_name: booking?.full_name, mobile: booking?.mobile, age: booking?.age ? Number(booking.age) : null,
    gender: booking?.gender, city: booking?.city, trek_name: booking?.trek_name,
    amount: booking?.amount ? Number(booking.amount) : null, razorpay_order_id, razorpay_payment_id,
    payment_status: 'Paid',
  }).select().single();
  if (error) throw error;
  return res.status(200).json({ ok: true, booking: data });
}

// ---------- WEBHOOK ----------
async function webhook(raw, req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const signature = req.headers['x-razorpay-signature'];

  if (secret) {
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (expected !== signature) {
      console.error('Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  let event;
  try { event = JSON.parse(raw || '{}'); } catch { return res.status(200).json({ ok: true, ignored: true }); }
  const type = event.event;
  const payment = event.payload?.payment?.entity;
  if (!payment) return res.status(200).json({ ok: true, ignored: true });

  const orderId = payment.order_id;
  const paymentId = payment.id;
  const notes = payment.notes || {};
  const status = type === 'payment.captured' ? 'Paid' : (type === 'payment.failed' ? 'Failed' : 'Pending');

  try {
    const { data: existing } = await supabase
      .from('trek_bookings')
      .select('id, payment_status')
      .or(`razorpay_order_id.eq.${orderId},razorpay_payment_id.eq.${paymentId}`)
      .maybeSingle();

    if (existing) {
      if (!(existing.payment_status === 'Paid' && status !== 'Paid')) {
        await supabase.from('trek_bookings').update({ razorpay_payment_id: paymentId, payment_status: status }).eq('id', existing.id);
      }
      return res.status(200).json({ ok: true, reconciled: true });
    }

    await supabase.from('trek_bookings').insert({
      full_name: notes['Full Name'] || null,
      mobile: notes['Mobile'] || (payment.contact ? String(payment.contact) : null),
      age: notes['Age'] ? Number(notes['Age']) : null,
      gender: notes['Gender'] || null,
      city: notes['City'] || null,
      trek_name: notes['Trek Name'] || null,
      amount: payment.amount ? Math.round(payment.amount / 100) : null,
      razorpay_order_id: orderId, razorpay_payment_id: paymentId, payment_status: status,
    });
    return res.status(200).json({ ok: true, created: true });
  } catch (err) {
    console.error('webhook error:', err);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
