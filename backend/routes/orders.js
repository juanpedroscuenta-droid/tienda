const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET orders
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId;

        let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[ORDERS] ❌ Error fetching orders:', error);
            throw error;
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST new order
router.post('/', async (req, res) => {
    try {
        const orderData = req.body;
        console.log('[ORDERS] 📥 Nueva orden recibida:', JSON.stringify(orderData, null, 2));

        const { items, order_type, user_id } = orderData;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'La orden debe contener productos.' });
        }

        // 1. Process stock deduction (Usando cliente anon, permitido por RLS público en productos)
        console.log('[ORDERS] 🛒 Verificando stock...');
        const stockUpdates = [];
        for (const item of items) {
            const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('stock, name')
                .eq('id', item.id)
                .single();

            if (fetchError || !product) {
                console.error(`[ORDERS] ❌ Producto no encontrado: ${item.id}`, fetchError);
                return res.status(404).json({ error: `Producto no encontrado: ${item.name || item.id}` });
            }

            const currentStock = Number(product.stock || 0);
            const quantity = Number(item.quantity || 0);

            if (currentStock < quantity) {
                return res.status(400).json({
                    error: `Stock insuficiente para ${product.name}. Disponible: ${currentStock}, Solicitado: ${quantity}`
                });
            }

            stockUpdates.push({ id: item.id, newStock: currentStock - quantity });
        }

        // 2. Perform updates
        console.log('[ORDERS] 📉 Actualizando stock...');
        for (const update of stockUpdates) {
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock: update.newStock })
                .eq('id', update.id);

            if (updateError) console.error(`[ORDERS] ❌ Error stock ${update.id}:`, updateError);
        }

        // 3. Handle Coupon Usage if applicable
        const couponCodeRaw_old = orderData.coupon_code || orderData.couponCode || null;
        if (false) {
            const couponCode = couponCodeRaw_old.trim().toUpperCase();
            console.log(`[ORDERS] 🎫 Procesando cupón: ${couponCode}`);
            const { data: coupon, error: couponError } = await supabase
                .from('coupons')
                .select('id, usage_count, code')
                .eq('code', couponCode)
                .eq('is_active', true)
                .maybeSingle();

            if (couponError) {
                console.error(`[ORDERS] ❌ Error buscando cupón ${couponCode}:`, couponError);
            }

            if (!couponError && coupon) {
                console.log(`[ORDERS] ✨ Aplicando uso a cupón ID: ${coupon.id}`);
                // Increment usage count
                const { error: updError } = await supabase
                    .from('coupons')
                    .update({ usage_count: (coupon.usage_count || 0) + 1 })
                    .eq('id', coupon.id);

                if (updError) console.error(`[ORDERS] ❌ Error incrementando uso:`, updError);

                // Log detailed usage
                const { error: insError } = await supabase
                    .from('coupon_usage')
                    .insert([{
                        coupon_id: coupon.id,
                        user_id: user_id || null,
                        user_name: orderData.user_name || orderData.userName || 'Cliente',
                        user_email: orderData.user_email || orderData.userEmail || null,
                        order_id: null
                    }]);

                if (insError) console.error(`[ORDERS] ❌ Error registrando log de uso:`, insError);
                else console.log(`[ORDERS] ✅ Uso de cupón registrado correctamente`);
            } else if (!coupon) {
                console.warn(`[ORDERS] ⚠️ Cupón ${couponCode} no encontrado o inactivo durante el checkout.`);
            }
        }

        // 3. Insert order
        console.log('[ORDERS] 📝 Guardando orden...');
        const appliedCouponCode = orderData.coupon_code ? orderData.coupon_code.trim().toUpperCase() : (orderData.couponCode ? orderData.couponCode.trim().toUpperCase() : null);
        const payload = {
            user_id: user_id || null,
            user_name: orderData.user_name || orderData.userName || null,
            user_email: orderData.user_email || orderData.userEmail || null,
            user_phone: orderData.user_phone || orderData.userPhone || null,
            items: items,
            total: Number(orderData.total),
            delivery_fee: Number(orderData.delivery_fee || 0),
            order_notes: orderData.order_notes || orderData.orderNotes || null,
            status: orderData.status || 'pending',
            order_type: order_type || 'online',
            payment_method: orderData.payment_method || orderData.paymentMethod || null,
            discount_type: orderData.discount_type || orderData.discountType || 'none',
            discount_value: Number(orderData.discount_value || 0),
            coupon_code: appliedCouponCode,
            created_at: new Date().toISOString()
        };

        const { data: order, error: insertError } = await supabase
            .from('orders')
            .insert([payload])
            .select();

        if (insertError) {
            console.error('[ORDERS] ❌ Error insertando:', insertError);
            throw insertError;
        }

        // 4. Update usage log with order ID if we have it
        if (appliedCouponCode && order?.[0]?.id) {
            const { data: coupon } = await supabase
                .from('coupons')
                .select('id')
                .eq('code', appliedCouponCode)
                .single();

            if (coupon) {
                await supabase
                    .from('coupon_usage')
                    .update({ order_id: order[0].id })
                    .eq('coupon_id', coupon.id)
                    .is('order_id', null)
                    .order('used_at', { ascending: false })
                    .limit(1);
            }
        }

        console.log('[ORDERS] ✅ Éxito:', order?.[0]?.id);
        res.status(201).json(order?.[0]);
    } catch (error) {
        console.error('[ORDERS] 💥 Error crítico:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET order stats for dashboard
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();

        // Today's confirmed sales
        const { data: todayData, error: todayError } = await supabase
            .from('orders')
            .select('total')
            .gte('created_at', startOfDay)
            .eq('status', 'confirmed');

        if (todayError) throw todayError;
        const todaySales = todayData.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

        // Monthly confirmed sales
        const { data: monthData, error: monthError } = await supabase
            .from('orders')
            .select('total')
            .gte('created_at', startOfMonth)
            .eq('status', 'confirmed');

        if (monthError) throw monthError;
        const monthlySales = monthData.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

        // Last month sales
        const { data: lastMonthData, error: lastMonthError } = await supabase
            .from('orders')
            .select('total')
            .gte('created_at', startOfLastMonth)
            .lte('created_at', endOfLastMonth)
            .eq('status', 'confirmed');

        if (lastMonthError) throw lastMonthError;
        const lastMonthSales = lastMonthData.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

        res.json({
            todaySales,
            monthlySales,
            lastMonthSales,
            count: todayData.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET order by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Order not found' });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status or details
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const tokenHeader = req.headers.authorization;

        console.log(`[ORDERS] 🔄 Actualizando orden ${id}:`, updates);
        console.log(`[ORDERS] 🔑 Token presente:`, !!tokenHeader);

        const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: tokenHeader ? { Authorization: tokenHeader } : {} },
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        // Debug: Check who is the user
        const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser();
        console.log(`[ORDERS] 👤 Usuario autenticado:`, authUser ? authUser.email : 'No encontrado', authError || '');
        console.log(`[ORDERS] 🆔 ID usuario:`, authUser ? authUser.id : 'N/A');

        const { data, error } = await authSupabase
            .from('orders')
            .update(updates)
            .eq('id', id)
            .select('*')
            .maybeSingle();

        if (error) {
            console.error(`[ORDERS] ❌ Error Supabase al actualizar orden ${id}:`, error);
            throw error;
        }

        if (!data) {
            console.error(`[ORDERS] ⚠️ No se encontró la orden ${id} para actualizar. Posible restricción de RLS.`);
            return res.status(404).json({ error: 'No se encontró la orden o no tienes permisos para actualizarla.' });
        }

        console.log(`[ORDERS] ✅ Orden ${id} actualizada exitosamente`);
        res.json(data);
    } catch (error) {
        console.error(`[ORDERS] 💥 Error crítico actualizando orden ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tokenHeader = req.headers.authorization;

        const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: tokenHeader ? { Authorization: tokenHeader } : {} },
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        const { error } = await authSupabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`[ORDERS] ❌ Error Supabase al eliminar orden ${id}:`, error);
            throw error;
        }
        res.json({ success: true });
    } catch (error) {
        console.error(`[ORDERS] ❌ Error eliminando orden ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
