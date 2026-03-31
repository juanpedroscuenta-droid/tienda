-- ================================================================
-- SEED DE PRODUCTOS: TURBO (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Turbo
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'turbo';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Turbo', 'turbo', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- TURBOCOMPRESORES COMPLETOS (GARRETT, BORGWARNER, HOLSET)
    FOR v_brand IN SELECT unnest(ARRAY['Garrett Original', 'BorgWarner', 'Holset Original', 'MHI Mitsubishi', 'IHI Japan', 'Genérico Premium']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Toyota Hilux 2.5 2KD-FTV', 'Toyota Hilux 3.0 1KD-FTV', 'Chevrolet Luv Dmax 3.0 4JJ1', 'Nissan Frontier NP300 YD25', 'Ford Ranger 2.2/3.2 TDCi', 'Volkswagen Amarok 2.0 BiTDI', 'Renault Duster 1.3 Turbo', 'Isuzu NPR 4.6 4HG1 Turbo', 'International DT466/Maxxforce 7']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Turbocompresor Completo ' || v_brand || ' para ' || v_car_model,
                'Unidad turbocompresora de alto rendimiento. Diseñada para maximizar el torque y la potencia del motor mediante la sobrealimentación eficiente. Calidad garantizada con balanceo dinámico de fábrica.',
                1850000 + (random() * 4500000)::int, 'Turbo', v_cat_id, 'Turbo',
                5, TRUE,
                format('[{"label": "Tipo", "value": "Turbocompresor Completo"}, {"label": "Marca", "value": "%s"}]', v_brand)::jsonb,
                ARRAY['Potencia Extra', 'Eficiencia de Combustible', 'Bajo Lag']
            );
        END LOOP;
    END LOOP;

    -- CARTUCHOS (NÚCLEOS / CHRA) - MUY VENDIDOS PARA REPARACIÓN
    FOR v_brand IN SELECT unnest(ARRAY['Jrone Pro', 'Melett England', 'Garrett Núcleos', 'MHI Núcleos']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Toyota Hilux 2.5/3.0', 'Chevrolet Dmax 3.0', 'Nissan Frontier YD25', 'Ford Ranger 3.2', 'Renault Master 2.5', 'Mitsubishi L200', 'Hyundai H1 Diesel', 'Audi A3/A4 1.8T/2.0T']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Cartucho (Núcleo) de Turbo ' || v_brand || ' para ' || v_car_model,
                'Conjunto central balanceado listo para instalar. Ahorre dinero reemplazando solo el núcleo interno desgastado. Incluye reporte de balanceo a alta velocidad (VSR).',
                450000 + (random() * 950000)::int, 'Turbo', v_cat_id, 'Turbo',
                12, TRUE,
                format('[{"label": "Estado", "value": "Balanceado VSR 120k RPM"}]')::jsonb,
                ARRAY['Reparación Económica', 'Balanceo de Precisión', 'Calidad Certificada']
            );
        END LOOP;
    END LOOP;

    -- ACTUADORES Y COMPONENTES VNT (GEOMETRÍA VARIABLE)
    FOR v_brand IN SELECT unnest(ARRAY['Garrett', 'BorgWarner', 'Genérico Pro']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Toyota Hilux VNT (Electrónico)', 'Nissan Frontier YD25 (VNT)', 'Ford Ranger TDCi (VNT)', 'Audi/VW TSI (Wastegate)', 'Chevrolet Tracker Turbo']) LOOP
            -- Actuador
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, benefits
            ) VALUES (
                'Actuador de Turbo (Pulmón/Electrónico) ' || v_brand || ' ' || v_car_model,
                'Controla la presión de sobrealimentación para proteger el motor y optimizar el rendimiento. Disponible en versiones neumáticas y electrónicas.',
                280000 + (random() * 850000)::int, 'Turbo', v_cat_id, 'Turbo',
                15, TRUE,
                ARRAY['Control Preciso PSI', 'Evita Pico de Presión']
            );
        END LOOP;
    END LOOP;

    -- KITS DE EMPAQUES Y SENSORES
    FOR v_item IN SELECT unnest(ARRAY['Kit de Empaques Turbo para Toyota Hilux 1KD/2KD', 'Kit de Empaques Turbo Chevrolet Luv Dmax 3.0', 'Kit de Empaques Turbo Nissan Frontier YD25', 'Sensor de Presión Turbo (MAP) Renault Duster', 'Sensor Presión Turbo Volkswagen Tiguan TSI', 'Línea de Lubricación de Turbo (Tubo) Toyota', 'Kit de Pernos Espárragos de Turbo (Alta Resistencia)']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Accesorio Turbo: ' || v_item,
            'Piezas indispensables para el montaje seguro del turbocompresor, evitando fugas de aceite o escape.',
            35000 + (random() * 450000)::int, 'Turbo', v_cat_id, 'Turbo',
            40, TRUE
        );
    END LOOP;

END $$;
