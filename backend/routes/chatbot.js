const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get chatbot settings
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('chatbot_settings')
            .select('*')
            .maybeSingle();

        if (error) throw error;
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upsert chatbot settings
router.post('/', async (req, res) => {
    try {
        const settingsData = req.body;

        // Ensure we always have an ID or fixed key if necessary
        // For a single settings row, we can use a fixed ID like 1
        if (!settingsData.id) {
            settingsData.id = 1;
        }

        const { data, error } = await supabase
            .from('chatbot_settings')
            .upsert(settingsData, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
