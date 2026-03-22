-- ================================================================
-- SEED DE PRODUCTOS: VÁLVULAS (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_type TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Válvulas
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'valvulas';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Válvulas', 'valvulas', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- VÁLVULAS DE ADMISIÓN Y ESCAPE (MARCAS TOP)
    FOR v_brand IN SELECT unnest(ARRAY['Federal Mogul', 'Mahle Original', 'TRW', 'Osivat Italy', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero 1.6 8V', 'Renault Logan/Sandero/Duster 1.6 16V', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Optra 1.4/1.8', 'Mazda 3 Skyactiv 2.0', 'Toyota Hilux 2.5/3.0 1KD/2KD', 'Hyundai Accent i25', 'Kia Picanto Ion', 'Nissan Frontier YD25']) LOOP
            -- Válvula Admisión
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Válvula de Admisión ' || v_brand || ' para ' || v_car_model,
                'Válvula de admisión fabricada en acero aleado de alta resistencia. Diseñada para un flujo de aire óptimo y un sellado perfecto en el asiento de culata. Tratamiento térmico para evitar deformaciones.',
                18000 + (random() * 25000)::int, 'Válvulas', v_cat_id, 'Válvulas',
                32, TRUE,
                format('[{"label": "Tipo", "value": "Admisión"}, {"label": "Material", "value": "Acero Templado"}]')::jsonb,
                ARRAY['Máximo Flujo', 'Resistente a Corrosión', 'Ajuste OEM']
            );
            -- Válvula Escape
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Válvula de Escape ' || v_brand || ' para ' || v_car_model,
                'Válvula de escape bimetálica diseñada para soportar temperaturas extremas de salida de gases. Resistente a la erosión y fatiga térmica prolongada.',
                22000 + (random() * 32000)::int, 'Válvulas', v_cat_id, 'Válvulas',
                32, TRUE,
                format('[{"label": "Tipo", "value": "Escape"}, {"label": "Material", "value": "Bimetálica Reforzada"}]')::jsonb,
                ARRAY['Alta Resistencia Térmica', 'Durabilidad Superior', 'Sellado de Compresión']
            );
        END LOOP;
    END LOOP;

    -- JUEGOS COMPLETOS DE VÁLVULAS (SET X8 / X16)
    FOR v_brand IN SELECT unnest(ARRAY['Federal Mogul Set', 'Mahle Kit', 'Genérico Pro']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault K4M (16 Válvulas)', 'Chevrolet Aveo 1.6 (16 Válvulas)', 'Toyota Hilux Diesel (16 Válvulas)', 'Renault Logan K7M (8 Válvulas)', 'Chevrolet Spark (8 Válvulas)']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Juego Completo de Válvulas ' || v_brand || ' ' || v_car_model,
                'Kit completo de válvulas (Admisión + Escape) para reparación total de culata. Asegura que todas las piezas tengan el mismo grado de expansión y desgaste.',
                185000 + (random() * 450000)::int, 'Válvulas', v_cat_id, 'Válvulas',
                12, TRUE,
                format('[{"label": "Contenido", "value": "Set Completo Culata"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- COMPONENTES RELACIONADOS
    FOR v_item IN SELECT unnest(ARRAY['Guías de Válvula en Bronce para Renault K4M (x16)', 'Guías de Válvula Chevrolet Aveo (x16)', 'Asiento de Válvula Medida STD (Set x8)', 'Cuñas (Seguros) de Válvula Reforzados (Set x32)', 'Resortes de Válvula de Alta Tensión', 'Arandelas de Asiento de Muelle']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Repuesto Detalle Válvulas: ' || v_item,
            'Componente necesario para el rearmado de válvulas en la culata. Piezas de precisión milimétrica.',
            8000 + (random() * 145000)::int, 'Válvulas', v_cat_id, 'Válvulas',
            100, TRUE
        );
    END LOOP;

END $$;
