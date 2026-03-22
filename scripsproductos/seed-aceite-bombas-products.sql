-- ================================================================
-- SEED DE PRODUCTOS: BOMBA ACEITE (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Bomba aceite
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'bomba-aceite';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Bomba aceite', 'bomba-aceite', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- BOMBAS DE ACEITE COMPLETAS (MELLING, SCHADEK, TOP ENGINE)
    FOR v_brand IN SELECT unnest(ARRAY['Melling Pro', 'Schadek Brazil', 'NPR Japan', 'Top Engine', 'Fallone', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M/K7M', 'Renault Duster 2.0 F4R', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Spark 1.0/GT 1.2', 'Chevrolet Sail 1.4', 'Mazda 3 Skyactiv 2.0', 'Toyota Hilux 2.5/2.7/3.0 Diesel', 'Kia Picanto Ion/Morning', 'Hyundai Accent i25', 'Nissan Frontier YD25', 'Ford Fiesta Titanium']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Bomba de Aceite de Alta Presión ' || v_brand || ' para ' || v_car_model,
                'Bomba de aceite de precisión diseñada para mantener una presión hidrodinámica estable en todas las revoluciones del motor. Fabricada en aleación de aluminio y acero de alta dureza para evitar fugas de presión interna.',
                245000 + (random() * 450000)::int, 'Bomba aceite', v_cat_id, 'Bomba aceite',
                15, TRUE,
                format('[{"label": "Tipo", "value": "Flujo Constante"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Presión de Aceite Estable', 'Reduce Desgaste Motor', 'Garantía 1 Año']
            );
        END LOOP;
    END LOOP;

    -- BOMBAS DE ACEITE ESPECIALIZADAS (LÍNEA DIESEL Y PESADA)
    FOR v_brand IN SELECT unnest(ARRAY['Melling Heavy Duty', 'Original Heavy', 'SGP Pro']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Isuzu NPR/NHR 4JB1/4HG1', 'Hino 300 / 500 Diesel', 'Toyota Land Cruiser Diesel 1HZ/1HD', 'International DT466', 'Cummins ISX/ISM Cummins', 'Caterpillar 3116/3126']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Bomba de Aceite Reforzada ' || v_brand || ' para ' || v_car_model,
                'Bomba de lubricación de alto volumen para motores de carga. Sistema de piñones helicoidales reforzados para soportar el trabajo pesado y la fricción constante.',
                485000 + (random() * 1250000)::int, 'Bomba aceite', v_cat_id, 'Bomba aceite',
                8, TRUE,
                format('[{"label": "Uso", "value": "Diesel Pesado"}, {"label": "Volumen", "value": "Alto Flujo"}]')::jsonb,
                ARRAY['Ideal para Carga', 'Resistente a Altas Temps', 'Operación de Larga Vida']
            );
        END LOOP;
    END LOOP;

    -- COMPONENTES: COLADERAS, VÁLVULAS Y SELLOS
    FOR v_item IN SELECT unnest(ARRAY['Coladera (Cedazo) de Bomba Aceite Renault Logan', 'Coladera (Cedazo) Chevrolet Aveo/Optra', 'Válvula Reguladora de Presión Aceite Cummins', 'Juego de Piñones de Bomba Aceite Toyota Hilux', 'Empaque de Bomba de Aceite (Junta) Renault', 'Sensor de Presión de Aceite (Pera) Chevrolet Aveo', 'Tubo de Succión de Aceite Hyundai Accent']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Repuesto/Accesorio Bomba Aceite: ' || v_item,
            'Componente esencial para el correcto funcionamiento del sistema de lubricación central del motor.',
            18000 + (random() * 145000)::int, 'Bomba aceite', v_cat_id, 'Bomba aceite',
            40, TRUE
        );
    END LOOP;

END $$;
