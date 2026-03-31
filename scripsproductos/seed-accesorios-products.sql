-- ================================================================
-- SEED DE PRODUCTOS: ACCESORIOS (100 PRODUCTOS PURA CALIDAD)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    brand TEXT;
    socket TEXT;
    item TEXT;
    i INTEGER;
BEGIN
    -- 1. Obtener el ID de la categoría Accesorios
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'accesorios';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Accesorios', 'accesorios', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS (Variaciones de los más vendidos en Colombia)

    -- RADIOS ANDROID PANTALLA (TOP 1)
    FOR brand IN SELECT unnest(ARRAY['Renault Logan/Sandero', 'Chevrolet Onix', 'Mazda 3', 'Kia Picanto', 'Toyota Hilux', 'Ford Fiesta', 'Volkswagen Gol', 'Universal 7"', 'Universal 9"', 'Universal 10"']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, specifications, benefits
        ) VALUES (
            'Radio Android Pantalla IPS 9" para ' || brand,
            'Sistema de infoentretenimiento Android. Pantalla táctil HD, Bluetooth, GPS, Wi-Fi. Compatible con CarPlay inalámbrico y Android Auto.',
            750000 + (random() * 200000)::int, 'Accesorios', v_cat_id, 'Accesorios',
            20, TRUE,
            '[{"label": "RAM", "value": "2GB"}, {"label": "ROM", "value": "32GB"}, {"label": "Procesador", "value": "QuadCore"}]'::jsonb,
            ARRAY['Sonido DSP Hi-Fi', 'Entrada Cámara Reversa', 'Mandos al Volante']
        );
    END LOOP;

    -- LUCES LED TURBO (TOP 2)
    FOR socket IN SELECT unnest(ARRAY['H4 Alta/Baja', 'H7', 'H1', 'H11/H8', '9005 (HB3)', '9006 (HB4)', '880/881', 'T10 Cocuyos', 'Estrobo 1156', 'Piruleta 1157']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published, is_offer, specifications, benefits
        ) VALUES (
            'Kit Bombillos Turbo LED Iron Ultra ' || socket || ' 25.000LM',
            'Potente iluminación blanca 6000K. Mayor rango de visión sin encandilar. Chip CSP de alta durabilidad.',
            145000 + (random() * 50000)::int, 'Accesorios', v_cat_id, 'Accesorios',
            150, TRUE, FALSE,
            '[{"label": "Lúmenes", "value": "25.000"}, {"label": "Color", "value": "Blanco Puro"}, {"label": "Refrigeración", "value": "Ventilador Turbo"}]'::jsonb,
            ARRAY['Encendido instantáneo', 'Fácil instalación', 'No requiere balastros']
        );
    END LOOP;

    -- SEGURIDAD (ALARMAS Y SENSORES)
    FOR item IN SELECT unnest(ARRAY['Alarma Ultra 4 Botones', 'Alarma Nemesis Gold', 'Sensor reversa 4 puntos LED', 'Cámara Reversa Mariposa HD', 'Cámara Portaplaca Night Vision', 'Sensor Reversa con Voz']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published, benefits
        ) VALUES (
            'Sistema de Seguridad ' || item,
            'Protege tu vehículo con lo mejor en tecnología de seguridad automotriz. Sensores de alta sensibilidad y largo alcance.',
            85000 + (random() * 200000)::int, 'Accesorios', v_cat_id, 'Accesorios', 50, TRUE,
            ARRAY['Garantía 1 año', 'Controles anti-clonación', 'Instalación simplificada']
        );
    END LOOP;

    -- ESTÉTICA EXTERIOR (COLOMBIA TUNING)
    FOR brand IN SELECT unnest(ARRAY['Renault', 'Chevrolet', 'Mazda', 'Kia', 'Hyundai', 'Toyota', 'Nissan', 'Ford', 'Suzuki', 'Volkswagen']) LOOP
        -- Antenas Tiburón
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published
        ) VALUES (
            'Antena Aleta de Tiburón Universal ' || brand,
            'Estética deportiva y funcional. Captación de señal FM/AM. Fácil montaje con adhesivo 3M.',
            35000, 'Accesorios', v_cat_id, 'Accesorios', 100, TRUE
        );
        -- Llaveros Lujo
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published
        ) VALUES (
            'Llavero de Lujo ' || brand || ' Cuero Premium',
            'El complemento perfecto para tu llave oficial. Logo grabado en metal inoxidable.',
            28000, 'Accesorios', v_cat_id, 'Accesorios', 200, TRUE
        );
        -- PortaPlaca
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published
        ) VALUES (
            'PortaPlaca de Lujo ' || brand || ' (Par)',
            'Evita ruidos molestos en la placa y dale un toque elegante a tu vehículo.',
            45000, 'Accesorios', v_cat_id, 'Accesorios', 150, TRUE
        );
    END LOOP;

    -- ACCESORIOS DE CABINA (ESTÉTICA INTERIOR)
    FOR item IN SELECT unnest(ARRAY['Forro Volante Deportivo Cuero', 'Pomo Palanca Cambios Universal', 'Cojines Cuello Memory Foam (Par)', 'Organizador de Sillas Premium', 'Tapete Tablero (Anti-reflejo)', 'Set Pedales Aluminio Tuning']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published
        ) VALUES (
            'Accesorio Interior: ' || item,
            'Personaliza tu espacio y mejora la comodidad en cada viaje.',
            55000 + (random() * 100000)::int, 'Accesorios', v_cat_id, 'Accesorios', 40, TRUE
        );
    END LOOP;

    -- GADGETS TECNOLÓGICOS (CARGADORES Y SOPORTES)
    FOR i IN 1..10 LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published, specifications
        ) VALUES (
            'Cargador Carga Rápida 4.8A Dual USB ' || i,
            'Carga dos dispositivos al tiempo con máxima velocidad. Protección contra sobre-voltaje.',
            32000, 'Accesorios', v_cat_id, 'Accesorios', 100, TRUE,
            '[{"label": "Puertos", "value": "USB-C + USB-A"}, {"label": "Carga", "value": "Quick Charge 3.0"}]'::jsonb
        );
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published
        ) VALUES (
            'Soporte Celular Magnético Neodimio para Rejilla ' || i,
            'Sujeción ultra fuerte que no deja caer tu celular ni en los huecos más grandes.',
            22000, 'Accesorios', v_cat_id, 'Accesorios', 100, TRUE
        );
    END LOOP;

    -- SONIDO AUTOMOTRIZ (TOP VENTAS) - 12 productos
    FOR item IN SELECT unnest(ARRAY['Bajo Pioneer 12" Doble Bobina', 'Parlantes Ovalados 6x9 Sony Xplod', 'Set de Medios Focal 6.5"', 'Amplificador 4 Canales Soundstream', 'Tweeters Bala de Alta Frecuencia (Par)', 'Radio Pioneer USB/BT 1 Din', 'Caja Acústica Turbo para Bajo 12"', 'Control de Bajos a Distancia', 'Filtro de Ruido RCA Ground Loop', 'Cableado Profesional 4 Gauge Kit', 'Planta Monoblock Clase D 1500W', 'Bluetooth Receptor Auxiliar 3.5mm']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published, benefits
        ) VALUES (
            'Sonido Pro: ' || item,
            'Mejora la experiencia acústica de tu vehículo con los mejores componentes de sonido del mercado.',
            45000 + (random() * 800000)::int, 'Accesorios', v_cat_id, 'Accesorios', 25, TRUE,
            ARRAY['Sonido Nitido', 'Fácil Conexión', 'Alta Fidelidad']
        );
    END LOOP;

    -- ILUMINACIÓN AMBIENTAL Y TUNING (ESTILO MODERNO) - 20 productos
    FOR item IN SELECT unnest(ARRAY['Cinta LED RGB Interior Neon', 'Proyector Logo Puerta (Laser)', 'Luces de Piso con App Bluetooth', 'Kit Ojos de Ángel LED 80mm', 'Barra LED 22" de Techo (Curva)', 'Bombillos LED T10 Siliconados', 'Tira LED Secuencial para Farolas', 'Luz de Baúl LED Ultra Blanca', 'Kit Luces de Domo LED Inteligentes', 'Luz Estroboscópica de Seguridad', 'Underglow LED Wheel Kit', 'Panel LED para Placa 24 SMD', 'Ojos de Demonio RGB con Control', 'Luces de Techo Estrellado (Fibra)', 'Barra LED de Trabajo 4"', 'Kit Neón para Bajachasis', 'Bombillo Reversa con Alarma', 'Luz de Puerta de Advertencia', 'Adaptador para Luces LED Canbus', 'Relay Reforzado para Luces']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published, specifications
        ) VALUES (
            'Iluminación Estilo: ' || item,
            'Dale un toque de exclusividad y modernismo a tu vehículo con iluminación LED de última tecnología.',
            45000 + (random() * 150000)::int, 'Accesorios', v_cat_id, 'Accesorios', 60, TRUE,
            '[{"label": "Color", "value": "Multicolor RGB"}, {"label": "Voltaje", "value": "12V"}]'::jsonb
        );
    END LOOP;

    -- PROTECCIÓN Y SEGURIDAD EXTERIOR - 20 productos
    FOR item IN SELECT unnest(ARRAY['Pernos de Seguridad Originales (Kit)', 'Candado de Embrague Trancapedal', 'Pijama Protectora Ultra Impermeable', 'Protector de Espejos Contra Robo', 'Candado de Timón de Alta Seguridad', 'Película de Seguridad Pro 4mil', 'Celo Antirrobo Pasador de Puerta', 'Kit Tuercas Lujo (Tuning)', 'Cantoneras Protectoras de Puerta', 'Embellecedor de Manija Cromado', 'Deflectores de Aire (Botaaguas)', 'Spoiler Lip Universal para Baúl', 'Faldones (Loderas) Deportivos', 'Protector de Manijas Fibra Carbono', 'Cinta Reflectiva 3M Reglamentaria', 'Martillo Rompe Vidrios Emergencia', 'Bloqueo Central Universal 4p', 'Modulo Elevavidrios Eléctrico', 'Sirena para Alarma 2 Tonos', 'Switch Cortacorriente Oculto']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published
        ) VALUES (
            'Protección & Exterior: ' || item,
            'Componentes diseñados para proteger la inversión de tu vehículo y mejorar su estética exterior.',
            35000 + (random() * 250000)::int, 'Accesorios', v_cat_id, 'Accesorios', 45, TRUE
        );
    END LOOP;

    -- AVENTURA, OFF-ROAD Y CARGA - 20 productos
    FOR item IN SELECT unnest(ARRAY['Canasta de Techo Aero (Universal)', 'Barras de Techo Transversales', 'Portabicicletas de Baúl (3 Bicis)', 'Maletero de Techo (Portaequipaje) 400L', 'Winch Eléctrico 3000 Lbs', 'Snorkel Genérico para Camioneta', 'Eslinga de Rescate 10 Toneladas', 'Pala Plegable de Emergencia', 'Inflador de Llantas Compresor 300PSI', 'Nevera Portátil Térmica 12V', 'Inversor 12V a 110V 500W', 'Soporte Extintor para Baúl', 'Red Portaequipajes Elástica', 'Tiro de Arrastre Universal', 'Protector de Cárter Reforzado', 'Alfombra de Baúl Pro', 'Porta Kayak para Techo', 'Focos Exploradores LED Offroad', 'Escalera para Camioneta (Tailgate)', 'Caja de Herramientas de Baúl']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published, benefits
        ) VALUES (
            'Aventura Off-Road: ' || item,
            'Equipa tu vehículo para la aventura definitiva. Resistencia y versatilidad en cualquier terreno.',
            120000 + (random() * 900000)::int, 'Accesorios', v_cat_id, 'Accesorios', 20, TRUE,
            ARRAY['Resistente Clima Extremo', 'Fácil Montaje', 'Alta Capacidad']
        );
    END LOOP;

    -- COMODIDAD E INTERIOR (FORROS Y MÁS) - 20 productos
    FOR item IN SELECT unnest(ARRAY['Forro de Silletería Cuero Sintético', 'Alfombras de Piso en Caucho Heavy Duty', 'Pomo de Lujo para Palanca Fibra', 'Cojines Cervicales Memory Foam', 'Organizador de Respaldo de Silla', 'Parasol Retráctil para Parabrisas', 'Fundas para Cinturón de Seguridad', 'Basurero Portátil para Consola', 'Protector de Millaré (Tablero)', 'Espejo Retrovisor de Gran Angular', 'Apoyacabezas con Pantalla 7"', 'Consola Central Apoyabrazos', 'Ventilador Doble 12V HighPower', 'Purificador de Aire Ionizador', 'Cortinas Laterales de Privacidad', 'Bandeja Multifunción para Volante', 'Cojín Calefactable (Cold/Warm)', 'Aromatizante de Lujo por Difusión', 'Protector de Baúl Anti-Mascotas', 'Set de Cubrevolante de Carbono']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published
        ) VALUES (
            'Interior y Confort: ' || item,
            'Innova el espacio interior de tu auto con accesorios que brindan ergonomía y un estilo superior.',
            28000 + (random() * 450000)::int, 'Accesorios', v_cat_id, 'Accesorios', 50, TRUE
        );
    END LOOP;

    -- LIMPIEZA Y CUIDADO (DETAIL) - 15 productos
    FOR item IN SELECT unnest(ARRAY['Silicona Brillo UV 500ml', 'Ambientador California Scents (Lata)', 'Paño Microfibra Ultra Absorbente x3', 'Aspiradora Portátil 12V HighPower', 'Renovador de Llantas Gel', 'Shampoo con Cera Carnauba 1Lt', 'Kit Restaurador de Farolas (Lámparas)', 'Eliminador de Olores Textil', 'Cera Protectora de Lujo Meguiar''s', 'Cepillo para Limpieza de Rines', 'Pistola de Espuma (Foam Cannon)', 'Kit Barro Limpiador (Clay Bar)', 'Toalla de Secado Gigante', 'Restaurador de Plásticos Negros', 'Desengrasante Motor biodegradable']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published
        ) VALUES (
            'Cuidado Automotriz: ' || item,
            'Mantén tu vehículo como nuevo. Productos de alta calidad para protección y limpieza.',
            18000 + (random() * 120000)::int, 'Accesorios', v_cat_id, 'Accesorios', 80, TRUE
        );
    END LOOP;

    -- EMERGENCIA Y RESCATE - 10 productos
    FOR item IN SELECT unnest(ARRAY['Cables de Inicio (Iniciadores) 500A', 'Linterna LED Recargable de Alta Potencia', 'Triángulos de Seguridad Reflejantes (Par)', 'Chaleco Reflectivo Reglamentario', 'Manta Térmica de Emergencia', 'Kit de Mechas para Despinche Rápido', 'Compresor de Aire Metalico 150 PSI', 'Cinta de Enmascarar Autopartes', 'Guantes de Nitrilo para Mecánica', 'Botiquín de Primeros Auxilios Tipo A']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, stock, is_published, benefits
        ) VALUES (
            'Emergencia: ' || item,
            'Equipamiento de seguridad esencial para afrontar imprevistos en la vía con total confianza.',
            15000 + (random() * 85000)::int, 'Accesorios', v_cat_id, 'Accesorios', 100, TRUE,
            ARRAY['Portátil', 'Alta Visibilidad', 'Indispensable']
        );
    END LOOP;

    -- BASICO REGLAMENTARIO (ACCESORIOS OBLIGATORIOS)
    INSERT INTO public.products (
        name, description, price, category, category_id, category_name, stock, is_published, benefits
    ) VALUES (
        'Kit de Carretera Reglamentario 2026',
        'Todo lo exigido por el Código Nacional de Tránsito. Extintor, señales, botiquín premium y herramientas básicas.',
        125000, 'Accesorios', v_cat_id, 'Accesorios', 300, TRUE,
        ARRAY['Extintor Vigente', 'Cumple Norma Técnica', 'Maletín Reforzado']
    );

END $$;
