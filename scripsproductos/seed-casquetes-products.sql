-- ================================================================
-- SEED DE PRODUCTOS: CASQUETES (200 PRODUCTOS)
-- ================================================================

DO $$ 
DECLARE 
    v_cat_id UUID;
    v_brand TEXT;
    v_car_model TEXT;
    v_size TEXT;
    v_type TEXT;
    v_item TEXT;
BEGIN
    -- 1. Obtener o crear el ID de la categoría Casquetes
    SELECT id INTO v_cat_id FROM public.categories WHERE slug = 'casquetes';

    IF v_cat_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active)
        VALUES ('Casquetes', 'casquetes', TRUE)
        RETURNING id INTO v_cat_id;
    END IF;

    -- 2. INSERTAR PRODUCTOS POR MARCA Y MODELO (TOP VENTAS COLOMBIA)

    -- CASQUETES DE BIELA Y BANCADA (RENAULT Y CHEVROLET)
    FOR v_brand IN SELECT unnest(ARRAY['Clevite Mahle', 'Kolbenschmidt', 'King Bearings', 'Federal Mogul', 'Original']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Renault Logan/Sandero K4M/K7M', 'Chevrolet Aveo 1.4/1.6', 'Chevrolet Spark 1.0/1.2', 'Renault Master 2.5 Diesel', 'Chevrolet Luv Dmax 2.4/3.0']) LOOP
            FOR v_size IN SELECT unnest(ARRAY['STD', '0.10', '0.20', '0.30', '0.40', '0.50']) LOOP
                -- Biela
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published, specifications, benefits
                ) VALUES (
                    'Casquetes de Biela ' || v_brand || ' para ' || v_car_model || ' (' || v_size || ')',
                    'Cojinetes de motor fabricados con materiales trimetálicos de alta resistencia. Diseñados para soportar las cargas cíclicas del cigüeñal y mantener una película de aceite estable.',
                    65000 + (random() * 85000)::int, 'Casquetes', v_cat_id, 'Casquetes',
                    15, TRUE,
                    format('[{"label": "Material", "value": "Trimetal Pro"}, {"label": "Medida", "value": "%s"}]', v_size)::jsonb,
                    ARRAY['Protección Antifricción', 'Alta Capacidad de Carga']
                );
                -- Bancada
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published, specifications
                ) VALUES (
                    'Casquetes de Bancada ' || v_brand || ' ' || v_car_model || ' (' || v_size || ')',
                    'Juego completo de cojinetes para apoyo del cigüeñal. Rectificado de precisión para un ajuste perfecto bajo normas globales OS.',
                    115000 + (random() * 145000)::int, 'Casquetes', v_cat_id, 'Casquetes',
                    10, TRUE,
                    format('[{"label": "Medida", "value": "%s"}]', v_size)::jsonb
                );
            END LOOP;
        END LOOP;
    END LOOP;

    -- LÍNEA JAPONESA Y COREANA (TOYOTA, MAZDA, HYUNDAI)
    FOR v_brand IN SELECT unnest(ARRAY['ACL Racing', 'King Bearings Japan', 'KMC Korea']) LOOP
        FOR v_car_model IN SELECT unnest(ARRAY['Toyota Hilux 2.5/3.0 1KD/2KD', 'Mazda 3 Skyactiv 2.0', 'Hyundai i25/Accent', 'Kia Picanto Ion', 'Toyota Prado 3.4/4.0', 'Nissan Frontier YD25']) LOOP
            FOR v_size IN SELECT unnest(ARRAY['STD', '0.10', '0.20']) LOOP
                INSERT INTO public.products (
                    name, description, price, category, category_id, category_name, 
                    stock, is_published, benefits
                ) VALUES (
                    'Casquetes de Motor Pro Series ' || v_brand || ' para ' || v_car_model || ' ' || v_size,
                    'Cojinetes de alto rendimiento. Ideal para motores de alta exigencia o vehículos de carga. Recubrimiento especial para arranques frecuentes.',
                    120000 + (random() * 250000)::int, 'Casquetes', v_cat_id, 'Casquetes',
                    12, TRUE,
                    ARRAY['Rendimiento Racing', 'Durabilidad Superior', 'Origen Premium']
                );
            END LOOP;
        END LOOP;
    END LOOP;

    -- MEDIA LUNAS AXIALES Y BUJES
    FOR v_item IN SELECT unnest(ARRAY['Medias Lunas Axiales Renault Logan', 'Medias Lunas Axiales Chevrolet Aveo', 'Axiales Toyota Hilux (Set)', 'Bujes de Árbol de Levas Chevrolet 350', 'Bujes de Levas Cummins ISX', 'Axiales Mazda BT-50 Diesel']) LOOP
        INSERT INTO public.products (
            name, description, price, category, category_id, category_name, 
            stock, is_published
        ) VALUES (
            'Cojinete de Motor: ' || v_item || ' STD',
            'Componente de motor encargado de controlar el juego axial del cigüeñal o la rotación del árbol de levas.',
            35000 + (random() * 145000)::int, 'Casquetes', v_cat_id, 'Casquetes',
            25, TRUE
        );
    END LOOP;

END $$;
