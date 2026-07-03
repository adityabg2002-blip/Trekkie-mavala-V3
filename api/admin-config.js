import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // POST = verify login credentials (never expose the passcode via GET)
    if (req.method === 'POST') {
      const { admin_id, passcode } = req.body;
      const { data, error } = await supabase.from('admin_config').select('*').order('id', { ascending: true }).limit(1).single();
      if (error) throw error;
      const ok = data && data.admin_id === (admin_id || '').trim() && data.passcode === passcode;
      return res.status(200).json({ ok: !!ok });
    }
    // PUT = change credentials (requires current passcode)
    if (req.method === 'PUT') {
      const { current_passcode, admin_id, passcode } = req.body;
      const { data, error } = await supabase.from('admin_config').select('*').order('id', { ascending: true }).limit(1).single();
      if (error) throw error;
      if (!data || data.passcode !== current_passcode) return res.status(403).json({ error: 'Current passcode incorrect' });
      const patch = { updated_at: new Date().toISOString() };
      if (admin_id) patch.admin_id = admin_id.trim();
      if (passcode) patch.passcode = passcode;
      const { data: upd, error: e2 } = await supabase.from('admin_config').update(patch).eq('id', data.id).select().single();
      if (e2) throw e2;
      return res.status(200).json({ ok: true, admin_id: upd.admin_id });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
