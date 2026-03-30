const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { authenticateToken, isAdmin } = require('../middleware/auth');
const { scrapeProducts } = require('../utils/product-scraper');

// Simple in-memory cache for category nodes to speed up recursive lookups
let cachedCatNodes = null;
let lastCatCacheTime = 0;
const CAT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCatNodes() {
    const now = Date.now();
    if (cachedCatNodes && (now - lastCatCacheTime < CAT_CACHE_DURATION)) {
        return cachedCatNodes;
    }
    const { data } = await supabase.from('categories').select('id, parent_id');
    cachedCatNodes = data || [];
    lastCatCacheTime = now;
    return cachedCatNodes;
}

// Get all published products (with pagination and filters)
router.get('/', async (req, res) => {
    try {
        const { 
            limit = 24, 
            offset = 0, 
            category_id, 
            category_name, 
            search,
            sort = 'updated_at',
            order = 'desc'
        } = req.query;

        let query = supabase
            .from('products')
            .select('*, suppliers(name)', { count: 'exact' })
            .eq('is_published', true);

        // Apply Search
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        // Apply Category Filter (including subcategories)
        if (category_id && category_id !== 'all') {
            const catNodes = await getCatNodes();
            const catIds = new Set([category_id]);
            const addChildren = (pid) => {
                catNodes.filter(c => c.parent_id === pid).forEach(c => {
                    if (!catIds.has(c.id)) {
                        catIds.add(c.id);
                        addChildren(c.id);
                    }
                });
            };
            addChildren(category_id);
            query = query.in('category_id', Array.from(catIds));
        } else if (category_name && category_name !== 'Todos' && category_name !== 'all') {
            const { data: targetCat } = await supabase.from('categories').select('id').ilike('name', category_name).maybeSingle();
            
            if (targetCat) {
                const catNodes = await getCatNodes();
                const catIds = new Set([targetCat.id]);
                const addChildren = (pid) => {
                    catNodes.filter(c => c.parent_id === pid).forEach(c => {
                        if (!catIds.has(c.id)) {
                            catIds.add(c.id);
                            addChildren(c.id);
                        }
                    });
                };
                addChildren(targetCat.id);
                
                const idsString = Array.from(catIds).join(',');
                query = query.or(`category_id.in.(${idsString}),category_name.ilike.%${category_name}%`);
            } else {
                query = query.or(`category_name.ilike.%${category_name}%,category.ilike.%${category_name}%`);
            }
        }

        // Apply Sorting
        query = query.order(sort, { ascending: order === 'asc' });

        // Apply Pagination
        const start = parseInt(offset);
        const end = start + parseInt(limit) - 1;
        
        const { data, count, error } = await query.range(start, end);

        if (error) throw error;
        
        res.json({
            products: data,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
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

// Get a single product by slug or ID
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // 1. Intentar por ID exacto si el slug parece un UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(slug)) {
            const { data: p, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', slug)
                .is('is_published', true)
                .maybeSingle();
            if (p && !error) return res.json(p);
        }

        // 2. Intentar buscar por el campo 'slug' si existiera (muchos usuarios lo agregan)
        const { data: productBySlug, error: slugError } = await supabase
            .from('products')
            .select('*')
            .eq('slug', slug)
            .is('is_published', true)
            .maybeSingle();
        
        if (productBySlug && !slugError) return res.json(productBySlug);

        // 3. Fallback: Buscar por nombre similar (ilike) y luego filtrar con slugify en JS
        // Esto es mucho más eficiente que traer TODO. Traemos solo los que coinciden un poco con las palabras del slug.
        const searchTerms = slug.split('-').filter(t => t.length > 2);
        let query = supabase.from('products').select('*').is('is_published', true);
        
        if (searchTerms.length > 0) {
            query = query.ilike('name', `%${searchTerms[0]}%`);
        } else {
            // Si es muy corto, traemos los últimos 100 para no fallar pero no traer mil
            query = query.limit(100);
        }

        const { data: candidates, error: candidateError } = await query;

        if (candidateError) throw candidateError;

        // Simulate frontend slugify logic
        const slugify = (text) => text.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase();

        const matchingProduct = candidates?.find((p) => slugify(p.name || '') === slug);

        if (!matchingProduct) {
            // Último esfuerzo: si no se encontró, buscamos uno por aproximación de nombre si el slug es el nombre
            const { data: approx } = await supabase
                .from('products')
                .select('*')
                .is('is_published', true)
                .ilike('name', slug.replace(/-/g, ' '))
                .limit(1)
                .maybeSingle();
            
            if (approx) return res.json(approx);

            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(matchingProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get featured/newest products for carousel
router.get('/featured', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products with offers/discounts
router.get('/offers', async (req, res) => {
    try {
        const { limit = 12 } = req.query;
        // Logic: is_offer is true OR discount > 0
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true)
            .or('is_offer.eq.true,discount.gt.0')
            .order('updated_at', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all products (admin view - includes unpublished) - PROTEGIDO
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        const { data, count, error } = await supabase
            .from('products')
            .select('*, suppliers(name)', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (error) throw error;
        res.json({ products: data, total: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single product by ID (admin view) - PROTEGIDO
router.get('/admin/:id', authenticateToken, isAdmin, async (req, res) => {
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

// Create product - PROTEGIDO
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const productData = req.body;

        // Define known valid columns for Supabase 'products' table
        const validColumns = [
            'name', 'description', 'price', 'original_price', 'discount', 'cost',
            'image', 'additional_images', 'category', 'category_id', 'category_name',
            'subcategory', 'subcategory_name', 'tercera_categoria', 'tercera_categoria_name',
            'stock', 'is_published', 'is_offer', 'specifications', 'benefits',
            'warranties', 'payment_methods', 'colors', 'brand', 'featured', 'slug', 'supplier_id'
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

// Update product - PROTEGIDO
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const productData = req.body;

        const validColumns = [
            'name', 'description', 'price', 'original_price', 'discount', 'cost',
            'image', 'additional_images', 'category', 'category_id', 'category_name',
            'subcategory', 'subcategory_name', 'tercera_categoria', 'tercera_categoria_name',
            'stock', 'is_published', 'is_offer', 'specifications', 'benefits',
            'warranties', 'payment_methods', 'colors', 'brand', 'featured', 'slug', 'supplier_id'
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

// Scrape product from URL
router.post('/scrape', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const scrapedData = await scrapeProducts(url);
        res.json(scrapedData);
    } catch (error) {
        console.error('Error in /scrape:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
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
