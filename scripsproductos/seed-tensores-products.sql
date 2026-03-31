-- ================================================================
-- SEED DE PRODUCTOS: TENSORES (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Tensores
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'tensores';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Tensores', 'tensores', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- TENSORES DE ACCESORIOS / ALTERNADOR (MUCHA ROTACIÓN)
    FOR v_brand IN SELECT unnest(ARRAY['INA (Schaeffler)', 'Litens Original', 'Gates', 'Dayco Pro', 'SKF']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Onix 1.4', 'Mazda 3 Skyactiv 2.0', 'Toyota Hilux 2.5/2.7/3.0', 'Kia Picanto Ion/Morning', 'Hyundai Accent i25', 'Nissan Frontier YD25/QR25', 'Ford Fiesta Titanium']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Tensor de Correa de Accesorios ' || v_brand || ' para ' || v_car_model,
                'Tensor automático de alta precisión diseñado para mantener la tensión óptima de la correa de accesorios (alternador, aire acondicionado, dirección). Rodamiento de alta gama para operación silenciosa.',
                125000 + (random() * 250000)::int, 'Tensores', v_cat_id, 'Tensores',
                15, TRUE,
                format('[{"label": "Tipo", "value": "Automático"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Operación Silenciosa', 'Compensación de Tensión', 'Calidad Original']
            );
        END LOOP;
    END LOOP;

    -- PATINES / POLEAS GUÍA (DISTRIBUCIÓN Y ACCESORIOS)
    FOR v_brand IN SELECT unnest(ARRAY['INA', 'SKF', 'Gates', 'Ruville', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault K4M 16V', 'Renault F4R Duster 2.0', 'Chevrolet Aveo/Optra', 'Toyota Hilux/Prado V6', 'Volkswagen Gol/Amarok', 'Nissan NP300 Diesel', 'Mazda BT-50 Diesel']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Patín / Polea Guía de Distribución ' || v_brand || ' para ' || v_car_model,
                'Rodillo o patín guía con rodamiento sellado. Superficie rectificada para evitar el desgaste prematuro de la correa. Esencial en el cambio de kit de repartición.',
                45000 + (random() * 120000)::int, 'Tensores', v_cat_id, 'Tensores',
                20, TRUE,
                format('[{"label": "Medida", "value": "STD"}, {"label": "Material", "value": "Acero/Plástico Reforzado"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- TENSORES HIDRÁULICOS (LINEA JAPONESA Y CARGA)
    FOR v_brand IN SELECT unnest(ARRAY['Aisin Japan', 'NTN Japan', 'Gates Hyd', 'Original']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Toyota Hilux 1KD/2KD Diesel', 'Toyota Prado 3.4 5VZ', 'Mazda BT-50 2.2/2.5', 'Mitsubishi L200 4D56', 'Nissan Urvan/Frontier YD25', 'Paccar ISX Cummins']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, benefits
            ) VALUES (
                'Tensor Hidráulico de Distribución ' || v_brand || ' para ' || v_car_model,
                'Actuador hidráulico de alta presión para tensión de cadena o correa. Calidad japonesa para garantizar la sincronización exacta aún en condiciones extremas de carga.',
                185000 + (random() * 450000)::int, 'Tensores', v_cat_id, 'Tensores',
                10, TRUE,
                ARRAY['Presión de Tensión Constante', 'Tecnología Japonesa', 'Garantía 1 Ahorro']
            );
        END LOOP;
    END LOOP;

    -- POLEAS DUMPER Y ACCESORIOS
    FOR v_item IN SELECT unnest(ARRAY['Polea Dumper (Cigüeñal) Renault K4M x 16V', 'Polea Dumper Chevrolet Aveo/Spark', 'Polea Dumper Toyota Hilux 2.7', 'Polea Alternador (Sola) Renault Logan', 'Polea Loca Accesorios Chevrolet N300/N200', 'Polea Tensora Metalica Cummins ISC', 'Resorte de Tensor Mecánico Renault Twingo']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Repuesto Polea/Tensor: ' || v_item,
            'Pieza indispensable para el sistema de transmisión de potencia por correas del motor.',
            35000 + (random() * 320000)::int, 'Tensores', v_cat_id, 'Tensores',
            30, TRUE
        );
    END LOOP;

END $$;
