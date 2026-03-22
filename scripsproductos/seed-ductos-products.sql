-- ================================================================
-- SEED DE PRODUCTOS: DUCTOS (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_type TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Ductos
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'ductos';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Ductos', 'ductos', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- DUCTOS DE ADMISIÓN DE AIRE (TOP VENTAS)
    FOR v_brand IN SELECT unnest(ARRAY['Gates Pro', 'Cauplas', 'Original', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Spark/Sail', 'Mazda 3 Skyactiv', 'Toyota Hilux 2.7', 'Kia Picanto Ion', 'Hyundai i25', 'Ford Fiesta Titanium']) LOOP
            -- Ducto Filtro Aire
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Ducto Filtro de Aire a Cuerpo Aceleración ' || v_brand || ' para ' || v_car_model,
                'Manguera de admisión de aire reforzada. Fabricada en caucho EPDM resistente a la succión y el calor motor. Evita la entrada de contaminantes y mantiene el flujo de aire estable.',
                85000 + (random() * 145000)::int, 'Ductos', v_cat_id, 'Ductos',
                15, TRUE,
                format('[{"label": "Material", "value": "Caucho Reforzado"}, {"label": "Uso", "value": "Admisión"}]')::jsonb,
                ARRAY['Fácil Sincronización', 'Resistente a Vacío', 'Acople Perfecto']
            );
        END LOOP;
    END LOOP;

    -- MANGUERAS DE TURBO E INTERCOOLER (LÍNEA PESADA Y TURBODIESEL)
    FOR v_brand IN SELECT unnest(ARRAY['Continental Pro', 'Cauplas Silicona', 'Gates', 'Original']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Duster/Oroch Turbo', 'Toyota Hilux 1KD/2KD Diesel', 'Chevrolet Luv Dmax 3.0', 'Nissan Frontier YD25', 'Ford Ranger TDCi', 'Volkswagen Amarok BiTDI', 'Hino 300 / NPR Diesel']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Manguera de Turbo Intercooler Reforzada ' || v_brand || ' para ' || v_car_model,
                'Ducto de alta presión fabricado con capas de silicona y refuerzo textil. Soporta altas temperaturas de escape y presiones de turbo elevadas sin deformarse.',
                145000 + (random() * 350000)::int, 'Ductos', v_cat_id, 'Ductos',
                12, TRUE,
                format('[{"label": "Presión", "value": "Alta"}, {"label": "Material", "value": "Silicona Reforzada"}]')::jsonb,
                ARRAY['No Se Sopla', 'Interior Liso para Flujo', 'Larga Duración']
            );
        END LOOP;
    END LOOP;

    -- MANGUERAS DE RADIADOR (SUPERIOR E INFERIOR)
    FOR v_brand IN SELECT unnest(ARRAY['Gates', 'Cauplas', 'Dayco']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo', 'Mazda 3 All New', 'Toyota Hilux 2.7', 'Kia Picanto', 'Hyundai Accent']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Manguera Radiador Superior/Inferior ' || v_brand || ' ' || v_car_model || ' (Par)',
                'Kit de mangueras de enfriamiento. Diseñadas para canalizar el refrigerante con seguridad bajo presión térmica constante.',
                45000 + (random() * 95000)::int, 'Ductos', v_cat_id, 'Ductos',
                25, TRUE,
                format('[{"label": "Tipo", "value": "Enfriamiento"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- DUCTOS Y MANGUERAS ESPECIALIZADAS
    FOR v_item IN SELECT unnest(ARRAY['Ducto de Ventilación de Carter (PCV) Renault', 'Manguera de Calefacción Chevrolet Aveo (Juego)', 'Ducto Respiradero Superior Toyota Hilux', 'Manguera de Vacío para Servofreno 12mm', 'Ducto de Entrada Turbo Diesel Isuzu NPR', 'Manguera Colectora de Agua Hyundai H1', 'Kit Ductos de Admisión Deportivos Tuning (Silicona Roja)']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Ducto/Manguera Especializada: ' || v_item,
            'Repuesto indispensable para el sistema de fluidos o aire del motor.',
            25000 + (random() * 185000)::int, 'Ductos', v_cat_id, 'Ductos',
            30, TRUE
        );
    END LOOP;

END $$;
