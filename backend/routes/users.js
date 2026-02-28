const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tokenHeader = req.headers.authorization;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;

        if (!data && tokenHeader) {
            console.log(`[USERS] 👤 User ${id} not in public.users, attempting auto-sync...`);
            const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
                global: { headers: { Authorization: tokenHeader } },
                auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
            });

            const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser();

            if (!authError && authUser && authUser.id === id) {
                const newUser = {
                    id: authUser.id,
                    email: authUser.email,
                    name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
                    is_admin: authUser.email === 'admin@gmail.com' || authUser.email === 'admin@tienda.com'
                };

                const { data: created, error: createError } = await supabase
                    .from('users')
                    .insert([newUser])
                    .select('*')
                    .maybeSingle();

                if (!createError && created) {
                    console.log(`[USERS] ✅ User ${id} synced to public.users`);
                    return res.json(created);
                } else {
                    console.error(`[USERS] ❌ Failed to auto-sync user ${id}:`, createError);
                }
            }
        }

        if (!data) return res.json(null);
        res.json(data);
    } catch (error) {
        console.error(`[USERS] 💥 Error:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        console.log(`Updating user ${id} with:`, body);

        // Map frontend fields (camelCase) to DB fields (snake_case)
        const updates = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.email !== undefined) updates.email = body.email;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.address !== undefined) updates.address = body.address;
        if (body.city !== undefined) updates.city = body.city;
        if (body.province !== undefined) updates.province = body.province;
        if (body.postalCode !== undefined) updates.postal_code = body.postalCode;
        if (body.birthdate !== undefined) {
            updates.birthdate = body.birthdate === "" ? null : body.birthdate;
        }
        if (body.preferences !== undefined) updates.preferences = body.preferences;
        if (body.notifications !== undefined) updates.notifications = body.notifications;
        if (body.departmentNumber !== undefined) updates.department_number = body.departmentNumber;

        console.log("Applying updates to Supabase:", updates);

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select('*')
            .maybeSingle();

        if (error) {
            console.error("Supabase update error detail:", error);
            return res.status(error.code === 'PGRST116' ? 404 : 400).json({
                error: error.message,
                hint: error.hint,
                details: error.details
            });
        }

        if (!data) {
            console.log(`User ${id} not found in public.users table. Attempting to create (upsert)...`);
            updates.id = id;
            if (body.email) updates.email = body.email;

            const { data: newData, error: createError } = await supabase
                .from('users')
                .upsert(updates)
                .select('*')
                .single();

            if (createError) {
                console.error("Supabase upsert error detail:", createError);
                return res.status(400).json({
                    error: createError.message,
                    hint: createError.hint,
                    details: createError.details
                });
            }
            return res.json(newData);
        }

        res.json(data);
    } catch (error) {
        console.error("Unexpected Backend Error:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// Create user (for sync or initial creation)
router.post('/', async (req, res) => {
    try {
        const userData = req.body;
        const { data, error } = await supabase
            .from('users')
            .upsert(userData, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
