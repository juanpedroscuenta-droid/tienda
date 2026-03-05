-- ==========================================
-- GESTIÓN DE CUPONES DE DESCUENTO
-- ==========================================

-- Tabla de cupones
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_value DECIMAL(15, 2) NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' o 'fixed'
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER, -- NULL para ilimitado
  usage_count INTEGER DEFAULT 0,
  applicable_categories UUID[] DEFAULT ARRAY[]::UUID[], -- Array de IDs de categorías
  applicable_products UUID[] DEFAULT ARRAY[]::UUID[], -- Array de IDs de productos
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

-- Habilitar RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS "Public: read active coupons" ON public.coupons;
CREATE POLICY "Public: read active coupons" ON public.coupons FOR SELECT TO public USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins: full access coupons" ON public.coupons;
CREATE POLICY "Admins: full access coupons" ON public.coupons FOR ALL TO authenticated USING (public.is_admin_email());

DROP POLICY IF EXISTS "Public: update usage count" ON public.coupons;
CREATE POLICY "Public: update usage count" ON public.coupons FOR UPDATE TO public USING (is_active = TRUE);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Otorgar permisos
GRANT ALL ON public.coupons TO postgres, service_role, authenticated;
GRANT SELECT, UPDATE ON public.coupons TO anon;

-- Tabla de historial de uso de cupones
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id UUID, -- Referencia a la orden (puede ser null si se usa previo a cerrar orden)
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en coupon_usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Políticas para coupon_usage
DROP POLICY IF EXISTS "Admins: full access usage" ON public.coupon_usage;
CREATE POLICY "Admins: full access usage" ON public.coupon_usage FOR ALL TO authenticated USING (public.is_admin_email());

DROP POLICY IF EXISTS "Public: insert usage" ON public.coupon_usage;
CREATE POLICY "Public: insert usage" ON public.coupon_usage FOR INSERT TO public WITH CHECK (true);

-- Otorgar permisos
GRANT ALL ON public.coupon_usage TO postgres, service_role, authenticated;
GRANT INSERT ON public.coupon_usage TO anon;

-- Añadir columnas a orders para rastrear el código usado y descuentos
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='coupon_code') THEN
    ALTER TABLE public.orders ADD COLUMN coupon_code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_value') THEN
    ALTER TABLE public.orders ADD COLUMN discount_value NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_type') THEN
    ALTER TABLE public.orders ADD COLUMN discount_type TEXT DEFAULT 'none';
  END IF;
END $$;
