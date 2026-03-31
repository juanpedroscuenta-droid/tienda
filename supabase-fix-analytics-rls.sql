-- ============================================================
-- FIX: Permitir que usuarios anónimos inserten en website_visits
-- ============================================================
-- El error 401 ocurre porque la RLS bloquea inserts del anon_key.
-- Ejecutar esto en el SQL Editor de Supabase.
-- Panel: https://supabase.com/dashboard/project/uwgrmfxxayybglbbvhph/sql
-- ============================================================

-- 1. Asegurarse de que RLS está activada (ya debería estarlo)
ALTER TABLE public.website_visits ENABLE ROW LEVEL SECURITY;

-- 2. Política: cualquiera puede insertar (anónimos y autenticados)
CREATE POLICY "allow_anonymous_insert_website_visits"
ON public.website_visits
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. Política: solo admins pueden leer (optional, para el panel de analytics)
-- Si ya tienes una política de lectura, puedes omitir esto.
CREATE POLICY "allow_authenticated_select_website_visits"
ON public.website_visits
FOR SELECT
TO authenticated
USING (true);

-- ============================================================
-- Lo mismo para product_views (misma situación potencial)
-- ============================================================
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anonymous_insert_product_views"
ON public.product_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "allow_authenticated_select_product_views"
ON public.product_views
FOR SELECT
TO authenticated
USING (true);

-- ============================================================
-- Y para product_analytics (lecturas y actualizaciones)
-- ============================================================
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anonymous_upsert_product_analytics"
ON public.product_analytics
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
