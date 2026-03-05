const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get all published products
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test token
router.get('/test-token', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        });
        const { data, error } = await authSupabase.from('products').select('*').limit(1);
        if (error) throw error;
        // Log the keys!
        console.log('Product columns from auth:', Object.keys(data[0] || {}));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single product by slug (simulated here by checking name)
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { data: allProducts, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true);

        if (error) throw error;

        // Simulate frontend slugify logic
        const slugify = (text) => text.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase();

        const matchingProduct = allProducts?.find((p) => slugify(p.name || '') === slug);

        if (!matchingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(matchingProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all products (admin view - includes unpublished)
router.get('/admin/all', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(300);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single product by ID (admin view)
router.get('/admin/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // Fetch associated filter groups
        const { data: groups, error: groupsError } = await supabase
            .from('product_filter_groups')
            .select('filter_group_id')
            .eq('product_id', id);

        if (!groupsError && groups) {
            product.filter_groups = groups.map(g => g.filter_group_id);
        } else {
            product.filter_groups = [];
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        const productData = req.body;

        // Define known valid columns for Supabase 'products' table
        const validColumns = [
            'name', 'description', 'price', 'original_price', 'discount', 'cost',
            'image', 'additional_images', 'category', 'category_id', 'category_name',
            'subcategory', 'subcategory_name', 'tercera_categoria', 'tercera_categoria_name',
            'stock', 'is_published', 'is_offer', 'specifications', 'benefits',
            'warranties', 'payment_methods', 'colors', 'brand', 'featured', 'slug'
        ];

        const cleanData = {};
        for (const key of validColumns) {
            if (productData[key] !== undefined) {
                cleanData[key] = productData[key];
            }
        }

        const tokenHeader = req.headers.authorization;
        console.log('Inserting clean product data:', JSON.stringify(cleanData, null, 2));
        console.log('Auth token present:', !!tokenHeader);

        const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: tokenHeader ? { Authorization: tokenHeader } : {} },
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        const { data, error } = await authSupabase
            .from('products')
            .insert([cleanData])
            .select('*')
            .single();

        if (error) {
            console.error('Supabase error creating product:', error);
            throw error;
        }

        console.log('Product created successfully with specs:', JSON.stringify(data.specifications));
        res.status(201).json(data);
    } catch (error) {
        console.error('Catch error in POST /api/products:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const productData = req.body;

        const validColumns = [
            'name', 'description', 'price', 'original_price', 'discount', 'cost',
            'image', 'additional_images', 'category', 'category_id', 'category_name',
            'subcategory', 'subcategory_name', 'tercera_categoria', 'tercera_categoria_name',
            'stock', 'is_published', 'is_offer', 'specifications', 'benefits',
            'warranties', 'payment_methods', 'colors', 'brand', 'featured', 'slug'
        ];

        const cleanData = {};
        for (const key of validColumns) {
            if (productData[key] !== undefined) {
                cleanData[key] = productData[key];
            }
        }

        const tokenHeader = req.headers.authorization;
        const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: tokenHeader ? { Authorization: tokenHeader } : {} },
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        console.log('Updating product ID:', id);
        console.log('Clean data for update:', JSON.stringify(cleanData, null, 2));

        const { data, error } = await authSupabase
            .from('products')
            .update(cleanData)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error('Supabase error updating product:', error);
            throw error;
        }

        console.log('Product updated successfully. Returned specs:', JSON.stringify(data.specifications));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
