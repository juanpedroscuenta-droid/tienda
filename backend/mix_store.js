require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function mix() {
    const { data: products, error } = await supabase.from('products').select('id');
    if (error) {
        console.error("Error fetching products:", error);
        return;
    }
    
    console.log(`Encontrados ${products.length} productos, mezclando fechas...`);
    let n = 0;
    
    // Shuffle the products randomly first to spread out the dates completely randomly
    const shuffled = products.sort(() => Math.random() - 0.5);
    
    for (let i of shuffled) {
        // Generate a random timestamp between now and 45 days ago
        const randomTime = new Date(Date.now() - Math.floor(Math.random() * 45 * 24 * 3600 * 1000)).toISOString();
        const { error: updateError } = await supabase
            .from('products')
            .update({ updated_at: randomTime, created_at: randomTime })
            .eq('id', i.id);
            
        if (!updateError) n++;
        if (n % 100 === 0) console.log(`${n} procesados...`);
    }
    console.log(`Hecho! ${n} productos mezclados correctamente en la base de datos.`);
}

mix();
