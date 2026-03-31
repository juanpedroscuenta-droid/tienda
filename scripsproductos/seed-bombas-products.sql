-- ================================================================
-- SEED DE PRODUCTOS: BOMBA COMBUSTIBLE (CORREGIDO)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_type TEXT;
    v_item TEXT;
BEGIN
    -- 1. Intentar obtener el ID con el nuevo slug o el anterior para evitar duplicados
    SELECT id INTO v_cat_id FROM public.categories WHERE slug IN ('bomba-combustible', 'bombas-combustible');

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Bomba combustible', 'bomba-combustible', TRUE)
        RETURNING id INTO v_cat_id;
    ELSE
        -- Si ya existe, nos aseguramos que tenga el nombre exacto que pediste
        UPDATE public.categories SET name = 'Bomba combustible', slug = 'bomba-combustible' WHERE id = v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- MÓDULOS COMPLETOS (TOP CALIDAD)
    FOR v_brand IN SELECT unnest(ARRAY['Bosch', 'Delphi', 'Denso', 'VDO', 'Marelli']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero 1.6', 'Chevrolet Aveo Gti/Emotion', 'Mazda 3 All New', 'Kia Picanto Ion/Morning', 'Hyundai Accent i25', 'Toyota Hilux 2.7 Gasolina', 'Nissan March/Versa', 'Ford Fiesta Titanium', 'Volkswagen Gol Trend']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Módulo Completo de Bomba Gasolina ' || v_brand || ' para ' || v_car_model,
                'Unidad de bombeo completa lista para instalar. Incluye sensor de nivel (flotador), regulador de presión y pre-filtro. Garantía de flujo constante y silencioso.',
                385000 + (random() * 450000)::int, 'Bomba combustible', v_cat_id, 'Bomba combustible',
                12, TRUE,
                format('[{"label": "Presión", "value": "3.5 - 4.2 Bar"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Fácil Instalación', 'Flujo de Combustible Optimo', 'Larga Vida Útil']
            );
        END LOOP;
    END LOOP;

    -- PILAS / REPUESTOS DE BOMBA (OPCIÓN ECONÓMICA)
    FOR v_brand IN SELECT unnest(ARRAY['Bosch Original', 'Walbro Pro', 'Airtex', 'Carter Precision', 'Marelli']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Universal 3 Bar', 'Universal 3.8 Bar', 'Tipo Renault/Peugeot', 'Tipo Chevrolet/Daewoo', 'Tipo Toyota/Honda', 'Tipo Hyundai/Kia']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Repuesto Pila Bomba de Gasolina ' || v_brand || ' ' || v_car_model,
                'Kit de repuesto para módulo original. Incluye cableado y pre-filtro de alta eficiencia. Diseñada para alto rendimiento y baja emisión de ruido térmico.',
                85000 + (random() * 95000)::int, 'Bomba combustible', v_cat_id, 'Bomba combustible',
                50, TRUE,
                format('[{"label": "Tipo", "value": "Pila/Repuesto"}, {"label": "Flujo", "value": "95 - 110 LPH"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- BOMBAS DE ALTA PRESIÓN GDI/TSI (MOTORES MODERNOS)
    FOR v_brand IN SELECT unnest(ARRAY['Bosch', 'Hitachi', 'Continental']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Mazda 3/6 Skyactiv', 'Volkswagen Jetta/Tiguan TSI', 'Audi A4/A6 TFSI', 'Ford Explorer EcoBoost', 'Chevrolet Tracker Turbo']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Bomba de Alta Presión GDI/TSI ' || v_brand || ' para ' || v_car_model,
                'Componente crítico para sistemas de inyección directa. Fabricado bajo especificaciones OE para garantizar la presión exacta requerida por el computador del motor.',
                850000 + (random() * 1200000)::int, 'Bomba combustible', v_cat_id, 'Bomba combustible',
                5, TRUE,
                format('[{"label": "Sistema", "value": "Inyección Directa"}, {"label": "Material", "value": "Acero Reforzado"}]')::jsonb,
                ARRAY['Máxima Potencia', 'Eficiencia Energética', 'Garantía 1 Año']
            );
        END LOOP;
    END LOOP;

    -- BOMBAS MECÁNICAS (LÍNEA CLÁSICA / VEHÍCULOS CARBURADOS)
    FOR v_brand IN SELECT unnest(ARRAY['Carter', 'Kyosan Japan', 'Brosol']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault 4/6/12', 'Chevrolet Chevette/Luv 1600', 'Mazda 323/626', 'Toyota Land Cruiser FJ40/FJ45', 'Mitsubishi Montero/L200', 'Ford 302/350 V8']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published
            ) VALUES (
                'Bomba de Gasolina Mecánica ' || v_brand || ' para ' || v_car_model,
                'Bomba accionada por árbol de levas para motores carburados tradicionales. Resistente a químicos y variaciones térmicas bruscas.',
                95000 + (random() * 120000)::int, 'Bomba combustible', v_cat_id, 'Bomba combustible',
                15, TRUE
            );
        END LOOP;
    END LOOP;

    -- BOMBAS DE TRANSFERENCIA DIESEL (SERVICIO PESADO)
    FOR v_brand IN SELECT unnest(ARRAY['Delphi Diesel', 'Bosch Pro', 'Carter Heavy Duty']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Chevrolet Luv Dmax 3.0', 'Toyota Hilux 2.5/3.0 D4D', 'Nissan Frontier NP300 Diesel', 'Ford Ranger 2.5 TDCi', 'Hyundai H1/Starex CRDi', 'Kenworth/Cummins Big Cam']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Bomba de Transferencia Diesel ' || v_brand || ' para ' || v_car_model,
                'Componente de alta robustez para sistemas de inyección diesel Common Rail y convencionales. Resistente al azufre y impurezas del combustible.',
                280000 + (random() * 550000)::int, 'Bomba combustible', v_cat_id, 'Bomba combustible',
                10, TRUE,
                format('[{"label": "Uso", "value": "Diesel/Turbodiesel"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- ACCESORIOS Y FILTROS DE BOMBA
    FOR v_item IN SELECT unnest(ARRAY['Pre-filtro Cedazo Universal Recto', 'Pre-filtro Cedazo Tipo Renault', 'Conector Eléctrico Bomba 4 Pines', 'Manguera Corrugada Flexible Combustible', 'Abrazaderas de Seguridad Presión (Par)', 'Sensor Nivel Flotador Aveo/Spark', 'Soporte Goma Anti-vibración Bomba']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, benefits
        ) VALUES (
            'Accesorio de Bomba: ' || v_item,
            'Componente esencial para el correcto funcionamiento del sistema de alimentación de combustible.',
            15000 + (random() * 65000)::int, 'Bomba combustible', v_cat_id, 'Bomba combustible',
            100, TRUE,
            ARRAY['Compatibilidad Garantizada', 'Calidad OEM']
        );
    END LOOP;

END $$;
