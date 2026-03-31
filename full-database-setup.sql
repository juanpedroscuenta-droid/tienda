-- ================================================================
-- FUEGO SHOP EXPRESS - SETUP COMPLETO DE BASE DE DATOS (SUPABASE)
-- ================================================================
-- Este script contiene TODO lo necesario para inicializar el proyecto
-- desde cero en un nuevo cliente. Incluye tablas, índices, RLS, 
-- políticas de seguridad y configuración de almacenamiento.
-- ================================================================

-- 0. EXTENSIONES Y SEGURIDAD BÁSICA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



-- 1. TABLAS PRINCIPALES

-- Tabla de usuarios (perfil extendido de auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  department_number TEXT,
  conjunto TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  birthdate DATE,
  preferences TEXT,
  notifications JSONB DEFAULT '{"email": true, "sms": false, "promotions": true}'::JSONB,
  sub_cuenta TEXT, -- 'si' o null
  is_admin BOOLEAN DEFAULT FALSE,
  liberta TEXT DEFAULT 'no', -- 'si' = publica directo; 'no' = a revisión
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de subcategorías (Para compatibilidad con backend)
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tercera categoría (Para compatibilidad con backend)
CREATE TABLE IF NOT EXISTS public.tercera_categoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.subcategories(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de categorías (Soporta N niveles)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  icon TEXT,
  image TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  parent_name TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(15, 2) NOT NULL,
  cost DECIMAL(15, 2),
  original_price DECIMAL(15, 2),
  image TEXT,
  additional_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  category TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  category_name TEXT,
  subcategory TEXT,
  subcategory_name TEXT,
  tercera_categoria TEXT,
  tercera_categoria_name TEXT,
  stock INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_offer BOOLEAN DEFAULT FALSE,
  discount INTEGER,
  specifications JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
  warranties TEXT[] DEFAULT ARRAY[]::TEXT[],
  payment_methods TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by TEXT,
  last_modified_by TEXT,
  cost_updated_at TIMESTAMP WITH TIME ZONE,
  profit_margin DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de órdenes (Sin FK estricta para mayor robustez)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  items JSONB NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  delivery_fee DECIMAL(15, 2) DEFAULT 0,
  order_notes TEXT,
  status TEXT DEFAULT 'pending',
  order_type TEXT, -- 'online' o 'physical'
  payment_method TEXT,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  discount_type TEXT DEFAULT 'none',
  discount_value DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar desacoplamiento de user_id en órdenes
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Tabla de direcciones de usuario
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

-- Tabla de contactos / suscriptores newsletter
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  avatar TEXT,
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'manual',
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de filtros de productos
CREATE TABLE IF NOT EXISTS public.filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.filter_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_id UUID NOT NULL REFERENCES public.filters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de empresa
CREATE TABLE IF NOT EXISTS public.company_profile (
  id TEXT PRIMARY KEY,
  friendly_name TEXT,
  legal_name TEXT,
  logo TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  postal_address TEXT,
  city TEXT,
  postal_code TEXT,
  state TEXT,
  country TEXT DEFAULT 'Colombia',
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar perfil por defecto si no existe
INSERT INTO public.company_profile (id, friendly_name) VALUES ('main', 'Mi Tienda') ON CONFLICT (id) DO NOTHING;

-- Tabla de filtros personalizados
CREATE TABLE IF NOT EXISTS public.filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de opciones de filtros
CREATE TABLE IF NOT EXISTS public.filter_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID NOT NULL REFERENCES public.filters(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de grupos de filtros (Ofertas, Relevantes, etc.)
CREATE TABLE IF NOT EXISTS public.filter_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT UNIQUE,
  color TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relación Productos <-> Grupos de Filtros
CREATE TABLE IF NOT EXISTS public.product_filter_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  filter_group_id UUID NOT NULL REFERENCES public.filter_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, filter_group_id)
);

-- Tabla de contactos
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  avatar TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE,
  created_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Tabla de reseñas de productos
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Tabla de analytics de vistas de productos (Sin FK estricta para mayor robustez)
CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  product_name TEXT,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  session_id TEXT NOT NULL,
  date TEXT,
  time TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de totales de analytics por producto
CREATE TABLE IF NOT EXISTS public.product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  total_views INTEGER NOT NULL DEFAULT 0,
  last_viewed TIMESTAMPTZ,
  views_by_day JSONB DEFAULT '{}'::jsonb,
  first_viewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de visitas al sitio web (Sin FK estricta)
CREATE TABLE IF NOT EXISTS public.website_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_info JSONB,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajuste para visitas: permitir upsert o ignorar conflictos si se envía el mismo ID
ALTER TABLE public.website_visits DROP CONSTRAINT IF EXISTS website_visits_pkey CASCADE;
ALTER TABLE public.website_visits ADD PRIMARY KEY (id);

-- Eliminar FKs si ya existían de una ejecución previa
ALTER TABLE public.product_views DROP CONSTRAINT IF EXISTS product_views_user_id_fkey;
ALTER TABLE public.website_visits DROP CONSTRAINT IF EXISTS website_visits_user_id_fkey;


-- Tabla de secciones informativas (Ayuda, FAQs)
CREATE TABLE IF NOT EXISTS public.info_sections (
  id TEXT PRIMARY KEY,
  content TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  lastEdited TIMESTAMPTZ,
  lastEditedBy TEXT,
  version INT NOT NULL DEFAULT 1,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de revisiones (Aprobación de cambios)
CREATE TABLE IF NOT EXISTS public.revision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'product', 'category', etc.
  data JSONB NOT NULL,
  status TEXT DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  editor_email TEXT,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración general
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ÍNDICES

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique_main ON public.categories (name) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_parent_unique ON public.categories (name, parent_id) WHERE parent_id IS NOT NULL;
-- Products
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);
-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
-- Analytics
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_timestamp ON public.product_views(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_website_visits_timestamp ON public.website_visits(timestamp DESC);

-- 3. FUNCIONES Y TRIGGERS (Auto-updated_at)

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'updated_at' AND table_schema = 'public') LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
    END LOOP;
END $$;

-- 4. ROW LEVEL SECURITY (RLS)

-- Habilitar RLS en todas las tablas
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- FUNCIÓN AUXILIAR: ¿Es el usuario actual administrador?
CREATE OR REPLACE FUNCTION public.is_admin_email() 
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- 1. Verificar por lista fija (Fallback seguro)
  IF (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'admin@tienda.com', 'tu-correo@gmail.com', 'admin@biosa.com', 'diego@gmail.com') THEN
    RETURN TRUE;
  END IF;

  -- 2. Verificar por columna en tabla users
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = auth.uid();
  RETURN COALESCE(v_is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para manejar la creación de un nuevo usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, is_admin, sub_cuenta)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    (NEW.email IN ('admin@gmail.com', 'admin@tienda.com', 'tu-correo@gmail.com')),
    NEW.raw_user_meta_data->>'sub_cuenta'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    sub_cuenta = COALESCE(EXCLUDED.sub_cuenta, public.users.sub_cuenta);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar auth.users con public.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. POLÍTICAS ESPECÍFICAS

-- USERS
DROP POLICY IF EXISTS "Public: insert during register" ON public.users;
CREATE POLICY "Public: insert during register" ON public.users FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Self: read/update" ON public.users;
CREATE POLICY "Self: read/update" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Self: update profile" ON public.users;
CREATE POLICY "Self: update profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins: full access by email" ON public.users;
CREATE POLICY "Admins: full access by email" ON public.users FOR ALL TO authenticated USING (public.is_admin_email());

-- CATEGORIES
DROP POLICY IF EXISTS "Public: read categories" ON public.categories;
CREATE POLICY "Public: read categories" ON public.categories FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins: manage categories" ON public.categories;
CREATE POLICY "Admins: manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin_email());

-- SUBCATEGORIES
DROP POLICY IF EXISTS "Public: read subcategories" ON public.subcategories;
CREATE POLICY "Public: read subcategories" ON public.subcategories FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins: manage subcategories" ON public.subcategories;
CREATE POLICY "Admins: manage subcategories" ON public.subcategories FOR ALL TO authenticated USING (public.is_admin_email());

-- TERCERA CATEGORIA
DROP POLICY IF EXISTS "Public: read third level" ON public.tercera_categoria;
CREATE POLICY "Public: read third level" ON public.tercera_categoria FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins: manage third level" ON public.tercera_categoria;
CREATE POLICY "Admins: manage third level" ON public.tercera_categoria FOR ALL TO authenticated USING (public.is_admin_email());

-- PRODUCTS
DROP POLICY IF EXISTS "Public: read published items" ON public.products;
CREATE POLICY "Public: read published items" ON public.products FOR SELECT TO public USING (is_published = TRUE);
DROP POLICY IF EXISTS "Admins: full access" ON public.products;
CREATE POLICY "Admins: full access" ON public.products FOR ALL TO authenticated USING (public.is_admin_email());

-- ORDERS
DROP POLICY IF EXISTS "Public: read orders" ON public.orders;
CREATE POLICY "Public: read orders" ON public.orders FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public: insert orders" ON public.orders;
CREATE POLICY "Public: insert orders" ON public.orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admins: manage orders" ON public.orders;
CREATE POLICY "Admins: manage orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin_email());

-- FAVORITES
DROP POLICY IF EXISTS "Self: manage favorites" ON public.favorites;
CREATE POLICY "Self: manage favorites" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id);

-- USER ADDRESSES
DROP POLICY IF EXISTS "Self: manage addresses" ON public.user_addresses;
CREATE POLICY "Self: manage addresses" ON public.user_addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- FILTERS
ALTER TABLE public.filters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.filters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public: read filters"   ON public.filters;
DROP POLICY IF EXISTS "Admins: manage filters" ON public.filters;
DROP POLICY IF EXISTS "Manage filters"         ON public.filters;
DROP POLICY IF EXISTS "Read filters"           ON public.filters;
CREATE POLICY "Read filters" ON public.filters FOR SELECT TO public USING (true);
CREATE POLICY "Manage filters" ON public.filters FOR ALL TO authenticated USING (true);
GRANT ALL ON public.filters TO postgres, service_role, authenticated;
GRANT SELECT ON public.filters TO anon;

-- FILTER OPTIONS
ALTER TABLE public.filter_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public: read filter_options"   ON public.filter_options;
DROP POLICY IF EXISTS "Admins: manage filter_options" ON public.filter_options;
DROP POLICY IF EXISTS "Manage options"               ON public.filter_options;
DROP POLICY IF EXISTS "Read options"                 ON public.filter_options;
CREATE POLICY "Read options" ON public.filter_options FOR SELECT TO public USING (true);
CREATE POLICY "Manage options" ON public.filter_options FOR ALL TO authenticated USING (true);
GRANT ALL ON public.filter_options TO postgres, service_role, authenticated;
GRANT SELECT ON public.filter_options TO anon;

-- CONTACTS (newsletter / CRM)
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public: insert contacts"  ON public.contacts;
DROP POLICY IF EXISTS "Public: update contacts"  ON public.contacts;
DROP POLICY IF EXISTS "Self: update contact"      ON public.contacts;
DROP POLICY IF EXISTS "Admins: manage contacts"  ON public.contacts;
DROP POLICY IF EXISTS "Allow insert for all"      ON public.contacts;
CREATE POLICY "Public: insert contacts" ON public.contacts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins: manage contacts" ON public.contacts FOR ALL TO authenticated USING (public.is_admin_email());
GRANT ALL ON public.contacts TO postgres, service_role;
GRANT INSERT ON public.contacts TO anon, authenticated;

-- COMPANY PROFILE
DROP POLICY IF EXISTS "Public: read profile" ON public.company_profile;
CREATE POLICY "Public: read profile" ON public.company_profile FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins: manage profile" ON public.company_profile;
CREATE POLICY "Admins: manage profile" ON public.company_profile FOR ALL TO authenticated USING (public.is_admin_email());

-- ANALYTICS & VISITS
ALTER TABLE public.product_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public: insert views/visits" ON public.product_views;
DROP POLICY IF EXISTS "Public: insert views"        ON public.product_views;
DROP POLICY IF EXISTS "Allow insert for all"         ON public.product_views;
DROP POLICY IF EXISTS "Admins: full access views"   ON public.product_views;
CREATE POLICY "Public: insert views" ON public.product_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins: full access views" ON public.product_views FOR ALL TO authenticated USING (public.is_admin_email());
GRANT ALL ON public.product_views TO postgres, service_role;
GRANT INSERT ON public.product_views TO anon, authenticated;

ALTER TABLE public.website_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public: insert visits"       ON public.website_visits;
DROP POLICY IF EXISTS "Public: insert views/visits" ON public.website_visits;
DROP POLICY IF EXISTS "Allow insert for all"         ON public.website_visits;
DROP POLICY IF EXISTS "Admins: read visits"         ON public.website_visits;
CREATE POLICY "Public: insert visits" ON public.website_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins: read visits" ON public.website_visits FOR SELECT TO authenticated USING (public.is_admin_email());
GRANT ALL ON public.website_visits TO postgres, service_role;
GRANT INSERT ON public.website_visits TO anon, authenticated;

-- Product Analytics (Necesita Select/Insert/Update para el upsert del cliente)
DROP POLICY IF EXISTS "Public: read analytics" ON public.product_analytics;
DROP POLICY IF EXISTS "Admins: read analytics" ON public.product_analytics;
DROP POLICY IF EXISTS "Public: insert analytics" ON public.product_analytics;
DROP POLICY IF EXISTS "Public: update analytics" ON public.product_analytics;
DROP POLICY IF EXISTS "Admins: full access analytics" ON public.product_analytics;
CREATE POLICY "Public: read analytics" ON public.product_analytics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public: insert analytics" ON public.product_analytics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public: update analytics" ON public.product_analytics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins: full access analytics" ON public.product_analytics FOR ALL TO authenticated USING (public.is_admin_email());

-- REVIEWS
DROP POLICY IF EXISTS "Public: read reviews" ON public.product_reviews;
CREATE POLICY "Public: read reviews" ON public.product_reviews FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Authenticated: create reviews" ON public.product_reviews;
CREATE POLICY "Authenticated: create reviews" ON public.product_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Self: update/delete reviews" ON public.product_reviews;
CREATE POLICY "Self: update/delete reviews" ON public.product_reviews FOR ALL TO authenticated USING (auth.uid() = user_id);

-- INFO SECTIONS
DROP POLICY IF EXISTS "Public: read info" ON public.info_sections;
CREATE POLICY "Public: read info" ON public.info_sections FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins: manage info" ON public.info_sections;
CREATE POLICY "Admins: manage info" ON public.info_sections FOR ALL TO authenticated USING (public.is_admin_email());

-- SETTINGS
DROP POLICY IF EXISTS "Public: read settings" ON public.settings;
CREATE POLICY "Public: read settings" ON public.settings FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins: manage settings" ON public.settings;
CREATE POLICY "Admins: manage settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin_email());

-- REVISION
DROP POLICY IF EXISTS "Admins: manage revisions" ON public.revision;
CREATE POLICY "Admins: manage revisions" ON public.revision FOR ALL TO authenticated USING (public.is_admin_email());

-- CONTACTS
DROP POLICY IF EXISTS "Public: insert contact" ON public.contacts;
CREATE POLICY "Public: insert contact" ON public.contacts FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Admins: manage contacts" ON public.contacts;
CREATE POLICY "Admins: manage contacts" ON public.contacts FOR ALL TO authenticated USING (public.is_admin_email());

-- 6. CONFIGURACIÓN DE STORAGE

-- Crear el bucket '24' si no existe (usado por el backend)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('24', '24', true) 
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para el bucket '24'
DROP POLICY IF EXISTS "Public Access 24" ON storage.objects;
CREATE POLICY "Public Access 24" ON storage.objects FOR SELECT USING (bucket_id = '24');

DROP POLICY IF EXISTS "Public Insert 24" ON storage.objects;
CREATE POLICY "Public Insert 24" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = '24');

DROP POLICY IF EXISTS "Authenticated users can upload 24" ON storage.objects;
CREATE POLICY "Authenticated users can upload 24" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '24');

DROP POLICY IF EXISTS "Authenticated users can update 24" ON storage.objects;
CREATE POLICY "Authenticated users can update 24" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = '24');

DROP POLICY IF EXISTS "Authenticated users can delete 24" ON storage.objects;
CREATE POLICY "Authenticated users can delete 24" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = '24');

-- Crear el bucket 'perfumes' si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('perfumes', 'perfumes', true) 
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para el bucket 'perfumes'
DROP POLICY IF EXISTS "Public Access perfumes" ON storage.objects;
CREATE POLICY "Public Access perfumes" ON storage.objects FOR SELECT USING (bucket_id = 'perfumes');

DROP POLICY IF EXISTS "Authenticated users can upload perfumes" ON storage.objects;
CREATE POLICY "Authenticated users can upload perfumes" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'perfumes');

DROP POLICY IF EXISTS "Authenticated users can update perfumes" ON storage.objects;
CREATE POLICY "Authenticated users can update perfumes" ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'perfumes');

DROP POLICY IF EXISTS "Authenticated users can delete perfumes" ON storage.objects;
CREATE POLICY "Authenticated users can delete perfumes" ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'perfumes');

-- 7. (Opcional) DATOS INICIALES - ELIMINADOS A PETICIÓN DEL USUARIO
-- El sistema iniciará con tablas vacías para categorías y productos.

-- 8. PERMISOS FINALES
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon, service_role;

-- 9. MIGRACIONES / CONSISTENCIA DE ESQUEMA (EJECUCIÓN AL FINAL)
-- Esto garantiza que si las tablas ya existen, se agreguen las columnas necesarias sin borrar datos.
DO $$ 
BEGIN
  -- 9.1 Sincronizar usuarios existentes (auth.users -> public.users)
  INSERT INTO public.users (id, email, is_admin, sub_cuenta)
  SELECT id, email, (email IN ('admin@gmail.com', 'admin@tienda.com', 'tu-correo@gmail.com')), raw_user_meta_data->>'sub_cuenta'
  FROM auth.users
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    is_admin = EXCLUDED.is_admin,
    sub_cuenta = COALESCE(EXCLUDED.sub_cuenta, public.users.sub_cuenta);

  -- 9.2 Migración de Filtros (order_index)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'filters') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='filters' AND column_name='order_index') THEN
      ALTER TABLE public.filters ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'filter_options') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='filter_options' AND column_name='order_index') THEN
      ALTER TABLE public.filter_options ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
  END IF;

  -- 9.3 Migración de Productos y Categorías
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category_id') THEN
      ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id);
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='is_active') THEN
      ALTER TABLE public.categories ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
  END IF;

  -- 9.4 Migración de Órdenes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_type') THEN
      ALTER TABLE public.orders ADD COLUMN discount_type TEXT DEFAULT 'none';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_value') THEN
      ALTER TABLE public.orders ADD COLUMN discount_value DECIMAL(15, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
      ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_fee') THEN
      ALTER TABLE public.orders ADD COLUMN delivery_fee DECIMAL(15, 2) DEFAULT 0;
    END IF;
  END IF;

  -- 9.5 Migración de Empresa (Exhaustiva)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_profile') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='friendly_name') THEN
      ALTER TABLE public.company_profile ADD COLUMN friendly_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='legal_name') THEN
      ALTER TABLE public.company_profile ADD COLUMN legal_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='logo') THEN
      ALTER TABLE public.company_profile ADD COLUMN logo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='postal_address') THEN
      ALTER TABLE public.company_profile ADD COLUMN postal_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='city') THEN
      ALTER TABLE public.company_profile ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='postal_code') THEN
      ALTER TABLE public.company_profile ADD COLUMN postal_code TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='state') THEN
      ALTER TABLE public.company_profile ADD COLUMN state TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='country') THEN
      ALTER TABLE public.company_profile ADD COLUMN country TEXT DEFAULT 'Colombia';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='email') THEN
      ALTER TABLE public.company_profile ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='phone') THEN
      ALTER TABLE public.company_profile ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='whatsapp') THEN
      ALTER TABLE public.company_profile ADD COLUMN whatsapp TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_profile' AND column_name='updated_by') THEN
      ALTER TABLE public.company_profile ADD COLUMN updated_by TEXT;
    END IF;
  END IF;

  -- 9.6 Removida regla de visitas que bloquea RETURNING (causaba error 400)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'website_visits') THEN
    DROP RULE IF EXISTS website_visits_ignore_duplicate ON public.website_visits;
  END IF;

  -- 9.7 Ajuste de RLS para Company Profile (Permitir al backend/anon gestionar el perfil 'main')
  -- Esto es necesario porque el backend usa SUPABASE_ANON_KEY y no envía JWT de usuario
  DROP POLICY IF EXISTS "Public: update main profile" ON public.company_profile;
  CREATE POLICY "Public: update main profile" ON public.company_profile FOR ALL TO public USING (id = 'main') WITH CHECK (id = 'main');
  
END $$;

-- FIN DEL SCRIPT

-- ==========================================
-- GESTIÓN DE TAREAS (KANBAN)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    due_date TEXT,
    priority TEXT DEFAULT 'Media',
    assignee TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Políticas para tasks
DROP POLICY IF EXISTS "Public: read tasks" ON public.tasks;
CREATE POLICY "Public: read tasks" ON public.tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public: insert tasks" ON public.tasks;
CREATE POLICY "Public: insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public: update tasks" ON public.tasks;
CREATE POLICY "Public: update tasks" ON public.tasks FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public: delete tasks" ON public.tasks;
CREATE POLICY "Public: delete tasks" ON public.tasks FOR DELETE USING (true);
