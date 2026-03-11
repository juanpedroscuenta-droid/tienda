const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uwgrmfxxayybglbbvhph.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('ERROR: No se encontró la SERVICE_ROLE_KEY necesaria para crear tablas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initSyncTables() {
    console.log('Iniciando creación de tabla para Correos Inbound...');

    // SQL literal para crear la tabla
    const sql = `
        CREATE TABLE IF NOT EXISTS public.emails_inbound (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            message_id text UNIQUE NOT NULL,
            from_email text NOT NULL,
            from_name text,
            subject text,
            body_text text,
            received_at timestamptz DEFAULT now(),
            is_replied boolean DEFAULT false,
            ai_draft text,
            status text DEFAULT 'unread',
            created_at timestamptz DEFAULT now()
        );

        -- Habilitar RLS
        ALTER TABLE public.emails_inbound ENABLE ROW LEVEL SECURITY;

        -- Políticas
        DROP POLICY IF EXISTS "emails_inbound_read" ON public.emails_inbound;
        DROP POLICY IF EXISTS "emails_inbound_insert" ON public.emails_inbound;
        DROP POLICY IF EXISTS "emails_inbound_update" ON public.emails_inbound;
        
        CREATE POLICY "emails_inbound_read" ON public.emails_inbound FOR SELECT USING (true);
        CREATE POLICY "emails_inbound_insert" ON public.emails_inbound FOR INSERT WITH CHECK (true);
        CREATE POLICY "emails_inbound_update" ON public.emails_inbound FOR UPDATE USING (true);
        
        -- Dashboard access
        GRANT ALL ON public.emails_inbound TO anon;
        GRANT ALL ON public.emails_inbound TO authenticated;
        GRANT ALL ON public.emails_inbound TO service_role;
    `;

    // Intentar vía RPC exec_sql (si existe el helper)
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.log('--- ERROR RPC (Normal si no has creado el helper exec_sql) ---');
        console.log(error.message);
        console.log('\n=== COPIA Y PEGA ESTE SQL EN EL SQL EDITOR DE SUPABASE ===\n');
        console.log(sql);
    } else {
        console.log('Tabla de correos creada exitosamente.');
    }
}

initSyncTables().then(() => process.exit(0));
