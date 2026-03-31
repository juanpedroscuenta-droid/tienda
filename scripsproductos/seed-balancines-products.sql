-- ================================================================
-- SEED DE PRODUCTOS: BALANCINES (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_type TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Balancines
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'balancines';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Balancines', 'balancines', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- IMPULSADORES / TAQUÉS HIDRÁULICOS (MUCHA ROTACIÓN)
    FOR v_brand IN SELECT unnest(ARRAY['INA (Schaeffler)', 'Ajusa', 'Eaton', 'Melling', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M 16V', 'Renault Duster 2.0 F4R', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Optra 1.4/1.8', 'Mazda 3 All New 2.0', 'Hyundai Accent i25', 'Kia Sportage Revolution', 'Volkswagen Jetta/Tiguan']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Impulsador (Taqué) Hidráulico ' || v_brand || ' para ' || v_car_model,
                'Compensador hidráulico de válvulas diseñado para mantener un juego de válvulas cero, eliminando ruidos y asegurando la apertura precisa. Calidad tipo original INA para motores multivalvulares.',
                28000 + (random() * 45000)::int, 'Balancines', v_cat_id, 'Balancines',
                64, TRUE,
                format('[{"label": "Tipo", "value": "Hidráulico"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Elimina Ruidos de Motor', 'Ajuste Automático', 'Larga Duración']
            );
        END LOOP;
    END LOOP;

    -- BALANCINES DE VÁLVULA (MECÁNICOS Y DE RODILLOS)
    FOR v_brand IN SELECT unnest(ARRAY['Top Engine', 'Ajusa', 'Original Renault', 'Original Chevrolet']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan 8V K7M', 'Chevrolet Spark 1.0 (Set x8)', 'Chevrolet Luv Dmax 2.4/3.0', 'Toyota Hilux 2.5/3.0 1KD/2KD', 'Nissan Frontier YD25/QR25', 'Kia Picanto Ion/Morning', 'Mazda BT-50 2.2/2.5']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Balancín de Válvula con Rodillo ' || v_brand || ' para ' || v_car_model,
                'Balancín de alta resistencia fabricado en acero forjado con rodamiento de agujas. Reduce la fricción entre el árbol de levas y la válvula, mejorando la eficiencia y reduciendo el calor.',
                45000 + (random() * 195000)::int, 'Balancines', v_cat_id, 'Balancines',
                16, TRUE,
                format('[{"label": "Material", "value": "Acero Forjado"}, {"label": "Tipo", "value": "A Rodillo"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- FLAUTAS Y EJES DE BALANCINES (LÍNEA DIESEL Y CARGA)
    FOR v_brand IN SELECT unnest(ARRAY['Original', 'Genérico Reforzado']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Isuzu NPR/NHR 4JB1/4HG1', 'Mitsubishi L200 2.5 4D56', 'Toyota Land Cruiser Diesel 2L/3L', 'Nissan Urvan 2.5 E25', 'Mazda B2600 / Bravo']) LOOP
            -- Eje de Balancín
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, benefits
            ) VALUES (
                'Eje (Flauta) de Balancines Completo ' || v_brand || ' ' || v_car_model,
                'Conjunto completo de eje y balancines. Rectificado con precisión para una lubricación óptima de todo el tren de válvulas.',
                385000 + (random() * 850000)::int, 'Balancines', v_cat_id, 'Balancines',
                4, TRUE,
                ARRAY['Listo para Instalar', 'Aceite con Pasajes Reforzados']
            );
        END LOOP;
    END LOOP;

    -- ACCESORIOS (MUELLES, SEGUROS Y BUJES)
    FOR v_item IN SELECT unnest(ARRAY['Kit de Varillas de Empuje Chevrolet 350 V8', 'Buje de Eje de Balancines Cummins', 'Seguro de Válvula de Cuña (Set x2)', 'Muelle (Resorte) de Válvula Reforzado', 'Asiento de Válvula en Aleación Especial', 'Perno de Regulación de Balancín']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Accesorio Tren de Válvulas: ' || v_item,
            'Pieza de recambio crítica para la sincronización y el correcto funcionamiento de las válvulas del motor.',
            8500 + (random() * 120000)::int, 'Balancines', v_cat_id, 'Balancines',
            100, TRUE
        );
    END LOOP;

END $$;
