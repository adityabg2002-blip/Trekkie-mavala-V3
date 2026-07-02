-- ============================================================================
--  TREKKIE मावळा — COMPLETE DATABASE SETUP
--  Copy this ENTIRE file and paste it into:
--    Your Supabase Project -> SQL Editor -> New Query -> Run
--  It creates every table your website needs and turns on security (RLS).
--  Safe to run once on a fresh project.
-- ============================================================================

-- 1) CORE CONTENT TABLES ----------------------------------------------------

create table if not exists treks (
  id bigserial primary key,
  name_en text, name_mr text, fort text, grade text, duration text,
  altitude text, price integer, date text, seats integer,
  description_en text, description_mr text, image text, category text,
  created_at timestamptz default now()
);

create table if not exists tours (
  id bigserial primary key,
  title_en text, title_mr text, region text, days integer, price integer,
  description_en text, description_mr text, image text,
  created_at timestamptz default now()
);

-- extra fields for treks/tours (route, venue, pickup, time) live here as JSON
create table if not exists entity_extras (
  id bigserial primary key,
  entity_type text not null,      -- 'trek' or 'tour'
  entity_id integer not null,
  data jsonb default '{}',
  updated_at timestamptz default now()
);

create table if not exists gallery_media (
  id bigserial primary key,
  title_en text, title_mr text, category text default 'Forts',
  media_type text default 'image', -- 'image' or 'video'
  url text not null, poster text, span text default 'normal',
  created_at timestamptz default now()
);

create table if not exists business_settings (
  id bigserial primary key,
  phone text, emergency_phone text, email text, whatsapp text,
  address_en text, address_mr text, map_embed text,
  next_departure text, instagram text,
  created_at timestamptz default now()
);

create table if not exists faqs (
  id bigserial primary key,
  category text, question_en text, question_mr text,
  answer_en text, answer_mr text, created_at timestamptz default now()
);

-- editable text/media overrides for the whole site (Site Customizer)
create table if not exists site_content (
  id bigserial primary key,
  content_key text not null,
  value_en text, value_mr text,
  content_type text default 'text',
  updated_at timestamptz default now()
);

-- 2) REVIEWS, HIKERS, MANUAL BOOKINGS --------------------------------------

create table if not exists hiker_reviews (
  id bigserial primary key,
  name text, hiker_email text, rating integer default 5,
  text_en text, text_mr text, trek text,
  pinned boolean default false, approved boolean default true,
  created_at timestamptz default now()
);

create table if not exists hiker_profiles (
  id bigserial primary key,
  name text, mobile text, email text, auth_email text,
  passport_id text, blood_group text default '—',
  emergency_contact text default '—',
  treks_completed integer default 0, stamps jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists bookings (
  id bigserial primary key,
  hiker_name text, trek_name text, date text, amount integer,
  status text default 'Confirmed', created_at timestamptz default now()
);

create table if not exists contact_messages (
  id bigserial primary key,
  name text, email text, phone text, message text,
  created_at timestamptz default now()
);

-- 3) ADMIN LOGIN + MOBILE OTP ----------------------------------------------

create table if not exists admin_config (
  id bigserial primary key,
  admin_id text not null, passcode text not null,
  updated_at timestamptz default now()
);

create table if not exists mobile_otps (
  id bigserial primary key,
  mobile text not null, code text not null,
  expires_at timestamptz, created_at timestamptz default now()
);

-- 4) THE PAYMENT / BOOKING TABLE (Razorpay) --------------------------------

create table if not exists trek_bookings (
  id bigserial primary key,
  full_name text not null, mobile text not null,
  age integer, gender text, city text, trek_name text, amount integer,
  razorpay_order_id text, razorpay_payment_id text,
  payment_status text default 'Pending',
  created_at timestamptz default now()
);

-- ============================================================================
-- 5) SECURITY (Row Level Security)
--    Public visitors (anon key) can READ public content, but CANNOT read the
--    private bookings table. Your server (service role key) bypasses RLS and
--    handles all writes + admin reads through the /api routes.
-- ============================================================================

alter table treks             enable row level security;
alter table tours             enable row level security;
alter table gallery_media     enable row level security;
alter table faqs              enable row level security;
alter table business_settings enable row level security;
alter table site_content      enable row level security;
alter table hiker_reviews     enable row level security;
alter table trek_bookings     enable row level security;

-- Public can READ these:
create policy public_read_treks    on treks             for select using (true);
create policy public_read_tours    on tours             for select using (true);
create policy public_read_gallery  on gallery_media     for select using (true);
create policy public_read_faqs     on faqs              for select using (true);
create policy public_read_settings on business_settings for select using (true);
create policy public_read_content  on site_content      for select using (true);
create policy public_read_reviews  on hiker_reviews     for select using (approved = true);

-- Bookings: NOBODY can read with the public key (server-only):
create policy no_public_access_bookings on trek_bookings for select using (false);

-- Seed one admin login (CHANGE THIS after first login in the Security panel):
insert into admin_config (admin_id, passcode) values ('command', 'mavala2025');

-- Done! Your database is ready.
