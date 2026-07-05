-- ============================================================================
--  TREKKIE मावळा — FULL DATABASE SCHEMA
--  Copy this ENTIRE file and paste it into:
--  Supabase Dashboard -> SQL Editor -> New Query -> paste -> click "Run"
--
--  Safe to run multiple times (uses "if not exists"). It will NOT delete data.
-- ============================================================================

-- 1) TREKS ---------------------------------------------------------------
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

-- 2) TOURS ---------------------------------------------------------------
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

-- 3) GALLERY (photos + videos) ------------------------------------------
create table if not exists gallery_media (
  id          bigserial primary key,
  title_en    text,
  title_mr    text,
  category    text default 'Forts',
  media_type  text default 'image',   -- 'image' or 'video'
  url         text not null,
  poster      text,
  span        text default 'normal',  -- 'normal' | 'tall' | 'wide'
  created_at  timestamptz default now()
);

-- 4) BUSINESS SETTINGS (phone, email, address, hero, etc.) --------------
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

-- 5) SITE CONTENT (editable labels, policies, brand, hero media) --------
create table if not exists site_content (
  id           bigserial primary key,
  content_key  text not null,
  value_en     text,
  value_mr     text,
  content_type text default 'text',
  updated_at   timestamptz default now()
);

-- 6) REVIEWS (customer testimonials) ------------------------------------
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

-- 7) FAQs ----------------------------------------------------------------
create table if not exists faqs (
  id           bigserial primary key,
  category     text,
  question_en  text,
  question_mr  text,
  answer_en    text,
  answer_mr    text,
  created_at   timestamptz default now()
);

-- 8) CONTACT MESSAGES (support courier form) ----------------------------
create table if not exists contact_messages (
  id         bigserial primary key,
  name       text,
  email      text,
  phone      text,
  message    text,
  created_at timestamptz default now()
);

-- 9) HIKER PROFILES ------------------------------------------------------
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

-- 10) SIMPLE BOOKINGS (from trek/tour "Book" flow, pre-payment) ---------
create table if not exists bookings (
  id         bigserial primary key,
  hiker_name text,
  trek_name  text,
  date       text,
  amount     integer,
  status     text default 'Confirmed',
  created_at timestamptz default now()
);

-- 11) TREK BOOKINGS (Razorpay paid bookings) ----------------------------
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

-- 12) MOBILE OTPs (mobile login) ----------------------------------------
create table if not exists mobile_otps (
  id         bigserial primary key,
  mobile     text not null,
  code       text not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 13) ADMIN CONFIG (commander login id + passcode) ----------------------
create table if not exists admin_config (
  id         bigserial primary key,
  admin_id   text not null,
  passcode   text not null,
  updated_at timestamptz default now()
);

-- 14) ENTITY EXTRAS (trek/tour route, venue, pickup, departure time) ----
create table if not exists entity_extras (
  id          bigserial primary key,
  entity_type text not null,   -- 'trek' or 'tour'
  entity_id   integer not null,
  data        jsonb default '{}',
  updated_at  timestamptz default now()
);

-- DONE. Next: run 2_SEED.sql (optional starter data), then 3_RLS.sql.
