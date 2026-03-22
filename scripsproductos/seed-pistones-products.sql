-- ================================================================
-- SEED DE PRODUCTOS: PISTONES Y BIELAS (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_size TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Pistones y Bielas
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'pistones-bielas';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Pistones y Bielas', 'pistones-bielas', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PISTONES POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- PISTONES PARA LÍNEA RENAULT (LOGAN/SANDERO/DUSTER)
    FOR v_brand IN SELECT unnest(ARRAY['Mahle Original', 'Kolbenschmidt', 'Top Engine', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan 1.4 K7J', 'Renault Logan/Sandero 1.6 8V K7M', 'Renault Sandero/Clio 1.6 16V K4M', 'Renault Duster/Oroch 2.0 F4R', 'Renault Twingo 1.2 16V D4F']) LOOP
            FOR v_size IN SELECT unnest(ARRAY['STD', '0.50', '0.25', '0.75']) LOOP
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published, specifications, benefits
                ) VALUES (
                    'Juego de Pistones ' || v_brand || ' para ' || v_car_model || ' (' || v_size || ')',
                    'Kit de pistones de motor fabricado con aleaciones de aluminio de baja expansión térmica. Recubrimiento especial en las faldas para reducir la fricción inicial. Incluye pasadores.',
                    185000 + (random() * 350000)::int, 'Pistones y Bielas', v_cat_id, 'Pistones y Bielas',
                    10, TRUE,
                    format('[{"label": "Material", "value": "Aleación de Aluminio"}, {"label": "Medida", "value": "%s"}]', v_size)::jsonb,
                    ARRAY['Reducción de Ruido Motor', 'Resistencia Térmica Superior', 'Ajuste Milimétrico']
                );
            END LOOP;
        END LOOP;
    END LOOP;

    -- PISTONES PARA LÍNEA CHEVROLET (AVEO/SPARK/SAIL)
    FOR v_brand IN SELECT unnest(ARRAY['Federal Mogul', 'Sealed Power', 'Mahle', 'KMC Korea']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Chevrolet Aveo 1.4/1.6', 'Chevrolet Spark 1.0/1.2 Life/GT', 'Chevrolet Sail 1.4', 'Chevrolet Onix 1.4', 'Chevrolet Luv Dmax 2.4 Gasolina', 'Chevrolet Optra 1.4/1.8']) LOOP
            FOR v_size IN SELECT unnest(ARRAY['STD', '0.50', '0.30']) LOOP
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published, specifications
                ) VALUES (
                    'Set Pistones Motor ' || v_brand || ' Chevrolet ' || v_car_model || ' ' || v_size,
                    'Componentes de motor de alta precisión diseñados para restaurar la compresión original del motor Chevrolet. Durabilidad garantizada por miles de kilómetros.',
                    165000 + (random() * 280000)::int, 'Pistones y Bielas', v_cat_id, 'Pistones y Bielas',
                    15, TRUE,
                    format('[{"label": "Marca", "value": "%s"}, {"label": "Origen", "value": "USA/Korea"}]', v_brand)::jsonb
                );
            END LOOP;
        END LOOP;
    END LOOP;

    -- BIELAS DE MOTOR (RENAULT/CHEVROLET/TOYOTA)
    FOR v_car_model IN SELECT unnest(ARRAY['Renault K4M/K7M', 'Renault F4R', 'Chevrolet Aveo 1.6', 'Chevrolet Spark/Sail', 'Toyota Hilux 2.5/3.0 1KD/2KD', 'Toyota Prado 3.4 5VZ', 'Mazda BT-50 2.2/2.5 Diesel']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, benefits
        ) VALUES (
            'Biela de Motor Reforzada para ' || v_car_model,
            'Biela de acero forjado de alta resistencia. Balanceada dinámicamente para asegurar una operación suave y sin vibraciones excesivas en el motor.',
            180000 + (random() * 550000)::int, 'Pistones y Bielas', v_cat_id, 'Pistones y Bielas',
            12, TRUE,
            ARRAY['Acero Forjado SAE 4340', 'Balanceo de Precisión', 'Ideal para Turbo']
        );
    END LOOP;

    -- PISTONES DIESEL PESADO (CUMMINS/CAT/HINO)
    FOR v_brand IN SELECT unnest(ARRAY['Mahle Heavy Duty', 'FP Diesel', 'Original Cummins']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Cummins ISX/ISM', 'Caterpillar 3116/3126', 'International DT466', 'Paccar PX-7', 'Hino 300/500 J08E']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Pistón Diesel Heavy Duty ' || v_brand || ' para ' || v_car_model,
                'Pistón con inserto de Ni-Resist y canal de enfriamiento interno. Diseñado para soportar las altísimas presiones de combustión de los motores diesel modernos de inyección directa.',
                250000 + (random() * 1200000)::int, 'Pistones y Bielas', v_cat_id, 'Pistones y Bielas',
                8, TRUE,
                format('[{"label": "Tipo", "value": "Diesel Pesado"}, {"label": "Material", "value": "Hierro Fundido/Aluminio con Inserto"}]')::jsonb,
                ARRAY['Máxima Durabilidad', 'Enfriamiento por Galería', 'Baja Dilatación']
            );
        END LOOP;
    END LOOP;

    -- ACCESORIOS (PASADORES, BUJES Y SEGUROS)
    FOR v_item IN SELECT unnest(ARRAY['Buje de Biela Bronce Grafitado para Camión', 'Par Seguadores de Pasador de Pistón', 'Pasador de Pistón Cementado para Automóvil', 'Buje de Biela para Renault K4M x4', 'Buje de Biela Chevrolet Aveo x4', 'Medidor de Holgura Plastigage (Verde)']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, benefits
        ) VALUES (
            'Repuesto Detalle: ' || v_item,
            'Accesorios críticos para el armado preciso del conjunto móvil del motor. Evita ruidos y desgastes prematuros.',
            15000 + (random() * 145000)::int, 'Pistones y Bielas', v_cat_id, 'Pistones y Bielas',
            80, TRUE,
            ARRAY['Ajuste de Presión', 'Resistente a Fricción']
        );
    END LOOP;

END $$;
