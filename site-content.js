import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('site_content').select('*').order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }
    // Upsert a single content key (create if missing, update otherwise)
    if (req.method === 'POST' || req.method === 'PUT') {
      const { content_key, value_en, value_mr, content_type } = req.body;
      if (!content_key) return res.status(400).json({ error: 'content_key required' });
      const { data: existing } = await supabase.from('site_content').select('id').eq('content_key', content_key).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from('site_content')
          .update({ value_en, value_mr, content_type: content_type || 'text', updated_at: new Date().toISOString() })
          .eq('content_key', content_key).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      } else {
        const { data, error } = await supabase.from('site_content')
          .insert({ content_key, value_en, value_mr, content_type: content_type || 'text' })
          .select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }
    }
    if (req.method === 'DELETE') {
      const { content_key } = req.body;
      const { error } = await supabase.from('site_content').delete().eq('content_key', content_key);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
