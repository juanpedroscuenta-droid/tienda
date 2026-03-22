-- ================================================================
-- SEED DE PRODUCTOS: CULATAS (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_type TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Culatas
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'culatas';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Culatas', 'culatas', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- CULATAS PARA LÍNEA RENAULT (MUCHA ROTACIÓN)
    FOR v_brand IN SELECT unnest(ARRAY['AMC Pro', 'Genérica Premium', 'Original Renault']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Logan/Sandero 1.6 8V K7M', 'Logan/Sandero 1.6 16V K4M', 'Duster 2.0 16V F4R', 'Twingo 1.2 8V C3G', 'Twingo 1.2 16V D4F', 'Clio/Symbol 1.4 16V K4J', 'Master 2.5 Diesel G9U', 'Kangoo 1.5 dCi K9K']) LOOP
            FOR v_type IN SELECT unnest(ARRAY['Desnuda', 'Completa con Válvulas']) LOOP
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published, specifications, benefits
                ) VALUES (
                    'Culata ' || v_type || ' ' || v_brand || ' para ' || v_car_model,
                    'Culata de motor fabricada en aleación de aluminio de alta resistencia térmico-mecánica. Rectificada con precisión bajo estándares OEM. Ideal para restaurar la compresión y el rendimiento del motor.',
                    1450000 + (random() * 2500000)::int, 'Culatas', v_cat_id, 'Culatas',
                    5, TRUE,
                    format('[{"label": "Tipo", "value": "%s"}, {"label": "Marca", "value": "%s"}]', v_type, v_brand)::jsonb,
                    ARRAY['Listo para instalar', 'Alta conductividad térmica', 'Garantía de sellado']
                );
            END LOOP;
        END LOOP;
    END LOOP;

    -- CULATAS PARA LÍNEA CHEVROLET
    FOR v_brand IN SELECT unnest(ARRAY['Top Engine', 'Genérica Calidad A', 'GM Genuine']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Aveo 1.4/1.6 16V', 'Spark 1.0/1.2', 'Onix/Prisma 1.4 8V', 'Captiva 2.4/3.0', 'Sail 1.4 16V S-TEC', 'Optra 1.4/1.8 J200', 'Luv Dmax 2.4 Gasolina', 'Luv Dmax 3.0 Diesel 4JJ1', 'NKR/NHR 2.8 4JB1', 'FHR/FRR 5.2 4HK1']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Culata de Motor ' || v_brand || ' Chevrolet ' || v_car_model,
                'Componente de motor de fundición premium. Diseñada para soportar altas presiones de combustión y garantizar una distribución de flujo de aire/combustible óptima.',
                1200000 + (random() * 3200000)::int, 'Culatas', v_cat_id, 'Culatas',
                8, TRUE,
                format('[{"label": "Modelo", "value": "%s"}]', v_car_model)::jsonb
            );
        END LOOP;
    END LOOP;

    -- CULATAS PARA LÍNEA JAPONESA Y COREANA (ALTA PRECISIÓN)
    FOR v_brand IN SELECT unnest(ARRAY['AMC Spain', 'Genérica Premium Coreana', 'Original']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Mazda 3 Skyactiv 2.0', 'Mazda 2 Sport', 'Toyota Hilux 2.5/3.0 1KD/2KD', 'Toyota Prado 3.4 5VZ', 'Toyota Corolla 1.8 1ZZ/2ZR', 'Hyundai Accent i25', 'Kia Picanto Ion', 'Kia Sportage Revolution', 'Nissan Frontier D22/D40 YD25', 'Nissan Urvan 2.5 QR25']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, benefits
            ) VALUES (
                'Culata Japonesa/Coreana ' || v_brand || ' para ' || v_car_model,
                'Culata de última generación. Fabricada bajo especificaciones estrictas para asegurar el mejor torque de culata y evitar deformaciones por sobrecalentamiento.',
                1800000 + (random() * 4500000)::int, 'Culatas', v_cat_id, 'Culatas',
                4, TRUE,
                ARRAY['Material Reforzado', 'Tratamiento Térmico', 'Calidad de Exportación']
            );
        END LOOP;
    END LOOP;

    -- CULATAS PARA VEHÍCULOS DE TRABAJO Y DIESEL PESADO
    FOR v_brand IN SELECT unnest(ARRAY['FP Diesel', 'AMC Heavy Duty']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Cummins ISX/ISM', 'Caterpillar 3116/3126', 'International DT466', 'Paccar PX-7', 'Mercedes OM904/OM906']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Culata Camión/Maquinaria ' || v_brand || ' ' || v_car_model,
                'Culata industrial para trabajo pesado en condiciones extremas. Aleación de hierro fundido de alta densidad para máxima resistencia a la fatiga térmica.',
                5500000 + (random() * 8500000)::int, 'Culatas', v_cat_id, 'Culatas',
                2, TRUE,
                format('[{"label": "Uso", "value": "Diesel Pesado"}, {"label": "Material", "value": "Hierro Fundido"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- ACCESORIOS DE CULATA (REPUESTOS Y COMPONENTES)
    FOR v_item IN SELECT unnest(ARRAY['Empaque de Culata Multilámina (Amianto)', 'Tornillos de Culata (Kit Completo)', 'Válvula de Admisión Reforzada', 'Válvula de Escape Reforzada', 'Guía de Válvula de Bronce', 'Sello de Válvula Viton', 'Árbol de Levas (Admisión/Escape)', 'Impulsadores Hidráulicos (Taqués)', 'Balancines de Culata', 'Retenes de Curva de Culata']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, benefits
        ) VALUES (
            'Componente de Culata: ' || v_item,
            'Repuesto esencial para la reparación o armado de la culata. Piezas fabricadas con precisión milimétrica.',
            45000 + (random() * 450000)::int, 'Culatas', v_cat_id, 'Culatas',
            40, TRUE,
            ARRAY['Resistencia al Desgaste', 'Acero Templado']
        );
    END LOOP;

END $$;
