const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get all filters with their options
router.get('/', async (req, res) => {
    try {
        // Fetch filters
        const { data: filters, error: filterError } = await supabase
            .from('filters')
            .select('*');

        if (filterError) {
            console.error('Error fetching filters:', filterError);
            return res.json([]);
        }

        // Fetch options for these filters
        const { data: options, error: optionsError } = await supabase
            .from('filter_options')
            .select('*');

        if (optionsError) {
            console.error('Error fetching filter options:', optionsError);
            return res.json([]);
        }

        // Combine filters with their options
        const result = filters.map(filter => ({
            ...filter,
            id: filter.id,
            name: filter.name,
            order: filter.order_index || 0,
            options: (options || [])
                .filter(opt => opt.filter_id === filter.id)
                .map(opt => ({
                    id: opt.id,
                    name: opt.name,
                    order: opt.order_index || 0
                }))
        }));

        res.json(result);
    } catch (error) {
        console.error('Exception in GET /api/filters:', error);
        res.json([]); // Return empty array instead of 500 to keep UI working
    }
});

// Create filter
router.post('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('filters').insert([req.body]).select('*').single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add option to filter
router.post('/options', async (req, res) => {
    try {
        const { data, error } = await supabase.from('filter_options').insert([req.body]).select('*').single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all filter groups (tags)
router.get('/groups', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('filter_groups')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching filter groups:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
