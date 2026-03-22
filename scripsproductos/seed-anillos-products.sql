-- ================================================================
-- SEED DE PRODUCTOS: ANILLOS DE MOTOR (200 PRODUCTOS - TOP MARCAS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand_part TEXT;
    v_car_model TEXT;
    v_size TEXT;
    v_material TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Anillos de Motor
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'anillos-motor';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Anillos de Motor', 'anillos-motor', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)
    
    -- ANILLOS PARA RENAULT (TOP 1 COLOMBIA)
    FOR v_brand_part IN SELECT unnest(ARRAY['Hastings', 'Mahle', 'NPR', 'Grant']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Logan 1.4/1.6 8V', 'Sandero 1.6 16V K4M', 'Duster 2.0 F4R', 'Twingo 1.2 16V D4F', 'Clio II 1.2/1.4', 'Crossover/Stepway K4M']) LOOP
            FOR v_size IN SELECT unnest(ARRAY['STD', '0.20', '0.30', '0.40']) LOOP
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published, specifications, benefits
                ) VALUES (
                    'Juego de Anillos ' || v_brand_part || ' para ' || v_car_model || ' (' || v_size || ')',
                    'Kit de anillos de pistón de alta precisión fabricados bajo normas OEM. Excelente sellado de compresión y control de aceite para una larga vida útil del motor.',
                    145000 + (random() * 95000)::int, 'Anillos de Motor', v_cat_id, 'Anillos de Motor',
                    15, TRUE,
                    format('[{"label": "Marca", "value": "%s"}, {"label": "Medida", "value": "%s"}, {"label": "Motor", "value": "%s"}]', v_brand_part, v_size, v_car_model)::jsonb,
                    ARRAY['Reducción de fricción', 'Resistencia a altas temperaturas', 'Ajuaste perfecto']
                );
            END LOOP;
        END LOOP;
    END LOOP;

    -- ANILLOS PARA CHEVROLET (TOP 2 COLOMBIA)
    FOR v_brand_part IN SELECT unnest(ARRAY['Perfect Circle', 'Mahle', 'Federal Mogul', 'TP']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Aveo 1.4/1.6', 'Spark 1.0/1.2', 'Onix 1.4', 'Captiva 2.4/3.0', 'Sail 1.4', 'Optra 1.4/1.8', 'Luv Dmax 2.4/3.0 Diesel']) LOOP
            FOR v_size IN SELECT unnest(ARRAY['STD', '0.20', '0.30', '0.50']) LOOP
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published, specifications
                ) VALUES (
                    'Anillos de Pistón ' || v_brand_part || ' Chevrolet ' || v_car_model || ' ' || v_size,
                    'Componentes de motor de calidad premium. Diseñados para restaurar la potencia original del motor y reducir el consumo excesivo de lubricante.',
                    120000 + (random() * 180000)::int, 'Anillos de Motor', v_cat_id, 'Anillos de Motor',
                    20, TRUE,
                    format('[{"label": "Aplicación", "value": "Chevrolet"}, {"label": "Material", "value": "Moly/Cromo"}]')::jsonb
                );
            END LOOP;
        END LOOP;
    END LOOP;

    -- ANILLOS PARA MAZDA Y TOYOTA (ALTA CALIDAD JAPONESA)
    FOR v_brand_part IN SELECT unnest(ARRAY['NPR Japan', 'TP Japan', 'Hastings Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Mazda 3 Skyactiv 2.0', 'Mazda 2 Sport', 'Toyota Hilux 2.4/2.5 Diesel', 'Toyota Prado 3.4/4.0', 'Toyota Corolla 1.6/1.8']) LOOP
            FOR v_size IN SELECT unnest(ARRAY['STD', '0.50']) LOOP
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published, benefits
                ) VALUES (
                    'Juego Anillos Japoneses ' || v_brand_part || ' para ' || v_car_model || ' (' || v_size || ')',
                    'Tecnología japonesa avanzada para motores de alto rendimiento. Materiales reforzados para soportar condiciones extremas de operación.',
                    180000 + (random() * 350000)::int, 'Anillos de Motor', v_cat_id, 'Anillos de Motor',
                    10, TRUE,
                    ARRAY['Durabilidad Extrema', 'Sellado de Compresión Superior', 'Origen Garantizado']
                );
            END LOOP;
        END LOOP;
    END LOOP;

    -- ANILLOS PARA HYUNDAI Y KIA (MOTORES COREANOS)
    FOR v_brand_part IN SELECT unnest(ARRAY['KMC', 'Mahle', 'NPR']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Hyundai Accent i25/Vision', 'Kia Picanto Ion/Morning', 'Kia Rio Stylus/Spice', 'Hyundai Tucson G4GC', 'Kia Sportage Revolution']) LOOP
            FOR v_size IN SELECT unnest(ARRAY['STD', '0.20', '0.40']) LOOP
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published, specifications
                ) VALUES (
                    'Kit Anillos Motor Coreano ' || v_brand_part || ' para ' || v_car_model || ' ' || v_size,
                    'Repuesto de motor de alta fiabilidad. Cumple con todas las especificaciones de fábrica para un montaje preciso y sin fugas de compresión.',
                    135000 + (random() * 120000)::int, 'Anillos de Motor', v_cat_id, 'Anillos de Motor',
                    25, TRUE,
                    format('[{"label": "Origen", "value": "Korea/USA"}, {"label": "Empaque", "value": "Kit Completo"}]')::jsonb
                );
            END LOOP;
        END LOOP;
    END LOOP;

    -- ANILLOS PARA NISSAN Y FORD (AMERICANOS Y JAPONESES)
    FOR v_brand_part IN SELECT unnest(ARRAY['Sealed Power', 'Hastings', 'Grant']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Nissan Sentra B13/B14/B15', 'Nissan Frontier D22/D40', 'Ford Fiesta Power/Titanium', 'Ford Ranger 2.3/2.5']) LOOP
            FOR v_size IN SELECT unnest(ARRAY['STD', '0.30']) LOOP
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published
                ) VALUES (
                    'Anillos de Pistón Pro ' || v_brand_part || ' ' || v_car_model || ' ' || v_size,
                    'Ingeniería de vanguardia para la reconstrucción de motores. Diseñados para compensar el desgaste de los cilindros y optimizar la combustión.',
                    155000 + (random() * 220000)::int, 'Anillos de Motor', v_cat_id, 'Anillos de Motor',
                    12, TRUE
                );
            END LOOP;
        END LOOP;
    END LOOP;

    -- ANILLOS PARA VEHÍCULOS DE CARGA Y TRACTORES (DIESEL PESADO)
    FOR v_brand_part IN SELECT unnest(ARRAY['Federal Mogul', 'Mahle Original', 'FP Diesel']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Cummins ISX/ISM', 'Caterpillar 3116/3126', 'International DT466', 'Kenworth T800 (Paccar)', 'Freightliner M2 (Mercedes)']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Anillos Motor Diesel Pesado ' || v_brand_part || ' ' || v_car_model || ' STD',
                'Kit de anillos industriales para motores de alto torque. Capas protectoras especiales para reducir la erosión y el desgaste prematuro por fricción severa.',
                450000 + (random() * 850000)::int, 'Anillos de Motor', v_cat_id, 'Anillos de Motor',
                8, TRUE,
                format('[{"label": "Tipo", "value": "Diesel Heavy Duty"}, {"label": "Material", "value": "Cerachrome / Moly"}]')::jsonb,
                ARRAY['Máxima Resistencia', 'Control de Aceite Pro', 'Garantía Reforzada']
            );
        END LOOP;
    END LOOP;

END $$;
