-- ================================================================
-- SEED DE PRODUCTOS: CUERPO ACELERADOR (CORREGIDO)
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
    SELECT id INTO v_cat_id FROM public.categories WHERE slug IN ('cuerpo-acelerador', 'cuerpos-aceleracion');

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Cuerpo acelerador', 'cuerpo-acelerador', TRUE)
        RETURNING id INTO v_cat_id;
    ELSE
        -- Si ya existe, nos aseguramos que tenga el nombre exacto que pediste
        UPDATE public.categories SET name = 'Cuerpo acelerador', slug = 'cuerpo-acelerador' WHERE id = v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- CUERPOS DE ACELERACIÓN ELECTRÓNICOS (DRIVE-BY-WIRE)
    FOR v_brand IN SELECT unnest(ARRAY['Bosch Original', 'VDO Continental', 'Magneti Marelli', 'Pierburg', 'Hitachi Japan']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero 1.6 16V', 'Chevrolet Aveo Gti/Emotion', 'Mazda 3 Skyactiv 2.0', 'Kia Picanto Ion/Morning', 'Hyundai Accent i25', 'Toyota Hilux 2.7 2TR-FE', 'Nissan March/Versa', 'Ford Fiesta Titanium', 'Volkswagen Gol Trend/Jetta']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Cuerpo de Aceleración Electrónico ' || v_brand || ' para ' || v_car_model,
                'Unidad de control de aire motorizada de alta precisión. Reemplazo directo tipo equipo original para garantizar una respuesta inmediata del acelerador y un ralentí perfecto.',
                450000 + (random() * 850000)::int, 'Cuerpo acelerador', v_cat_id, 'Cuerpo acelerador',
                10, TRUE,
                format('[{"label": "Tipo", "value": "Electrónico (Drive-by-Wire)"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Respuesta Inmediata', 'Calibración Precisa', 'Garantía 1 Año']
            );
        END LOOP;
    END LOOP;

    -- CUERPOS DE ACELERACIÓN MECÁNICOS (POR CABLE)
    FOR v_brand IN SELECT unnest(ARRAY['Marelli', 'Delphi', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Twingo 8V', 'Chevrolet Spark 1.0', 'Chevrolet Luv Dmax 2.4', 'Mazda 323 / Allegro', 'Hyundai Accent Gyro', 'Nissan Sentra B13', 'Toyota Corolla 1.6 Antiguo']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Cuerpo de Aceleración Mecánico (Cable) ' || v_brand || ' ' || v_car_model,
                'Cuerpo de mariposa tradicional accionado por guaya. Incluye alojamiento para sensor TPS y válvula IAC. Fabricación en aluminio de alta durabilidad.',
                250000 + (random() * 450000)::int, 'Cuerpo acelerador', v_cat_id, 'Cuerpo acelerador',
                15, TRUE,
                format('[{"label": "Accionamiento", "value": "Mecánico por Guaya"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- SENSORES TPS Y VÁLVULAS IAC
    FOR v_brand IN SELECT unnest(ARRAY['Bosch', 'Delphi', 'Denso', 'Marelli', 'Hella']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero/Clio', 'Chevrolet Aveo/Spark/Sail', 'Mazda 3/BT50', 'Toyota Prado/Hilux', 'Hyundai/Kia Varios', 'Nissan Frontier/Sentra']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, benefits
            ) VALUES (
                'Sensor TPS ' || v_brand || ' para ' || v_car_model,
                'Sensor de alta precisión. Informa la posición exacta de la mariposa a la ECU.',
                65000 + (random() * 120000)::int, 'Cuerpo acelerador', v_cat_id, 'Cuerpo acelerador',
                50, TRUE,
                ARRAY['Lectura Lineal', 'Contactos de Oro/Plata']
            );
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, benefits
            ) VALUES (
                'Válvula IAC ' || v_brand || ' ' || v_car_model,
                'Actuador de ralentí. Estabiliza las revoluciones en bajas velocidades.',
                55000 + (random() * 150000)::int, 'Cuerpo acelerador', v_cat_id, 'Cuerpo acelerador',
                45, TRUE,
                ARRAY['Evita Apagones', 'Calidad Profesional']
            );
        END LOOP;
    END LOOP;

    -- LIMPIADORES
    FOR v_brand IN SELECT unnest(ARRAY['Liqui Moly', 'STP', 'CRC', 'Würth']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, specifications
        ) VALUES (
            'Limpiador de Cuerpo Acelerador ' || v_brand,
            'Spray limpiador de alta potencia para remover barniz y carbón.',
            28000 + (random() * 45000)::int, 'Cuerpo acelerador', v_cat_id, 'Cuerpo acelerador',
            100, TRUE,
            format('[{"label": "Uso", "value": "Aerosol 400ml"}]')::jsonb
        );
    END LOOP;

    -- ACCESORIOS
    FOR v_item IN SELECT unnest(ARRAY['Empaque Cuerpo Aceleración Renault K4M', 'Empaque Cuerpo Aceleración Chevrolet Aveo', 'Sello O-Ring Mariposa Universal', 'Conector Eléctrico Cuerpo Aceleración 6 Pines', 'Manguera de Vacío Reforzada']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Accesorio Aceleración: ' || v_item,
            'Repuesto indispensable para el correcto montaje del sistema de admisión.',
            12000 + (random() * 85000)::int, 'Cuerpo acelerador', v_cat_id, 'Cuerpo acelerador',
            60, TRUE
        );
    END LOOP;

END $$;
