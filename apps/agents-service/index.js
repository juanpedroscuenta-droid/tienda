require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Logger to see all incoming traffic
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// CONFIGURATION - These values come from your Meta Developer Dashboard
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// SUPABASE CONFIGURATION
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// GEMINI CONFIGURATION (Eyes for Sebas)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Usamos gemini-1.5-flash que es el más rápido y compatible con visión
const visionModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// Memory to store user state (In production, use a Database like Redis or MongoDB)
const userSessions = {};

// CONFIGURATION - Meta Policies Safety
const RATE_LIMIT_MS = 2000; // Wait 2 seconds between responses per user to avoid "Spam" flags

// Temporary memory to avoid processing the same message ID multiple times (Meta retries)
const processedMessages = new Set();
const MAX_PROCESSED_MESSAGES = 1000;

/**
 * 1. WEBHOOK VERIFICATION (GET)
 * Meta will ping this URL to verify your server.
 * You must put the SAME 'VERIFY_TOKEN' here and in the Meta Dashboard.
 */
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully!');
        return res.status(200).send(challenge);
    }

    console.error('❌ Verification failed. Check your VERIFY_TOKEN.');
    res.sendStatus(403);
});

app.post('/webhook', (req, res) => {
    // --- CRITICAL: Respond 200 OK immediately to Meta ---
    res.status(200).send('EVENT_RECEIVED');

    const body = req.body;
    if (body.object === 'whatsapp_business_account') {

        if (body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]) {

            const message = body.entry[0].changes[0].value.messages[0];
            const senderId = message.from;
            const messageId = message.id;
            const timestamp = parseInt(message.timestamp);
            const nowSeconds = Math.floor(Date.now() / 1000);

            // ⛔ SEGURIDAD 1: Ignorar mensajes de hace más de 60 segundos
            if (nowSeconds - timestamp > 60) {
                console.log(`⏳ Ignorando mensaje antiguo de ${senderId} (hace ${nowSeconds - timestamp}s)`);
                return;
            }

            // --- SYNC WITH CRM PANEL (Port 3005) ---
            axios.post('http://localhost:3005/webhook', body).catch(() => { });

            let messageText = message.text ? message.text.body : '';
            const isImage = message.type === 'image';
            const isAudio = message.type === 'audio' || message.type === 'voice';
            const mediaId = isImage ? message.image.id : (isAudio ? (message.audio ? message.audio.id : message.voice.id) : null);

            // ⛔ SEGURIDAD 2: Ignorar si no hay texto/imagen/audio (Evita bucles de sistema)
            if (!messageText && !isImage && !isAudio) {
                return;
            }

            // ⛔ SEGURIDAD 3: Persistencia de IDs para no repetir tras reiniciar
            let persistentIds = [];
            try {
                if (fs.existsSync('processed_ids.json')) {
                    persistentIds = JSON.parse(fs.readFileSync('processed_ids.json', 'utf8'));
                }
            } catch (e) { }

            if (processedMessages.has(messageId) || persistentIds.includes(messageId)) {
                return;
            }

            processedMessages.add(messageId);
            persistentIds.push(messageId);

            // Guardar solo los últimos 500 para no hacer pesado el archivo
            if (persistentIds.length > 500) persistentIds.shift();
            fs.writeFileSync('processed_ids.json', JSON.stringify(persistentIds));

            console.log(`♻️ Nuevo mensaje registrado: ${messageId}`);

            // --- SEGURIDAD 4: Inicialización de Sesión Obligatoria ---
            if (!userSessions[senderId]) {
                userSessions[senderId] = { history: [], lastMessageTime: 0, transferred: false };
            }

            // --- POLICY COMPLIANCE: RATE LIMITING ---
            const now = Date.now();
            const lastTime = userSessions[senderId].lastMessageTime || 0;
            if (now - lastTime < RATE_LIMIT_MS) {
                console.log(`⚠️ Rate limit hit for ${senderId}. Ignoring message.`);
                return;
            }
            userSessions[senderId].lastMessageTime = now;

            // --- USER STATUS: Silent if human transferred ---
            if (userSessions[senderId].transferred) {
                return;
            }

            // --- DETECCIÓN DE PAGOS POR TEXTO ---
            const paymentKeywords = ['pagué', 'pague', 'comprobante', 'transferencia', 'nequi', 'daviplata', 'recibo', 'ticket', 'consignación', 'paga'];
            const isPaymentText = messageText && paymentKeywords.some(k => messageText.toLowerCase().includes(k));

            if (isPaymentText && !isImage && !isAudio) {
                userSessions[senderId].transferred = true;
                axios.post('http://localhost:3005/api/crm/chats/intervention/' + senderId, {
                    reason: "Cliente reporta pago por texto: " + messageText,
                    type: "payment"
                }).catch(() => { });
                return sendWhatsAppMessage(senderId, "¡Excelente! Dame un momento, confirmo tu pago y te atiendo de inmediato para finalizar tu pedido. 👨‍💻✅");
            }

            // Update history only (timer was already updated above)
            userSessions[senderId].history = userSessions[senderId].history || [];
            console.log(`📩 Message from ${senderId}: "${messageText}"`);

            // --- POLICY COMPLIANCE: HUMAN HANDOFF ---
            if (userSessions[senderId]?.transferred) {
                console.log(`👤 User ${senderId} is in human handoff mode. Bot is silent.`);
                return;
            }

            // --- HUMAN EFFECT: Mark as read and start typing ---
            sendWhatsAppAction(senderId, "mark_as_read", messageId).catch(() => { });
            sendWhatsAppAction(senderId, "typing_on").catch(() => { });

            // --- PROCESS ASYNCHRONOUSLY ---
            (async () => {
                try {
                    let textToProcess = messageText;

                    if (isImage && mediaId) {
                        console.log(`📸 Foto recibida de ${senderId}. Identificando...`);
                        sendWhatsAppMessage(senderId, "¡Veo que me envió una foto! Déjeme ver qué repuesto es... 🧐").catch(() => { });

                        const identification = await identifyPartFromImage(mediaId);
                        if (identification === 'RECEIPT') {
                            const session = userSessions[senderId];
                            session.transferred = true;
                            axios.post('http://localhost:3005/api/crm/chats/intervention/' + senderId, {
                                reason: "El cliente envió un comprobante de pago.",
                                type: "payment"
                            }).catch(() => { });
                            return sendWhatsAppMessage(senderId, "¡Excelente! Dame un momento, confirmo tu pago y te atiendo de inmediato para finalizar tu pedido. 👨‍💻✅");
                        }

                        if (identification === 'NOT_PART') {
                            const session = userSessions[senderId];
                            session.strikes = (session.strikes || 0) + 1;

                            if (session.strikes >= 2) {
                                session.transferred = true;
                                axios.post('http://localhost:3005/api/crm/chats/intervention/' + senderId, { reason: "Cliente envió imagen no reconocida 2 veces." }).catch(() => { });
                                return sendWhatsAppMessage(senderId, "Entendido. Para darte una mejor atención, te estoy transfiriendo con uno de nuestros asesores humanos. Por favor, espera un momento... 👨‍💻");
                            } else {
                                return sendWhatsAppMessage(senderId, "Esta imagen no parece estar relacionada con un repuesto automotriz. Si me equivoqué, por favor escríbeme el nombre de la pieza que buscas.");
                            }
                        } else if (identification) {
                            console.log(`👁️ Gemini identificó: ${identification}`);
                            textToProcess = identification;
                        } else {
                            return sendWhatsAppMessage(senderId, "Lo siento, no pude ver bien la imagen. ¿Podría enviarla de nuevo o decirme el nombre?");
                        }
                    } else if (isAudio && mediaId) {
                        console.log(`🎙️ Nota de voz recibida de ${senderId}. Transcribiendo...`);
                        sendWhatsAppMessage(senderId, "¡Recibido el audio! Déjeme escucho qué necesita... 🧐").catch(() => { });

                        const transcription = await transcribeAudioWithGemini(mediaId);
                        if (transcription === '[NOISE]') {
                            return sendWhatsAppMessage(senderId, "Disculpe, no alcancé a entender bien su audio (parecía ser ruido o una prueba). ¿Podría repetírmelo o escribírmelo? 🧐");
                        }
                        if (transcription) {
                            console.log(`🎙️ Gemini transcribió: ${transcription}`);
                            textToProcess = transcription;
                        } else {
                            return sendWhatsAppMessage(senderId, "Lo siento, tuve un problema técnico al escuchar su audio. ¿Podría repetirlo?");
                        }
                    }

                    // Reset strikes if it's a valid message processing
                    userSessions[senderId].strikes = 0;
                    await processAgentLogic(senderId, textToProcess, isImage, isAudio);
                } catch (err) {
                    console.error("❌ Error in background processing:", err.message);
                }
            })();
        }
    } else {
        res.sendStatus(404);
    }
});

// Locks to prevent concurrent processing of retries
const userLocks = new Set();

/**
 * 3. AGENT BRAIN: Handle greetings and follow-up WITH DEEPSEEK AI
 */
async function processAgentLogic(from, text, isImage = false, isAudio = false) {
    if (userLocks.has(from)) return; // Already processing this user
    userLocks.add(from);

    const userInput = text.toLowerCase().trim();
    let response = "";
    let productImages = [];
    let productContext = "";

    try {
        console.log(`🧠 Pensando con DeepSeek...`);

        // 1. SMART SEARCH: Remove stop words, normalize accents explicitly, sort by length
        const STOP_WORDS = new Set(['hola', 'ando', 'buscando', 'necesito', 'quiero', 'busco',
            'tengo', 'para', 'como', 'algo', 'una', 'uno', 'unos', 'unas', 'tiene', 'tienen',
            'hay', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'gracias',
            'cualquiera', 'cual', 'este', 'esta', 'esos', 'esas', 'comprar',
            'queria', 'podria', 'seria', 'ayuda', 'favor', 'vender', 'sirve',
            'cuanto', 'cuantos', 'cuantas', 'donde', 'cuando', 'tiene', 'carro',
            'vehiculo', 'coche', 'auto', 'costo', 'vale', 'valor', 'precio',
            'venden', 'vende', 'repuestos', 'repuesto', 'todo', 'tipo', 'clase',
            'marcas', 'marca', 'modelo', 'manejas', 'manejan', 'venden',
            'ustedes', 'haces', 'hacen', 'hacer', 'nosotros', 'tienda', 'local',
            'negocio', 'ubicados', 'estan', 'estamos', 'claro', 'tipo', 'clase',
            'tenes', 'tienes', 'tenemos', 'hay', 'da', 'dan', 'dame', 'dar', 'tenis',
            'carro', 'camioneta', 'vehiculo', 'automovil', 'auto', 'es', 'son', 'esta',
            'este', 'esto', 'eso', 'aquello', 'del', 'las', 'los', 'una', 'un',
            'va', 'vas', 'van', 'voy', 'vayan', 'mira', 'mirar', 'mirando', 'haber'
        ]);

        // Explicit accent map (more reliable than NFD in WhatsApp messages)
        const normalizeWord = (str) => str.toLowerCase()
            .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
            .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
            .replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]/g, '');

        // --- SMART KEYWORD EXTRACTION (Handles plurals and common verbs) ---
        const rawWords = userInput.split(/\s+/)
            .map(w => normalizeWord(w))
            .filter(w => w.length > 2); // Exclude very short words

        let searchWordsSet = new Set();
        rawWords.forEach(word => {
            if (STOP_WORDS.has(word)) return;

            // Try the word
            searchWordsSet.add(word);
            
            // --- ACCENT ROBUSTNESS ---
            // If it's a known part keyword, add common variations
            if (word === 'bateria') searchWordsSet.add('batería');
            if (word === 'bujia') searchWordsSet.add('bujía');
            if (word === 'kit') searchWordsSet.add('embrague');

            // If it ends in 's', try the singular
            if (word.length > 4 && word.endsWith('s')) {
                const singular = word.slice(0, -1);
                if (!STOP_WORDS.has(singular)) searchWordsSet.add(singular);
            }
        });

        const searchWords = Array.from(searchWordsSet).sort((a, b) => b.length - a.length);

        console.log(`🔍 Palabras clave para buscar: [${searchWords.join(', ')}]`);

        // --- ENVIAR AVISO SOLO SI ES UNA BÚSQUEDA DE PRODUCTO REAL Y LARGA ---
        const PART_KEYWORDS = ['bateria', 'pastilla', 'filtro', 'aceite', 'bujia', 'amortiguador', 'freno', 'empaque', 'correa', 'bomba', 'disco'];
        const isPartSearch = searchWords.some(w => PART_KEYWORDS.some(k => w.includes(k)));

        // Unificado el mensaje inicial para fotos/audios dentro de app.post
        // Solo enviamos aviso aquí si el texto es MUY largo y es una búsqueda directa
        if (isPartSearch && text.length > 25 && !isImage && !isAudio) {
            sendWhatsAppMessage(from, "¡Recibido! Déjeme consulto la disponibilidad para usted... 🧐").catch(() => { });
        }

        // --- BÚSQUEDA SEMÁNTICA + TRADICIONAL UNIFICADA ---
        try {
            let foundProducts = [];

            // 1. Similitud Semántica (Gemini)
            if (text.length > 3) {
                try {
                    console.log(`🔎 Similitud para: "${text}" | Palabras: [${searchWords.join(', ')}]`);
                    const embedResult = await embeddingModel.embedContent(text);
                    const { data: vProducts, error: vError } = await supabase.rpc('match_products', {
                        query_embedding: embedResult.embedding.values,
                        match_threshold: 0.5,
                        match_count: 5
                    });
                    if (vError) console.error('❌ Error RPC:', vError.message);
                    if (vProducts && vProducts.length > 0) {
                        console.log(`✅ Vector Search encontró ${vProducts.length} items`);
                        foundProducts = [...vProducts];
                    }
                } catch (vErr) { console.warn('⚠️ Falló Búsqueda semántica:', vErr.message); }
            }

            // 2. Búsqueda Tradicional si no hay resultados o para reforzar
            if (foundProducts.length === 0 && searchWords.length > 0) {
                const orFilter = searchWords.map(w => `name.ilike.%${w}%`).join(',');
                console.log(`🔍 Intentando DB (OR): ${orFilter}`);
                
                const { data: kProducts, error: kError } = await supabase
                    .from('products')
                    .select('name, price, stock, image')
                    .or(orFilter)
                    .eq('is_published', true)
                    .limit(5);
                
                if (kError) console.error('❌ Error DB traditional:', kError.message);
                if (kProducts && kProducts.length > 0) {
                    console.log(`✅ DB Traditional encontró ${kProducts.length} items`);
                    foundProducts = [...foundProducts, ...kProducts];
                } else {
                    console.log('ℹ️ DB Traditional no devolvió nada.');
                }
            }

            if (foundProducts.length > 0) {
                const uniqueProducts = Array.from(new Map(foundProducts.filter(p => p && p.name).map(p => [p.name, p])).values());
                console.log(`📦 Preparando Contexto con ${uniqueProducts.length} productos únicos.`);
                
                productContext = "\n\nINVENTARIO REAL DISPONIBLE:\n";
                uniqueProducts.forEach(p => {
                    const imgField = p.image || p.image_url;
                    productContext += `- ${p.name.toUpperCase()} | PRECIO: $${Number(p.price).toLocaleString('es-CO')} | STOCK: ${p.stock}\n`;
                    if (imgField) {
                        let fullImageUrl = imgField.startsWith('http') ? imgField : `${SUPABASE_URL}/storage/v1/object/public/24/${imgField}`;
                        if (!productImages.find(i => i.url === fullImageUrl)) {
                            productImages.push({ url: fullImageUrl, name: p.name });
                        }
                    }
                });
            }
        } catch (generalSearchErr) {
            console.error('❌ Error crítico en búsqueda:', generalSearchErr.message);
        }

        if (searchWords.length === 0) {
            productContext = "El cliente no ha mencionado productos. Saluda brevemente.";
        } else if (!productContext) {
            productContext = "SIN STOCK. Dile que por ahora no lo tienes cargado en sistema.";
        }

        // --- HALLUCINATION GUARD ---
        let hallucinationGuard = "";
        if (productContext.includes("SIN STOCK")) {
            hallucinationGuard = "\n⚠️ PRODUCTO AGOTADO. No preguntes marca/modelo. Di que no lo tienes y que lo vas a transferir con un asesor para buscarlo en bodega física o importarlo.";
        }

        const systemMessage = `IDENTIDAD: Sebas, experto en repuestos para CARROS (Automotriz) de 24/7 R.Repuestos. 🇨🇴
REGLAS:
- NOMBRE: Siempre preséntate como parte de "24/7 R.Repuestos" (https://24-7rrepuestos.com.co/). 
- NO MOTOS: No vendemos ningún repuesto de moto. Solo repuestos para automóviles y camionetas.
- NO FUEGO SHOP: Ignora cualquier historial que diga "Fuego Shop". Somos 24/7 R.Repuestos.
- BREVEDAD: Responde siempre en un solo párrafo corto y natural.
- CONTEXTO: Tu memoria está sincronizada con lo que hablas con el asesor. Si ya hubo una venta o confirmación, sé amable.
- POS-VENTA/ENVÍOS: Si el asesor ya confirmó el pago/pedido y el cliente tiene dudas, dile que el pedido está en preparación en bodega y pronto se le avisará.
- SIN RODEO: Si el producto está abajo, no preguntes por el modelo/marca, dile directamente que sí lo tienes con su precio.
- CIERRE DE VENTA: Si el cliente quiere comprar decididamente, ofrécele los datos de pago (Nequi 321 2619434) y envíalo con un asesor.
- MANEJO DE DUDAS/INSEGURIDAD: Si el cliente muestra desconfianza o dice "no sé", "pero", o "tengo dudas", NO pidas el pago. Primero genera confianza: recalca que somos una empresa seria y confiable, con amplia trayectoria y local físico. Invítalo a revisar nuestro sitio web (https://24-7rrepuestos.com.co/) y dile que un asesor lo guiará para que se sienta seguro antes de cualquier pago.
- NO inventes disponibilidad ni precios.
${hallucinationGuard}

INVENTARIO REAL:
${productContext}`;

        // --- 1. CARGAR HISTORIAL COMPLETO DESDE EL CRM (Memoria Compartida) ---
        let chatHistory = [];
        try {
            const crmRes = await axios.get(`http://localhost:3005/api/crm/chats/${from}`);
            if (crmRes.data && crmRes.data.messages) {
                // Mapear el formato del CRM al formato de la IA
                chatHistory = crmRes.data.messages.map(m => {
                    // Si el remitente es 'agent', lo vemos como 'assistant' para la IA
                    const role = (m.sender === 'assistant' || m.sender === 'agent') ? "assistant" : "user";
                    return { role: role, content: m.content };
                });
                console.log(`📜 Historial sincronizado (${chatHistory.length} mensajes) para ${from}.`);
            }
        } catch (crmErr) {
            console.warn(`⚠️ No se pudo sincronizar historial con CRM para ${from}. Usando memoria local.`, crmErr.message);
            chatHistory = userSessions[from].history || [];
        }

        // Si es un mensaje nuevo, lo añadimos si no está ya en el historial (el CRM suele tenerlo)
        if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content !== text) {
            // No añadimos aquí para evitar duplicar lo que ya viene del CRM
        }

        // Mantener el historial local actualizado por precaución
        userSessions[from].history = chatHistory;

        let aiResponse;
        let retries = 3;
        while (retries > 0) {
            try {
                aiResponse = await axios.post('https://api.deepseek.com/chat/completions', {
                    model: "deepseek-chat",
                    messages: [{ role: "system", content: systemMessage }, ...chatHistory]
                }, {
                    headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
                    timeout: 20000 // 20s timeout
                });
                break; // success!
            } catch (err) {
                retries--;
                if (retries === 0) throw err;
                console.log(`⚠️ AI Timeout? Reintentando... (${retries} restantes)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        response = aiResponse.data.choices[0].message.content;
        // Convert Markdown → WhatsApp format
        response = response
            .replace(/\*\*(.+?)\*\*/g, '*$1*')  // **bold** → *bold*
            .replace(/^#{1,6}\s+/gm, '')         // Remove ## headers
            .replace(/^[-*]\s+/gm, '• ')         // - item → • item
            .trim();
        userSessions[from].history.push({ role: "assistant", content: response });

        // --- FLUJO DE PAGO AUTOMÁTICO PARA COMPRAS (Solo si hay intención) ---
        (async () => {
            try {
                const lowerInput = userInput.toLowerCase();
                const lowerResponse = response.toLowerCase();
                let needsIntervention = false;
                let reason = "";

                const paymentKeywords = ["pagué", "comprobante", "transferencia", "voucher", "recibo", "pague", "consignacion", "nequi", "daviplata"];
                if (paymentKeywords.some(k => lowerInput.includes(k))) {
                    needsIntervention = true;
                    reason = "Confirmación de Pago / Comprobante enviado";
                }

                const buyKeywords = ["comprar", "interesa", "pedido", "quiero", "llevar", "cuanto vale", "cuánto vale", "pagar", "pago", "separar", "envío", "envio", "mandame", "mándame", "qr", "bold"];
                if (!needsIntervention && buyKeywords.some(k => lowerInput.includes(k))) {
                    needsIntervention = true;
                    // Detectar si hay inseguridad (pero, no se, etc)
                    const isHesitant = ["pero", "no se", "no sé", "duda", "desconfianza", "seguro", "desconfio", "estafa"].some(d => lowerInput.includes(d));
                    reason = isHesitant ? "Cliente con dudas o inseguridad" : "Intención de compra o cierre detectada";
                }

                const angerKeywords = ["asesor", "humano", "persona", "ayuda", "atención", "atencion", "no me gusta", "molesto", "enojado", "mal servicio", "queja", "estafa", "no entiendo", "llamar", "llamada"];
                if (!needsIntervention && angerKeywords.some(k => lowerInput.includes(k))) {
                    needsIntervention = true;
                    reason = "Cliente requiere atención humana o muestra malestar";
                }

                if (!needsIntervention && (lowerResponse.includes("asesor") || lowerResponse.includes("humano") || lowerResponse.includes("transfer") || lowerResponse.includes("gestionar tu pedido"))) {
                    needsIntervention = true;
                    reason = "IA sugirió transferencia a asesor para finalizar";
                }

                if (needsIntervention) {
                    console.log(`🚨 Solicitando intervención para ${from}: ${reason}`);
                    
                    // Solo enviamos los datos de pago si es por compra/interés y la IA no lo acaba de hacer
                    if (reason === "Intención de compra o cierre detectada") {
                        const nequiMsg = "¡Excelente! Para agilizar tu pedido, puedes realizar el pago a *Nequi* al número *321 2619434*. Una vez realizado, por favor envía el comprobante por aquí mismo. 💸";
                        await sendWhatsAppMessage(from, nequiMsg);
                        
                        const qrUrl = "https://uwgrmfxxayybglbbvhph.supabase.co/storage/v1/object/public/24/WhatsApp%20Image%202026-03-18%20at%208.50.14%20PM.jpeg";
                        await sendWhatsAppMessage(from, "📸 También puedes pagar escaneando este QR de Bold:", qrUrl);
                    }

                    userSessions[from].transferred = true;
                    await axios.post('http://localhost:3005/api/crm/chats/intervention/' + from, { reason });
                    
                    if (!lowerResponse.includes("transferir") && !lowerResponse.includes("asesor")) {
                        await sendWhatsAppMessage(from, "Te estoy transfiriendo con un asesor experto para coordinar los detalles finales de tu entrega. ¡En un momento te atienden! 👨‍💻🚀");
                    }
                }
            } catch (err) {
                console.error("❌ Error notificando intervención:", err.message);
            }
        })();

    } catch (error) {
        console.error('❌ AI/DB Error:', error.message);
        response = "Lo siento, estamos verificando el sistema. ¿Me repites en un momento?";
    } finally {
        userLocks.delete(from); // Release lock
    }

    await sendWhatsAppMessage(from, response);

    // El QR ahora se envía solo a través del flujo de intervención arriba para evitar duplicados.

    if (productImages.length > 0 && !response.includes("Lo siento") && productContext.length > 0) { // Added productContext.length > 0 to avoid phantom sales
        // Enviar solo la primera imagen de producto encontrada para no saturar
        const first = productImages[0];
        setTimeout(() => {
            sendWhatsAppMessage(from, `📸 Aquí puede ver el repuesto (${first.name}):`, first.url).catch(() => { });
        }, 1500);
    }
}


/**
 * 4. SEND MESSAGE UTILITY
 */
async function sendWhatsAppMessage(to, text, imageUrl = null) {
    // --- SYNC WITH CRM PANEL (Port 3005) ---
    axios.post(`http://localhost:3005/api/crm/chats/${to}/messages`, {
        content: text || (imageUrl ? "[Imagen enviada por Agente]" : ""),
        sender: 'assistant'
    }).catch(() => { });

    // Limpieza de URL para evitar doble codificación (importante para Meta)
    const encodedImageUrl = imageUrl ? encodeURI(decodeURI(imageUrl)).replace(/\(/g, '%28').replace(/\)/g, '%29') : null;

    if (imageUrl) {
        console.log(`\n📷 ENVIANDO IMAGEN (Codificada) --- To: ${to} | URL: ${encodedImageUrl}\n`);
    } else {
        console.log(`\n--- 🤖 RESPUESTA --- To: ${to} | Msg: ${text}\n`);
    }

    const hasValidToken = ACCESS_TOKEN && !ACCESS_TOKEN.includes('TU_');
    const hasValidPhoneId = WHATSAPP_PHONE_NUMBER_ID && !WHATSAPP_PHONE_NUMBER_ID.includes('TU_');

    if (hasValidToken && hasValidPhoneId) {
        try {
            const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
            const payload = imageUrl ? {
                messaging_product: "whatsapp",
                to: to,
                type: "image",
                image: { 
                    link: encodedImageUrl,
                    caption: text 
                }
            } : {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: text }
            };

            await axios.post(url, payload, {
                headers: {
                    "Authorization": `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            });
            console.log(`✅ ¡ENVIADO A WHATSAPP REAL EXITOSAMENTE!`);
        } catch (error) {
            console.error('❌ Error de Meta:', error.response ? JSON.stringify(error.response.data) : error.message);
        }
    } else {
        console.log(`ℹ️ Modo Simulación: Datos mostrados solo en consola.`);
    }
}

/**
 * 4.1 SEND ACTION UTILITY (Typing, Mark as read)
 */
async function sendWhatsAppAction(to, action, messageId = null) {
    const hasValidToken = ACCESS_TOKEN && !ACCESS_TOKEN.includes('TU_');
    const hasValidPhoneId = WHATSAPP_PHONE_NUMBER_ID && !WHATSAPP_PHONE_NUMBER_ID.includes('TU_');

    if (!hasValidToken || !hasValidPhoneId) return;

    try {
        const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
        let payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to
        };

        if (action === "mark_as_read" && messageId) {
            payload.status = "read";
            payload.message_id = messageId;
        } else if (action === "typing_on") {
            // Note: Cloud API typing indicator payload structure
            payload.sender_action = "typing_on";
        }

        await axios.post(url, payload, {
            headers: {
                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        // Silently fail for actions as they are not critical for flow
    }
}

/**
 * 5. VISION UTILITY: Identify parts using Gemini
 */
async function identifyPartFromImage(mediaId) {
    try {
        // 1. Get Media URL from Meta
        const metaUrl = `https://graph.facebook.com/v20.0/${mediaId}`;
        const response = await axios.get(metaUrl, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const mediaUrl = response.data.url;

        // 2. Download Image Buffer
        const imageRes = await axios.get(mediaUrl, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
            responseType: 'arraybuffer'
        });
        const buffer = Buffer.from(imageRes.data);
        const base64Data = buffer.toString("base64");
        console.log(`📡 Enviando a Gemini... (Tamaño base64: ${base64Data.length} chars)`);

        // 3. Prompt Gemini to identify specifically as a spare part OR a payment receipt
        const prompt = "Eres un experto en repuestos y administración. Mira esta imagen y decide:\n1. Si es un repuesto automotriz, dime qué pieza es y modelo (ej: 'Pastillas freno Mazda 3').\n2. Si es un comprobante de pago, recibo de transferencia bancaria, o ticket de consignación, di exactamente 'RECEIPT'.\n3. Si no es ninguna de las anteriores, di 'Desconocido'.";

        const result = await visionModel.generateContent([
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        const identification = result.response.text().trim();
        const lowId = identification.toLowerCase();

        if (identification === 'RECEIPT') return 'RECEIPT';
        return (lowId === 'desconocido' || lowId.includes('desconocido')) ? 'NOT_PART' : identification;

    } catch (error) {
        if (error.response) {
            console.error("❌ Error Vision AI (API):", error.response.status, JSON.stringify(error.response.data));
        } else {
            console.error("❌ Error Vision AI (SDK):", error.message);
            // Some Gemini errors have .response.data inside
            if (error.response?.data) console.error("   Detalle:", JSON.stringify(error.response.data));
        }
        return null;
    }
}

/**
 * 6. AUDIO UTILITY: Transcribe audio using Gemini
 */
async function transcribeAudioWithGemini(mediaId) {
    try {
        // 1. Get Media URL from Meta
        const metaUrl = `https://graph.facebook.com/v20.0/${mediaId}`;
        const response = await axios.get(metaUrl, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        const mediaUrl = response.data.url;
        const mimeType = response.data.mime_type || "audio/ogg";

        // 2. Download Audio Buffer
        const audioRes = await axios.get(mediaUrl, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
            responseType: 'arraybuffer'
        });
        const buffer = Buffer.from(audioRes.data);
        const base64Data = buffer.toString("base64"); // Added this line to define base64Data

        // 3. Prompt Gemini to transcribe specifically for sparse parts OR detect noise
        const prompt = "Transcribe este audio de WhatsApp para una tienda de repuestos en Colombia. Si el audio contiene ruido de fondo, silencio, o frases que parecen de prueba (ej: 'hola', '1 2 3', 'probando', 'prueba número 1'), escribe exactamente '[NOISE]'. Si no es ruido, transcribe el mensaje completo con la mejor precisión posible.";

        const result = await visionModel.generateContent([
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: mimeType } }
        ]);

        const transcription = result.response.text().trim();
        if (transcription.toUpperCase().includes('[NOISE]') || transcription.length < 3) return '[NOISE]';
        return transcription;

    } catch (error) {
        console.error("❌ Error Audio AI:", error.message);
        return null;
    }
}

// --- ENDPOINTS PARA CONTROL HUMANO ---
app.post('/api/agent/session/stop/:phone', (req, res) => {
    const { phone } = req.params;
    if (!userSessions[phone]) {
        userSessions[phone] = { history: [], lastStatus: null, transferred: true, strikes: 0 };
    } else {
        userSessions[phone].transferred = true;
        userSessions[phone].strikes = 0;
    }
    console.log(`👨‍💻 Control manual tomado por humano para ${phone}. IA desactivada.`);
    res.json({ success: true });
});

app.post('/api/agent/session/reset/:phone', (req, res) => {
    const { phone } = req.params;
    if (userSessions[phone]) {
        userSessions[phone].transferred = false;
        userSessions[phone].strikes = 0;
        console.log(`🤖 Sesión del agente reseteada para ${phone}. IA ahora tiene el control.`);
        return res.json({ success: true });
    }
    res.json({ success: false, message: 'Sesión no encontrada.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Standalone Agent is online on port ${PORT}`);
    console.log(`🔗 Webhook Path: /webhook`);
});
