-- ================================================================
-- SEED DE PRODUCTOS: EJES MOTOR (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_type TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Ejes motor
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'ejes-motor';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Ejes motor', 'ejes-motor', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- EJES DE LEVAS (ADMISIÓN Y ESCAPE)
    FOR v_brand IN SELECT unnest(ARRAY['Mahle Original', 'Top Engine', 'Ajusa Spain', 'Melling USA', 'Original Brand']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Optra 1.4/1.8', 'Mazda 3 Skyactiv 2.0', 'Toyota Hilux 2.5/3.0 Diesel', 'Kia Picanto Ion/Morning', 'Hyundai Accent i25', 'Nissan Frontier YD25', 'Volkswagen Amarok BiTDI']) LOOP
            -- Eje de Levas Admisión
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Eje de Levas de Admisión ' || v_brand || ' para ' || v_car_model,
                'Eje de levas de precisión fabricado en acero cementado. Perfil de levas diseñado para optimizar la entrada de aire y potenciar el rendimiento del motor.',
                385000 + (random() * 850000)::int, 'Ejes motor', v_cat_id, 'Ejes motor',
                8, TRUE,
                format('[{"label": "Tipo", "value": "Admisión"}, {"label": "Material", "value": "Acero Cementado"}]')::jsonb,
                ARRAY['Máximo Llenado Cilindros', 'Resistente al Desgaste', 'Calidad Profesional']
            );
            -- Eje de Levas Escape
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Eje de Levas de Escape ' || v_brand || ' para ' || v_car_model,
                'Sincronización perfecta para la evacuación de gases. Rectificado con tolerancias milimétricas para asegurar la vida útil de los balancines y válvulas.',
                385000 + (random() * 850000)::int, 'Ejes motor', v_cat_id, 'Ejes motor',
                8, TRUE,
                format('[{"label": "Tipo", "value": "Escape"}, {"label": "Dureza", "value": "Tratamiento Térmico"}]')::jsonb,
                ARRAY['Resistencia Térmica', 'Flujo de Escape Optimizado']
            );
        END LOOP;
    END LOOP;

    -- EJOS BALANCEADORES Y OTROS
    FOR v_item IN SELECT unnest(ARRAY['Conjunto Ejes Balanceadores Toyota Hilux 2.7', 'Eje de Transmisión de Bomba Aceite VW', 'Eje de Mando de Distribuidor Chevrolet Swift', 'Piñon de Eje de Levas VVT Renault Logan', 'Retén de Eje de Levas (Par) Chevrolet', 'Buje de Eje de Levas (Set) Cummins ISX']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Repuesto Eje Motor: ' || v_item,
            'Piezas técnicas para la rotación y sincronización de los componentes internos del motor.',
            45000 + (random() * 350000)::int, 'Ejes motor', v_cat_id, 'Ejes motor',
            30, TRUE
        );
    END LOOP;

END $$;
