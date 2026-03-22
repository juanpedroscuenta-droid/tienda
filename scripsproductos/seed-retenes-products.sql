-- ================================================================
-- SEED DE PRODUCTOS: RETÉN (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_type TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Retén
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'reten';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Retén', 'reten', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- RETENES DE MOTOR (CIGÜEÑAL Y ÁRBOL DE LEVAS)
    FOR v_brand IN SELECT unnest(ARRAY['SABO', 'Corteco Brazil', 'NOK Japan', 'Victor Reinz', 'SKF']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Spark/Sail', 'Mazda 3 Skyactiv', 'Toyota Hilux 2.5/3.0 Diesel', 'Toyota Prado 3.4/4.0', 'Hyundai Accent i25', 'Kia Picanto Ion', 'Nissan Frontier YD25']) LOOP
            -- Retén Cigüeñal Trasero (Grande)
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Retén Cigüeñal Trasero ' || v_brand || ' para ' || v_car_model,
                'Retén de alta calidad diseñado para soportar altas revoluciones y presiones internas de aceite. Material Viton de alta resistencia térmica para evitar fugas entre el motor y la caja.',
                45000 + (random() * 85000)::int, 'Retén', v_cat_id, 'Retén',
                20, TRUE,
                format('[{"label": "Material", "value": "Viton (FKM)"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Resistente a Altas Temperaturas', 'Doble Labio Anti-polvo']
            );
            -- Retén Cigüeñal Delantero
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Retén Cigüeñal Delantero ' || v_brand || ' ' || v_car_model,
                'Sello de aceite para el lado de la distribución. Fabricado bajo especificaciones OEM para un ajuste perfecto y duradero.',
                18000 + (random() * 25000)::int, 'Retén', v_cat_id, 'Retén',
                30, TRUE,
                format('[{"label": "Uso", "value": "Lado Distribución"}]')::jsonb
            );
            -- Retén Árbol de Levas
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published
            ) VALUES (
                'Retén Árbol de Levas ' || v_brand || ' para ' || v_car_model,
                'Garantiza que el aceite no contamine la correa de distribución. Alta durabilidad y resistencia química.',
                12000 + (random() * 18000)::int, 'Retén', v_cat_id, 'Retén',
                40, TRUE
            );
        END LOOP;
    END LOOP;

    -- RETENES DE CAJA Y DIFERENCIAL
    FOR v_brand IN SELECT unnest(ARRAY['NSK', 'SABO', 'National', 'Original']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Caja Renault JC5/JR5', 'Caja Chevrolet Aveo/Spark', 'Diferencial Trasero Toyota Hilux', 'Diferencial Delantero Toyota Prado', 'Salida de Caja Mazda BT-50', 'Caja Nissan Frontier Diesel']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Retén de Salida de Caja/Diferencial ' || v_brand || ' ' || v_car_model,
                'Sello reforzado para transmisiones. Evita la pérdida de valvulina y protege los rodamientos internos.',
                25000 + (random() * 45000)::int, 'Retén', v_cat_id, 'Retén',
                15, TRUE,
                format('[{"label": "Tipo", "value": "Transmisión"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- SELLOS DE VÁLVULA
    FOR v_brand IN SELECT unnest(ARRAY['SABO', 'Nok', 'Victor Reinz']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault K4M/K7M (Set x8/x16)', 'Chevrolet Aveo/Spark (Set x8/x16)', 'Toyota 1KD/2KD (Set x16)', 'Mazda Skyactiv (Set x16)', 'Hyundai/Kia (Set x16)']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, benefits
            ) VALUES (
                'Juego de Sellos de Válvula ' || v_brand || ' para ' || v_car_model,
                'Evita el paso de aceite a la cámara de combustión (humo azul). Material Viton de larga vida útil.',
                35000 + (random() * 95000)::int, 'Retén', v_cat_id, 'Retén',
                50, TRUE,
                ARRAY['Elimina Humo de Escape', 'Resistencia Térmica']
            );
        END LOOP;
    END LOOP;

    -- RETENES DE RUEDA Y OTROS
    FOR v_item IN SELECT unnest(ARRAY['Retén Rueda Trasera Toyota Hilux', 'Retén Rueda Delantera Isuzu NPR', 'Retén de Mando de Embrague (Clutch)', 'Retén de Distribuidor Chevrolet Swift/323', 'Retén de Bomba de Aceite Renault', 'Retén de Eje de Selección de Cambios']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Retén Especializado: ' || v_item,
            'Componente crítico para el sellado de fluidos en sistemas dinámicos del vehículo.',
            15000 + (random() * 55000)::int, 'Retén', v_cat_id, 'Retén',
            30, TRUE
        );
    END LOOP;

END $$;
