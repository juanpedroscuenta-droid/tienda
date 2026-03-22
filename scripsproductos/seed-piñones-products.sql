-- ================================================================
-- SEED DE PRODUCTOS: PIÑONES (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Piñones
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'piñones';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Piñones', 'piñones', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- PRODUCTOS CON IMAGEN GENERADA (MARCADOS)
    
    -- #1 Original Brand - Renault Logan/Sandero K4M/K7M - Cigüeñal
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, benefits, image
    ) VALUES (
        'Piñón de Cigüeñal Distribución Original Brand para Renault Logan/Sandero K4M/K7M',
        'Piñón de arrastre para la correa o cadena de distribución. Fabricado en acero de alta resistencia con dientes endurecidos por inducción para evitar el desgaste prematuro del sincronismo.',
        45000 + (random() * 125000)::int, 'Piñones', v_cat_id, 'Piñones',
        20, TRUE,
        '[{"label": "Material", "value": "Acero Endurecido"}]'::jsonb,
        ARRAY['Tratamiento por Inducción', 'Ajuste Perfecto'],
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_ciguenal_renault_logan_original.png'
    ); -- IMAGE_READY

    -- #2 Original Brand - Renault Logan/Sandero K4M/K7M - Levas
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, image
    ) VALUES (
        'Piñón de Eje de Levas Original Brand para Renault Logan/Sandero K4M/K7M',
        'Engranaje de sincronía superior. Mantiene el tiempo de apertura de válvulas alineado con el cigüeñal. Calidad pro para evitar saltos de tiempo.',
        65000 + (random() * 185000)::int, 'Piñones', v_cat_id, 'Piñones',
        15, TRUE,
        '[{"label": "Tipo", "value": "Distribución Superior"}]'::jsonb,
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_levas_renault_logan_original.png'
    ); -- IMAGE_READY

    -- #3 Original Brand - Chevrolet Aveo 1.4/1.6 - Cigüeñal
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, benefits, image
    ) VALUES (
        'Piñón de Cigüeñal Distribución Original Brand para Chevrolet Aveo 1.4/1.6',
        'Piñón de arrastre para la correa o cadena de distribución. Fabricado en acero de alta resistencia con dientes endurecidos por inducción para evitar el desgaste prematuro del sincronismo.',
        45000 + (random() * 125000)::int, 'Piñones', v_cat_id, 'Piñones',
        20, TRUE,
        '[{"label": "Material", "value": "Acero Endurecido"}]'::jsonb,
        ARRAY['Tratamiento por Inducción', 'Ajuste Perfecto'],
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_ciguenal_aveo_original.png'
    ); -- IMAGE_READY

    -- #4 Original Brand - Chevrolet Aveo 1.4/1.6 - Levas
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, image
    ) VALUES (
        'Piñón de Eje de Levas Original Brand para Chevrolet Aveo 1.4/1.6',
        'Engranaje de sincronía superior. Mantiene el tiempo de apertura de válvulas alineado con el cigüeñal. Calidad pro para evitar saltos de tiempo.',
        65000 + (random() * 185000)::int, 'Piñones', v_cat_id, 'Piñones',
        15, TRUE,
        '[{"label": "Tipo", "value": "Distribución Superior"}]'::jsonb,
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_levas_aveo_original.png'
    ); -- IMAGE_READY

    -- #5 Original Brand - Chevrolet Spark/Sail - Cigüeñal
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, benefits, image
    ) VALUES (
        'Piñón de Cigüeñal Distribución Original Brand para Chevrolet Spark/Sail',
        'Piñón de arrastre para la correa o cadena de distribución. Fabricado en acero de alta resistencia con dientes endurecidos por inducción para evitar el desgaste prematuro del sincronismo.',
        45000 + (random() * 125000)::int, 'Piñones', v_cat_id, 'Piñones',
        20, TRUE,
        '[{"label": "Material", "value": "Acero Endurecido"}]'::jsonb,
        ARRAY['Tratamiento por Inducción', 'Ajuste Perfecto'],
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_ciguenal_spark_original.png'
    ); -- IMAGE_READY

    -- #6 Original Brand - Kia Picanto Ion/Morning - Cigüeñal
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, benefits, image
    ) VALUES (
        'Piñón de Cigüeñal Distribución Original Brand para Kia Picanto Ion/Morning',
        'Piñón de arrastre para la correa o cadena de distribución. Fabricado en acero de alta resistencia con dientes endurecidos por inducción para evitar el desgaste prematuro del sincronismo.',
        45000 + (random() * 125000)::int, 'Piñones', v_cat_id, 'Piñones',
        20, TRUE,
        '[{"label": "Material", "value": "Acero Endurecido"}]'::jsonb,
        ARRAY['Tratamiento por Inducción', 'Ajuste Perfecto'],
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_ciguenal_picanto_original.png'
    ); -- IMAGE_READY

    -- #7 Original Brand - Kia Picanto Ion/Morning - Levas
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, image
    ) VALUES (
        'Piñón de Eje de Levas Original Brand para Kia Picanto Ion/Morning',
        'Engranaje de sincronía superior. Mantiene el tiempo de apertura de válvulas alineado con el cigüeñal. Calidad pro para evitar saltos de tiempo.',
        65000 + (random() * 185000)::int, 'Piñones', v_cat_id, 'Piñones',
        15, TRUE,
        '[{"label": "Tipo", "value": "Distribución Superior"}]'::jsonb,
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_levas_picanto_original.png'
    ); -- IMAGE_READY

    -- #8 Original Brand - Volkswagen Amarok BiTDI - Cigüeñal
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, benefits, image
    ) VALUES (
        'Piñón de Cigüeñal Distribución Original Brand para Volkswagen Amarok BiTDI',
        'Piñón de arrastre para la correa o cadena de distribución. Fabricado en acero de alta resistencia con dientes endurecidos por inducción para evitar el desgaste prematuro del sincronismo.',
        45000 + (random() * 125000)::int, 'Piñones', v_cat_id, 'Piñones',
        20, TRUE,
        '[{"label": "Material", "value": "Acero Endurecido"}]'::jsonb,
        ARRAY['Tratamiento por Inducción', 'Ajuste Perfecto'],
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_ciguenal_amarok_original.png'
    ); -- IMAGE_READY

    -- #9 Original Brand - Volkswagen Amarok BiTDI - Levas
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, image
    ) VALUES (
        'Piñón de Eje de Levas Original Brand para Volkswagen Amarok BiTDI',
        'Engranaje de sincronía superior. Mantiene el tiempo de apertura de válvulas alineado con el cigüeñal. Calidad pro para evitar saltos de tiempo.',
        65000 + (random() * 185000)::int, 'Piñones', v_cat_id, 'Piñones',
        15, TRUE,
        '[{"label": "Tipo", "value": "Distribución Superior"}]'::jsonb,
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_levas_amarok_original.png'
    ); -- IMAGE_READY

    -- #10 Top Engine Japan - Renault Logan/Sandero K4M/K7M - Cigüeñal
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, benefits, image
    ) VALUES (
        'Piñón de Cigüeñal Distribución Top Engine Japan para Renault Logan/Sandero K4M/K7M',
        'Piñón de arrastre para la correa o cadena de distribución. Fabricado en acero de alta resistencia con dientes endurecidos por inducción para evitar el desgaste prematuro del sincronismo.',
        45000 + (random() * 125000)::int, 'Piñones', v_cat_id, 'Piñones',
        20, TRUE,
        '[{"label": "Material", "value": "Acero Endurecido"}]'::jsonb,
        ARRAY['Tratamiento por Inducción', 'Ajuste Perfecto'],
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_ciguenal_logan_top_engine.png'
    ); -- IMAGE_READY

    -- #11 Top Engine Japan - Renault Logan/Sandero K4M/K7M - Levas
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, image
    ) VALUES (
        'Piñón de Eje de Levas Top Engine Japan para Renault Logan/Sandero K4M/K7M',
        'Engranaje de sincronía superior. Mantiene el tiempo de apertura de válvulas alineado con el cigüeñal. Calidad pro para evitar saltos de tiempo.',
        65000 + (random() * 185000)::int, 'Piñones', v_cat_id, 'Piñones',
        15, TRUE,
        '[{"label": "Tipo", "value": "Distribución Superior"}]'::jsonb,
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_levas_logan_top_engine.png'
    ); -- IMAGE_READY

    -- #12 Top Engine Japan - Chevrolet Aveo 1.4/1.6 - Cigüeñal
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, benefits, image
    ) VALUES (
        'Piñón de Cigüeñal Distribución Top Engine Japan para Chevrolet Aveo 1.4/1.6',
        'Piñón de arrastre para la correa o cadena de distribución. Fabricado en acero de alta resistencia con dientes endurecidos por inducción para evitar el desgaste prematuro del sincronismo.',
        45000 + (random() * 125000)::int, 'Piñones', v_cat_id, 'Piñones',
        20, TRUE,
        '[{"label": "Material", "value": "Acero Endurecido"}]'::jsonb,
        ARRAY['Tratamiento por Inducción', 'Ajuste Perfecto'],
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_ciguenal_aveo_top_engine.png'
    ); -- IMAGE_READY

    -- #13 Top Engine Japan - Chevrolet Aveo 1.4/1.6 - Levas
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, image
    ) VALUES (
        'Piñón de Eje de Levas Top Engine Japan para Chevrolet Aveo 1.4/1.6',
        'Engranaje de sincronía superior. Mantiene el tiempo de apertura de válvulas alineado con el cigüeñal. Calidad pro para evitar saltos de tiempo.',
        65000 + (random() * 185000)::int, 'Piñones', v_cat_id, 'Piñones',
        15, TRUE,
        '[{"label": "Tipo", "value": "Distribución Superior"}]'::jsonb,
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_levas_aveo_top_engine.png'
    ); -- IMAGE_READY

    -- #14 Top Engine Japan - Chevrolet Spark/Sail - Cigüeñal
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, benefits, image
    ) VALUES (
        'Piñón de Cigüeñal Distribución Top Engine Japan para Chevrolet Spark/Sail',
        'Piñón de arrastre para la correa o cadena de distribución. Fabricado en acero de alta resistencia con dientes endurecidos por inducción para evitar el desgaste prematuro del sincronismo.',
        45000 + (random() * 125000)::int, 'Piñones', v_cat_id, 'Piñones',
        20, TRUE,
        '[{"label": "Material", "value": "Acero Endurecido"}]'::jsonb,
        ARRAY['Tratamiento por Inducción', 'Ajuste Perfecto'],
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_ciguenal_spark_top_engine.png'
    ); -- IMAGE_READY

    -- #15 Top Engine Japan - Chevrolet Spark/Sail - Levas
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, 
        stock, is_published, specifications, image
    ) VALUES (
        'Piñón de Eje de Levas Top Engine Japan para Chevrolet Spark/Sail',
        'Engranaje de sincronía superior. Mantiene el tiempo de apertura de válvulas alineado con el cigüeñal. Calidad pro para evitar saltos de tiempo.',
        65000 + (random() * 185000)::int, 'Piñones', v_cat_id, 'Piñones',
        15, TRUE,
        '[{"label": "Tipo", "value": "Distribución Superior"}]'::jsonb,
        'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/pinones/pinon_levas_spark_top_engine.png'
    ); -- IMAGE_READY

    -- RESTO DE PRODUCTOS (PENDIENTES DE IMAGEN - EN BUCLE)
    FOR v_brand IN SELECT unnest(ARRAY['Original Brand', 'Top Engine Japan', 'OSK', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Spark/Sail', 'Mazda 3 Skyactiv 2.0', 'Toyota Hilux 2.5/2.7 Diesel', 'Nissan Frontier YD25/QR25', 'Hyundai Accent i25', 'Kia Picanto Ion/Morning', 'Volkswagen Amarok BiTDI']) LOOP
            -- Saltar los que ya fueron unrolled manualmente
            IF (v_brand = 'Original Brand' AND v_car_model IN ('Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Spark/Sail', 'Kia Picanto Ion/Morning', 'Volkswagen Amarok BiTDI')) OR 
               (v_brand = 'Top Engine Japan' AND v_car_model IN ('Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Spark/Sail')) THEN
                -- No hacer nada para los ya procesados arriba
                CONTINUE;
            END IF;


            -- Piñón Cigüeñal (PENDIENTE)
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Piñón de Cigüeñal Distribución ' || v_brand || ' para ' || v_car_model,
                'Piñón de arrastre para la correa o cadena de distribución. Fabricado en acero de alta resistencia con dientes endurecidos por inducción para evitar el desgaste prematuro del sincronismo.',
                45000 + (random() * 125000)::int, 'Piñones', v_cat_id, 'Piñones',
                20, TRUE,
                format('[{"label": "Material", "value": "Acero Endurecido"}]')::jsonb,
                ARRAY['Tratamiento por Inducción', 'Ajuste Perfecto']
            ); -- IMAGE_PENDING
            
            -- Piñón Levas (PENDIENTE)
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Piñón de Eje de Levas ' || v_brand || ' para ' || v_car_model,
                'Engranaje de sincronía superior. Mantiene el tiempo de apertura de válvulas alineado con el cigüeñal. Calidad pro para evitar saltos de tiempo.',
                65000 + (random() * 185000)::int, 'Piñones', v_cat_id, 'Piñones',
                15, TRUE,
                format('[{"label": "Tipo", "value": "Distribución Superior"}]')::jsonb
            ); -- IMAGE_PENDING
        END LOOP;
    END LOOP;


    -- PIÑONES VVT (VARIABLE VALVE TIMING) - ALTA TECNOLOGÍA
    FOR v_brand IN SELECT unnest(ARRAY['Aisin Japan', 'Hitachi', 'Original Renault', 'Original Chevrolet']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M (VVT)', 'Chevrolet Cruze 1.8 (Actuador)', 'Toyota Hilux 2.7 VVT-i', 'Toyota Prado V6 Dual VVT-i', 'Mazda CX-5 Skyactiv (Piñón)', 'Kia Rio Spice / Cerato']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, benefits
            ) VALUES (
                'Piñón / Actuador VVT (Tiempo Variable) ' || v_brand || ' para ' || v_car_model,
                'Engranaje inteligente que ajusta el tiempo de las válvulas hidráulicamente para mejorar el ahorro de combustible y la potencia. Reemplazo indispensable cuando hay ruidos al arrancar.',
                285000 + (random() * 850000)::int, 'Piñones', v_cat_id, 'Piñones',
                8, TRUE,
                ARRAY['Ahorro Combustible Pro', 'Elimina Ruidos en Frío', 'Respuesta Dinámica']
            );
        END LOOP;
    END LOOP;

    -- PIÑONES DE BOMBA Y OTROS
    FOR v_item IN SELECT unnest(ARRAY['Piñón de Bomba de Aceite Renault K4M', 'Piñón Lococ de Distribución Nissan Frontier YD25', 'Piñón de Mando Bomba Inyectora Hilux 1KD/2KD', 'Piñón de Distribuidor Chevrolet Swift Gti', 'Piñón de Bomba de Agua Renault Megane (Set)', 'Chavetero (Cuña) para Piñón de Cigüeñal x5']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Piñón Especializado: ' || v_item,
            'Componente de engranaje para sistemas rotativos auxiliares del motor.',
            25000 + (random() * 245000)::int, 'Piñones', v_cat_id, 'Piñones',
            40, TRUE
        );
    END LOOP;

END $$;
