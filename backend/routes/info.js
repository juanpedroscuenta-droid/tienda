const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get all info sections
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('info_sections')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific info section by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('info_sections')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upsert info section
router.post('/', async (req, res) => {
    try {
        const sectionData = req.body;
        const { data, error } = await supabase
            .from('info_sections')
            .upsert(sectionData, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
