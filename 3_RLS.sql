-- ============================================================================
--  ROW LEVEL SECURITY (RLS)  — IMPORTANT SECURITY STEP
--  Paste into Supabase -> SQL Editor -> Run, AFTER 1_SCHEMA.sql (and 2_SEED.sql).
--
--  HOW THIS APP IS SECURED:
--  * All WRITES (create/update/delete) go through your server API routes in the
--    /api folder. Those use the SERVICE ROLE key, which bypasses RLS safely on
--    the server. The service key is NEVER exposed to browsers.
--  * The browser only ever READS public content directly (treks, tours, gallery,
--    reviews, faqs, settings, site content) using the public anon key.
--  * So the rule is: turn RLS ON everywhere, allow PUBLIC READ on public content,
--    and DO NOT add any browser-write policies. Sensitive tables get NO public
--    policies at all (only the server can touch them).
--
--  Safe to run multiple times (drops policy if exists, then recreates).
-- ============================================================================

-- Helper: enable RLS on every table -----------------------------------------
alter table treks              enable row level security;
alter table tours              enable row level security;
alter table gallery_media      enable row level security;
alter table business_settings  enable row level security;
alter table site_content       enable row level security;
alter table hiker_reviews      enable row level security;
alter table faqs               enable row level security;
alter table contact_messages   enable row level security;
alter table hiker_profiles     enable row level security;
alter table bookings           enable row level security;
alter table trek_bookings      enable row level security;
alter table mobile_otps        enable row level security;
alter table admin_config       enable row level security;
alter table entity_extras      enable row level security;

-- === PUBLIC-READ tables (website displays these to everyone) ================
-- READ allowed for anyone; writes blocked (only server/service role can write).

drop policy if exists "public read treks" on treks;
create policy "public read treks" on treks for select using (true);

drop policy if exists "public read tours" on tours;
create policy "public read tours" on tours for select using (true);

drop policy if exists "public read gallery" on gallery_media;
create policy "public read gallery" on gallery_media for select using (true);

drop policy if exists "public read settings" on business_settings;
create policy "public read settings" on business_settings for select using (true);

drop policy if exists "public read content" on site_content;
create policy "public read content" on site_content for select using (true);

drop policy if exists "public read reviews" on hiker_reviews;
create policy "public read reviews" on hiker_reviews for select using (true);

drop policy if exists "public read faqs" on faqs;
create policy "public read faqs" on faqs for select using (true);

drop policy if exists "public read extras" on entity_extras;
create policy "public read extras" on entity_extras for select using (true);

-- === PRIVATE tables (NO public policies — server only) ======================
-- We intentionally add NO policies for these. With RLS enabled and no policy,
-- the public anon key can neither read nor write them. Your server API routes
-- (service role) still work fine and bypass RLS.
--   contact_messages   (customer messages — private)
--   hiker_profiles     (personal data — private)
--   bookings           (booking records — private)
--   trek_bookings      (payments — private)
--   mobile_otps        (login codes — must be private)
--   admin_config       (admin credentials — must be private)

-- DONE. Your database is now secured:
--   * Anyone can VIEW public site content.
--   * NOBODY can write from the browser directly.
--   * NOBODY can read private tables (bookings, profiles, OTPs, admin) directly.
--   * Your /api server routes handle all writes/reads safely.
