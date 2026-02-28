-- ================================================================
-- FIX: PERMISOS DE ANALYTICS (PRODUCT_VIEWS & PRODUCT_ANALYTICS)
-- ================================================================
-- Este script corrige los errores 403 y violaciones de RLS al 
-- intentar registrar vistas de productos.
-- ================================================================

-- 1. Asegurar que RLS esté habilitado
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_visits ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para PRODUCT_VIEWS (Inserción pública y Lectura para administradores)
DROP POLICY IF EXISTS "Public: insert views/visits" ON public.product_views;
DROP POLICY IF EXISTS "Allow insert for all" ON public.product_views;
CREATE POLICY "Public: insert views" ON public.product_views 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins: read views" ON public.product_views;
CREATE POLICY "Admins: read views" ON public.product_views 
FOR SELECT TO authenticated 
USING (public.is_admin_email());

-- 3. Políticas para PRODUCT_ANALYTICS (Lectura, Inserción y Actualización pública para upsert)
DROP POLICY IF EXISTS "Admins: read analytics" ON public.product_analytics;
DROP POLICY IF EXISTS "Public: read analytics" ON public.product_analytics;
CREATE POLICY "Public: read analytics" ON public.product_analytics 
FOR SELECT TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public: insert analytics" ON public.product_analytics;
CREATE POLICY "Public: insert analytics" ON public.product_analytics 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public: update analytics" ON public.product_analytics;
CREATE POLICY "Public: update analytics" ON public.product_analytics 
FOR UPDATE TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Políticas para WEBSITE_VISITS (Inserción pública y Lectura para administradores)
DROP POLICY IF EXISTS "Public: insert visits" ON public.website_visits;
CREATE POLICY "Public: insert visits" ON public.website_visits 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins: read visits" ON public.website_visits;
CREATE POLICY "Admins: read visits" ON public.website_visits 
FOR SELECT TO authenticated 
USING (public.is_admin_email());

-- 5. Mantener acceso total para administradores (Opcional, pero recomendado)
DROP POLICY IF EXISTS "Admins: full access analytics" ON public.product_analytics;
CREATE POLICY "Admins: full access analytics" ON public.product_analytics 
FOR ALL TO authenticated 
USING (public.is_admin_email());

DROP POLICY IF EXISTS "Admins: full access views" ON public.product_views;
CREATE POLICY "Admins: full access views" ON public.product_views 
FOR ALL TO authenticated 
USING (public.is_admin_email());

-- 6. Grant de permisos básicos
GRANT ALL ON public.product_views TO anon, authenticated;
GRANT ALL ON public.product_analytics TO anon, authenticated;
GRANT ALL ON public.website_visits TO anon, authenticated;
