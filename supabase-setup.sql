-- =====================================================================
--  TREKKIE मावळा — COMPLETE SUPABASE SETUP
--  ---------------------------------------------------------------
--  HOW TO USE:
--  1. Open your own Supabase project  ->  https://supabase.com/dashboard
--  2. In the left menu, click  "SQL Editor"
--  3. Click  "+ New query"
--  4. Select ALL the text in this file (Ctrl+A / Cmd+A) and copy it
--  5. Paste it into the SQL Editor box
--  6. Click the green  "Run"  button
--  7. Done! All your tables are created.
--
--  This script is safe to run more than once (uses IF NOT EXISTS).
-- =====================================================================


-- ---------- 1. TREKS ----------
create table if not exists treks (
  id              bigserial primary key,
  name_en         text,
  name_mr         text,
  fort            text,
  grade           text,
  duration        text,
  altitude        text,
  price           integer,
  date            text,
  seats           integer,
  description_en  text,
  description_mr  text,
  image           text,
  category        text,
  created_at      timestamptz default now()
);

-- ---------- 2. TOURS ----------
create table if not exists tours (
  id              bigserial primary key,
  title_en        text,
  title_mr        text,
  region          text,
  days            integer,
  price           integer,
  description_en  text,
  description_mr  text,
  image           text,
  created_at      timestamptz default now()
);

-- ---------- 3. GALLERY (photos + videos) ----------
create table if not exists gallery_media (
  id          bigserial primary key,
  title_en    text,
  title_mr    text,
  category    text default 'Forts',
  media_type  text default 'image',   -- 'image' or 'video'
  url         text not null,
  poster      text,
  span        text default 'normal',
  created_at  timestamptz default now()
);

-- ---------- 4. BUSINESS SETTINGS (phone / email / hero / map) ----------
create table if not exists business_settings (
  id              bigserial primary key,
  phone           text,
  emergency_phone text,
  email           text,
  whatsapp        text,
  address_en      text,
  address_mr      text,
  map_embed       text,
  next_departure  text,
  instagram       text,
  created_at      timestamptz default now()
);

-- ---------- 5. SITE CONTENT (editable text + logo + policies) ----------
create table if not exists site_content (
  id            bigserial primary key,
  content_key   text not null,
  value_en      text,
  value_mr      text,
  content_type  text default 'text',
  updated_at    timestamptz default now()
);

-- ---------- 6. REVIEWS ----------
create table if not exists hiker_reviews (
  id          bigserial primary key,
  name        text,
  hiker_email text,
  rating      integer default 5,
  text_en     text,
  text_mr     text,
  trek        text,
  pinned      boolean default false,
  approved    boolean default true,
  created_at  timestamptz default now()
);

-- ---------- 7. FAQs ----------
create table if not exists faqs (
  id           bigserial primary key,
  category     text,
  question_en  text,
  question_mr  text,
  answer_en    text,
  answer_mr    text,
  created_at   timestamptz default now()
);

-- ---------- 8. CONTACT MESSAGES ----------
create table if not exists contact_messages (
  id          bigserial primary key,
  name        text,
  email       text,
  phone       text,
  message     text,
  created_at  timestamptz default now()
);

-- ---------- 9. HIKER PROFILES ----------
create table if not exists hiker_profiles (
  id                bigserial primary key,
  name              text,
  mobile            text,
  email             text,
  auth_email        text,
  passport_id       text,
  blood_group       text default '—',
  emergency_contact text default '—',
  treks_completed   integer default 0,
  stamps            jsonb default '[]',
  created_at        timestamptz default now()
);

-- ---------- 10. ADMIN CONFIG (your login id + passcode) ----------
create table if not exists admin_config (
  id          bigserial primary key,
  admin_id    text not null,
  passcode    text not null,
  updated_at  timestamptz default now()
);

-- ---------- 11. MOBILE OTP CODES ----------
create table if not exists mobile_otps (
  id          bigserial primary key,
  mobile      text not null,
  code        text not null,
  expires_at  timestamptz,
  created_at  timestamptz default now()
);

-- ---------- 12. EXTRA FIELDS for treks/tours (route, venue, pickup, time) ----------
create table if not exists entity_extras (
  id           bigserial primary key,
  entity_type  text not null,     -- 'trek' or 'tour'
  entity_id    integer not null,
  data         jsonb default '{}',
  updated_at   timestamptz default now()
);

-- ---------- 13. GENERAL BOOKINGS (from the old booking modal) ----------
create table if not exists bookings (
  id          bigserial primary key,
  hiker_name  text,
  trek_name   text,
  date        text,
  amount      integer,
  status      text default 'Confirmed',
  created_at  timestamptz default now()
);

-- ---------- 14. PAID TREK BOOKINGS (Razorpay) ----------
create table if not exists trek_bookings (
  id                   bigserial primary key,
  full_name            text not null,
  mobile               text not null,
  age                  integer,
  gender               text,
  city                 text,
  trek_name            text,
  amount               integer,
  razorpay_order_id    text,
  razorpay_payment_id  text,
  payment_status       text default 'Pending',
  created_at           timestamptz default now()
);


-- ---------- 15. SEED YOUR FIRST ADMIN LOGIN ----------
-- This lets you log into the Commander Dashboard the first time.
-- (You can change the id/passcode later inside the site's Security panel.)
insert into admin_config (admin_id, passcode)
select 'command', 'mavala2025'
where not exists (select 1 from admin_config);

-- ---------- 16. SEED DEFAULT BUSINESS SETTINGS ----------
insert into business_settings (phone, emergency_phone, email, whatsapp, address_en, next_departure)
select '+91 98220 44561', '+91 91234 56789', 'command@trekkiemavala.in', '919822044561',
       'Base Camp HQ, Malshej Ghat Road, Junnar, Maharashtra 410502', '2025-08-15T05:30:00'
where not exists (select 1 from business_settings);

-- =====================================================================
--  ALL DONE.  Your database is ready.
--  Next: open the SETUP-GUIDE file to connect your website to it.
-- =====================================================================
