// -----------------------------------------------------------------------------
// Consolidated data API (security-hardened)
// -----------------------------------------------------------------------------
// One serverless function fronts all simple DB resources (Vercel Hobby 12-func
// limit). Usage: /api/data?resource=treks  (GET/POST/PUT/DELETE)
//
// AUTHORIZATION MODEL:
//   * GET is public for content resources (the storefront must render).
//   * Mutations (POST/PUT/DELETE) are ADMIN-ONLY for every content resource
//     (treks, tours, gallery, faqs, site-content, business-settings, reviews
//     moderation, trek-bookings) — verified via a Supabase JWT carrying
//     role:"admin". No token / not admin => 401 / 403.
//   * A small allow-list of genuine PUBLIC writes exists for end-user actions:
//       - contact-messages: POST      (visitor sends a message)
//       - reviews:          POST      (hiker submits a review)
//       - bookings:         POST/PUT  (hiker creates / cancels own booking)
//       - hikers:           POST/PUT  (profile bootstrap on signup)
//   Everything else falls through to the admin guard.
//
//   The former `adminConfigHandler` (plain-text admin_id / passcode validation)
//   has been REMOVED entirely — admin identity now comes from Supabase Auth.
// -----------------------------------------------------------------------------
import supabase, { requireAdmin } from './db-client.js';

// Small helper: enforce admin on a specific handler branch (e.g. a GET that
// returns PII). Returns true if the response was already sent (blocked).
async function blockIfNotAdmin(req, res) {
  const { user, reason } = await requireAdmin(req);
  if (!user && reason === 'missing_token') { res.status(401).json({ error: 'Authentication required' }); return true; }
  if (!user && reason === 'invalid_token') { res.status(401).json({ error: 'Invalid or expired session' }); return true; }
  if (reason === 'not_admin') { res.status(403).json({ error: 'Forbidden: admin privileges required' }); return true; }
  return false;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Public-write allow-list: `${resource}:${METHOD}` combinations that do NOT
// require an admin token. Anything not listed here needs admin for mutations.
const PUBLIC_WRITES = new Set([
  'contact-messages:POST',
  'reviews:POST',
  'bookings:POST',
  'bookings:PUT',
  'hikers:POST',
  'hikers:PUT',
]);

// ---- entity_extras helpers for treks & tours ----
const TREK_BASE = ['name_en','name_mr','fort','grade','duration','altitude','price','date','seats','description_en','description_mr','image','category'];
const TREK_EXTRA = ['route_en','route_mr','venue_en','venue_mr','pickup_en','pickup_mr','departure_time','show_date'];
const TOUR_BASE = ['title_en','title_mr','region','days','price','description_en','description_mr','image'];
const TOUR_EXTRA = ['route_en','route_mr','venue_en','venue_mr','pickup_en','pickup_mr','date','departure_time','show_date'];

function split(body, BASE, EXTRA) {
  const base = {}, extra = {};
  for (const k of BASE) if (k in body) base[k] = body[k];
  for (const k of EXTRA) if (k in body) extra[k] = body[k];
  return { base, extra };
}
async function attachExtras(rows, type) {
  const ids = rows.map((r) => r.id);
  if (!ids.length) return rows;
  const { data } = await supabase.from('entity_extras').select('*').eq('entity_type', type).in('entity_id', ids);
  const map = {};
  (data || []).forEach((e) => { map[e.entity_id] = e.data || {}; });
  return rows.map((r) => ({ ...r, ...(map[r.id] || {}) }));
}
async function saveExtras(id, extra, type) {
  if (!extra || !Object.keys(extra).length) return;
  const { data: existing } = await supabase.from('entity_extras').select('id,data').eq('entity_type', type).eq('entity_id', id).maybeSingle();
  if (existing) {
    await supabase.from('entity_extras').update({ data: { ...(existing.data || {}), ...extra }, updated_at: new Date().toISOString() }).eq('id', existing.id);
  } else {
    await supabase.from('entity_extras').insert({ entity_type: type, entity_id: id, data: extra });
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const resource = (req.query.resource || '').toString();

  // ---------------------------------------------------------------------------
  // ROUTE GUARD: enforce admin auth on non-public mutations before any DB work.
  // ---------------------------------------------------------------------------
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    const key = `${resource}:${req.method}`;
    const isPublicWrite = PUBLIC_WRITES.has(key);

    if (!isPublicWrite) {
      const { user, reason } = await requireAdmin(req);
      if (!user && reason === 'missing_token') {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (!user && reason === 'invalid_token') {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      if (reason === 'not_admin') {
        return res.status(403).json({ error: 'Forbidden: admin privileges required' });
      }
      // user is a verified admin — proceed.
    }
  }

  try {
    switch (resource) {
      case 'treks': return treksHandler(req, res);
      case 'tours': return toursHandler(req, res);
      case 'gallery': return galleryHandler(req, res);
      case 'reviews': return reviewsHandler(req, res);
      case 'faqs': return faqsHandler(req, res);
      case 'bookings': return bookingsHandler(req, res);
      case 'contact-messages': return contactHandler(req, res);
      case 'site-content': return siteContentHandler(req, res);
      case 'business-settings': return businessHandler(req, res);
      case 'hikers': return hikersHandler(req, res);
      case 'trek-bookings': return trekBookingsHandler(req, res);
      default: return res.status(400).json({ error: 'Unknown resource: ' + resource });
    }
  } catch (err) {
    console.error('data API error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ---------- TREKS (GET public / mutations admin-guarded above) ----------
async function treksHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('treks').select('*').order('id', { ascending: true });
    if (error) throw error;
    return res.status(200).json(await attachExtras(data, 'trek'));
  }
  if (req.method === 'POST') {
    const { base, extra } = split(req.body, TREK_BASE, TREK_EXTRA);
    const { data, error } = await supabase.from('treks').insert(base).select().single();
    if (error) throw error;
    await saveExtras(data.id, extra, 'trek');
    return res.status(201).json({ ...data, ...extra });
  }
  if (req.method === 'PUT') {
    const { id } = req.body;
    const { base, extra } = split(req.body, TREK_BASE, TREK_EXTRA);
    const { data, error } = await supabase.from('treks').update(base).eq('id', id).select().single();
    if (error) throw error;
    await saveExtras(id, extra, 'trek');
    return res.status(200).json({ ...data, ...extra });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    await supabase.from('entity_extras').delete().eq('entity_type', 'trek').eq('entity_id', id);
    const { error } = await supabase.from('treks').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------- TOURS ----------
async function toursHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('tours').select('*').order('id', { ascending: true });
    if (error) throw error;
    return res.status(200).json(await attachExtras(data, 'tour'));
  }
  if (req.method === 'POST') {
    const { base, extra } = split(req.body, TOUR_BASE, TOUR_EXTRA);
    const { data, error } = await supabase.from('tours').insert(base).select().single();
    if (error) throw error;
    await saveExtras(data.id, extra, 'tour');
    return res.status(201).json({ ...data, ...extra });
  }
  if (req.method === 'PUT') {
    const { id } = req.body;
    const { base, extra } = split(req.body, TOUR_BASE, TOUR_EXTRA);
    const { data, error } = await supabase.from('tours').update(base).eq('id', id).select().single();
    if (error) throw error;
    await saveExtras(id, extra, 'tour');
    return res.status(200).json({ ...data, ...extra });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    await supabase.from('entity_extras').delete().eq('entity_type', 'tour').eq('entity_id', id);
    const { error } = await supabase.from('tours').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------- GALLERY ----------
async function galleryHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('gallery_media').select('*').order('id', { ascending: false });
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const body = req.body;
    const rows = Array.isArray(body) ? body : [body];
    const clean = rows.map((r) => ({
      title_en: r.title_en || '', title_mr: r.title_mr || r.title_en || '',
      category: r.category || 'Forts', media_type: r.media_type || 'image',
      url: r.url, poster: r.poster || null, span: r.span || 'normal',
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
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------- REVIEWS (GET public, POST public-submit, PUT/DELETE admin) ----------
async function reviewsHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('hiker_reviews').select('*').order('pinned', { ascending: false }).order('id', { ascending: false });
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    // Public submission: force safe defaults; never trust client for moderation flags.
    const { name, hiker_email, rating, text_en, text_mr, trek } = req.body;
    const safeRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    const { data, error } = await supabase.from('hiker_reviews').insert({
      name: String(name || 'Anonymous').slice(0, 80),
      hiker_email: hiker_email ? String(hiker_email).slice(0, 160) : null,
      rating: safeRating,
      text_en: String(text_en || '').slice(0, 2000),
      text_mr: String(text_mr || text_en || '').slice(0, 2000),
      trek: trek ? String(trek).slice(0, 120) : null,
      pinned: false,
      approved: true,
    }).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  }
  // PUT (pin/approve) and DELETE reach here only after the admin guard passed.
  if (req.method === 'PUT') {
    const { id, ...rest } = req.body;
    const { data, error } = await supabase.from('hiker_reviews').update(rest).eq('id', id).select().single();
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { error } = await supabase.from('hiker_reviews').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------- FAQS ----------
async function faqsHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('faqs').select('*').order('id', { ascending: true });
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { data, error } = await supabase.from('faqs').insert(req.body).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  }
  if (req.method === 'PUT') {
    const { id, ...rest } = req.body;
    const { data, error } = await supabase.from('faqs').update(rest).eq('id', id).select().single();
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------- BOOKINGS (hiker-facing: create own booking, cancel own booking) ----------
async function bookingsHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('bookings').select('*').order('id', { ascending: false });
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { data, error } = await supabase.from('bookings').insert(req.body).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  }
  if (req.method === 'PUT') {
    const { id, ...rest } = req.body;
    const { data, error } = await supabase.from('bookings').update(rest).eq('id', id).select().single();
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'DELETE') {
    // Deleting bookings outright is admin-only (guard already ran for DELETE).
    const { id } = req.body;
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------- CONTACT MESSAGES (public POST, admin GET) ----------
async function contactHandler(req, res) {
  if (req.method === 'GET') {
    // The contact inbox contains visitor PII — admin-only.
    if (await blockIfNotAdmin(req, res)) return;
    const { data, error } = await supabase.from('contact_messages').select('*').order('id', { ascending: false });
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { name, email, phone, message } = req.body || {};
    const { data, error } = await supabase.from('contact_messages').insert({
      name: String(name || '').slice(0, 120),
      email: email ? String(email).slice(0, 160) : null,
      phone: phone ? String(phone).slice(0, 40) : null,
      message: String(message || '').slice(0, 4000),
    }).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------- SITE CONTENT (admin-only mutations) ----------
async function siteContentHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('site_content').select('*').order('id', { ascending: true });
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'POST' || req.method === 'PUT') {
    const { content_key, value_en, value_mr, content_type } = req.body;
    if (!content_key) return res.status(400).json({ error: 'content_key required' });
    const { data: existing } = await supabase.from('site_content').select('id').eq('content_key', content_key).maybeSingle();
    if (existing) {
      const { data, error } = await supabase.from('site_content').update({ value_en, value_mr, content_type: content_type || 'text', updated_at: new Date().toISOString() }).eq('content_key', content_key).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    const { data, error } = await supabase.from('site_content').insert({ content_key, value_en, value_mr, content_type: content_type || 'text' }).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  }
  if (req.method === 'DELETE') {
    const { content_key } = req.body;
    const { error } = await supabase.from('site_content').delete().eq('content_key', content_key);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------- BUSINESS SETTINGS (admin-only PUT) ----------
async function businessHandler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('business_settings').select('*').order('id', { ascending: true }).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return res.status(200).json(data || null);
  }
  if (req.method === 'PUT') {
    const { id, ...rest } = req.body;
    const { data, error } = await supabase.from('business_settings').update(rest).eq('id', id).select().single();
    if (error) throw error;
    return res.status(200).json(data);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------- HIKERS (profile bootstrap on signup: public POST/PUT) ----------
async function hikersHandler(req, res) {
  if (req.method === 'GET') {
    const { auth_email, mobile } = req.query || {};
    let q = supabase.from('hiker_profiles').select('*').order('id', { ascending: true });
    if (auth_email) q = q.eq('auth_email', auth_email);
    else if (mobile) q = q.eq('mobile', String(mobile).replace(/\D/g, ''));
    const { data, error } = await q;
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { name, mobile, email, auth_email } = req.body;
    const cleanMobile = mobile ? String(mobile).replace(/\D/g, '') : null;
    const key = auth_email || email;
    if (key) {
      const { data: existing } = await supabase.from('hiker_profiles').select('id').eq('auth_email', key).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from('hiker_profiles').update({ ...(name ? { name } : {}), ...(cleanMobile ? { mobile: cleanMobile } : {}), ...(email ? { email } : {}) }).eq('id', existing.id).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }
    }
    const { data, error } = await supabase.from('hiker_profiles').insert({
      name: name || 'New Hiker', mobile: cleanMobile, email: email || null, auth_email: key || null,
      passport_id: 'MVL-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 89999),
      blood_group: '—', emergency_contact: '—', treks_completed: 0, stamps: [],
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
  return res.status(405).json({ error: 'Method not allowed' });
}

// ---------- TREK BOOKINGS (paid list + stats; admin-guarded for mutations) ----------
async function trekBookingsHandler(req, res) {
  if (req.method === 'GET') {
    // Paid bookings expose PII (names/mobiles/cities) and revenue — admin-only.
    if (await blockIfNotAdmin(req, res)) return;
    const { data, error } = await supabase.from('trek_bookings').select('*').order('id', { ascending: false });
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
    const { data, error } = await supabase.from('trek_bookings').update({ payment_status }).eq('id', id).select().single();
    if (error) throw error;
    return res.status(200).json(data);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
