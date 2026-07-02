import supabase from './db-client.js';

// Returns all trek bookings + summary stats for the admin dashboard,
// and supports marking a booking as Refunded.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('trek_bookings')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;

      const bookings = data || [];
      const paidRows = bookings.filter((b) => b.payment_status === 'Paid');
      const stats = {
        total: bookings.length,
        paid: paidRows.length,
        pending: bookings.filter((b) => b.payment_status === 'Pending').length,
        failed: bookings.filter((b) => b.payment_status === 'Failed').length,
        refunded: bookings.filter((b) => b.payment_status === 'Refunded').length,
        revenue: paidRows.reduce((sum, b) => sum + (b.amount || 0), 0),
      };
      return res.status(200).json({ bookings, stats });
    }

    if (req.method === 'PUT') {
      const { id, payment_status } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase
        .from('trek_bookings')
        .update({ payment_status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
