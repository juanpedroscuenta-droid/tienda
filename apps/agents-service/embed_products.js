require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// CONFIGURATION
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function embedProducts() {
    console.log('🔄 Iniciando proceso de vectorización de productos...');

    // 1. Obtener productos que no tienen embedding aún
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .is('embedding', null);

    if (error) {
        console.error('❌ Error al obtener productos:', error.message);
        return;
    }

    if (!products || products.length === 0) {
        console.log('✅ Todos los productos ya están vectorizados.');
        return;
    }

    console.log(`📦 Encontrados ${products.length} productos para procesar.`);

    for (let product of products) {
        try {
            console.log(`🧠 Generando vector para: "${product.name}"...`);
            
            // Generar el embedding con Gemini
            const result = await embeddingModel.embedContent(product.name);
            const embedding = result.embedding.values;

            // Guardar en Supabase
            const { error: updateError } = await supabase
                .from('products')
                .update({ embedding: embedding })
                .eq('id', product.id);

            if (updateError) {
                console.error(`❌ Error guardando vector para ${product.name}:`, updateError.message);
            } else {
                console.log(`✅ Vector guardado para: ${product.name}`);
            }
            
            // Pequeña pausa para no saturar la API (Rate limit)
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err) {
            console.error(`❌ Error procesando ${product.name}:`, err.message);
        }
    }

    console.log('\n✨ ¡Proceso de vectorización completado! Ya puedes usar la búsqueda semántica.');
}

embedProducts().catch(console.error);
