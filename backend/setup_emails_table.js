require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEmailsTable() {
    console.log('--- 📧 Creating "emails_inbound" table ---');

    // Comprobar la tabla 'emails_inbound'
    // Como no podemos correr SQL arbitrario directamente desde el JS de Supabase si no está habilitado rpc o similar
    // Vamos a intentar un query simple para ver si existe, sino, daremos la instrucción de crearla en el panel.

    // Dejo aquí el SQL para que el usuario o nosotros lo corramos en el dashboard si el script falla.
    const SQL = `
      -- 1. Crear tabla para correos recibidos
      CREATE TABLE IF NOT EXISTS public.emails_inbound (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          message_id text UNIQUE,
          from_email text NOT NULL,
          from_name text,
          subject text,
          body_text text,
          received_at timestamptz DEFAULT now(),
          is_replied boolean DEFAULT false,
          ai_draft text, -- Un borrador generado por la IA
          status text DEFAULT 'unread', -- 'unread', 'read', 'archived', 'auto_replied'
          created_at timestamptz DEFAULT now()
      );

      -- 2. Habilitar RLS
      ALTER TABLE public.emails_inbound ENABLE ROW LEVEL SECURITY;

      -- 3. Políticas para admin
      CREATE POLICY "Admin can do everything with emails" ON public.emails_inbound
      FOR ALL USING (auth.role() = 'authenticated');
    `;

    console.log('----------------------------------------------------');
    console.log('IMPORTANTE: Copia este SQL en tu panel de Supabase SQL Editor:');
    console.log(SQL);
    console.log('----------------------------------------------------');

    // Intentamos crear una fila de prueba solo para ver si el esquema ya existe o si podemos "forzar" algo.
    // Pero lo ideal es que el usuario lo pegue en el editor SQL.

    try {
        const { error } = await supabase.from('emails_inbound').select('count', { count: 'exact', head: true });
        if (error) {
            console.log('⚠️ La tabla no parece existir aún. Por favor crea la tabla en el Dashboard de Supabase usando el SQL de arriba.');
        } else {
            console.log('✅ La tabla "emails_inbound" ya existe.');
        }
    } catch (e) {
        console.log('⚠️ Error verificando tabla:', e.message);
    }
}

createEmailsTable();
