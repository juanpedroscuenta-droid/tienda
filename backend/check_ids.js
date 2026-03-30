require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkIds() {
    const { data, error } = await supabase.from('products').select('id, name').limit(5);
    if (error) {
        console.error(error);
        return;
    }
    console.log(data);
}
checkIds();
