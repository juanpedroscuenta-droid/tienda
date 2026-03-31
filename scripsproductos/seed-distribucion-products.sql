-- ================================================================
-- SEED DE PRODUCTOS: KIT DE DISTRIBUCIÓN PARA CARRO (CORREGIDO)
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
    SELECT id INTO v_cat_id FROM public.categories WHERE slug IN ('kit-distribucion-carro', 'kits-distribucion');

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Kit de distribución para carro', 'kit-distribucion-carro', TRUE)
        RETURNING id INTO v_cat_id;
    ELSE
        -- Si ya existe, nos aseguramos que tenga el nombre exacto que pediste
        UPDATE public.categories SET name = 'Kit de distribución para carro', slug = 'kit-distribucion-carro' WHERE id = v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- KITS DE CORREA DE DISTRIBUCIÓN
    FOR v_brand IN SELECT unnest(ARRAY['Gates PowerGrip', 'INA (Schaeffler)', 'Dayco Pro', 'SKF Timing', 'Continental ContiTech']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero 1.6 8V', 'Renault Logan/Sandero/Duster 1.6 16V', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Optra 1.4/1.8', 'Chevrolet Corsa 1.3/1.4', 'Kia Picanto Ion/Morning', 'Hyundai Accent i25', 'Volkswagen Gol Trend/Jetta 2.0']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Kit de Distribución Completo ' || v_brand || ' para ' || v_car_model,
                'Kit completo que incluye correa de alta resistencia reforzada con fibra de vidrio y tensores de precisión. Componentes fabricados bajo especificaciones OEM para garantizar el sincronismo perfecto del motor.',
                185000 + (random() * 450000)::int, 'Kit de distribución para carro', v_cat_id, 'Kit de distribución para carro',
                20, TRUE,
                format('[{"label": "Incluye", "value": "Correa + Tendedores"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Sincronismo Garantizado', 'Material Reforzado', 'Garantía 1 Año / 50.000km']
            );
        END LOOP;
    END LOOP;

    -- KITS DE DISTRIBUCIÓN CON BOMBA DE AGUA
    FOR v_brand IN SELECT unnest(ARRAY['Gates Premium', 'SKF Water Pump Kit', 'INA Plus']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero 16V', 'Chevrolet Aveo 1.6', 'Volkswagen Gol 1.6', 'Chevrolet Optra 1.8']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Kit Distribución ' || v_brand || ' + Bomba de Agua para ' || v_car_model,
                'Mantenimiento total del motor. Incluye kit de repartición completo y bomba de agua de equipo original para evitar fallas catastróficas por recalentamiento.',
                385000 + (random() * 650000)::int, 'Kit de distribución para carro', v_cat_id, 'Kit de distribución para carro',
                12, TRUE,
                format('[{"label": "Extras", "value": "Bomba de Agua Incluida"}]')::jsonb,
                ARRAY['Mantenimiento Integral', 'Ahorro en Mano de Obra', 'Seguridad Total']
            );
        END LOOP;
    END LOOP;

    -- KITS DE CADENA DE DISTRIBUCIÓN
    FOR v_brand IN SELECT unnest(ARRAY['Cloyes USA', 'OSK Japan', 'Tsubaki', 'AISIN Japan']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Mazda 3 Skyactiv 2.0', 'Mazda 2 Sport', 'Toyota Hilux 2.7 2TR-FE', 'Nissan Frontier QR25/YD25', 'Kia Rio Spice i30', 'Nissan Sentra B13/B15 GXE', 'Ford Ranger 2.3/2.5']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Juego Kit de Cadena de Distribución ' || v_brand || ' para ' || v_car_model,
                'Kit técnico de cadena silenciosa. Incluye cadenas, tensores hidráulicos, guias de baquelita y piñones de alta dureza. Calidad superior para evitar saltos de tiempo.',
                450000 + (random() * 1250000)::int, 'Kit de distribución para carro', v_cat_id, 'Kit de distribución para carro',
                8, TRUE,
                format('[{"label": "Transmisión", "value": "Cadena Silenciosa"}]')::jsonb,
                ARRAY['Durabilidad Extrema', 'Operación Silenciosa', 'Material Cementado']
            );
        END LOOP;
    END LOOP;

    -- CORREAS Y TENSORES INDIVIDUALES
    FOR v_item IN SELECT unnest(ARRAY['Correa de Repartición Gates Renault Twingo 16V', 'Correa de Distribución Dayco Chevrolet Aveo', 'Tensor de Distribución Original Kia i10', 'Patín Guía de Distribución Hyundai Getz', 'Tensor Hidráulico de Cadena Toyota Hilux', 'Retén de Distribución Renault Logan (Kit x3)']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Repuesto Distribución: ' || v_item,
            'Pieza individual para el mantenimiento preventivo del sistema de repartición del motor.',
            45000 + (random() * 250000)::int, 'Kit de distribución para carro', v_cat_id, 'Kit de distribución para carro',
            40, TRUE
        );
    END LOOP;

END $$;
