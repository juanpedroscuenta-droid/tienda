-- ================================================================
-- SEED DE PRODUCTOS: MOTOR (100 PRODUCTOS TOP COLOMBIA)
-- ================================================================

DO $$ 
DECLARE 
    v_main_cat_id UUID;
    v_sub_cat_id UUID;
    v_third_cat_id UUID;
    car TEXT;
    brand TEXT;
    pos TEXT;
    sensor TEXT;
    item TEXT;
    i INTEGER;
BEGIN
    -- 1. Obtener ID de categoría MOTOR
    SELECT id INTO v_main_cat_id FROM public.categories WHERE slug = 'motor';

    -- KIT DE DISTRIBUCIÓN (Top Ventas en Colombia)
    -- Los kits de distribución son críticos para Renault, Chevrolet y Mazda
    FOR car IN SELECT unnest(ARRAY['Renault Logan/Sandero/Duster 1.6 16v', 'Chevrolet Onix/Joy 1.4', 'Kia Picanto/Rio 1.25', 'Mazda 2 Skyactiv', 'Hyundai Accent i25', 'Toyota Hilux 2.5/3.0 D4D']) LOOP
        INSERT INTO public.products (
            name, description, price, original_price, category, category_id, category_name, 
            stock, is_published, is_offer, specifications, benefits, last_modified_by
        ) VALUES (
            'Kit de Distribución Original ' || car,
            'Kit completo que incluye correa dentada de alta resistencia y tensor original. Garantiza la sincronización perfecta y evita daños graves en el motor por rotura.',
            285000 + (random() * 200000)::int, 285000 + (random() * 200000)::int, 'Motor', v_main_cat_id, 'Motor',
            30, TRUE, FALSE,
            '[{"label": "Componentes", "value": "Correa + Tensor"}, {"label": "Vida útil", "value": "50.000 km"}, {"label": "Calidad", "value": "OEM"}]'::jsonb,
            ARRAY['Material reforzado en HNBR', 'Tensor con rodamiento NSK/SKF', 'Ajuste milimétrico'],
            'System Seeder'
        );
    END LOOP;

    -- CORREAS DE ACCESORIOS (Multi-V)
    FOR car IN SELECT unnest(ARRAY['Chevrolet Sail', 'Renault Kwid', 'Ford Fiesta Titanium', 'Nissan March', 'Volkswagen Gol']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published, specifications
        ) VALUES (
            'Correa de Accesorios (Única) Gates para ' || car,
            'Correa Micro-V de alto rendimiento para alternador, bomba de agua y aire acondicionado. Silenciosa y duradera.',
            65000 + (random() * 40000)::int, 'Motor', v_main_cat_id, 'Motor',
            60, TRUE,
            '[{"label": "Marca", "value": "Gates / Continental"}, {"label": "Uso", "value": "Accesorios (Poli-V)"}]'::jsonb
        );
    END LOOP;

    -- BUJÍAS DE IRIDIUM (AHORRO COMBUSTIBLE)
    FOR brand IN SELECT unnest(ARRAY['NGK Iridium IX', 'Denso Iridium Power', 'Bosch Double Iridium']) LOOP
        FOR car IN SELECT unnest(ARRAY['Mazda 3', 'Kia Sportage', 'Tucson']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, stock, is_published, benefits
            ) VALUES (
                'Juego x4 Bujías ' || brand || ' para ' || car,
                'Mejora el encendido y la respuesta del acelerador. El electrodo de iridio fino permite una chispa más potente con menos voltaje.',
                180000 + (random() * 50000)::int, 'Motor', v_main_cat_id, 'Motor',
                100, TRUE,
                ARRAY['Máxima durabilidad', 'Mejor rendimiento de combustible', 'Resistente a la corrosión']
            );
        END LOOP;
    END LOOP;

    -- BOBINAS DE ENCENDIDO
    FOR car IN SELECT unnest(ARRAY['Renault Logan 8v', 'Chevrolet Aveo', 'Mazda CX-5', 'Captiva 2.4', 'Picanto Ion']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published, specifications
        ) VALUES (
            'Bobina de Encendido Individual para ' || car,
            'Convierte el voltaje de la batería en la chispa necesaria para la combustión. Evita vibraciones y pérdida de fuerza en el motor.',
            145000 + (random() * 100000)::int, 'Motor', v_main_cat_id, 'Motor',
            45, TRUE,
            '[{"label": "Tipo", "value": "Electrónica"}, {"label": "Conector", "value": "Específico"}]'::jsonb
        );
    END LOOP;

    -- BOMBAS DE AGUA (REFRIGERACIÓN MOTOR)
    FOR car IN SELECT unnest(ARRAY['Renault Logan', 'Chevrolet Spark GT', 'Twingo 16v', 'Nissan Frontier NP300']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published, benefits
        ) VALUES (
            'Bomba de Agua GMB / Pro-Parts para ' || car,
            'Mantiene el flujo de refrigerante constante para evitar el recalentamiento del motor en trancones y trayectos largos.',
            120000 + (random() * 80000)::int, 'Motor', v_main_cat_id, 'Motor',
            25, TRUE,
            ARRAY['Sello cerámico de alta calidad', 'Impulsor metálico', 'Instalación precisa']
        );
    END LOOP;

    -- SOPORTES DE MOTOR (ELIMINA VIBRACIONES)
    FOR pos IN SELECT unnest(ARRAY['Lado Distribución', 'Caja de Cambios', 'Trasero / Limitador']) LOOP
        FOR car IN SELECT unnest(ARRAY['Renault Sandero Stepway', 'Chevrolet Tracker']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, stock, is_published
            ) VALUES (
                'Soporte de Motor ' || pos || ' para ' || car,
                'Absorbe las vibraciones del motor para un manejo más suave y silencioso. Caucho reforzado de alta densidad.',
                160000 + (random() * 120000)::int, 'Motor', v_main_cat_id, 'Motor',
                20, TRUE
            );
        END LOOP;
    END LOOP;

    -- SENSORES DE MOTOR
    FOR sensor IN SELECT unnest(ARRAY['Sensor de Oxígeno (Lambda)', 'Sensor MAF (Flujo Aire)', 'Sensor de Posición Cigüeñal (CKP)', 'Sensor Detonación (Knock)']) LOOP
        FOR car IN SELECT unnest(ARRAY['Chevrolet Optra', 'Mazda 3 All New', 'Renault Duster 2.0']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, stock, is_published, specifications
            ) VALUES (
                sensor || ' para ' || car,
                'Sensor de precisión que monitorea los parámetros del motor para optimizar la mezcla aire-combustible en la computadora (ECU).',
                130000 + (random() * 180000)::int, 'Motor', v_main_cat_id, 'Motor',
                15, TRUE,
                '[{"label": "Origen", "value": "OEM / Importado"}, {"label": "Garantía", "value": "6 Meses"}]'::jsonb
            );
        END LOOP;
    END LOOP;

    -- FILTROS DE AIRE MOTOR
    FOR car IN SELECT unnest(ARRAY['Toyota Prado TXL', 'Chevrolet Onix Turbo', 'Renault Stepway', 'Hiundai Tucson TL']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published, benefits
        ) VALUES (
            'Filtro de Aire Motor Premium para ' || car,
            'Protege tu motor de polvo y partículas dañinas. Filtración de alto flujo para mantener la potencia intacta.',
            45000 + (random() * 30000)::int, 'Motor', v_main_cat_id, 'Motor',
            150, TRUE,
            ARRAY['Microfibras de alta retención', 'Estructura reforzada', 'Cambio recomendado cada 10.000km']
        );
    END LOOP;

    -- EMPAQUETADURAS Y SELLOS
    FOR item IN SELECT unnest(ARRAY['Empaque de Culata (Amianto/Metal)', 'Retén de Cigüeñal Trasero', 'Sellos de Válvula x16', 'Empaque de Tapa Válvulas']) LOOP
        FOR car IN SELECT unnest(ARRAY['Chevrolet Spark', 'Renault Megane', 'Mazda 2']) LOOP
            INSERT INTO public.products (
                name, description, price, category, category_id, category_name, stock, is_published
            ) VALUES (
                item || ' para ' || car,
                'Selle herméticamente los componentes del motor y evite fugas de aceite o refrigerante. Materiales resistentes a altas temperaturas.',
                35000 + (random() * 60000)::int, 'Motor', v_main_cat_id, 'Motor',
                80, TRUE
            );
        END LOOP;
    END LOOP;

    -- GENERAR RESTANTES PARA COMPLETAR 100
    FOR i IN 1..15 LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published
        ) VALUES (
            'Válvula PCV / IAC para Motores ' || CASE WHEN i%2=0 THEN 'Renault' ELSE 'Chevrolet' END || ' ' || i,
            'Componente esencial para el control de gases y el ralentí estable del motor.',
            85000 + (i * 2000), 'Motor', v_main_cat_id, 'Motor', 40, TRUE
        );
    END LOOP;

END $$;
