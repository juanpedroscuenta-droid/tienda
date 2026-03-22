DO $$ 
DECLARE 
    v_cat_filtracion_id UUID;
    v_cat_suspension_id UUID;
BEGIN
    -- Obtener IDs de categorías
    SELECT id INTO v_cat_filtracion_id FROM public.categories WHERE slug = 'filtracion' LIMIT 1;
    SELECT id INTO v_cat_suspension_id FROM public.categories WHERE slug = 'direccion-y-suspension' LIMIT 1;

    -- Si no existen, las creamos
    IF v_cat_filtracion_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active) VALUES ('Filtración', 'filtracion', TRUE) RETURNING id INTO v_cat_filtracion_id;
    END IF;
    IF v_cat_suspension_id IS NULL THEN
        INSERT INTO public.categories (name, slug, is_active) VALUES ('Dirección y suspensión', 'direccion-y-suspension', TRUE) RETURNING id INTO v_cat_suspension_id;
    END IF;

    -- 1. Carcasa purificador filtro aire Hyundai I-10
    INSERT INTO public.products (
        id, name, description, price, original_price, category, category_id, category_name, is_published, is_offer, stock, image
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440000', 'Carcasa purificador filtro aire Hyundai I-10 1.100 c.c. Inferior, ORIGINAL',
        'Carcasa de purificador de aire original para Hyundai I-10 motor 1.100cc. Pieza inferior que garantiza el sellado perfecto del sistema de filtración.',
        139500, 155000, 'Filtración', v_cat_filtracion_id, 'Filtración', TRUE, TRUE, 15, 'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/carcasa-i10.webp'
    ) ON CONFLICT (id) DO UPDATE SET 
        price = EXCLUDED.price, original_price = EXCLUDED.original_price, is_offer = TRUE;

    -- 2. Amortiguador Delantero Derecho Hyundai I-10 - Kia Picanto Morning
    INSERT INTO public.products (
        id, name, description, price, original_price, category, category_id, category_name, is_published, is_offer, stock, image
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440001', 'Amortiguador Delantero Derecho Hyundai I-10 - Kia Picanto Morning',
        'Amortiguador de alta resistencia diseñado para Hyundai i10 y Kia Picanto Morning. Mejora la estabilidad y el confort en la conducción urbana.',
        137700, 153000, 'Dirección y suspensión', v_cat_suspension_id, 'Dirección y suspensión', TRUE, TRUE, 20, 'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/amortiguador-derecho.webp'
    ) ON CONFLICT (id) DO UPDATE SET 
        price = EXCLUDED.price, original_price = EXCLUDED.original_price, is_offer = TRUE;

    -- 3. Amortiguador Delantero Izquierdo Hyundai I-10 - Kia Picanto Morning
    INSERT INTO public.products (
        id, name, description, price, original_price, category, category_id, category_name, is_published, is_offer, stock, image
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440002', 'Amortiguador Delantero Izquierdo Hyundai I-10 - Kia Picanto Morning',
        'Amortiguador de alta resistencia diseñado para Hyundai i10 y Kia Picanto Morning. Posición delantera izquierda, calidad equipo original.',
        137700, 153000, 'Dirección y suspensión', v_cat_suspension_id, 'Dirección y suspensión', TRUE, TRUE, 22, 'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/amortiguador-izquierdo.webp'
    ) ON CONFLICT (id) DO UPDATE SET 
        price = EXCLUDED.price, original_price = EXCLUDED.original_price, is_offer = TRUE;

    -- 4. Amortiguador Delantero Derecho Kia Picanto Ion .../2017
    INSERT INTO public.products (
        id, name, description, price, original_price, category, category_id, category_name, is_published, is_offer, stock, image
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440003', 'Amortiguador Delantero Derecho Kia Picanto Ion .../2017',
        'Amortiguador especializado para Kia Picanto Ion modelos hasta 2017. Tecnología de gas para mayor durabilidad en baches y terrenos irregulares.',
        162000, 180000, 'Dirección y suspensión', v_cat_suspension_id, 'Dirección y suspensión', TRUE, TRUE, 12, 'https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/products/amortiguador-ion.webp'
    ) ON CONFLICT (id) DO UPDATE SET 
        price = EXCLUDED.price, original_price = EXCLUDED.original_price, is_offer = TRUE;

    -- Reseñas
    INSERT INTO public.product_reviews (product_id, user_id, user_name, user_email, rating, comment) 
    VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', '00000000-0000-0000-0000-000000000000', 'Carlos Rodriguez', 'carlos@ejemplo.com', 5, 'Excelente calidad, el filtro calzó perfecto en mi i10.'),
    ('550e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', 'Juan Perez', 'juan@ejemplo.com', 4, 'Muy buen amortiguador, se siente el cambio en la suavidad.'),
    ('550e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', 'Maria Lopez', 'maria@ejemplo.com', 5, 'Original y a muy buen precio. Recomendado.')
    ON CONFLICT (product_id, user_id) DO NOTHING;

END $$;
