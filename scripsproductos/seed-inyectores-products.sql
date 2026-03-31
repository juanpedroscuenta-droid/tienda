-- ================================================================
-- SEED DE PRODUCTOS: INYECTORES (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_type TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Inyectores
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'inyectores';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Inyectores', 'inyectores', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- INYECTORES GASOLINA ELÉCTRICOS (CONVENCIONALES)
    FOR v_brand IN SELECT unnest(ARRAY['Bosch Original', 'Delphi', 'Denso Japan', 'Magneti Marelli', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero 1.6', 'Chevrolet Aveo 1.4/1.6', 'Mazda 3 All New 2.0', 'Kia Picanto Ion/Morning', 'Hyundai Accent i25', 'Toyota Hilux 2.7 2TR-FE', 'Nissan March/Versa', 'Ford Fiesta Titanium', 'Volkswagen Gol Trend']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Inyector de Combustible ' || v_brand || ' para ' || v_car_model,
                'Inyector electrónico de alta precisión diseñado para optimizar el consumo de combustible y la atomización de la mezcla. Calidad garantizada para un ralentí estable y potencia máxima.',
                125000 + (random() * 250000)::int, 'Inyectores', v_cat_id, 'Inyectores',
                16, TRUE,
                format('[{"label": "Tipo", "value": "Electrónico"}, {"label": "Resistencia", "value": "12-14 Ohms"}]')::jsonb,
                ARRAY['Atomización perfecta', 'Menor consumo', 'Garantía 6 meses']
            );
        END LOOP;
    END LOOP;

    -- INYECTORES DIESEL COMMON RAIL (TDI/CRDi/D4D)
    FOR v_brand IN SELECT unnest(ARRAY['Bosch Diesel', 'Delphi Diesel', 'Denso Diesel', 'Continental']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Toyota Hilux 2.5/3.0 1KD/2KD', 'Chevrolet Luv Dmax 3.0 4JJ1', 'Nissan Frontier NP300 Diesel', 'Ford Ranger 2.5/3.2 TDCi', 'Hyundai H1/Starex CRDi', 'Volkswagen Amarok BiTDI', 'Mitsubishi L200 Tritón']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Inyector Diesel Common Rail ' || v_brand || ' para ' || v_car_model,
                'Unidad de inyección diesel de última tecnología. Ofrece inyecciones precisas de alta frecuencia para cumplir con normas ambientales y maximizar el torque. Producto codificado de fábrica.',
                850000 + (random() * 1500000)::int, 'Inyectores', v_cat_id, 'Inyectores',
                8, TRUE,
                format('[{"label": "Sistema", "value": "Common Rail"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Máximo Torque', 'Ahorro Diesel Pro', 'Codificación Original']
            );
        END LOOP;
    END LOOP;

    -- INYECTORES GDI (INYECCIÓN DIRECTA GASOLINA - MOTORES TURBO)
    FOR v_brand IN SELECT unnest(ARRAY['Bosch GDI', 'Hitachi', 'Denso GDI']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Mazda 3/6 Skyactiv', 'Volkswagen Jetta/Tiguan TSI', 'Audi A4/A6 TFSI', 'Ford Explorer EcoBoost', 'Chevrolet Tracker Turbo']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Inyector GDI / TSI de Alta Presión ' || v_brand || ' ' || v_car_model,
                'Inyectores especializados para sistemas de inyección directa que operan a presiones extremadamente altas. Mejora drásticamente la potencia y disminuye emisiones.',
                450000 + (random() * 800000)::int, 'Inyectores', v_cat_id, 'Inyectores',
                12, TRUE,
                format('[{"label": "Tipo", "value": "GDI Directo"}, {"label": "Uso", "value": "Motores Turbo/Skyactiv"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- INYECTORES MECÁNICOS Y TOBERAS (DIESEL PESADO Y TRADICIONAL)
    FOR v_brand IN SELECT unnest(ARRAY['Zexel Japan', 'Stanadyne USA', 'Lucas England']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Hino 500/700', 'Isuzu NPR/NHR Convencional', 'Mitsubishi Montero Diesel (Bomba Inyectora)', 'Toyota Land Cruiser Diesel Antiguo', 'Motor Cummins 6BT/4BT']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published
            ) VALUES (
                'Inyector Diesel Mecánico/Convencional ' || v_brand || ' ' || v_car_model,
                'Inyector robusto para sistemas diesel de bomba rotativa o lineal. Fácil mantenimiento y excelente pulverización de combustible.',
                280000 + (random() * 450000)::int, 'Inyectores', v_cat_id, 'Inyectores',
                10, TRUE
            );
            -- Insertar Tobera por separado
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published
            ) VALUES (
                'Tobera de Inyección ' || v_brand || ' para ' || v_car_model,
                'Punta de inyector mecanizada con precisión. Repuesto ideal para restaurar el patrón de pulverización sin cambiar el cuerpo completo.',
                65000 + (random() * 120000)::int, 'Inyectores', v_cat_id, 'Inyectores',
                40, TRUE
            );
        END LOOP;
    END LOOP;

    -- ACCESORIOS Y KITS DE LIMPIEZA
    FOR v_item IN SELECT unnest(ARRAY['Kit O-Rings (Anillos Goma) para Inyectores x4', 'Microfiltros de Canasta para Inyectores x10', 'Conector Eléctrico Arnes Inyector', 'Aditivo Limpia Inyectores Gasolina Pro', 'Aditivo Limpia Inyectores Diesel Liqui Moly', 'Retén de Inyector Diesel (Arandela Cobre)', 'Porta Inyector para Camión']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, benefits
        ) VALUES (
            'Accesorio Inyectores: ' || v_item,
            'Componente esencial para el mantenimiento preventivo y correctivo del sistema de inyección.',
            12000 + (random() * 85000)::int, 'Inyectores', v_cat_id, 'Inyectores',
            100, TRUE,
            ARRAY['Soporta Hidrocarburos', 'Ajuste Estanco']
        );
    END LOOP;

END $$;
