-- ============================================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA TABLA 'users'
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Habilitar RLS en la tabla users (si no está activo)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas conflictivas anteriores si existen
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.users;
DROP POLICY IF EXISTS "Backend anon can insert" ON public.users;

-- 3. Política: cualquier usuario autenticado puede LEER su propio registro
CREATE POLICY "Users can read own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- 4. Política: cualquier usuario autenticado puede ACTUALIZAR su propio registro
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- 5. Política: permitir INSERT al rol 'anon' (usado por el backend con la anon key)
--    Esto es necesario para que el backend pueda auto-sincronizar usuarios nuevos
CREATE POLICY "Allow anon insert for user sync"
ON public.users FOR INSERT
WITH CHECK (true);

-- 6. Política: el admin puede ver todos los usuarios
CREATE POLICY "Admin can see all users"
ON public.users FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'admin@gmail.com' OR
  auth.jwt() ->> 'email' = 'admin@tienda.com' OR
  auth.uid() = id
);

-- Verificar que las políticas están activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
