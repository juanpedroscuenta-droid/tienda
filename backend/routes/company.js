const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get company profile
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('company_profile')
            .select('*')
            .maybeSingle();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upsert company profile
router.post('/', async (req, res) => {
    try {
        const profileData = req.body;
        console.log('[BACKEND] Recibido payload para company_profile:', JSON.stringify(profileData, null, 2));

        const { data, error } = await supabase
            .from('company_profile')
            .upsert(profileData, { onConflict: 'id' })
            .select();

        if (error) {
            console.error('[BACKEND] Error de Supabase en upsert company_profile:', error);
            return res.status(500).json({ error: error.message, details: error.details, hint: error.hint });
        }

        console.log('[BACKEND] Upsert exitoso:', data?.[0]);
        res.json(data?.[0] || null);
    } catch (error) {
        console.error('[BACKEND] Error crítico en POST /company:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
