-- ================================================================
-- SEED DE PRODUCTOS: CIGÜEÑAL (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_size TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Cigüeñal
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'cigueñal';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Cigüeñal', 'cigueñal', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- CIGÜEÑALES COMPLETOS (FORJADOS Y FUNDIDOS)
    FOR v_brand IN SELECT unnest(ARRAY['Mahle Original', 'Top Engine', 'Genérico Premium', 'KMC Korea', 'Original Brand']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Spark 1.0/GT 1.2', 'Mazda 3 Skyactiv 2.0', 'Toyota Hilux 2.5/2.7 Diesel', 'Nissan Frontier YD25/QR25', 'Hyundai Accent i25', 'Kia Picanto Ion/Morning', 'Volkswagen Amarok BiTDI']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Cigüeñal de Motor Nuevo ' || v_brand || ' para ' || v_car_model,
                'Cigüeñal fabricado en acero forjado o fundición nodular de alta tenacidad. Balanceado dinámicamente de fábrica para garantizar una operación suave, sin vibraciones y extender la vida de los casquetes.',
                850000 + (random() * 2500000)::int, 'Cigüeñal', v_cat_id, 'Cigüeñal',
                5, TRUE,
                format('[{"label": "Material", "value": "Acero Forjado SAE 4340"}, {"label": "Balanceo", "value": "Dinámico"}]')::jsonb,
                ARRAY['Operación sin Vibraciones', 'Alta Tenacidad', 'Medida Estándar (STD)']
            );
        END LOOP;
    END LOOP;

    -- ACERATORIOS Y COMPONENTES DE CIGÜEÑAL
    FOR v_item IN SELECT unnest(ARRAY['Polea Dumper Cigüeñal Renault Logan', 'Polea Dumper Chevrolet Aveo/Optra', 'Piñón Cigüeñal Distribución Toyota Hilux', 'Chaveta (Cuña) de Cigüeñal Universal', 'Retén Cigüeñal Trasero (Grande) Renault', 'Retén Cigüeñal Delantero Chevrolet Spark', 'Tornillo de Volante de Inercia (Juego)', 'Casquillo de Agujas Piloto Cigüeñal Isuzu NPR']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Repuesto Detalle Cigüeñal: ' || v_item,
            'Pieza fundamental para la transmisión de torque y correcta alineación del conjunto móvil del motor.',
            15000 + (random() * 245000)::int, 'Cigüeñal', v_cat_id, 'Cigüeñal',
            40, TRUE
        );
    END LOOP;

END $$;
