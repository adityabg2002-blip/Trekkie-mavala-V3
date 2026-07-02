import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('gallery_media').select('*').order('id', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      // Accept a single item or an array of items (bulk upload)
      const body = req.body;
      const rows = Array.isArray(body) ? body : [body];
      const clean = rows.map((r) => ({
        title_en: r.title_en || '',
        title_mr: r.title_mr || r.title_en || '',
        category: r.category || 'Forts',
        media_type: r.media_type || 'image',
        url: r.url,
        poster: r.poster || null,
        span: r.span || 'normal',
      })).filter((r) => r.url);
      if (!clean.length) return res.status(400).json({ error: 'No valid media items' });
      const { data, error } = await supabase.from('gallery_media').insert(clean).select();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...rest } = req.body;
      const { data, error } = await supabase.from('gallery_media').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      // Support single id or bulk ids array
      const { id, ids } = req.body;
      if (Array.isArray(ids) && ids.length) {
        const { error } = await supabase.from('gallery_media').delete().in('id', ids);
        if (error) throw error;
        return res.status(200).json({ ok: true, deleted: ids.length });
      }
      const { error } = await supabase.from('gallery_media').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
