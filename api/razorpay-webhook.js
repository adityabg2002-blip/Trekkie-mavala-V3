// Razorpay Webhook endpoint (server-to-server safety net).
// Razorpay calls this URL directly when a payment is captured — so even if the
// user's browser closes right after paying, the booking is still recorded.
//
// SETUP (after you go live, or to test now):
//   Razorpay Dashboard -> Settings -> Webhooks -> Add New Webhook
//   URL:    https://YOUR-SITE/api/razorpay-webhook
//   Secret: choose a strong string and set it as RAZORPAY_WEBHOOK_SECRET (server env)
//   Events: payment.captured, payment.failed
//
// The webhook secret lives ONLY in server env vars. It is never exposed in the app.

import crypto from 'crypto';
import supabase from './db-client.js';

// We need the RAW body to verify the webhook signature.
export const config = { api: { bodyParser: false } };

function readRaw(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const raw = await readRaw(req);
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const signature = req.headers['x-razorpay-signature'];

    // Verify the webhook signature so only genuine Razorpay calls are trusted.
    if (secret) {
      const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
      if (expected !== signature) {
        console.error('Webhook signature mismatch');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const event = JSON.parse(raw || '{}');
    const type = event.event;
    const payment = event.payload?.payment?.entity;
    if (!payment) return res.status(200).json({ ok: true, ignored: true });

    const orderId = payment.order_id;
    const paymentId = payment.id;
    const notes = payment.notes || {};
    const status = type === 'payment.captured' ? 'Paid' : (type === 'payment.failed' ? 'Failed' : 'Pending');

    // 1) Find an existing booking by order id or payment id
    const { data: existing } = await supabase
      .from('trek_bookings')
      .select('id, payment_status')
      .or(`razorpay_order_id.eq.${orderId},razorpay_payment_id.eq.${paymentId}`)
      .maybeSingle();

    if (existing) {
      // Only upgrade Pending/Failed -> Paid; never downgrade a Paid record.
      if (!(existing.payment_status === 'Paid' && status !== 'Paid')) {
        await supabase.from('trek_bookings')
          .update({ razorpay_payment_id: paymentId, payment_status: status })
          .eq('id', existing.id);
      }
      return res.status(200).json({ ok: true, reconciled: true });
    }

    // 2) No record (browser closed before saving) -> create from webhook notes.
    await supabase.from('trek_bookings').insert({
      full_name: notes['Full Name'] || null,
      mobile: notes['Mobile'] || (payment.contact ? String(payment.contact) : null),
      age: notes['Age'] ? Number(notes['Age']) : null,
      gender: notes['Gender'] || null,
      city: notes['City'] || null,
      trek_name: notes['Trek Name'] || null,
      amount: payment.amount ? Math.round(payment.amount / 100) : null,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      payment_status: status,
    });

    return res.status(200).json({ ok: true, created: true });
  } catch (err) {
    console.error('webhook error:', err);
    // Return 200 so Razorpay doesn't retry-storm on parsing bugs;
    // genuine signature failures already returned 400 above.
    return res.status(200).json({ ok: false, error: err.message });
  }
}
