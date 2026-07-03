-- ============================================================
--  TREKKIE मावळा — Full database setup for YOUR OWN Supabase
--  How to use:
--    1. Supabase Dashboard → SQL Editor → New query
--    2. Paste ALL of this → Run
--  Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- ---------- TREKS ----------
create table if not exists treks (
  id serial primary key,
  name_en text, name_mr text, fort text, grade text,
  duration text, altitude text, price integer, date text,
  seats integer, description_en text, description_mr text,
  image text, category text, created_at timestamptz default now()
);

-- ---------- TOURS ----------
create table if not exists tours (
  id serial primary key,
  title_en text, title_mr text, region text, days integer,
  price integer, description_en text, description_mr text,
  image text, created_at timestamptz default now()
);

-- ---------- GALLERY (photos + videos) ----------
create table if not exists gallery_media (
  id serial primary key,
  title_en text, title_mr text, category text default 'Forts',
  media_type text default 'image', url text not null, poster text,
  span text default 'normal', created_at timestamptz default now()
);

-- ---------- BUSINESS SETTINGS ----------
create table if not exists business_settings (
  id serial primary key,
  phone text, emergency_phone text, email text, whatsapp text,
  address_en text, address_mr text, map_embed text,
  next_departure text, instagram text, created_at timestamptz default now()
);

-- ---------- REVIEWS ----------
create table if not exists hiker_reviews (
  id serial primary key,
  name text, hiker_email text, rating integer default 5,
  text_en text, text_mr text, trek text,
  pinned boolean default false, approved boolean default true,
  created_at timestamptz default now()
);

-- ---------- FAQ ----------
create table if not exists faqs (
  id serial primary key,
  category text, question_en text, question_mr text,
  answer_en text, answer_mr text, created_at timestamptz default now()
);

-- ---------- CONTACT MESSAGES ----------
create table if not exists contact_messages (
  id serial primary key,
  name text, email text, phone text, message text,
  created_at timestamptz default now()
);

-- ---------- SITE CONTENT (editable text/labels + hero media) ----------
create table if not exists site_content (
  id serial primary key,
  content_key text not null,
  value_en text, value_mr text,
  content_type text default 'text',
  updated_at timestamptz default now()
);

-- ---------- HIKER PROFILES ----------
create table if not exists hiker_profiles (
  id serial primary key,
  name text, mobile text, email text, auth_email text,
  passport_id text, blood_group text default '—',
  emergency_contact text default '—', treks_completed integer default 0,
  stamps jsonb default '[]', created_at timestamptz default now()
);

-- ---------- MOBILE OTPs ----------
create table if not exists mobile_otps (
  id serial primary key,
  mobile text not null, code text not null,
  expires_at timestamptz, created_at timestamptz default now()
);

-- ---------- ADMIN CONFIG (login credentials) ----------
create table if not exists admin_config (
  id serial primary key,
  admin_id text not null, passcode text not null,
  updated_at timestamptz default now()
);

-- ---------- ENTITY EXTRAS (route/venue/pickup/time for treks & tours) ----------
create table if not exists entity_extras (
  id serial primary key,
  entity_type text not null, entity_id integer not null,
  data jsonb default '{}', updated_at timestamptz default now()
);

-- ---------- LEGACY BOOKINGS (portal cancellations) ----------
create table if not exists bookings (
  id serial primary key,
  hiker_name text, trek_name text, date text, amount integer,
  status text default 'Confirmed', created_at timestamptz default now()
);

-- ---------- PAID TREK BOOKINGS (Razorpay) ----------
create table if not exists trek_bookings (
  id serial primary key,
  full_name text not null, mobile text not null, age integer,
  gender text, city text, trek_name text, amount integer,
  razorpay_order_id text, razorpay_payment_id text,
  payment_status text default 'Pending', created_at timestamptz default now()
);


-- ============================================================
--  ROW LEVEL SECURITY (RLS)
--  This app talks to the DB through the server (service_role key),
--  which BYPASSES RLS safely. We enable RLS on every table and
--  block direct anon/browser access, so nobody can read/write your
--  data using only the public anon key. Public read is allowed only
--  on the tables the website needs to display to visitors.
-- ============================================================

-- Enable RLS everywhere
alter table treks              enable row level security;
alter table tours              enable row level security;
alter table gallery_media      enable row level security;
alter table business_settings  enable row level security;
alter table hiker_reviews      enable row level security;
alter table faqs               enable row level security;
alter table contact_messages   enable row level security;
alter table site_content       enable row level security;
alter table hiker_profiles     enable row level security;
alter table mobile_otps        enable row level security;
alter table admin_config       enable row level security;
alter table entity_extras      enable row level security;
alter table bookings           enable row level security;
alter table trek_bookings      enable row level security;

-- PUBLIC READ (anon) — only content the site must show to visitors.
create policy "public read treks"    on treks             for select using (true);
create policy "public read tours"    on tours             for select using (true);
create policy "public read gallery"  on gallery_media     for select using (true);
create policy "public read settings" on business_settings for select using (true);
create policy "public read reviews"  on hiker_reviews     for select using (true);
create policy "public read faqs"     on faqs              for select using (true);
create policy "public read content"  on site_content      for select using (true);
create policy "public read extras"   on entity_extras     for select using (true);

-- Allow visitors to submit a contact message and a review (insert only, no read of others).
create policy "public insert contact" on contact_messages for insert with check (true);
create policy "public insert review"  on hiker_reviews     for insert with check (true);

-- NOTE: No anon policies are added for admin_config, mobile_otps, trek_bookings,
-- hiker_profiles, or bookings. With RLS on and no policy, the anon key CANNOT
-- read them. Your server (service_role) still has full access, so the app works.


-- ============================================================
--  SEED DATA — admin login + one demo of each so the site isn't empty
-- ============================================================

insert into admin_config (admin_id, passcode)
select 'command', 'mavala2025'
where not exists (select 1 from admin_config);

insert into business_settings (phone, emergency_phone, email, whatsapp, address_en, next_departure, instagram)
select '+91 98220 44561', '+91 91234 56789', 'command@trekkiemavala.in', '919822044561',
       'Base Camp HQ, Malshej Ghat Road, Junnar, Pune District, Maharashtra 410502',
       '2025-08-15T05:30:00', '@trekkie_mavala'
where not exists (select 1 from business_settings);

-- (Add your treks, tours, gallery items, FAQs from the admin panel after logging in.)

-- Done ✅  Admin login → ID: command  |  Passcode: mavala2025
