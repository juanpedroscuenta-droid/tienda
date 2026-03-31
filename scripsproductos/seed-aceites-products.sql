-- ================================================================
-- SEED DE PRODUCTOS: ACEITES (200+ PRODUCTOS - TOP VENTAS COLOMBIA)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_viscosity TEXT;
    v_type TEXT;
    v_item TEXT;
    i INTEGER;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Aceites
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'aceites';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Aceites y Lubricantes', 'aceites', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. ACEITES MOTOR GASOLINA - SINTÉTICOS (TOP CALIDAD)
    FOR v_brand IN SELECT unnest(ARRAY['Mobil 1', 'Castrol Edge', 'Shell Helix Ultra', 'Motul 8100', 'Liqui Moly MoS2', 'Terpel Pro Sintético', 'Valvoline Advanced', 'Chevron Havoline Pro-DS']) LOOP
        FOR v_viscosity IN SELECT unnest(ARRAY['0W-20', '5W-30', '5W-40']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Aceite Motor Gasolina 100% Sintético ' || v_brand || ' ' || v_viscosity,
                'Lubricante de máxima tecnología para motores modernos. Protección superior contra el desgaste, mayor ahorro de combustible y arranques en frío más rápidos.',
                165000 + (random() * 85000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
                100, TRUE,
                format('[{"label": "Tipo", "value": "100%% Sintético"}, {"label": "Viscosidad", "value": "%s"}, {"label": "Marca", "value": "%s"}]', v_viscosity, v_brand)::jsonb,
                ARRAY['Máxima limpieza del motor', 'Protección Turbo', 'Intervalos de cambio extendidos']
            );
        END LOOP;
    END LOOP;

    -- 3. ACEITES MOTOR GASOLINA - SEMI-SINTÉTICOS (MÁS VENDIDOS)
    FOR v_brand IN SELECT unnest(ARRAY['Mobil Super 2000', 'Castrol Magnatec', 'Shell Helix HX7', 'Motul 6100', 'Terpel Pro Semi-Sintético', 'Texaco Havoline Semi', 'Gulf Formula G', 'Total Quartz 7000']) LOOP
        FOR v_viscosity IN SELECT unnest(ARRAY['10W-30', '10W-40']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Aceite Motor Gasolina Semi-Sintético ' || v_brand || ' ' || v_viscosity,
                'Equilibrio perfecto entre protección y economía. Sus moléculas inteligentes se adhieren a las partes críticas del motor reduciendo el desgaste desde el arranque.',
                95000 + (random() * 45000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
                150, TRUE,
                format('[{"label": "Tipo", "value": "Semi-Sintético"}, {"label": "Viscosidad", "value": "%s"}, {"label": "Marca", "value": "%s"}]', v_viscosity, v_brand)::jsonb,
                ARRAY['Protección en ciudad', 'Excelente fluidez', 'Control de lodos']
            );
        END LOOP;
    END LOOP;

    -- 4. ACEITES MOTOR GASOLINA - MINERALES (TRADICIONAL Y ALTO KILOMETRAJE)
    FOR v_brand IN SELECT unnest(ARRAY['Mobil Super 1000', 'Castrol GTX', 'Shell Helix HX5', 'Terpel Pro Mineral', 'Texaco Havoline', 'Gulf Pride', 'Elf Evolution 500']) LOOP
        FOR v_viscosity IN SELECT unnest(ARRAY['20W-50', '15W-40']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Aceite Motor ' || v_brand || ' ' || v_viscosity || ' Mineral Alto Kilometraje',
                'Diseñado para vehículos con más de 100,000 km. Ayuda a sellar fugas internas y revitaliza sellos y empaques para reducir el consumo de aceite.',
                75000 + (random() * 30000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
                200, TRUE,
                format('[{"label": "Tipo", "value": "Mineral"}, {"label": "Viscosidad", "value": "%s"}, {"label": "Uso", "value": "Alto Kilometraje"}]', v_viscosity)::jsonb,
                ARRAY['Reduce consumo de aceite', 'Protege motores antiguos', 'Económico y confiable']
            );
        END LOOP;
    END LOOP;

    -- 5. ACEITES PARA MOTORES DIESEL (SERVICIO PESADO)
    FOR v_brand IN SELECT unnest(ARRAY['Mobil Delvac MX', 'Shell Rimula R4', 'Castrol CRB Plus', 'Terpel GTD Heavy Duty', 'Gulf Superfleet', 'Valvoline Premium Blue']) LOOP
        FOR v_viscosity IN SELECT unnest(ARRAY['15W-40', '10W-30 (Full Sint)']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Aceite Diesel ' || v_brand || ' ' || v_viscosity || ' Galón/Cuarto',
                'Lubricante de alto rendimiento para motores diesel de trabajo pesado. Control superior de hollín y estabilidad térmica excepcional para largas jornadas.',
                110000 + (random() * 190000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
                80, TRUE,
                format('[{"label": "Uso", "value": "Diesel Pesado"}, {"label": "Norma", "value": "API CK-4 / CJ-4"}]')::jsonb
            );
        END LOOP;
    END LOOP;

    -- 6. ACEITES PARA MOTOCICLETAS 4 TIEMPOS (TOP MOTOS COLOMBIA)
    FOR v_brand IN SELECT unnest(ARRAY['Motul 5100', 'Motul 7100', 'Castrol Power 1', 'Shell Advance Ultra', 'Terpel Celerity', 'Mobil Super Moto', 'Yamalube', 'Suzuki Ecstar']) LOOP
        FOR v_viscosity IN SELECT unnest(ARRAY['10W-40', '20W-50', '10W-30']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications, benefits
            ) VALUES (
                'Aceite Moto 4T ' || v_brand || ' ' || v_viscosity || ' JASO MA2',
                'Lubricante especializado para motores, embragues y cajas de cambios de motocicletas modernas. Cumple con los más altos estándares japoneses (JASO).',
                35000 + (random() * 55000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
                300, TRUE,
                format('[{"label": "Norma", "value": "JASO MA2 / API SN"}, {"label": "Tipo", "value": "Especial para Motos"}]')::jsonb,
                ARRAY['Cambios suaves', 'Protección embrague sumergido', 'Baja evaporación']
            );
        END LOOP;
    END LOOP;

    -- 7. ACEITES PARA MOTOCICLETAS 2 TIEMPOS
    FOR v_brand IN SELECT unnest(ARRAY['Motul 800', 'Castrol Go 2T', 'Shell Advance 2', 'Terpel Celerity 2T', 'Gulf Pride 2T']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Aceite Moto 2T ' || v_brand || ' Autolub/Premezcla',
            'Aceite premium para motores de 2 tiempos. Combustión limpia con baja emisión de humo y protección máxima contra el pegado de anillos.',
            22000 + (random() * 30000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
            150, TRUE
        );
    END LOOP;

    -- 8. ACEITES PARA TRANSMISIÓN Y DIFERENCIAL (VALVULINAS)
    FOR v_brand IN SELECT unnest(ARRAY['Mobilube HD', 'Shell Spirax', 'Castrol Axle', 'Terpel Valvulina', 'Motul Gear', 'Gulf Gear']) LOOP
        FOR v_type IN SELECT unnest(ARRAY['80W-90 GL-5', '85W-140 GL-5', '75W-90 Sintético']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published, specifications
            ) VALUES (
                'Valvulina Transmisión/Diferencial ' || v_brand || ' ' || v_type,
                'Lubricante de extrema presión para engranajes hipoidales y ejes traseros. Resistente a altas cargas y temperaturas de operación.',
                38000 + (random() * 45000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
                100, TRUE,
                format('[{"label": "Tipo", "value": "Engranajes"}, {"label": "Grado", "value": "%s"}]', v_type)::jsonb
            );
        END LOOP;
    END LOOP;

    -- 9. LÍQUIDOS PARA TRANSMISIÓN AUTOMÁTICA (ATF / CVT)
    FOR v_brand IN SELECT unnest(ARRAY['Mobil Multi-Vehicle ATF', 'Castrol Transmax', 'Shell Spirax S4 ATF', 'Motul Multi ATF', 'Terpel ATF DX III', 'Valvoline MaxLife Multi-Vehicle']) LOOP
        FOR v_type IN SELECT unnest(ARRAY['Dexron III / Mercon', 'Sintético Multi-Vehículo', 'CVT Automática', 'Dual Clutch (DSG)']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, 
                stock, is_published
            ) VALUES (
                'Fluido Transmisión Automática ' || v_brand || ' ' || v_type,
                'Fluido de alta calidad diseñado para proporcionar cambios suaves, excelente estabilidad a la oxidación y protección contra la fricción.',
                45000 + (random() * 95000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
                60, TRUE
            );
        END LOOP;
    END LOOP;

    -- 10. LÍQUIDOS DE FRENOS Y OTROS ESPECÍFICOS
    FOR v_item IN SELECT unnest(ARRAY['Líquido de Frenos Wagner DOT 3', 'Líquido de Frenos Bosch DOT 4', 'Líquido de Frenos Motul DOT 5.1', 'Aceite Hidráulico Dirección Terpel (Frasco)', 'Aceite para Gato Hidráulico (ISO 68)', 'Grasa de Litio Roja Multipropósito', 'Grasa Azul Alta Temperatura Rodamientos', 'Lubricante de Cadenas Motul C2/C4', 'Limpia Carburadores/Inyectores Liqui Moly', 'Aditivo Elevador de Octanaje STP']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, benefits
        ) VALUES (
            'Especialidad: ' || v_item,
            'Fluido o lubricante especializado diseñado para componentes críticos que requieren máxima seguridad y rendimiento operativo.',
            15000 + (random() * 65000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
            120, TRUE,
            ARRAY['Seguridad Garantizada', 'Protección Anti-corrosiva', 'Uso Profesional']
        );
    END LOOP;

    -- 11. COMBOS Y PRESENTACIONES POR CAJA (PARA MAYORISTAS)
    FOR v_brand IN SELECT unnest(ARRAY['Mobil', 'Castrol', 'Shell', 'Terpel']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, is_offer
        ) VALUES (
            'Caja x 12 Cuartos Aceite ' || v_brand || ' 20W-50 Mineral',
            'Precio especial para mayoristas y flotas. Caja sellada original con 12 unidades.',
            650000 + (random() * 100000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
            20, TRUE, TRUE
        );
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, is_offer
        ) VALUES (
            'Balde 5 Galones Aceite ' || v_brand || ' 15W-40 Diesel MX',
            'Presentación industrial para camiones y maquinaria pesada. Máximo ahorro por volumen.',
            520000 + (random() * 150000)::int, 'Aceites y Lubricantes', v_cat_id, 'Aceites y Lubricantes',
            15, TRUE, TRUE
        );
    END LOOP;

END $$;
