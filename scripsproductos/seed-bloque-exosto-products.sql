-- ================================================================
-- SEED DE PRODUCTOS: BLOQUE Y EXOSTO (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Bloque y Exosto
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'bloque-exosto';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Bloque y Exosto', 'bloque-exosto', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. BLOQUE DE MOTOR Y COMPONENTES (CILINDROS, CAMISAS)
    
    -- CAMISAS DE CILINDRO (MUCHA ROTACIÓN EN COLOMBIA)
    FOR v_brand IN SELECT unnest(ARRAY['Mahle Original', 'Kolbenschmidt', 'Melling', 'Top Engine']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K7M/K4M', 'Chevrolet Aveo 1.4/1.6', 'Toyota Hilux 2.5/3.0 Diesel 1KD/2KD', 'Mazda 3 Skyactiv', 'Hyundai Accent i25', 'Kia Picanto Ion', 'Nissan Frontier YD25']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Camisa de Cilindro ' || v_brand || ' para ' || v_car_model,
                'Camisa fabricada en fundición centrífuga de alta resistencia. Superficie con acabado de precisión para asegurar la retención de aceite y el sellado de los anillos.',
                55000 + (random() * 120000)::int, 'Bloque y Exosto', v_cat_id, 'Bloque y Exosto',
                40, TRUE,
                format('[{"label": "Material", "value": "Fundición Gris Aleada"}]')::jsonb,
                ARRAY['Excelente Transferencia Térmica', 'Alta Resistencia al Desgaste']
            );
        END LOOP;
    END LOOP;

    -- BLOQUES Y CIGÜEÑALES (PRODUCTOS DE ALTO VALOR)
    FOR v_car_model IN SELECT unnest(ARRAY['Renault K4M/K7M', 'Chevrolet Aveo 1.6', 'Chevrolet Spark GT', 'Toyota Hilux 2TR-FE', 'Nissan Frontier QR25', 'Kia Rio Stylus']) LOOP
        -- Cigüeñales
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, specifications
        ) VALUES (
            'Cigüeñal de Motor Nuevo para ' || v_car_model,
            'Cigüeñal forjado o de fundición nodular de alta tenacidad. Balanceado dinámicamente y con muñones templados para soportar altas cargas operativas.',
            850000 + (random() * 2500000)::int, 'Bloque y Exosto', v_cat_id, 'Bloque y Exosto',
            3, TRUE,
            format('[{"label": "Balanceo", "value": "Dinámico"}, {"label": "Material", "value": "Acero/Fundición Nodular"}]')::jsonb
        );
        -- Bloques
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Bloque de Motor Desnudo Nuevo para ' || v_car_model,
            'Bloque de motor fabricado bajo especificaciones de equipo original. Incluye bancadas. Ideal para reconstrucción total de motores fundidos o con grietas irreparables.',
            3500000 + (random() * 12000000)::int, 'Bloque y Exosto', v_cat_id, 'Bloque y Exosto',
            2, TRUE
        );
    END LOOP;

    -- 3. SISTEMA DE EXOSTO / ESCAPE (MÚLTIPLES, CATALIZADORES, SILENCIADORES)
    
    -- CATALIZADORES (CUMPLIMIENTO AMBIENTAL)
    FOR v_brand IN SELECT unnest(ARRAY['Walker Premium', 'Magnaflow', 'Genérico Alta Eficiencia']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Universal 2 pulg', 'Universal 2.5 pulg', 'Renault Logan/Sandero Euro 4', 'Chevrolet Aveo/Spark', 'Mazda 3 Skyactiv (Multiple)', 'Hyundai/Kia OBDI/II']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Catalizador ' || v_brand || ' ' || v_car_model,
                'Convertidor catalítico cerámico/metálico de alto flujo. Reduce significativamente la emisión de gases tóxicos. Ayuda a pasar la revisión técnico-mecánica.',
                450000 + (random() * 950000)::int, 'Bloque y Exosto', v_cat_id, 'Bloque y Exosto',
                15, TRUE,
                format('[{"label": "Norma", "value": "EPA / Euro 4"}, {"label": "Entrada", "value": "%s"}]', v_car_model)::jsonb,
                ARRAY['Baja Restricción', 'Instalación Tipo Original', 'Material Inoxidable']
            );
        END LOOP;
    END LOOP;

    -- MÚLTIPLES DE ESCAPE Y SILENCIADORES
    FOR v_item IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M', 'Chevrolet Aveo 1.6', 'Chevrolet Spark 1.0', 'Toyota Prado 3.4 V6', 'Kia Picanto Ion', 'Hyundai Accent i25', 'Mazda BT-50 2.2']) LOOP
        -- Múltiple
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Múltiple de Escape (Araña) para ' || v_item,
            'Múltiple de escape metálico resistente a choques térmicos extremos. No se deforma ni se agrieta fácilmente bajo alta carga.',
            280000 + (random() * 450000)::int, 'Bloque y Exosto', v_cat_id, 'Bloque y Exosto',
            8, TRUE
        );
        -- Silenciador
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Silenciador Trasero Recubierto para ' || v_item,
            'Exosto de alta calidad con sistema de cámaras para reducción de ruido efectivo. Recubrimiento aluminizado para evitar la corrosión prematura.',
            185000 + (random() * 250000)::int, 'Bloque y Exosto', v_cat_id, 'Bloque y Exosto',
            12, TRUE
        );
    END LOOP;

    -- PUNTERAS DE LUJO Y ACCESORIOS TUNING
    FOR v_item IN SELECT unnest(ARRAY['Puntera Doble Inox Magnaflow', 'Puntera Quemada Titanio Look 3"', 'Puntera Escualizable Ovalada', 'Flex acople Exhaust 2" x 6"', 'Flex acople Exhaust 2.5" x 8"', 'Resonador (Bombitón) Deportivo 2.5"', 'Abrazadera de Escape Alta Presión 2.5"', 'Soporte Goma (Caucho) Universal Exosto']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, benefits
        ) VALUES (
            'Accesorio Exosto Pro: ' || v_item,
            'Mejora la estética y el sonido de tu vehículo con accesorios de alta calidad resistentes a la corrosión.',
            35000 + (random() * 195000)::int, 'Bloque y Exosto', v_cat_id, 'Bloque y Exosto',
            50, TRUE,
            ARRAY['Sonido Deportivo', 'Acero Inoxidable T304']
        );
    END LOOP;

    -- COMPONENTES TÉCNICOS (SENSORES Y EMPAQUES)
    FOR v_item IN SELECT unnest(ARRAY['Sensor de Oxígeno (Lambda) Renault Logan', 'Sensor de Oxígeno Chevrolet Aveo/Spark', 'Sensor de Oxígeno Universal 4 Cables', 'Sensor Oxígeno Toyota Prado V6', 'Empaque Múltiple Escape Lámina Renault K4M', 'Empaque Múltiple Escape Chevrolet Aveo', 'Pernos de Múltiple de Escape (Kit x8)', 'Sello de Carbón para Unión de Escape']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, specifications
        ) VALUES (
            'Repuesto Técnico Escape: ' || v_item,
            'Pieza fundamental para garantizar que el sistema de escape opere sin fugas y envíe la información correcta a la ECU del motor.',
            18000 + (random() * 320000)::int, 'Bloque y Exosto', v_cat_id, 'Bloque y Exosto',
            60, TRUE,
                format('[{"label": "Tipo", "value": "Repuesto Técnico"}]')::jsonb
        );
    END LOOP;

END $$;
