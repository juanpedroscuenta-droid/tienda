-- ================================================================
-- FIX DEFINITIVO: Permisos RLS para contacts, website_visits, product_views
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ================================================================

-- =====================
-- 1. CONTACTS
-- =====================
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public: insert contacts"   ON public.contacts;
DROP POLICY IF EXISTS "Public: update contacts"   ON public.contacts;
DROP POLICY IF EXISTS "Self: update contact"       ON public.contacts;
DROP POLICY IF EXISTS "Admins: manage contacts"   ON public.contacts;
DROP POLICY IF EXISTS "Allow insert for all"       ON public.contacts;

-- Solo INSERT (no upsert) para cualquiera
CREATE POLICY "Public: insert contacts" ON public.contacts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Admins leen y gestionan todo
CREATE POLICY "Admins: manage contacts" ON public.contacts
  FOR ALL TO authenticated
  USING (public.is_admin_email());

GRANT ALL ON public.contacts TO postgres, service_role;
GRANT INSERT ON public.contacts TO anon, authenticated;

-- =====================
-- 2. WEBSITE_VISITS
-- =====================
ALTER TABLE public.website_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public: insert visits"      ON public.website_visits;
DROP POLICY IF EXISTS "Public: insert views/visits" ON public.website_visits;
DROP POLICY IF EXISTS "Allow insert for all"        ON public.website_visits;
DROP POLICY IF EXISTS "Admins: read visits"         ON public.website_visits;

CREATE POLICY "Public: insert visits" ON public.website_visits
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins: read visits" ON public.website_visits
  FOR SELECT TO authenticated USING (public.is_admin_email());

GRANT ALL ON public.website_visits TO postgres, service_role;
GRANT INSERT ON public.website_visits TO anon, authenticated;

-- =====================
-- 3. PRODUCT_VIEWS
-- =====================
ALTER TABLE public.product_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public: insert views"        ON public.product_views;
DROP POLICY IF EXISTS "Public: insert views/visits" ON public.product_views;
DROP POLICY IF EXISTS "Allow insert for all"         ON public.product_views;
DROP POLICY IF EXISTS "Admins: full access views"   ON public.product_views;

CREATE POLICY "Public: insert views" ON public.product_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins: full access views" ON public.product_views
  FOR ALL TO authenticated USING (public.is_admin_email());

GRANT ALL ON public.product_views TO postgres, service_role;
GRANT INSERT ON public.product_views TO anon, authenticated;
