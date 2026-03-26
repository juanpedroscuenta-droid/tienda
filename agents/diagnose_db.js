require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function diagnose() {
    console.log('🔍 Conectando a Supabase:', process.env.SUPABASE_URL);
    console.log('');

    // 1. Ver las tablas disponibles (listamos la tabla products)
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .limit(10);

    if (error) {
        console.error('❌ Error al consultar products:', error.message);
        console.error('   Detalles:', error.details, error.hint);
        return;
    }

    if (!products || products.length === 0) {
        console.log('⚠️ La tabla "products" existe pero está vacía o la política de acceso bloquea la lectura.');
        return;
    }

    console.log(`✅ Encontradas ${products.length} filas en "products"`);
    console.log('');
    console.log('📋 Columnas disponibles:', Object.keys(products[0]).join(', '));
    console.log('');
    console.log('🧪 Primeros 5 productos:');
    products.forEach((p, i) => {
        console.log(`\n[${i+1}] Nombre: ${p.name}`);
        console.log(`    Precio: ${p.price}`);
        console.log(`    Stock: ${p.stock}`);
        console.log(`    is_published: ${p.is_published}`);
        console.log(`    Imagen: ${p.image || p.image_url || 'NO HAY CAMPO DE IMAGEN'}`);
        console.log(`    Todas las claves:`, JSON.stringify(p));
    });

    // 2. Probar búsqueda de batería
    console.log('\n\n🔎 Probando búsqueda de "bateria"...');
    const { data: baterias, error: err2 } = await supabase
        .from('products')
        .select('name, price, stock, image, image_url')
        .or('name.ilike.%bateria%,name.ilike.%batería%')
        .limit(5);

    if (err2) {
        console.error('❌ Error búsqueda batería:', err2.message);
    } else {
        console.log(`Encontradas ${baterias?.length || 0} baterías:`, JSON.stringify(baterias, null, 2));
    }
}

diagnose().catch(console.error);
