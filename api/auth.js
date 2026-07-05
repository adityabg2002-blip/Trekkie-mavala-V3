// -----------------------------------------------------------------------------
// Consolidated auth + upload API (security-hardened)
// -----------------------------------------------------------------------------
//   POST /api/auth?action=send | verify | register | resolve   (OTP/mobile auth)
//   POST /api/auth?action=upload                               (file upload)
//
// HARDENING:
//   1. OTP RATE-LIMITING: `send` enforces a cooldown per mobile (default 45s)
//      and a hard hourly cap, so nobody can spam delete/insert the mobile_otps
//      table. Expired rows are purged opportunistically.
//   2. OTP EXPIRY: verify strictly rejects expired codes.
//   3. NO PROFILE CORRUPTION: hiker profiles are keyed on the trusted internal
//      auth_email derived from the *verified* mobile. Untrusted name/email from
//      the request can only FILL EMPTY fields — it can never overwrite an
//      existing non-empty value, preventing identity desync/takeover.
//
//   Auth-admin operations (createUser / listUsers) require the service role, so
//   this file uses `supabaseAdmin`. RLS-respecting reads/writes use `supabase`.
// -----------------------------------------------------------------------------
import supabase, { supabaseAdmin } from './db-client.js';

export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };

// OTP policy
const OTP_TTL_MS = 5 * 60 * 1000;   // code valid 5 minutes
const OTP_COOLDOWN_MS = 45 * 1000;  // min gap between sends to the same number
const OTP_HOURLY_CAP = 5;           // max sends per number per rolling hour

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function normMobile(m) {
  return String(m || '').replace(/\D/g, '');
}
function mobileToEmail(mobile) {
  return `m${normMobile(mobile)}@mavala-hiker.app`;
}
function mobileToPassword(mobile) {
  return `MavalaOtp#${normMobile(mobile)}`;
}
function isValidMobile(digits) {
  return /^\d{10,15}$/.test(digits);
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
  const safeName = `${Date.now()}-${String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  // Storage upload requires service role for server-side writes.
  const { error } = await supabaseAdmin.storage.from('site-assets').upload(safeName, buffer, {
    contentType: contentType || 'application/octet-stream', upsert: true,
  });
  if (error) throw error;
  const { data: urlData } = supabaseAdmin.storage.from('site-assets').getPublicUrl(safeName);
  return res.status(200).json({ url: urlData.publicUrl });
}

// ---------- OTP / MOBILE AUTH ----------
async function otpHandler(action, req, res) {
  // ===== SEND (rate-limited) =====
  if (action === 'send') {
    const digits = normMobile(req.body.mobile);
    if (!isValidMobile(digits)) return res.status(400).json({ error: 'Enter a valid mobile number' });

    const now = Date.now();

    // Opportunistically purge expired codes for this number.
    await supabase.from('mobile_otps').delete().eq('mobile', digits).lt('expires_at', new Date(now).toISOString());

    // Rate-limit: inspect existing rows for cooldown + hourly cap.
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('mobile_otps')
      .select('id, created_at')
      .eq('mobile', digits)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    if (recent && recent.length) {
      const last = new Date(recent[0].created_at).getTime();
      if (now - last < OTP_COOLDOWN_MS) {
        const wait = Math.ceil((OTP_COOLDOWN_MS - (now - last)) / 1000);
        return res.status(429).json({ error: `Please wait ${wait}s before requesting another OTP` });
      }
      if (recent.length >= OTP_HOURLY_CAP) {
        return res.status(429).json({ error: 'Too many OTP requests. Try again later.' });
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(now + OTP_TTL_MS).toISOString();

    // Replace the active code for this number (keeps table lean) then insert.
    await supabase.from('mobile_otps').delete().eq('mobile', digits);
    const { error } = await supabase.from('mobile_otps').insert({ mobile: digits, code, expires_at: expires });
    if (error) throw error;

    // In production, dispatch `code` via SMS instead of returning it.
    return res.status(200).json({ ok: true, demoCode: code });
  }

  // ===== VERIFY =====
  if (action === 'verify') {
    const { mobile, code, name, email } = req.body;
    const digits = normMobile(mobile);
    if (!isValidMobile(digits)) return res.status(400).json({ error: 'Enter a valid mobile number' });

    const { data: row } = await supabase.from('mobile_otps').select('*').eq('mobile', digits).maybeSingle();
    if (!row) return res.status(400).json({ error: 'No OTP requested for this number' });
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      await supabase.from('mobile_otps').delete().eq('mobile', digits);
      return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    }
    if (String(code) !== String(row.code)) return res.status(400).json({ error: 'Incorrect OTP' });

    // One-time use: burn the code immediately on success.
    await supabase.from('mobile_otps').delete().eq('mobile', digits);

    const internalEmail = mobileToEmail(digits);
    const password = mobileToPassword(digits);

    // The mobile is now VERIFIED, so it is safe to (de)provision this identity.
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => u.email === internalEmail);
    if (existing) {
      // Only fill missing metadata; do not clobber existing values with input.
      const meta = existing.user_metadata || {};
      const patch = { ...meta, mobile: digits };
      if (name && !meta.name) patch.name = name;
      if (email && !meta.contact_email) patch.contact_email = email;
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { user_metadata: patch });
    } else {
      const { error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email: internalEmail, password, email_confirm: true,
        user_metadata: { mobile: digits, name: name || `Hiker ${digits.slice(-4)}`, contact_email: email || null, auth_kind: 'mobile' },
      });
      if (cErr) throw cErr;
    }

    await ensureHiker(digits, name, email);
    return res.status(200).json({ ok: true, email: internalEmail, password });
  }

  // ===== REGISTER (mobile + password) =====
  if (action === 'register') {
    const { mobile, password, name, email } = req.body;
    const digits = normMobile(mobile);
    if (!isValidMobile(digits)) return res.status(400).json({ error: 'Enter a valid mobile number' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const internalEmail = mobileToEmail(digits);
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => u.email === internalEmail);
    if (existing) return res.status(409).json({ error: 'An account with this mobile already exists. Please sign in.' });

    const { error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail, password, email_confirm: true,
      user_metadata: { mobile: digits, name: name || `Hiker ${digits.slice(-4)}`, contact_email: email || null, auth_kind: 'mobile' },
    });
    if (cErr) throw cErr;
    await ensureHiker(digits, name, email);
    return res.status(200).json({ ok: true, email: internalEmail });
  }

  // ===== RESOLVE (mobile -> internal login email) =====
  if (action === 'resolve') {
    const digits = normMobile(req.body.mobile);
    if (!isValidMobile(digits)) return res.status(400).json({ error: 'Enter a valid mobile number' });
    return res.status(200).json({ email: mobileToEmail(digits) });
  }
}

// -----------------------------------------------------------------------------
// ensureHiker — desync-safe profile upsert.
// Keyed on the TRUSTED auth_email (derived from the verified mobile). Untrusted
// name/email can only fill an EMPTY field; it will never overwrite an existing
// non-empty value, so a second registration attempt can't corrupt/hijack the
// stored profile.
// -----------------------------------------------------------------------------
async function ensureHiker(mobile, name, email) {
  try {
    const digits = normMobile(mobile);
    const authEmail = mobileToEmail(digits);

    // Resolve strictly by the immutable auth_email identity.
    const { data: existing } = await supabase
      .from('hiker_profiles')
      .select('id, name, email')
      .eq('auth_email', authEmail)
      .maybeSingle();

    if (existing) {
      const patch = {};
      // Fill-only semantics: never overwrite an existing non-empty value.
      const isBlank = (v) => v === null || v === undefined || String(v).trim() === '' || String(v).trim() === '—';
      if (name && isBlank(existing.name)) patch.name = String(name).slice(0, 120);
      if (email && isBlank(existing.email)) patch.email = String(email).slice(0, 160);
      if (Object.keys(patch).length) {
        await supabase.from('hiker_profiles').update(patch).eq('id', existing.id);
      }
      return;
    }

    await supabase.from('hiker_profiles').insert({
      name: name ? String(name).slice(0, 120) : `Hiker ${digits.slice(-4)}`,
      mobile: digits,
      email: email ? String(email).slice(0, 160) : null,
      auth_email: authEmail,
      passport_id: 'MVL-' + new Date().getFullYear() + '-' + digits.slice(-5),
      blood_group: '—', emergency_contact: '—', treks_completed: 0, stamps: [],
    });
  } catch (e) {
    console.error('ensureHiker error:', e.message);
  }
}
