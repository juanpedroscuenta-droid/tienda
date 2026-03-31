-- Crear tabla de direcciones si no existe
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT, -- Alias como "Casa", "Oficina"
  address TEXT NOT NULL,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS "Self: manage addresses" ON public.user_addresses;
CREATE POLICY "Self: manage addresses" ON public.user_addresses 
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir lectura pública (opcional, dependiendo de si se usa en checkout anónimo, 
-- pero aquí mejor restringir a dueños)
GRANT ALL ON public.user_addresses TO postgres, authenticated, service_role;
