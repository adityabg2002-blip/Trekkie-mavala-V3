import supabase from './db-client.js';

const BASE = ['name_en','name_mr','fort','grade','duration','altitude','price','date','seats','description_en','description_mr','image','category'];
const EXTRA = ['route_en','route_mr','venue_en','venue_mr','pickup_en','pickup_mr','departure_time','show_date'];

function split(body) {
  const base = {}, extra = {};
  for (const k of BASE) if (k in body) base[k] = body[k];
  for (const k of EXTRA) if (k in body) extra[k] = body[k];
  return { base, extra };
}

async function attachExtras(rows) {
  const ids = rows.map(r => r.id);
  if (!ids.length) return rows;
  const { data } = await supabase.from('entity_extras').select('*').eq('entity_type', 'trek').in('entity_id', ids);
  const map = {};
  (data || []).forEach(e => { map[e.entity_id] = e.data || {}; });
  return rows.map(r => ({ ...r, ...(map[r.id] || {}) }));
}

async function saveExtras(id, extra) {
  if (!extra || !Object.keys(extra).length) return;
  const { data: existing } = await supabase.from('entity_extras').select('id,data').eq('entity_type', 'trek').eq('entity_id', id).maybeSingle();
  if (existing) {
    await supabase.from('entity_extras').update({ data: { ...(existing.data||{}), ...extra }, updated_at: new Date().toISOString() }).eq('id', existing.id);
  } else {
    await supabase.from('entity_extras').insert({ entity_type: 'trek', entity_id: id, data: extra });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('treks').select('*').order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(await attachExtras(data));
    }
    if (req.method === 'POST') {
      const { base, extra } = split(req.body);
      const { data, error } = await supabase.from('treks').insert(base).select().single();
      if (error) throw error;
      await saveExtras(data.id, extra);
      return res.status(201).json({ ...data, ...extra });
    }
    if (req.method === 'PUT') {
      const { id } = req.body;
      const { base, extra } = split(req.body);
      const { data, error } = await supabase.from('treks').update(base).eq('id', id).select().single();
      if (error) throw error;
      await saveExtras(id, extra);
      return res.status(200).json({ ...data, ...extra });
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await supabase.from('entity_extras').delete().eq('entity_type', 'trek').eq('entity_id', id);
      const { error } = await supabase.from('treks').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
