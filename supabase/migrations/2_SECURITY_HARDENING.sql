-- =============================================================================
--  SECURITY HARDENING MIGRATION  (append to / run after 1_SCHEMA.sql)
--  Run this in Supabase → SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Remove plain-text admin credential storage.
-- Admin identity is now handled 100% by Supabase Auth (JWT + role claim).
-- No admin IDs or passcodes are ever stored in application tables again.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.admin_config CASCADE;

-- -----------------------------------------------------------------------------
-- STEP 2: How to create an admin (do this in the Supabase Dashboard, NOT SQL
-- with a plaintext password):
--
--   Option A — Dashboard:
--     Authentication → Users → Add user (email + password),
--     then edit the user and set app_metadata / user_metadata:
--        { "role": "admin" }
--
--   Option B — SQL to tag an EXISTING auth user as admin (app_metadata is the
--   trusted, server-controlled claim the backend checks):
--
--     UPDATE auth.users
--     SET raw_app_meta_data =
--         COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
--     WHERE email = 'you@yourdomain.com';
--
--   The backend `requireAdmin()` verifies the JWT and checks role = "admin".
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- STEP 3: OTP table hygiene — support rate-limiting + expiry cleanup.
-- (Harmless if columns/indexes already exist.)
-- -----------------------------------------------------------------------------
ALTER TABLE public.mobile_otps
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_mobile_otps_mobile      ON public.mobile_otps (mobile);
CREATE INDEX IF NOT EXISTS idx_mobile_otps_created_at  ON public.mobile_otps (created_at);
CREATE INDEX IF NOT EXISTS idx_mobile_otps_expires_at  ON public.mobile_otps (expires_at);

-- Ensure one active code per mobile (send flow deletes-then-inserts).
CREATE UNIQUE INDEX IF NOT EXISTS uq_mobile_otps_mobile ON public.mobile_otps (mobile);

-- -----------------------------------------------------------------------------
-- STEP 4: Integrity guards on hiker_profiles to prevent identity desync.
-- auth_email is the immutable identity key used by the backend.
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_hiker_profiles_auth_email
  ON public.hiker_profiles (auth_email)
  WHERE auth_email IS NOT NULL;

-- -----------------------------------------------------------------------------
-- STEP 5 (recommended): Enable RLS. The backend uses the ANON client for
-- reads by default and the SERVICE ROLE client only for trusted server writes
-- (payments, auth provisioning), so these policies are safe.
-- -----------------------------------------------------------------------------

-- Public, read-only content ---------------------------------------------------
ALTER TABLE public.treks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_media     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiker_reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_extras     ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Anyone may READ public content (anon key). Writes go through the service
  -- role in the backend, which bypasses RLS after the JWT admin check.
  PERFORM 1;
END $$;

CREATE POLICY "public read treks"        ON public.treks             FOR SELECT USING (true);
CREATE POLICY "public read tours"        ON public.tours             FOR SELECT USING (true);
CREATE POLICY "public read gallery"      ON public.gallery_media     FOR SELECT USING (true);
CREATE POLICY "public read faqs"         ON public.faqs              FOR SELECT USING (true);
CREATE POLICY "public read site_content" ON public.site_content      FOR SELECT USING (true);
CREATE POLICY "public read business"     ON public.business_settings FOR SELECT USING (true);
CREATE POLICY "public read reviews"      ON public.hiker_reviews     FOR SELECT USING (true);
CREATE POLICY "public read extras"       ON public.entity_extras     FOR SELECT USING (true);

-- Visitor-submitted review (insert only; moderation flags forced server-side).
CREATE POLICY "public insert review" ON public.hiker_reviews FOR INSERT WITH CHECK (true);

-- Sensitive tables: NO anon policies at all → anon key is fully denied.
-- The backend only ever touches these with the SERVICE ROLE (post JWT check).
ALTER TABLE public.trek_bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_otps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiker_profiles   ENABLE ROW LEVEL SECURITY;

-- Allow the public contact form to INSERT a message (but not read others').
CREATE POLICY "public insert contact" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- (Intentionally NO select/update/delete policies for trek_bookings,
--  mobile_otps, hiker_profiles under the anon role — service role handles them.)
