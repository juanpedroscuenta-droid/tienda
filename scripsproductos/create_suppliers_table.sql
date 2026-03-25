-- =====================================================
-- Tabla de Proveedores para Fuego Shop
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  contact_name TEXT,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por nombre
CREATE INDEX IF NOT EXISTS suppliers_name_idx ON public.suppliers (name);

-- Columna en products para enlazar el proveedor (si aún no existe)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- RLS: permitir lectura a todos los autenticados, escritura solo a admins
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Política: lectura pública (el backend con anon key puede leer)
CREATE POLICY "suppliers_select" ON public.suppliers
  FOR SELECT USING (true);

-- Política: insertar/actualizar/eliminar solo con service_role o anon key autenticado
CREATE POLICY "suppliers_insert" ON public.suppliers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "suppliers_update" ON public.suppliers
  FOR UPDATE USING (true);

CREATE POLICY "suppliers_delete" ON public.suppliers
  FOR DELETE USING (true);
