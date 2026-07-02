# TREKKIE मावळा — Go‑Live Migration Guide

This guide moves your site from the temporary/demo backend to YOUR OWN accounts,
safely. Follow the steps in order. No coding required — just copy/paste.

--------------------------------------------------------------------------------
## STEP 1 — Create your own Supabase project
1. Go to supabase.com → sign up / log in.
2. "New Project" → give it a name (e.g. "trekkie-mavala") → choose a strong DB password → create.
3. Wait ~2 minutes for it to provision.

## STEP 2 — Create all tables (copy‑paste this SQL)
Open your project → left menu "SQL Editor" → "New query" → paste EVERYTHING below → Run.

```sql
-- ========= CONTENT =========
create table if not exists treks (
  id bigserial primary key, name_en text, name_mr text, fort text, grade text,
  duration text, altitude text, price integer, date text, seats integer,
  description_en text, description_mr text, image text, category text,
  created_at timestamptz default now()
);
create table if not exists tours (
  id bigserial primary key, title_en text, title_mr text, region text, days integer,
  price integer, description_en text, description_mr text, image text,
  created_at timestamptz default now()
);
create table if not exists gallery_media (
  id bigserial primary key, title_en text, title_mr text, category text default 'Forts',
  media_type text default 'image', url text not null, poster text, span text default 'normal',
  created_at timestamptz default now()
);
create table if not exists faqs (
  id bigserial primary key, category text, question_en text, question_mr text,
  answer_en text, answer_mr text, created_at timestamptz default now()
);
create table if not exists hiker_reviews (
  id bigserial primary key, name text, hiker_email text, rating integer default 5,
  text_en text, text_mr text, trek text, pinned boolean default false,
  approved boolean default true, created_at timestamptz default now()
);
create table if not exists business_settings (
  id bigserial primary key, phone text, emergency_phone text, email text, whatsapp text,
  address_en text, address_mr text, map_embed text, next_departure text, instagram text,
  created_at timestamptz default now()
);
create table if not exists site_content (
  id bigserial primary key, content_key text not null, value_en text, value_mr text,
  content_type text default 'text', updated_at timestamptz default now()
);
create table if not exists entity_extras (
  id bigserial primary key, entity_type text not null, entity_id integer not null,
  data jsonb default '{}', updated_at timestamptz default now()
);

-- ========= ACCOUNTS / ADMIN =========
create table if not exists admin_config (
  id bigserial primary key, admin_id text not null, passcode text not null,
  updated_at timestamptz default now()
);
create table if not exists hiker_profiles (
  id bigserial primary key, name text, mobile text, email text, auth_email text,
  passport_id text, blood_group text default '—', emergency_contact text default '—',
  treks_completed integer default 0, stamps jsonb default '[]', created_at timestamptz default now()
);
create table if not exists mobile_otps (
  id bigserial primary key, mobile text not null, code text not null,
  expires_at timestamptz, created_at timestamptz default now()
);
create table if not exists contact_messages (
  id bigserial primary key, name text, email text, phone text, message text,
  created_at timestamptz default now()
);
create table if not exists bookings (
  id bigserial primary key, hiker_name text, trek_name text, date text, amount integer,
  status text default 'Confirmed', created_at timestamptz default now()
);

-- ========= PAYMENTS =========
create table if not exists trek_bookings (
  id bigserial primary key, full_name text not null, mobile text not null, age integer,
  gender text, city text, trek_name text, amount integer, razorpay_order_id text,
  razorpay_payment_id text, payment_status text default 'Pending', created_at timestamptz default now()
);

-- ========= SECURITY: turn on Row Level Security =========
-- These tables hold private data — lock out public reads (server routes still work).
alter table trek_bookings   enable row level security;
alter table mobile_otps     enable row level security;
alter table admin_config    enable row level security;
alter table hiker_profiles  enable row level security;
alter table contact_messages enable row level security;
alter table bookings        enable row level security;

create policy "no_public_read" on trek_bookings   for select using (false);
create policy "no_public_read" on mobile_otps      for select using (false);
create policy "no_public_read" on admin_config     for select using (false);
create policy "no_public_read" on hiker_profiles   for select using (false);
create policy "no_public_read" on contact_messages for select using (false);
create policy "no_public_read" on bookings         for select using (false);

-- Set your admin login (change these!)
insert into admin_config (admin_id, passcode) values ('command', 'change-me-now');
```

## STEP 3 — Get your Supabase keys
Project → Settings → API. Copy:
- Project URL
- anon public key
- service_role key (SECRET — server only)

## STEP 4 — Razorpay (do this when your site is ready for review)
1. Razorpay Dashboard → complete KYC / business activation.
2. Once activated, Settings → API Keys → Generate LIVE keys (rzp_live_...).
3. IMPORTANT: also REGENERATE your test secret, since the old one was shared in chat.
4. (Optional but recommended) Settings → Webhooks → Add:
   - URL: https://YOUR-SITE/api/razorpay-webhook
   - Secret: any strong string
   - Events: payment.captured, payment.failed

## STEP 5 — Put keys in environment variables (NEVER in the code)
On Vercel: Project → Settings → Environment Variables. Add:

    NEXT_PUBLIC_SUPABASE_URL      = your project URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY = your anon key
    SUPABASE_SERVICE_ROLE_KEY     = your service_role key   (secret)
    VITE_SUPABASE_URL             = your project URL
    VITE_SUPABASE_ANON_KEY        = your anon key
    VITE_RAZORPAY_KEY_ID          = rzp_live_xxx  (public key id)
    RAZORPAY_KEY_ID               = rzp_live_xxx
    RAZORPAY_KEY_SECRET           = your razorpay secret  (secret, server only)
    RAZORPAY_WEBHOOK_SECRET       = the webhook secret you chose

GOLDEN RULE: Anything named *SECRET or *SERVICE_ROLE* must NEVER start with VITE_
and must NEVER appear in frontend code. This app already keeps them server‑only.

## STEP 6 — Redeploy
Redeploy the site so the new keys take effect. Test one booking. Done!

--------------------------------------------------------------------------------
### Test card (Test Mode only)
Card 4111 1111 1111 1111 · any future expiry · any CVV · any OTP.

### Where to see bookings
- Inside the site: Commander Login → Payments tab (read‑only + CSV export).
- Supabase: Table Editor → trek_bookings.
- Razorpay: Dashboard → Transactions (your form details appear under "Notes").
