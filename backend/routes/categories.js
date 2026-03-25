const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all categories data (combines categories, subcategories, third levels)
router.get('/', async (req, res) => {
    try {
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*');

        if (catError) throw catError;

        // We can also fetch subcategories or let frontend do it through separate endpoints
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get subcategories
router.get('/subcategories', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('subcategories')
            .select('*');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get third level categories
router.get('/third-level', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tercera_categoria')
            .select('*');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CATEGORIES ---
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('categories').insert([req.body]).select('*').single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('categories').update(req.body).eq('id', req.params.id).select('*').single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- SUBCATEGORIES ---
router.post('/subcategories', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('subcategories').insert([req.body]).select('*').single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/subcategories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('subcategories').update(req.body).eq('id', req.params.id).select('*').single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/subcategories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('subcategories').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- THIRD LEVEL ---
router.post('/third-level', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('tercera_categoria').insert([req.body]).select('*').single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/third-level/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('tercera_categoria').update(req.body).eq('id', req.params.id).select('*').single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/third-level/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('tercera_categoria').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
