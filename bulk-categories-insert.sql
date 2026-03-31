-- Script definitivo: ACTUALIZA Y MUEVE categorías sin borrar para evitar errores de FK con productos.
DO $$ 
DECLARE 
    v_main_id UUID;
    v_sub_id UUID;
BEGIN
    -- ESTRATEGIA: Usamos ON CONFLICT (slug) DO UPDATE para "reubicar" categorías existentes
    -- Esto permite cambiar el parent_id sin romper los productos asociados.

    -- 1. ACEITES
    INSERT INTO public.categories (name, slug, parent_id, is_active)
    VALUES ('Aceites', 'aceites', NULL, TRUE)
    ON CONFLICT (slug) DO UPDATE SET parent_id = NULL, parent_name = NULL, updated_at = NOW()
    RETURNING id INTO v_main_id;

    -- 2. MOTOR
    INSERT INTO public.categories (name, slug, parent_id, is_active)
    VALUES ('Motor', 'motor', NULL, TRUE)
    ON CONFLICT (slug) DO UPDATE SET parent_id = NULL, parent_name = NULL, updated_at = NOW()
    RETURNING id INTO v_main_id;

    -- Correas y Caja (Subcategorías de MOTOR)
    INSERT INTO public.categories (name, slug, parent_id, parent_name) VALUES ('Correas', 'correas', v_main_id, 'Motor')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, parent_name = EXCLUDED.parent_name RETURNING id INTO v_sub_id;
    
    INSERT INTO public.categories (name, slug, parent_id, parent_name) VALUES 
        ('Correas aire acondicionado', 'correas-aire-acondicionado', v_sub_id, 'Correas'),
        ('Correas alternador', 'correas-alternador', v_sub_id, 'Correas'),
        ('Correas dirección hidráulica', 'correas-direccion-hidraulica', v_sub_id, 'Correas'),
        ('Correas distribución', 'correas-distribucion', v_sub_id, 'Correas')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, parent_name = EXCLUDED.parent_name;

    INSERT INTO public.categories (name, slug, parent_id, parent_name) VALUES ('Caja y transmisión', 'caja-y-transmision', v_main_id, 'Motor')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, parent_name = EXCLUDED.parent_name RETURNING id INTO v_sub_id;

    INSERT INTO public.categories (name, slug, parent_id, parent_name) VALUES 
        ('Bronce', 'bronce', v_sub_id, 'Caja y transmisión'),
        ('Trenfijo', 'trenfijo', v_sub_id, 'Caja y transmisión'),
        ('Retén caja', 'reten-caja', v_sub_id, 'Caja y transmisión'),
        ('Caja velocidades', 'caja-velocidades', v_sub_id, 'Caja y transmisión'),
        ('Guaya cambios', 'guaya-cambios', v_sub_id, 'Caja y transmisión'),
        ('Transferencia', 'transferencia', v_sub_id, 'Caja y transmisión'),
        ('Corona y speed', 'corona-y-speed', v_sub_id, 'Caja y transmisión'),
        ('Palanca cambios y pedal', 'palanca-cambios-pedal', v_sub_id, 'Caja y transmisión')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, parent_name = EXCLUDED.parent_name;

    -- 3. ELÉCTRICOS
    INSERT INTO public.categories (name, slug, parent_id, is_active)
    VALUES ('Eléctricos', 'electricos', NULL, TRUE)
    ON CONFLICT (slug) DO UPDATE SET parent_id = NULL, parent_name = NULL, updated_at = NOW()
    RETURNING id INTO v_main_id;

    INSERT INTO public.categories (name, slug, parent_id, parent_name) VALUES ('Iluminación', 'iluminacion', v_main_id, 'Eléctricos')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, parent_name = EXCLUDED.parent_name RETURNING id INTO v_sub_id;
    INSERT INTO public.categories (name, slug, parent_id, parent_name) VALUES 
        ('Bombillos', 'bombillos', v_sub_id, 'Iluminación'),
        ('Stop', 'stop', v_sub_id, 'Iluminación'),
        ('Farolas', 'farolas', v_sub_id, 'Iluminación'),
        ('Direccional', 'direccional-iluminacion', v_sub_id, 'Iluminación'),
        ('Exploradoras', 'exploradoras', v_sub_id, 'Iluminación')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, parent_name = EXCLUDED.parent_name;

    INSERT INTO public.categories (name, slug, parent_id, parent_name) VALUES ('Baterías', 'baterias', v_main_id, 'Eléctricos')
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, parent_name = EXCLUDED.parent_name;

    -- 4. DIRECCIÓN Y SUSPENSIÓN
    INSERT INTO public.categories (name, slug, parent_id, is_active)
    VALUES ('Dirección y suspensión', 'direccion-y-suspension', NULL, TRUE)
    ON CONFLICT (slug) DO UPDATE SET parent_id = NULL, parent_name = NULL, updated_at = NOW()
    RETURNING id INTO v_main_id;

    -- 5. REFRIGERACIÓN
    INSERT INTO public.categories (name, slug, parent_id, is_active)
    VALUES ('Refrigeración', 'refrigeracion', NULL, TRUE)
    ON CONFLICT (slug) DO UPDATE SET parent_id = NULL, parent_name = NULL, updated_at = NOW();

    -- 6. CARROCERÍA
    INSERT INTO public.categories (name, slug, parent_id, is_active)
    VALUES ('Carrocería', 'carroceria', NULL, TRUE)
    ON CONFLICT (slug) DO UPDATE SET parent_id = NULL, parent_name = NULL, updated_at = NOW();

    -- 7. FRENADO
    INSERT INTO public.categories (name, slug, parent_id, is_active)
    VALUES ('Frenado', 'frenado', NULL, TRUE)
    ON CONFLICT (slug) DO UPDATE SET parent_id = NULL, parent_name = NULL, updated_at = NOW();

    -- 8. ACCESORIOS
    INSERT INTO public.categories (name, slug, parent_id, is_active)
    VALUES ('Accesorios', 'accesorios', NULL, TRUE)
    ON CONFLICT (slug) DO UPDATE SET parent_id = NULL, parent_name = NULL, updated_at = NOW();

    -- 9. CLUTCH
    INSERT INTO public.categories (name, slug, parent_id, is_active)
    VALUES ('Clutch', 'clutch', NULL, TRUE)
    ON CONFLICT (slug) DO UPDATE SET parent_id = NULL, parent_name = NULL, updated_at = NOW();

    -- 10. FILTRACIÓN
    INSERT INTO public.categories (name, slug, parent_id, is_active)
    VALUES ('Filtración', 'filtracion', NULL, TRUE)
    ON CONFLICT (slug) DO UPDATE SET parent_id = NULL, parent_name = NULL, updated_at = NOW();

END $$;
