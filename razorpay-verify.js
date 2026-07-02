// Verifies the Razorpay payment signature (proves the payment is genuine and
// not tampered with) and then saves the booking to Supabase with status 'Paid'.
// The Key SECRET is read only from the server environment.

import crypto from 'crypto';
import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(500).json({ error: 'Payment gateway not configured' });

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking, // { full_name, mobile, age, gender, city, trek_name, amount }
    } = req.body;

    // 1) Verify signature: HMAC_SHA256(order_id + '|' + payment_id, key_secret)
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      await supabase.from('trek_bookings').insert({
        full_name: booking?.full_name, mobile: booking?.mobile, age: booking?.age ? Number(booking.age) : null,
        gender: booking?.gender, city: booking?.city, trek_name: booking?.trek_name,
        amount: booking?.amount ? Number(booking.amount) : null, razorpay_order_id, razorpay_payment_id,
        payment_status: 'Failed',
      });
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // 2) Signature valid -> save the paid booking
    const { data, error } = await supabase.from('trek_bookings').insert({
      full_name: booking?.full_name,
      mobile: booking?.mobile,
      age: booking?.age ? Number(booking.age) : null,
      gender: booking?.gender,
      city: booking?.city,
      trek_name: booking?.trek_name,
      amount: booking?.amount ? Number(booking.amount) : null,
      razorpay_order_id,
      razorpay_payment_id,
      payment_status: 'Paid',
    }).select().single();
    if (error) throw error;

    return res.status(200).json({ ok: true, booking: data });
  } catch (err) {
    console.error('razorpay-verify error:', err);
    res.status(500).json({ error: err.message });
  }
}
