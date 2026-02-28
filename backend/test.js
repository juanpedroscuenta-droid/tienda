require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    const { data } = await supabase.from('products').select('*').limit(1);
    console.log(Object.keys(data[0]).join(', '));
}
check();
