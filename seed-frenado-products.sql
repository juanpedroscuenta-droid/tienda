-- Seed script for 'Frenado' category (100 products)
-- Target: Best-selling braking parts in the Colombian market

DO $$
DECLARE
    frenado_category_id UUID;
    i INTEGER;
    v_name TEXT;
    v_desc TEXT;
    v_price INTEGER;
    v_stock INTEGER;
    v_image TEXT;
    v_brand TEXT;
    v_vehicle TEXT;
    v_specs JSONB;
    v_benefits JSONB;
BEGIN
    -- 1. Ensure 'Frenado' category exists
    SELECT id INTO frenado_category_id FROM categories WHERE slug = 'frenado';
    
    IF frenado_category_id IS NULL THEN
        INSERT INTO categories (id, name, slug, description, published)
        VALUES (
            gen_random_uuid(),
            'Frenado',
            'frenado',
            'Componentes críticos de seguridad: pastillas, discos, bandas y sistemas hidráulicos.',
            true
        ) RETURNING id INTO frenado_category_id;
    END IF;

    -- 2. Insert 100 Products
    FOR i IN 1..100 LOOP
        -- Sequence of products by sub-type
        IF i <= 25 THEN
            -- Pastillas de Freno (Brake Pads)
            v_brand := CASE (i % 5)
                WHEN 0 THEN 'Incolbest'
                WHEN 1 THEN 'Brembo'
                WHEN 2 THEN 'Bosch'
                WHEN 3 THEN 'TRW'
                ELSE 'Wagner'
            END;
            v_vehicle := CASE (i % 8)
                WHEN 0 THEN 'Renault Logan/Sandero'
                WHEN 1 THEN 'Chevrolet Onix'
                WHEN 2 THEN 'Kia Picanto'
                WHEN 3 THEN 'Mazda 3 (CX-30)'
                WHEN 4 THEN 'Toyota Hilux'
                WHEN 5 THEN 'Ford Fiesta'
                WHEN 6 THEN 'Nissan Versa'
                ELSE 'Hyundai Accent'
            END;
            v_name := 'Pastillas de Freno ' || v_brand || ' para ' || v_vehicle;
            v_desc := 'Pastillas de freno de alta fricción ' || v_brand || '. Diseñadas para un frenado silencioso y efectivo en terrenos montañosos colombianos. Material semimetálico o cerámico según aplicación.';
            v_price := 85000 + (i * 1250);
            v_image := 'https://images.unsplash.com/photo-1621259182978-fbf9ad132644?q=80&w=400&h=400&auto=format&fit=crop'; -- Placeholder generic parts
            v_specs := jsonb_build_array(
                jsonb_build_object('name', 'Material', 'value', CASE WHEN i % 2 = 0 THEN 'Cerámica' ELSE 'Semimetálico' END),
                jsonb_build_object('name', 'Posición', 'value', 'Delantera'),
                jsonb_build_object('name', 'Origen', 'value', 'Colombia/Brasil')
            );
            v_benefits := jsonb_build_array('Frenado silencioso', 'Larga duración', 'Menor polvo en rines');

        ELSIF i <= 50 THEN
            -- Discos de Freno (Brake Discs)
            v_brand := CASE (i % 4)
                WHEN 0 THEN 'Fremax'
                WHEN 1 THEN 'Brembo'
                WHEN 2 THEN 'Ate'
                ELSE 'Hi-Q'
            END;
            v_vehicle := CASE (i % 7)
                WHEN 0 THEN 'Chevrolet Sail'
                WHEN 1 THEN 'Renault Duster'
                WHEN 2 THEN 'Toyota Prado'
                WHEN 3 THEN 'Suzuki Vitara'
                WHEN 4 THEN 'Kia Sportage'
                WHEN 5 THEN 'Mazda CX-5'
                ELSE 'Volkswagen Gol'
            END;
            v_name := 'Disco de Freno ' || v_brand || ' Ventidado - ' || v_vehicle;
            v_desc := 'Disco de freno ventilado con tecnología High Carbon. Evita la deformación por calor extremo en bajadas prolongadas (Línea de La Línea). Acabado protector contra corrosión.';
            v_price := 125000 + (i * 2500);
            v_image := 'https://images.unsplash.com/photo-1592906209472-a36b5d3e2d92?q=80&w=400&h=400&auto=format&fit=crop';
            v_specs := jsonb_build_array(
                jsonb_build_object('name', 'Tipo', 'value', 'Ventilado'),
                jsonb_build_object('name', 'Diámetro', 'value', '256mm - 300mm'),
                jsonb_build_object('name', 'Pernos', 'value', '4 o 5 según versión')
            );
            v_benefits := jsonb_build_array('Alta disipación de calor', 'Balanceo electrónico', 'Resistencia al "Fading"');

        ELSIF i <= 70 THEN
            -- Bandas de Freno (Brake Shoes)
            v_brand := 'Incolbest';
            v_vehicle := CASE (i % 5)
                WHEN 0 THEN 'Chevrolet Spark GT'
                WHEN 1 THEN 'Renault Kwid'
                WHEN 2 THEN 'Kia Rio'
                WHEN 3 THEN 'Hyundai i10'
                ELSE 'Toyota Land Cruiser (Antiguo)'
            END;
            v_name := 'Juego de Bandas de Freno Traseras ' || v_brand || ' - ' || v_vehicle;
            v_desc := 'Bandas de freno traseras para sistema de tambor. Máxima adherencia y durabilidad. Cumple con la norma técnica colombiana para sistemas de frenado.';
            v_price := 45000 + (i * 800);
            v_image := 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=400&h=400&auto=format&fit=crop';
            v_specs := jsonb_build_array(
                jsonb_build_object('name', 'Posición', 'value', 'Trasera'),
                jsonb_build_object('name', 'Sistema', 'value', 'Tambor'),
                jsonb_build_object('name', 'Certificación', 'value', 'ICONTEC')
            );
            v_benefits := jsonb_build_array('Ajuste perfecto', 'Coeficiente de fricción estable', 'Respaldo de marca nacional');

        ELSIF i <= 85 THEN
            -- Bombas y Cilindros (Master & Wheel Cylinders)
            v_brand := 'LPR';
            v_name := CASE WHEN i % 2 = 0 THEN 'Bomba Principal de Freno' ELSE 'Cilindro de Rueda Trasero' END || ' - ' || v_brand;
            v_desc := 'Componente hidráulico de precisión. Sellos de alta temperatura para evitar fugas de líquido de frenos. Cuerpo de hierro o aluminio fundido de alta resistencia.';
            v_price := 60000 + (i * 1500);
            v_image := 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=400&h=400&auto=format&fit=crop';
            v_specs := jsonb_build_array(
                jsonb_build_object('name', 'Material', 'value', 'Hierro/Aluminio'),
                jsonb_build_object('name', 'Origen', 'value', 'Italia / OEM'),
                jsonb_build_object('name', 'Presión máxima', 'value', 'Estandarizada')
            );
            v_benefits := jsonb_build_array('Sellado hermético', 'Resistencia a la presión', 'Fácil instalación');

        ELSE
            -- Líquidos y Varios (Brake Fluid, Sensors)
            v_brand := CASE WHEN i % 2 = 0 THEN 'Mobil' ELSE 'Bosch' END;
            v_name := 'Líquido de Frenos ' || v_brand || ' DOT 4 - 250ml';
            v_desc := 'Fluido hidráulico premium para sistemas de frenos y embrague. Alto punto de ebullición para máxima seguridad en frenados constantes. Protege contra la corrosión interna.';
            v_price := 18000 + (i * 200);
            v_image := 'https://images.unsplash.com/photo-1635773100239-d370df7aa0b8?q=80&w=400&h=400&auto=format&fit=crop';
            v_specs := jsonb_build_array(
                jsonb_build_object('name', 'Grado', 'value', 'DOT 4'),
                jsonb_build_object('name', 'Contenido', 'value', '250ml'),
                jsonb_build_object('name', 'Ebullición', 'value', '230°C min.')
            );
            v_benefits := jsonb_build_array('No higroscópico extremo', 'Protección antioxidante', 'Compatible con ABS');
        END IF;

        v_stock := 10 + floor(random() * 40);

        INSERT INTO products (
            id,
            name,
            description,
            price,
            original_price,
            stock,
            image,
            category_id,
            brand,
            specifications,
            benefits,
            is_published,
            is_offer,
            discount,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            v_name,
            v_desc,
            v_price,
            v_price,
            v_stock,
            v_image,
            frenado_category_id,
            v_brand,
            v_specs,
            v_benefits,
            true,
            false,
            0,
            now(),
            now()
        );
    END LOOP;
END $$;
