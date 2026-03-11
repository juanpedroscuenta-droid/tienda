const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const { createClient } = require('@supabase/supabase-js');
const { callAI } = require('../utils/ai');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Enviar correos masivos
router.post('/send-bulk', async (req, res) => {
    try {
        const { emails, subject, body, smtpConfig: clientConfig } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron correos destinatarios validos' });
        }

        if (!subject || !body) {
            return res.status(400).json({ message: 'El asunto y el cuerpo del mensaje son obligatorios' });
        }

        // Obtener configuración SMTP desde Supabase 'company_profile' o variables de entorno
        let smtpConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 465,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            fromName: process.env.SMTP_FROM_NAME || 'Administración de Tienda'
        };

        // Si el cliente nos envió una configuración guardada en su interfaz
        if (clientConfig && clientConfig.email && clientConfig.appPassword) {
            smtpConfig.host = clientConfig.smtpHost || smtpConfig.host;
            smtpConfig.port = parseInt(clientConfig.smtpPort) || smtpConfig.port;
            smtpConfig.user = clientConfig.email;
            smtpConfig.pass = clientConfig.appPassword;
        }

        // secure: true para port 465, false para otros puertos (como 587 o 25)
        smtpConfig.secure = smtpConfig.port === 465;

        if (!smtpConfig.user || !smtpConfig.pass) {
            return res.status(500).json({ message: 'La configuración SMTP no está completa. Por favor configure sus credenciales de correo electrónico en la configuración.' });
        }

        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure, // true for 465, false for other ports
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
            },
        });

        // Verificar conexión
        await transporter.verify();

        let successCount = 0;
        let failCount = 0;
        let errors = [];

        // Enviar correos secuencialmente para no reventar servidores de correo pequeños
        for (const email of emails) {
            try {
                await transporter.sendMail({
                    from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
                    to: email, // destinatario individual para privacidad
                    subject: subject,
                    text: body, // enviar como texto plano
                    // html: `<div>${body}</div>` // Opcional si admites HTML
                });
                successCount++;
            } catch (err) {
                console.error(`Error enviando a ${email}:`, err.message);
                failCount++;
                errors.push(err.message);
            }
        }

        if (successCount === 0 && failCount > 0) {
            return res.status(500).json({ message: 'Todos los intentos de envío fallaron.', errors: errors.slice(0, 3) });
        }

        res.status(200).json({
            message: 'Envío completado',
            successful: successCount,
            failed: failCount
        });

    } catch (error) {
        console.error('Error in POST /mail/send-bulk:', error);
        res.status(500).json({ message: 'Error interno conectando con el servidor de correo: ' + error.message });
    }
});

// Probar conexión SMTP
router.post('/test-smtp', async (req, res) => {
    try {
        const { smtpConfig: clientConfig } = req.body;

        if (!clientConfig || !clientConfig.email || !clientConfig.appPassword) {
            return res.status(400).json({ message: 'Faltan credenciales para la prueba.' });
        }

        const transporter = nodemailer.createTransport({
            host: clientConfig.smtpHost || 'smtp.gmail.com',
            port: parseInt(clientConfig.smtpPort) || 465,
            secure: parseInt(clientConfig.smtpPort) === 465,
            auth: {
                user: clientConfig.email,
                pass: clientConfig.appPassword,
            },
        });

        await transporter.verify();
        res.status(200).json({ message: 'Conexión SMTP exitosa.' });

    } catch (error) {
        console.error('[MAIL TEST ERROR]', error);
        res.status(500).json({ message: 'Fallo conexión SMTP: ' + error.message });
    }
});

// Enviar correo de confirmación de pedido al cliente
router.post('/send-order-confirmation', async (req, res) => {
    try {
        const { order, smtpConfig: clientConfig } = req.body;

        if (!order || !order.userEmail) {
            return res.status(400).json({ message: 'Faltan datos del pedido o email del cliente.' });
        }

        // Configuración SMTP
        let smtpConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 465,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            fromName: process.env.SMTP_FROM_NAME || 'Tienda Online'
        };

        if (clientConfig && clientConfig.email && clientConfig.appPassword) {
            smtpConfig.host = clientConfig.smtpHost || smtpConfig.host;
            smtpConfig.port = parseInt(clientConfig.smtpPort) || smtpConfig.port;
            smtpConfig.user = clientConfig.email;
            smtpConfig.pass = clientConfig.appPassword;
            smtpConfig.fromName = clientConfig.fromName || smtpConfig.fromName;
        }

        smtpConfig.secure = smtpConfig.port === 465;

        if (!smtpConfig.user || !smtpConfig.pass) {
            return res.status(500).json({ message: 'La configuración SMTP no está completa.' });
        }

        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
            },
        });

        await transporter.verify();

        // Construir lista de productos en HTML
        const itemsHtml = (order.items || []).map(item => `
            <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 8px; border: 1px solid #eee;" />` : ''}
                        <div>
                            <strong style="color: #1a1a1a; font-size: 14px;">${item.name}</strong>
                            ${item.selectedColor ? `<br/><span style="font-size: 12px; color: #666;">Color: ${item.selectedColor.name}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #666; font-size: 14px;">
                    ${item.quantity}
                </td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; color: #1a1a1a; font-size: 14px;">
                    $${(item.price * item.quantity).toLocaleString('es-CO')}
                </td>
            </tr>
        `).join('');

        const total = typeof order.total === 'number' ? order.total.toLocaleString('es-CO') : '0';
        const orderDate = new Date().toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d47a1 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                        ✅ ¡Pedido Confirmado!
                    </h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">
                        Tu pedido ha sido procesado exitosamente
                    </p>
                </div>

                <!-- Body -->
                <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    
                    <!-- Greeting -->
                    <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
                        Hola <strong>${order.userName || 'Cliente'}</strong>,
                        <br/>
                        Tu pedido ha sido <strong style="color: #16a34a;">confirmado</strong> y se encuentra en preparación.
                    </p>

                    <!-- Order Info -->
                    <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">ID del Pedido</span>
                            <span style="font-weight: 700; font-size: 13px; color: #1e3a5f;">${order.id ? order.id.substring(0, 8).toUpperCase() : 'N/A'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Fecha de Confirmación</span>
                            <span style="font-weight: 600; font-size: 13px; color: #334155;">${orderDate}</span>
                        </div>
                    </div>

                    <!-- Products Table -->
                    <h3 style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 12px;">
                        Productos del pedido
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Producto</th>
                                <th style="padding: 10px 16px; text-align: center; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Cant.</th>
                                <th style="padding: 10px 16px; text-align: right; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <!-- Total -->
                    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d47a1 100%); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                        <span style="color: rgba(255,255,255,0.7); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total del Pedido</span>
                        <div style="color: white; font-size: 32px; font-weight: 900; margin-top: 4px;">
                            $${total}
                        </div>
                    </div>

                    ${order.orderNotes ? `
                    <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <strong style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">📝 Notas del pedido</strong>
                        <p style="color: #78350f; margin: 8px 0 0; font-size: 14px;">${order.orderNotes}</p>
                    </div>
                    ` : ''}

                    <!-- Footer Message -->
                    <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                        <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                            Gracias por tu compra. Si tienes alguna pregunta, no dudes en contactarnos.
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 11px;">
                    <p style="margin: 0;">Este correo fue enviado automáticamente. Por favor no responda directamente a este mensaje.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: `"${smtpConfig.fromName}" <${smtpConfig.user}>`,
            to: order.userEmail,
            subject: `✅ Pedido Confirmado - #${order.id ? order.id.substring(0, 8).toUpperCase() : ''}`,
            html: htmlBody,
        });

        console.log(`[MAIL] ✅ Confirmación enviada a ${order.userEmail}`);
        res.status(200).json({ message: 'Correo de confirmación enviado exitosamente', email: order.userEmail });

    } catch (error) {
        console.error('[MAIL] ❌ Error enviando confirmación:', error);
        res.status(500).json({ message: 'Error al enviar correo de confirmación: ' + error.message });
    }
});

// --- 📧 NUEVAS FUNCIONES PARA RECIBIR Y AUTOMATIZAR ---

// Listar correos recibidos desde la DB
router.get('/inbound', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('emails_inbound')
            .select('*')
            .order('received_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Forzar sincronización con el servidor de correo (IMAP)
router.post('/sync', async (req, res) => {
    console.log('[IMAP] Iniciando petición de sincronización...');
    try {
        const { smtpConfig: clientConfig } = req.body;

        const config = {
            user: clientConfig?.email || process.env.SMTP_USER,
            password: clientConfig?.appPassword || process.env.SMTP_PASS,
            host: clientConfig?.imapHost || process.env.IMAP_HOST || 'imap.gmail.com',
            port: parseInt(clientConfig?.imapPort) || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        };

        if (!config.user || !config.password) {
            console.warn('[IMAP] Credenciales incompletas.');
            return res.status(400).json({ message: 'Faltan credenciales de correo (user/pass).' });
        }

        console.log(`[IMAP] Conectando a ${config.host}:${config.port} como ${config.user}...`);
        const imap = new Imap(config);

        const openBox = (cb) => {
            imap.openBox('INBOX', false, cb);
        };

        let responseSent = false;

        imap.once('ready', () => {
            console.log('[IMAP] Conexión establecida. Abriendo INBOX...');
            openBox((err, box) => {
                if (err) {
                    console.error('[IMAP ERROR BOX]', err);
                    if (!responseSent) {
                        responseSent = true;
                        res.status(500).json({ error: 'Fallo al abrir INBOX: ' + err.message });
                    }
                    imap.end();
                    return;
                }

                // Buscar los últimos 20 mensajes
                imap.search(['ALL'], (err, results) => {
                    if (err) {
                        console.error('[IMAP ERROR SEARCH]', err);
                        if (!responseSent) {
                            responseSent = true;
                            res.status(500).json({ error: 'Fallo al buscar correos: ' + err.message });
                        }
                        imap.end();
                        return;
                    }

                    if (!results || results.length === 0) {
                        console.log('[IMAP] Buzón vacío.');
                        imap.end();
                        if (!responseSent) {
                            responseSent = true;
                            return res.json({ message: 'Buzón vacío.' });
                        }
                        return;
                    }

                    const lastResults = results.slice(-20); // Últimos 20
                    console.log(`[IMAP] Descargando ${lastResults.length} mensajes...`);
                    const f = imap.fetch(lastResults, { bodies: '' });
                    let downloaded = 0;

                    f.on('message', (msg, seqno) => {
                        msg.on('body', (stream, info) => {
                            simpleParser(stream, async (err, parsed) => {
                                if (!err) {
                                    try {
                                        // Guardar en Supabase asegurando que sea único
                                        const { error: upsertError } = await supabase.from('emails_inbound').upsert({
                                            message_id: parsed.messageId || `msg_${seqno}_${Date.now()}`,
                                            from_email: parsed.from?.value[0]?.address || 'unknown',
                                            from_name: parsed.from?.value[0]?.name || 'Unknown',
                                            subject: parsed.subject || '(Sin Asunto)',
                                            body_text: parsed.text || parsed.html || '(Sin contenido)',
                                            received_at: parsed.date || new Date().toISOString(),
                                            status: 'unread'
                                        }, { onConflict: 'message_id' });

                                        if (upsertError) {
                                            console.error('[IMAP SUPABASE ERROR]', upsertError.message);
                                            // Si la tabla no existe, informamos pero intentamos seguir con otros
                                            if (upsertError.code === 'PGRST116' || upsertError.message.includes('not found')) {
                                                console.error('[IMAP] Error: La tabla emails_inbound no parece existir.');
                                            }
                                        }
                                    } catch (upsertFail) {
                                        console.error('[IMAP UPSERT CRASH]', upsertFail.message);
                                    }
                                }

                                downloaded++;
                                if (downloaded === lastResults.length) {
                                    console.log('[IMAP] Descarga finalizada.');
                                    imap.end();
                                }
                            });
                        });
                    });

                    f.once('error', (err) => {
                        console.error('[IMAP FETCH ERROR]', err);
                        imap.end();
                    });
                });
            });
        });

        imap.once('error', (err) => {
            console.error('[IMAP GLOBAL ERROR]', err);
            if (!responseSent) {
                responseSent = true;
                res.status(500).json({ error: 'Error IMAP: ' + err.message });
            }
        });

        imap.once('end', () => {
            console.log('[IMAP] Conexión cerrada.');
            if (!responseSent) {
                responseSent = true;
                res.json({ message: 'Sincronización completada correctamente.' });
            }
        });

        imap.connect();

    } catch (e) {
        console.error('[IMAP CATCH]', e);
        if (!responseSent) {
            res.status(500).json({ error: e.message });
        }
    }
});

// Generar borrador de respuesta con IA
router.post('/generate-reply/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Obtener el correo
        const { data: email, error: e1 } = await supabase.from('emails_inbound').select('*').eq('id', id).single();
        if (!email) return res.status(404).json({ error: 'Correo no encontrado.' });

        // 2. Obtener ajustes del chatbot (para la API Key e instrucciones)
        const { data: bot, error: e2 } = await supabase.from('chatbot_settings').select('*').maybeSingle();
        if (!bot || !bot.api_key) return res.status(400).json({ error: 'Configura el ChatBot IA primero.' });

        const prompt = `Un cliente ha enviado este correo:\nASUNTO: ${email.subject}\nCUERPO: ${email.body_text}\n\nGenera una respuesta profesional, amable y corta. Si pregunta por productos, menciona que puede verlos en la web 24/7. Firma como "Soporte al Cliente".`;
        const systemPrompt = bot.prompt || "Eres un asistente de ventas profesional.";

        const draft = await callAI(prompt, systemPrompt, {
            provider: bot.provider,
            apiKey: bot.api_key
        });

        // 3. Guardar borrador en la DB
        await supabase.from('emails_inbound').update({ ai_draft: draft }).eq('id', id);

        res.json({ draft });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
