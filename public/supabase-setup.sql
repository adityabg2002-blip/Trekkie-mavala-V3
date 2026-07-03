-- ============================================================================
--  TREKKIE मावळा — Complete Supabase Setup
--  Copy ALL of this and paste into: Supabase Dashboard -> SQL Editor -> Run
--  Safe to run more than once (uses "if not exists").
-- ============================================================================

-- ---------- TREKS ----------
create table if not exists treks (
  id             bigserial primary key,
  name_en        text,
  name_mr        text,
  fort           text,
  grade          text,
  duration       text,
  altitude       text,
  price          integer,
  date           text,
  seats          integer,
  description_en text,
  description_mr text,
  image          text,
  category       text,
  created_at     timestamptz default now()
);

-- ---------- TOURS ----------
create table if not exists tours (
  id             bigserial primary key,
  title_en       text,
  title_mr       text,
  region         text,
  days           integer,
  price          integer,
  description_en text,
  description_mr text,
  image          text,
  created_at     timestamptz default now()
);

-- ---------- EXTRA FIELDS for treks/tours (route, venue, pickup, time) ----------
create table if not exists entity_extras (
  id          bigserial primary key,
  entity_type text not null,        -- 'trek' or 'tour'
  entity_id   integer not null,
  data        jsonb default '{}',
  updated_at  timestamptz default now()
);

-- ---------- GALLERY (photos + videos) ----------
create table if not exists gallery_media (
  id         bigserial primary key,
  title_en   text,
  title_mr   text,
  category   text default 'Forts',
  media_type text default 'image',  -- 'image' or 'video'
  url        text not null,
  poster     text,
  span       text default 'normal',
  created_at timestamptz default now()
);

-- ---------- BUSINESS SETTINGS (phone, email, map, etc.) ----------
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

-- ---------- EDITABLE SITE CONTENT (all labels, hero media, policies, brand) ----------
create table if not exists site_content (
  id           bigserial primary key,
  content_key  text not null,
  value_en     text,
  value_mr     text,
  content_type text default 'text',
  updated_at   timestamptz default now()
);

-- ---------- REVIEWS ----------
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

-- ---------- FAQs ----------
create table if not exists faqs (
  id          bigserial primary key,
  category    text,
  question_en text,
  question_mr text,
  answer_en   text,
  answer_mr   text,
  created_at  timestamptz default now()
);

-- ---------- CONTACT MESSAGES ----------
create table if not exists contact_messages (
  id         bigserial primary key,
  name       text,
  email      text,
  phone      text,
  message    text,
  created_at timestamptz default now()
);

-- ---------- HIKER PROFILES ----------
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

-- ---------- MOBILE OTP (for mobile login) ----------
create table if not exists mobile_otps (
  id         bigserial primary key,
  mobile     text not null,
  code       text not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- ADMIN CREDENTIALS ----------
create table if not exists admin_config (
  id         bigserial primary key,
  admin_id   text not null,
  passcode   text not null,
  updated_at timestamptz default now()
);
-- Seed a default admin (change the passcode after first login!)
insert into admin_config (admin_id, passcode)
select 'command', 'mavala2025'
where not exists (select 1 from admin_config);

-- ---------- PAYMENT BOOKINGS (Razorpay) ----------
create table if not exists bookings_v2 (
  id                  bigserial primary key,
  full_name           text not null,
  mobile              text not null,
  email               text,
  age                 integer,
  gender              text,
  city                text,
  trek_name           text,
  amount              integer,
  razorpay_order_id   text,
  razorpay_payment_id text,
  razorpay_refund_id  text,
  payment_status      text default 'Pending',   -- Pending | Paid | Failed | Refunded
  refunded_at         timestamptz,
  notify_status       text,
  created_at          timestamptz default now()
);

-- (Legacy manual bookings table — optional)
create table if not exists bookings (
  id         bigserial primary key,
  hiker_name text,
  trek_name  text,
  date       text,
  amount     integer,
  status     text default 'Confirmed',
  created_at timestamptz default now()
);

-- ============================================================================
--  ROW LEVEL SECURITY (RLS)
--  Turn RLS ON everywhere. Public tables allow safe read; sensitive tables are
--  writable ONLY by the server (service_role key), never by the browser.
-- ============================================================================

-- Helper: enable RLS on every table
alter table treks             enable row level security;
alter table tours             enable row level security;
alter table entity_extras     enable row level security;
alter table gallery_media     enable row level security;
alter table business_settings enable row level security;
alter table site_content      enable row level security;
alter table hiker_reviews     enable row level security;
alter table faqs              enable row level security;
alter table contact_messages  enable row level security;
alter table hiker_profiles    enable row level security;
alter table mobile_otps       enable row level security;
alter table admin_config      enable row level security;
alter table bookings_v2       enable row level security;
alter table bookings          enable row level security;

-- PUBLIC READ-ONLY content (anyone can view your website content)
create policy "public read treks"    on treks             for select using (true);
create policy "public read tours"    on tours             for select using (true);
create policy "public read extras"   on entity_extras     for select using (true);
create policy "public read gallery"  on gallery_media     for select using (true);
create policy "public read settings" on business_settings for select using (true);
create policy "public read content"  on site_content      for select using (true);
create policy "public read faqs"     on faqs              for select using (true);

-- REVIEWS: anyone can read approved reviews + submit a new one
create policy "public read reviews"   on hiker_reviews for select using (true);
create policy "public insert reviews" on hiker_reviews for insert with check (true);

-- CONTACT: anyone can submit a message (but not read others')
create policy "public insert contact" on contact_messages for insert with check (true);

-- IMPORTANT: admin_config, mobile_otps, bookings_v2, hiker_profiles have NO
-- public policies on purpose. That means the browser (anon key) cannot read or
-- write them. Only your server API routes (using the SERVICE ROLE key) can —
-- which is exactly what we want for passwords, OTPs, and payment records.

-- ============================================================================
--  DONE! Your database is ready.
--  Next: put your own project's URL + anon key + service_role key into the
--  app's environment variables (see the SETUP GUIDE for exact names).
-- ============================================================================
