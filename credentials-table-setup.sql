-- ================================================================
-- TABLA DE CREDENCIALES (GESTOR DE CONTRASEÑAS)
-- ================================================================

-- 1. Crear tabla de credenciales
CREATE TABLE IF NOT EXISTS public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL,
  username TEXT,
  email TEXT,
  password TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad (RLS)
-- Los administradores pueden hacer todo (usando la función del sistema)
CREATE POLICY "Admins can manage credentials"
  ON public.credentials
  FOR ALL
  TO authenticated
  USING (public.is_admin_email());

-- Las subcuentas con permiso "liberta" pueden ver y gestionar todo también
CREATE POLICY "Privileged subaccounts manage credentials"
  ON public.credentials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.liberta = 'si'
    )
  );

-- Ayuda: Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_credentials_updated
  BEFORE UPDATE ON public.credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
