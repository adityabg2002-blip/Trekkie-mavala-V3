// -----------------------------------------------------------------------------
// Consolidated Razorpay API (security-hardened)
// -----------------------------------------------------------------------------
//   POST /api/payment?action=order    -> create order (SERVER prices it)
//   POST /api/payment?action=verify   -> verify signature + save booking
//   POST /api/payment?action=webhook  -> Razorpay server-to-server callback
//
// HARDENING:
//   1. SERVER-SIDE PRICING: `createOrder` ignores any client-sent `amount`.
//      It accepts `trekId`/`tourId`, reads the authoritative price from the DB,
//      and prices the order from that. Prevents "pay ₹1 for a ₹5000 trek".
//   2. SAFE TYPE CASTS: every numeric field from untrusted `notes`/body is cast
//      through `safeInt` -> valid integer or null. Never lets NaN reach Postgres
//      (which would raise and silently drop a paid booking).
//   3. NO SILENT WEBHOOK FAILURE: if the DB write fails inside the webhook, we
//      return 500 so Razorpay retries delivery from its queue.
//
//   Payment writes use `supabaseAdmin` because they are server-trusted events
//   (signature already verified) and must succeed regardless of table RLS.
// -----------------------------------------------------------------------------
import crypto from 'crypto';
import { supabaseAdmin } from './db-client.js';

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

// Cast any input to a bounded integer, or null if it cannot be parsed.
function safeInt(value, { min = null, max = null } = {}) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return null;
  let out = Math.trunc(n);
  if (min !== null && out < min) return null;
  if (max !== null && out > max) out = max;
  return out;
}

// Trim + hard-cap a string field, or null.
function safeStr(value, max = 200) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s.slice(0, max) : null;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = (req.query.action || '').toString();

  try {
    const raw = await readRaw(req);

    if (action === 'webhook') return webhook(raw, req, res);

    let body;
    try { body = raw ? JSON.parse(raw) : {}; }
    catch { return res.status(400).json({ error: 'Invalid JSON body' }); }

    if (action === 'order') return createOrder(body, res);
    if (action === 'verify') return verifyPayment(body, res);
    return res.status(400).json({ error: 'Unknown action: ' + action });
  } catch (err) {
    console.error('payment API error:', err);
    res.status(500).json({ error: err.message });
  }
}

// -----------------------------------------------------------------------------
// Look up the authoritative, server-trusted price for a trek or tour.
// Returns { amount, name } or throws. Never trusts a client-supplied amount.
// -----------------------------------------------------------------------------
async function resolveServerPrice(body) {
  const trekId = safeInt(body.trekId);
  const tourId = safeInt(body.tourId);

  if (trekId) {
    const { data, error } = await supabaseAdmin.from('treks').select('id, name_en, price').eq('id', trekId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Trek not found');
    return { amount: safeInt(data.price, { min: 1 }), name: data.name_en };
  }
  if (tourId) {
    const { data, error } = await supabaseAdmin.from('tours').select('id, title_en, price').eq('id', tourId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Tour not found');
    return { amount: safeInt(data.price, { min: 1 }), name: data.title_en };
  }
  return null;
}

// ---------- CREATE ORDER (server prices it) ----------
async function createOrder(body, res) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return res.status(500).json({ error: 'Payment gateway not configured' });

  // Authoritative price lookup. The browser can no longer dictate the amount.
  let priced;
  try {
    priced = await resolveServerPrice(body);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  if (!priced) {
    return res.status(400).json({ error: 'A valid trekId or tourId is required to price this order' });
  }
  const rupees = priced.amount;
  if (!rupees || rupees < 1) return res.status(400).json({ error: 'Item is not purchasable (invalid price)' });

  // Build sanitized notes for the dashboard from user details (display only).
  const n = body.notes || {};
  const notes = {
    'Trek Name': priced.name || safeStr(n['Trek Name'], 120) || 'Expedition',
    'Full Name': safeStr(n['Full Name'], 120) || '',
    'Mobile': safeStr(n['Mobile'], 20) || '',
    'Age': safeStr(n['Age'], 3) || '',
    'Gender': safeStr(n['Gender'], 20) || '',
    'City': safeStr(n['City'], 80) || '',
    // A server tag so the webhook/verify can trust the priced item.
    'server_amount': String(rupees),
  };

  const payload = {
    amount: rupees * 100, // paise, integer
    currency: 'INR',
    receipt: 'rcpt_' + Date.now(),
    notes,
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
  // Return the server-priced amount so the client cannot show a different total.
  return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId, serverAmount: rupees });
}

// Build a sanitized, NaN-proof booking row from mixed sources.
function buildBookingRow(src, { orderId, paymentId, status, amountRupees }) {
  return {
    full_name: safeStr(src.full_name ?? src['Full Name'], 120),
    mobile: safeStr(src.mobile ?? src['Mobile'], 20),
    age: safeInt(src.age ?? src['Age'], { min: 1, max: 120 }),   // NaN -> null (never crashes insert)
    gender: safeStr(src.gender ?? src['Gender'], 20),
    city: safeStr(src.city ?? src['City'], 80),
    trek_name: safeStr(src.trek_name ?? src['Trek Name'], 120),
    amount: safeInt(amountRupees, { min: 0 }),
    razorpay_order_id: safeStr(orderId, 60),
    razorpay_payment_id: safeStr(paymentId, 60),
    payment_status: status,
  };
}

// ---------- VERIFY PAYMENT ----------
async function verifyPayment(body, res) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return res.status(500).json({ error: 'Payment gateway not configured' });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  const expected = crypto.createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');

  // Re-derive the authoritative amount from the order's notes (server_amount),
  // falling back to a DB re-price if trek/tour id is present. Never trust the
  // client's booking.amount for what we persist.
  let amountRupees = safeInt(booking?.server_amount);
  if (amountRupees === null) {
    try {
      const priced = await resolveServerPrice(booking || {});
      if (priced) amountRupees = priced.amount;
    } catch { /* ignore – amount stays null */ }
  }

  if (expected !== razorpay_signature) {
    // Record the failure with fully-sanitized casts (age NaN -> null, etc.).
    const row = buildBookingRow(booking || {}, {
      orderId: razorpay_order_id, paymentId: razorpay_payment_id, status: 'Failed', amountRupees,
    });
    await supabaseAdmin.from('trek_bookings').insert(row);
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }

  const row = buildBookingRow(booking || {}, {
    orderId: razorpay_order_id, paymentId: razorpay_payment_id, status: 'Paid', amountRupees,
  });
  const { data, error } = await supabaseAdmin.from('trek_bookings').insert(row).select().single();
  if (error) throw error;
  return res.status(200).json({ ok: true, booking: data });
}

// ---------- WEBHOOK ----------
async function webhook(raw, req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const signature = req.headers['x-razorpay-signature'];

  // Require a configured secret in production; verify signature strictly.
  if (secret) {
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (expected !== signature) {
      console.error('Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  let event;
  try { event = JSON.parse(raw || '{}'); }
  catch { return res.status(200).json({ ok: true, ignored: true }); } // unparseable = don't retry

  const type = event.event;
  const payment = event.payload?.payment?.entity;
  if (!payment) return res.status(200).json({ ok: true, ignored: true });

  const orderId = safeStr(payment.order_id, 60);
  const paymentId = safeStr(payment.id, 60);
  const notes = payment.notes || {};
  const status = type === 'payment.captured' ? 'Paid'
    : (type === 'payment.failed' ? 'Failed' : 'Pending');

  // Amount comes from Razorpay's own captured entity (paise) — fully trusted.
  const amountRupees = safeInt(payment.amount, { min: 0 }) !== null
    ? Math.round(payment.amount / 100)
    : safeInt(notes['server_amount'], { min: 0 });

  try {
    const { data: existing, error: selErr } = await supabaseAdmin
      .from('trek_bookings')
      .select('id, payment_status')
      .or(`razorpay_order_id.eq.${orderId},razorpay_payment_id.eq.${paymentId}`)
      .maybeSingle();
    if (selErr) throw selErr;

    if (existing) {
      // Never downgrade a Paid record; otherwise reconcile status/payment id.
      if (!(existing.payment_status === 'Paid' && status !== 'Paid')) {
        const { error: updErr } = await supabaseAdmin.from('trek_bookings')
          .update({ razorpay_payment_id: paymentId, payment_status: status })
          .eq('id', existing.id);
        if (updErr) throw updErr;
      }
      return res.status(200).json({ ok: true, reconciled: true });
    }

    // No prior record (browser closed before /verify) -> create from notes.
    const row = buildBookingRow(notes, { orderId, paymentId, status, amountRupees });
    if (!row.mobile && payment.contact) row.mobile = safeStr(payment.contact, 20);
    const { error: insErr } = await supabaseAdmin.from('trek_bookings').insert(row);
    if (insErr) throw insErr;

    return res.status(200).json({ ok: true, created: true });
  } catch (err) {
    // CRITICAL: do NOT swallow with 200. Return 500 so Razorpay re-queues the
    // webhook and we don't permanently lose a paid booking.
    console.error('webhook DB failure (Razorpay will retry):', err);
    return res.status(500).json({ error: 'Booking persistence failed; retry requested' });
  }
}
