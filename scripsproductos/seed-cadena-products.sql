-- ================================================================
-- SEED DE PRODUCTOS: CADENA DISTRIBUCIÓN (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Cadena distribución
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'cadena-distribucion';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Cadena distribución', 'cadena-distribucion', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- KITS DE CADENA COMPLETOS (SILENCIOSOS Y REFORZADOS)
    FOR v_brand IN SELECT unnest(ARRAY['OSK Japan Original', 'Cloyes USA Pro', 'Tsubaki', 'AISIN Japan', 'BGA England', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Toyota Hilux 2.7 2TR-FE', 'Toyota Prado 3.4 5VZ', 'Mazda 3 Skyactiv 2.0', 'Mazda 2 Sport', 'Nissan Frontier YD25 Diesel', 'Nissan Sentra B13/B15', 'Chevrolet Tracker Turbo', 'Ford Ranger 2.3/2.5']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Kit Completo de Cadena Distribución ' || v_brand || ' para ' || v_car_model,
                'Kit técnico que incluye cadena silenciosa cementada, tensores hidráulicos de alta presión, guías de baquelita reforzada y piñones. Máxima durabilidad para evitar saltos de tiempo y ruidos de motor.',
                385000 + (random() * 950000)::int, 'Cadena distribución', v_cat_id, 'Cadena distribución',
                10, TRUE,
                format('[{"label": "Transmisión", "value": "Cadena (Kit)"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Máxima Durabilidad', 'Operación Silenciosa', 'Acero Cementado']
            );
        END LOOP;
    END LOOP;

    -- CADENAS INDIVIDUALES (RECAMBIO RÁPIDO)
    FOR v_brand IN SELECT unnest(ARRAY['Tsubaki', 'OSK', 'Cloyes', 'Original']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Nissan Sentra B13', 'Toyota Hilux 2.7', 'Mazda BT-50 2.2', 'Hyundai Accent i25', 'Kia Rio Spice']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Cadena de Tiempo (Distribución) ' || v_brand || ' ' || v_car_model,
                'Cadena de eslabones reforzados de alta tensión. Tratamiento térmico especial para prevenir el estiramiento prematuro. Calidad tipo original.',
                125000 + (random() * 250000)::int, 'Cadena distribución', v_cat_id, 'Cadena distribución',
                20, TRUE,
                format('[{"label": "Tipo", "value": "Cadena de Eslabones"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- COMPONENTES: TENSORES Y GUÍAS (ALTA ROTACIÓN)
    FOR v_brand IN SELECT unnest(ARRAY['OSK', 'AISIN', 'Genérico Pro']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Toyota Hilux/Fortuner', 'Mazda 3/CX-5 Skyactiv', 'Nissan Frontier/Urvan', 'Chevrolet Captiva 2.4']) LOOP
            -- Tensor Hidráulico
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, benefits
            ) VALUES (
                'Tensor Hidráulico de Cadena ' || v_brand || ' para ' || v_car_model,
                'Actuador hidráulico encargado de mantener la tensión exacta de la cadena de distribución. Evita ruidos y saltos de sincronismo por falta de presión.',
                145000 + (random() * 220000)::int, 'Cadena distribución', v_cat_id, 'Cadena distribución',
                15, TRUE,
                ARRAY['Mantiene Tensión Constante', 'Garantía 1 Año']
            );
            -- Guía de Cadena
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published
            ) VALUES (
                'Guía de Cadena de Distribución ' || v_brand || ' ' || v_car_model,
                'Riel de deslizamiento fabricado en polímero de alta densidad (baquelita) resistente a la fricción y calor extremo del aceite.',
                45000 + (random() * 125000)::int, 'Cadena distribución', v_cat_id, 'Cadena distribución',
                30, TRUE
            );
        END LOOP;
    END LOOP;

    -- ACCESORIOS ADICIONALES
    FOR v_item IN SELECT unnest(ARRAY['Piñón de Árbol de Levas VVT-i Toyota Hilux', 'Piñón Cigüeñal Distribución Mazda Skyactiv', 'Piñón Loco (Intermedio) Nissan YD25 Diesel', 'Separador de Guía de Cadena (Kit)', 'Sello de Tapa de Distribución Renault/Nissan', 'Aditivo Protector de Fricción Cadena Liqui Moly']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Detalle Cadena Distribución: ' || v_item,
            'Componente complementario para la reparación total del sistema de sincronismo por cadena.',
            35000 + (random() * 450000)::int, 'Cadena distribución', v_cat_id, 'Cadena distribución',
            50, TRUE
        );
    END LOOP;

END $$;
