const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSupabase() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('Verificando conexión con Supabase...');
    const { data, error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
    if (error) {
        console.error('❌ Error de Supabase:', error.message);
    } else {
        console.log('✅ Conexión con Supabase OK. Total categorías:', data);
    }
}
checkSupabase();
