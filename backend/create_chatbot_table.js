const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://uwgrmfxxayybglbbvhph.supabase.co',
    'sb_publishable_Rf3YMwPQqBkIZknge2W2cg_mhBN9LTy'
);

async function createTable() {
    // Intentar crear la tabla usando SQL via RPC
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
            CREATE TABLE IF NOT EXISTS public.chatbot_settings (
                id integer PRIMARY KEY DEFAULT 1,
                is_unlocked boolean DEFAULT false,
                provider text DEFAULT 'deepseek',
                api_key text DEFAULT '',
                prompt text DEFAULT 'Eres un asistente de ventas amable y persuasivo.',
                allow_product_access boolean DEFAULT true,
                created_at timestamptz DEFAULT now(),
                updated_at timestamptz DEFAULT now()
            );
        `
    });

    if (error) {
        console.log('RPC method not available, error:', error.message);
        console.log('');
        console.log('=== COPIA Y PEGA ESTE SQL EN SUPABASE SQL EDITOR ===');
        console.log('');
        console.log(`CREATE TABLE IF NOT EXISTS public.chatbot_settings (
    id integer PRIMARY KEY DEFAULT 1,
    is_unlocked boolean DEFAULT false,
    provider text DEFAULT 'deepseek',
    api_key text DEFAULT '',
    prompt text DEFAULT 'Eres un asistente de ventas amable y persuasivo.',
    allow_product_access boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chatbot_read" ON public.chatbot_settings FOR SELECT USING (true);
CREATE POLICY "chatbot_insert" ON public.chatbot_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "chatbot_update" ON public.chatbot_settings FOR UPDATE USING (true);`);
    } else {
        console.log('Table created successfully:', data);
    }
}

createTable().then(() => process.exit(0));
