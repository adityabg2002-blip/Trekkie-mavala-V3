import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      // Optional filters: ?auth_email= or ?mobile=
      const { auth_email, mobile } = req.query || {};
      let q = supabase.from('hiker_profiles').select('*').order('id', { ascending: true });
      if (auth_email) q = q.eq('auth_email', auth_email);
      else if (mobile) q = q.eq('mobile', String(mobile).replace(/\D/g, ''));
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }

    // Create/ensure a profile for an email-based signup
    if (req.method === 'POST') {
      const { name, mobile, email, auth_email } = req.body;
      const cleanMobile = mobile ? String(mobile).replace(/\D/g, '') : null;
      const key = auth_email || email;
      if (key) {
        const { data: existing } = await supabase.from('hiker_profiles').select('id').eq('auth_email', key).maybeSingle();
        if (existing) {
          const { data, error } = await supabase.from('hiker_profiles')
            .update({ ...(name ? { name } : {}), ...(cleanMobile ? { mobile: cleanMobile } : {}), ...(email ? { email } : {}) })
            .eq('id', existing.id).select().single();
          if (error) throw error;
          return res.status(200).json(data);
        }
      }
      const { data, error } = await supabase.from('hiker_profiles').insert({
        name: name || 'New Hiker',
        mobile: cleanMobile,
        email: email || null,
        auth_email: key || null,
        passport_id: 'MVL-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 89999),
        blood_group: '—',
        emergency_contact: '—',
        treks_completed: 0,
        stamps: [],
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...rest } = req.body;
      const { data, error } = await supabase.from('hiker_profiles').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
