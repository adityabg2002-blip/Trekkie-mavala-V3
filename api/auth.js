// Consolidated auth + upload API (OTP, mobile register/resolve, file upload).
// Usage:
//   POST /api/auth?action=send | verify | register | resolve   (OTP/mobile auth)
//   POST /api/auth?action=upload                               (file upload)
import supabase from './db-client.js';

export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function mobileToEmail(mobile) {
  const digits = String(mobile).replace(/\D/g, '');
  return `m${digits}@mavala-hiker.app`;
}
function mobileToPassword(mobile) {
  const digits = String(mobile).replace(/\D/g, '');
  return `MavalaOtp#${digits}`;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = (req.query.action || req.body?.action || '').toString();

  try {
    if (action === 'upload') return uploadHandler(req, res);
    if (['send', 'verify', 'register', 'resolve'].includes(action)) return otpHandler(action, req, res);
    return res.status(400).json({ error: 'Unknown action: ' + action });
  } catch (err) {
    console.error('auth API error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ---------- FILE UPLOAD ----------
async function uploadHandler(req, res) {
  const { fileName, fileBase64, contentType } = req.body;
  if (!fileName || !fileBase64) return res.status(400).json({ error: 'fileName and fileBase64 required' });
  const buffer = Buffer.from(fileBase64, 'base64');
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from('site-assets').upload(safeName, buffer, { contentType: contentType || 'application/octet-stream', upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(safeName);
  return res.status(200).json({ url: urlData.publicUrl });
}

// ---------- OTP / MOBILE AUTH ----------
async function otpHandler(action, req, res) {
  if (action === 'send') {
    const digits = String(req.body.mobile || '').replace(/\D/g, '');
    if (digits.length < 10) return res.status(400).json({ error: 'Enter a valid mobile number' });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await supabase.from('mobile_otps').delete().eq('mobile', digits);
    const { error } = await supabase.from('mobile_otps').insert({ mobile: digits, code, expires_at: expires });
    if (error) throw error;
    return res.status(200).json({ ok: true, demoCode: code });
  }

  if (action === 'verify') {
    const { mobile, code, name, email } = req.body;
    const digits = String(mobile || '').replace(/\D/g, '');
    const { data: row } = await supabase.from('mobile_otps').select('*').eq('mobile', digits).maybeSingle();
    if (!row) return res.status(400).json({ error: 'No OTP requested for this number' });
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    if (String(code) !== String(row.code)) return res.status(400).json({ error: 'Incorrect OTP' });
    await supabase.from('mobile_otps').delete().eq('mobile', digits);

    const internalEmail = mobileToEmail(digits);
    const password = mobileToPassword(digits);
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => u.email === internalEmail);
    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, {
        user_metadata: { ...existing.user_metadata, mobile: digits, ...(name ? { name } : {}), ...(email ? { contact_email: email } : {}) },
      });
    } else {
      const { error: cErr } = await supabase.auth.admin.createUser({
        email: internalEmail, password, email_confirm: true,
        user_metadata: { mobile: digits, name: name || `Hiker ${digits.slice(-4)}`, contact_email: email || null, auth_kind: 'mobile' },
      });
      if (cErr) throw cErr;
    }
    await ensureHiker(digits, name, email);
    return res.status(200).json({ ok: true, email: internalEmail, password });
  }

  if (action === 'register') {
    const { mobile, password, name, email } = req.body;
    const digits = String(mobile || '').replace(/\D/g, '');
    if (digits.length < 10) return res.status(400).json({ error: 'Enter a valid mobile number' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const internalEmail = mobileToEmail(digits);
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => u.email === internalEmail);
    if (existing) return res.status(409).json({ error: 'An account with this mobile already exists. Please sign in.' });
    const { error: cErr } = await supabase.auth.admin.createUser({
      email: internalEmail, password, email_confirm: true,
      user_metadata: { mobile: digits, name: name || `Hiker ${digits.slice(-4)}`, contact_email: email || null, auth_kind: 'mobile' },
    });
    if (cErr) throw cErr;
    await ensureHiker(digits, name, email);
    return res.status(200).json({ ok: true, email: internalEmail });
  }

  if (action === 'resolve') {
    const digits = String(req.body.mobile || '').replace(/\D/g, '');
    return res.status(200).json({ email: mobileToEmail(digits) });
  }
}

async function ensureHiker(mobile, name, email) {
  try {
    const authEmail = mobileToEmail(mobile);
    const { data: existing } = await supabase.from('hiker_profiles').select('id').eq('mobile', mobile).maybeSingle();
    if (existing) {
      if (name || email) await supabase.from('hiker_profiles').update({ ...(name ? { name } : {}), ...(email ? { email } : {}) }).eq('id', existing.id);
      return;
    }
    await supabase.from('hiker_profiles').insert({
      name: name || `Hiker ${String(mobile).slice(-4)}`, mobile, email: email || null, auth_email: authEmail,
      passport_id: 'MVL-' + new Date().getFullYear() + '-' + String(mobile).slice(-5),
      blood_group: '—', emergency_contact: '—', treks_completed: 0, stamps: [],
    });
  } catch (e) {
    console.error('ensureHiker error:', e.message);
  }
}
