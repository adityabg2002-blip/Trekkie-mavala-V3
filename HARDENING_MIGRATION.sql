-- =============================================================================
--  TREKKIE मावळा — CUMULATIVE HARDENING MIGRATION  (non-destructive, idempotent)
-- =============================================================================
--  Safe to run on an EXISTING database created from SUPABASE_SETUP.sql.
--  * Creates nothing that already exists (IF NOT EXISTS / guarded DO blocks).
--  * DROPs nothing that holds data. No table/column is removed.
--  * Pure DDL + policy statements — no extensions, no pg_cron, no background
--    jobs — so it is fully compatible with Vercel Hobby + Supabase Free tiers.
--
--  How to run:
--    Supabase Dashboard -> SQL Editor -> New query -> paste ALL -> Run.
--  Re-running is safe.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. SCHEMA SAFETY: make sure every table the code touches exists, with the
--    columns the current handlers write. (No-ops if already present.)
-- -----------------------------------------------------------------------------

-- trek_bookings must carry the Razorpay + PII columns the payment route writes.
alter table if exists trek_bookings add column if not exists full_name           text;
alter table if exists trek_bookings add column if not exists mobile              text;
alter table if exists trek_bookings add column if not exists age                 integer;
alter table if exists trek_bookings add column if not exists gender              text;
alter table if exists trek_bookings add column if not exists city                text;
alter table if exists trek_bookings add column if not exists trek_name           text;
alter table if exists trek_bookings add column if not exists amount              integer;
alter table if exists trek_bookings add column if not exists razorpay_order_id   text;
alter table if exists trek_bookings add column if not exists razorpay_payment_id text;
alter table if exists trek_bookings add column if not exists payment_status      text default 'Pending';
alter table if exists trek_bookings add column if not exists created_at          timestamptz default now();

-- hiker_profiles columns used by ensureHiker()/hikers handler.
alter table if exists hiker_profiles add column if not exists auth_email  text;
alter table if exists hiker_profiles add column if not exists mobile      text;
alter table if exists hiker_profiles add column if not exists email       text;
alter table if exists hiker_profiles add column if not exists stamps      jsonb default '[]';

-- mobile_otps columns used by the rate-limited OTP flow.
alter table if exists mobile_otps add column if not exists expires_at timestamptz;
alter table if exists mobile_otps add column if not exists created_at timestamptz default now();

-- hiker_reviews moderation flags.
alter table if exists hiker_reviews add column if not exists pinned   boolean default false;
alter table if exists hiker_reviews add column if not exists approved boolean default true;

-- -----------------------------------------------------------------------------
-- 2. TYPE / VALUE INTEGRITY: bound the payment status to known values so a
--    malformed write can never poison dashboard stats. Uses a CHECK added only
--    if missing. NULLs are tolerated (legacy rows) — the app defaults 'Pending'.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trek_bookings_status_chk'
  ) then
    alter table trek_bookings
      add constraint trek_bookings_status_chk
      check (payment_status is null or payment_status in ('Pending','Paid','Failed','Refunded'));
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 3. IDEMPOTENCY & PERFORMANCE INDEXES
--    * Unique payment id prevents duplicate paid rows if verify AND webhook both
--      land (webhook reconciles instead of double-inserting). Partial unique so
--      many NULLs (failed/pending) are still allowed.
--    * Fast webhook lookups by order id.
--    * OTP rate-limit queries hit (mobile, created_at) & expiry purges.
-- -----------------------------------------------------------------------------
create unique index if not exists uq_trek_bookings_payment_id
  on trek_bookings (razorpay_payment_id)
  where razorpay_payment_id is not null;

create index if not exists idx_trek_bookings_order_id
  on trek_bookings (razorpay_order_id);

create index if not exists idx_trek_bookings_status
  on trek_bookings (payment_status);

create index if not exists idx_mobile_otps_mobile_created
  on mobile_otps (mobile, created_at desc);

create index if not exists idx_mobile_otps_expires
  on mobile_otps (expires_at);

create index if not exists idx_hiker_profiles_auth_email
  on hiker_profiles (auth_email);

create index if not exists idx_hiker_profiles_mobile
  on hiker_profiles (mobile);

create index if not exists idx_entity_extras_type_id
  on entity_extras (entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — enable on EVERY table. The app reaches the DB through
--    the server using the service_role key, which bypasses RLS safely. With RLS
--    ON and only the minimal public policies below, the public anon key can read
--    ONLY storefront content and can never touch bookings/PII/OTPs/admin data.
-- -----------------------------------------------------------------------------
alter table if exists treks              enable row level security;
alter table if exists tours              enable row level security;
alter table if exists gallery_media      enable row level security;
alter table if exists business_settings  enable row level security;
alter table if exists hiker_reviews      enable row level security;
alter table if exists faqs               enable row level security;
alter table if exists contact_messages   enable row level security;
alter table if exists site_content       enable row level security;
alter table if exists hiker_profiles     enable row level security;
alter table if exists mobile_otps        enable row level security;
alter table if exists entity_extras      enable row level security;
alter table if exists bookings           enable row level security;
alter table if exists trek_bookings      enable row level security;

-- admin_config is decommissioned by the app (auth moved to Supabase JWT). Keep
-- RLS on with NO policies so the anon key can never read the legacy creds.
alter table if exists admin_config        enable row level security;

-- -----------------------------------------------------------------------------
-- 5. PUBLIC POLICIES (idempotent create-if-absent).
--    Public READ: only content the website renders for visitors.
--    Public INSERT: only visitor-submitted contact messages + reviews.
--    Everything else has NO anon policy => anon has zero access; the server
--    (service_role) retains full access, and admin mutations are additionally
--    JWT-guarded in the API layer (requireAdmin).
-- -----------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  -- public SELECT on storefront content
  for pol in
    select * from (values
      ('treks',             'pub_read_treks'),
      ('tours',             'pub_read_tours'),
      ('gallery_media',     'pub_read_gallery'),
      ('business_settings', 'pub_read_settings'),
      ('hiker_reviews',     'pub_read_reviews'),
      ('faqs',              'pub_read_faqs'),
      ('site_content',      'pub_read_content'),
      ('entity_extras',     'pub_read_extras')
    ) as t(tbl, polname)
  loop
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=pol.tbl and policyname=pol.polname) then
      execute format('create policy %I on public.%I for select using (true);', pol.polname, pol.tbl);
    end if;
  end loop;

  -- public INSERT for visitor submissions
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contact_messages' and policyname='pub_insert_contact') then
    execute 'create policy pub_insert_contact on public.contact_messages for insert with check (true);';
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hiker_reviews' and policyname='pub_insert_review') then
    execute 'create policy pub_insert_review on public.hiker_reviews for insert with check (true);';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 6. OPERATIONAL SAFETY: purge any already-expired OTP rows right now. (Ongoing
--    purges happen opportunistically in /api/auth on each send — no cron needed,
--    keeping this Hobby/Free-tier compatible.)
-- -----------------------------------------------------------------------------
delete from mobile_otps where expires_at is not null and expires_at < now();

-- -----------------------------------------------------------------------------
-- 7. SECRET-HYGIENE NOTE (no SQL side-effects):
--    The legacy admin_config table (plaintext admin_id/passcode) is NO LONGER
--    used for auth — admin identity is a Supabase Auth JWT with role:"admin".
--    This migration does NOT drop admin_config (non-destructive), but RLS above
--    makes it unreadable by the anon key. To fully retire it later, you may run:
--        -- drop table if exists admin_config;
--    only after confirming nothing references it.
-- -----------------------------------------------------------------------------

commit;

-- Done ✅  RLS hardened, idempotency indexes added, OTP hygiene enforced,
--          status values bounded — all non-destructively.
