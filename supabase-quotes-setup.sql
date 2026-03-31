-- ================================================================
-- SETUP DE TABLA DE COTIZACIONES (Repuesto.co)
-- ================================================================

-- 1. Crear tabla de cotizaciones
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spare_part TEXT NOT NULL,
  brand TEXT NOT NULL,
  line TEXT NOT NULL,
  model_year TEXT NOT NULL,
  engine_size TEXT,
  client_name TEXT NOT NULL,
  city TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'responded', 'rejected'
  type TEXT DEFAULT 'web',      -- 'web', 'whatsapp'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad
-- Permitir que cualquier persona (público) inserte una cotización
DROP POLICY IF EXISTS "Public: insert quotes" ON public.quotes;
CREATE POLICY "Public: insert quotes" ON public.quotes FOR INSERT TO public WITH CHECK (true);

-- Permitir que solo administradores vean y gestionen cotizaciones
-- (Utiliza la función is_admin_email() ya existente en el proyecto)
DROP POLICY IF EXISTS "Admins: manage quotes" ON public.quotes;
CREATE POLICY "Admins: manage quotes" ON public.quotes FOR ALL TO authenticated USING (public.is_admin_email());

-- 4. Permisos de roles
GRANT ALL ON public.quotes TO postgres, service_role, authenticated, anon;

-- 5. Índice para velocidad
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
