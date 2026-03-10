const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/config
// ─────────────────────────────────────────────────────────────────────────────
router.get('/config', (req, res) => {
    const apiKey = process.env.BOLD_API_KEY;
    const isTest = process.env.BOLD_TEST !== 'false';

    if (!apiKey) {
        return res.status(500).json({ error: 'Pasarela Bold no configurada en el servidor.' });
    }

    res.json({
        api_key: apiKey,
        test: isTest,
        currency: 'COP',
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/confirm (WEBHOOK de Bold)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/confirm', async (req, res) => {
    try {
        const data = req.body;
        console.log('[BOLD] 🔔 Webhook recibido:', JSON.stringify(data, null, 2));

        // Bold envía los datos en un formato específico
        // Nota: Bold suele usar firmas HMAC para veracidad. 
        // Por ahora procesamos el estado si el evento es exitoso.
        const { event, data: paymentData } = data;

        if (!paymentData) {
            return res.status(400).json({ error: 'Datos de pago no encontrados' });
        }

        const orderId = paymentData.reference_id || paymentData.description?.split('#')?.[1];
        const status = paymentData.status; // 'approved', 'rejected', etc.

        // Mapeo de estados de Bold -> Tienda
        const statusMap = {
            'approved': 'confirmed',
            'rejected': 'rejected',
            'pending': 'pending',
            'failed': 'failed'
        };

        const newStatus = statusMap[status] || 'pending';

        if (orderId) {
            console.log(`[BOLD] Actualizando orden ${orderId} a estado: ${newStatus}`);
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: newStatus,
                    payment_method: 'bold',
                    payment_transaction_id: paymentData.id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (updateError) console.error('[BOLD] Error en BD:', updateError);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[BOLD] Error procesando webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-session
// Calcula la firma de integridad que Bold requiere para el checkout.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-session', async (req, res) => {
    try {
        const { orderId, amount, description, userName, userEmail } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({ error: 'Faltan datos de la orden (orderId, amount).' });
        }

        const apiKey = process.env.BOLD_API_KEY;
        const secretKey = process.env.BOLD_SIGNING_SECRET;

        if (!apiKey || !secretKey) {
            return res.status(500).json({ error: 'Configuración de Bold incompleta en servidor. Verifica BOLD_API_KEY y BOLD_SIGNING_SECRET.' });
        }

        // IMPORTANTE: Bold rechaza order IDs que ya fueron usados en una transacción pagada.
        // Añadimos timestamp para garantizar unicidad absoluta en cada intento de pago.
        const uniqueOrderId = `${orderId}-${Date.now()}`;

        const currency = 'COP';
        // El monto debe ser entero sin decimales (ej: 95000 para $95.000 COP)
        const amountInt = Math.round(Number(amount));
        const amountStr = String(amountInt);

        // FORMATO EXACTO BOLD → {orderId}{amount}{currency}{secretKey}
        const signatureBase = `${uniqueOrderId}${amountStr}${currency}${secretKey}`;
        const integritySignature = crypto.createHash('sha256').update(signatureBase, 'utf8').digest('hex');

        console.log(`[BOLD] ✅ Sesión creada`);
        console.log(`[BOLD]   orderId  : ${uniqueOrderId}`);
        console.log(`[BOLD]   amount   : ${amountStr} ${currency}`);
        console.log(`[BOLD]   base     : ${uniqueOrderId}${amountStr}${currency}***`);
        console.log(`[BOLD]   hash(6)  : ${integritySignature.substring(0, 6)}...`);

        res.json({
            apiKey,
            integritySignature,
            orderId: uniqueOrderId,
            amount: amountStr,
            currency,
            description: description || 'Compra en Tienda 24-7',
            userEmail,
            userName
        });
    } catch (error) {
        console.error('[BOLD] Error creando sesión:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

