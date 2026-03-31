-- ================================================================
-- SEED DE PRODUCTOS: SOPORTES CAJA Y MOTOR (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_type TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Soportes caja y motor
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'soportes-caja-motor';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Soportes caja y motor', 'soportes-caja-motor', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- SOPORTES DE MOTOR (DERECHO, IZQUIERDO, TRASERO)
    FOR v_brand IN SELECT unnest(ARRAY['Anchor USA', 'DEA Industries', 'Westar', 'Sampel Brazil', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Spark/Sail', 'Mazda 3 Skyactiv', 'Toyota Hilux 2.5/2.7 Diesel/Gas', 'Kia Picanto Ion/Morning', 'Hyundai i25', 'Nissan March/Versa', 'Ford Fiesta Titanium']) LOOP
            -- Soporte Derecho (Motor)
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Soporte de Motor Derecho (Lado Distribución) ' || v_brand || ' para ' || v_car_model,
                'Soporte de motor fabricado en caucho de alta densidad y acero estructural. Absorbente de vibraciones diseñado para mitigar el ruido y mantener el motor alineado correctamente bajo carga.',
                145000 + (random() * 250000)::int, 'Soportes caja y motor', v_cat_id, 'Soportes caja y motor',
                15, TRUE,
                format('[{"label": "Tipo", "value": "Motor Derecho"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Máxima Absorción', 'Fácil Instalación', 'Calidad OEM']
            );
            -- Soporte Trasero (Huesito/Limitador)
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Soporte de Motor Trasero (Torque) ' || v_brand || ' ' || v_car_model,
                'Refuerzo de torque indispensable para evitar ruidos al arrancar o frenar. Controla el movimiento oscilatorio del motor.',
                85000 + (random() * 120000)::int, 'Soportes caja y motor', v_cat_id, 'Soportes caja y motor',
                20, TRUE,
                format('[{"label": "Uso", "value": "Limitador de Esfuerzo"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- SOPORTES DE CAJA (TRANSMISIÓN)
    FOR v_brand IN SELECT unnest(ARRAY['Anchor', 'Westar Pro', 'Original']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Caja Renault Logan/Sandero', 'Caja Chevrolet Aveo/Optra', 'Caja Mazda 3 Skyactiv', 'Caja Toyota Hilux 4x4', 'Caja Nissan Frontier Diesel', 'Caja Kia Rio Spice', 'Caja VW Jetta/Gol']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Soporte de Caja de Cambios (Transmisión) ' || v_brand || ' para ' || v_car_model,
                'Soporte especializado para el tren motriz. Asegura la caja y absorbe las vibraciones de la transmisión. Diseñado para soportar químicos como aceite y grasas.',
                95000 + (random() * 185000)::int, 'Soportes caja y motor', v_cat_id, 'Soportes caja y motor',
                12, TRUE,
                format('[{"label": "Uso", "value": "Soporte de Caja"}]')::jsonb,
                ARRAY['Larga Duración', 'Resistente a Corrosión']
            );
        END LOOP;
    END LOOP;

    -- SOPORTES HIDRÁULICOS Y ESPECIALIZADOS
    FOR v_brand IN SELECT unnest(ARRAY['Original', 'Premium Hidráulico']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Mazda 3 All New (Superior)', 'Chevrolet Captiva 2.4/3.0', 'Renault Duster 2.0 (Hidráulico)', 'Ford Escape EcoBoost']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, benefits
            ) VALUES (
                'Soporte de Motor Hidráulico Premium para ' || v_car_model,
                'Soporte técnicamente avanzado lleno de fluido hidráulico para una absorción de vibraciones superior a los soportes de caucho convencionales. Confort total en el habitáculo.',
                285000 + (random() * 450000)::int, 'Soportes caja y motor', v_cat_id, 'Soportes caja y motor',
                8, TRUE,
                ARRAY['Absorción Activa', 'Tecnología Hidráulica', 'Máximo Silencio']
            );
        END LOOP;
    END LOOP;

    -- SOPORTES DE CARDÁN Y OTROS
    FOR v_item IN SELECT unnest(ARRAY['Centro de Cardán (Soporte) Toyota Hilux 2.5/3.0', 'Soporte Cardán Isuzu NPR/NHR', 'Kit Soportes Radiador Renault Logan', 'Buje Soporte Motor Superior Chevrolet Swift', 'Soporte Amortiguador de Vibración Mazda BT-50']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Soporte Especializado: ' || v_item,
            'Componente crítico para la sujeción firme del tren motor y transmisión.',
            65000 + (random() * 250000)::int, 'Soportes caja y motor', v_cat_id, 'Soportes caja y motor',
            25, TRUE
        );
    END LOOP;

END $$;
