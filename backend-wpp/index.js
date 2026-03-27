const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Ubicación de base de datos local
const DB_PATH = path.join(__dirname, 'chats.json');

// Mock Data (Persistente)
let chats = [];
if (fs.existsSync(DB_PATH)) {
  try {
    chats = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    console.log("📂 Chats cargados desde el archivo local.");
  } catch (e) {
    console.error("Error cargando base de datos:", e);
    chats = [];
  }
}

function saveChats() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(chats, null, 2));
  } catch (e) {
    console.error("❌ Error guardando chats:", e);
  }
}

let metaConfig = {
  accessToken: 'EAAQPOigEjZCwBREAT2UzEEvC9idh8Tu5ZCJyhsSFPlRIicvKFuExAzdRlfAlIs3leZAZCsDveWWZBS9lMQe3pOgl2YZCWlffcUscfBbvNHj7icF24UURLZC5yF2e0O6etebVZCVFcdX00E1gZBukyTlCzZCxlh6NfQZBdsSwm90iDnP5YfEFO0tEthdbLbqofxcOpyh2O5MRYcXiakvXm0eGFwOUr7TChceOT3UILGYt0aLqiyxb1Dhn4UPx8NQcrelAo3YZAEq0ZCWGorUMsK9tdZCTZAngHkm6TTnOutqGwZDZD',
  phoneId: '833690719823401',
  businessId: '1029384756', // Dejamos el genérico o el que tenga
  verifyToken: 'hola'
};

// Config endpoint: Guardar credenciales de Meta Graph API
app.post('/api/crm/config', (req, res) => {
  metaConfig = { ...metaConfig, ...req.body };
  console.log("✅ Credenciales de Meta guardadas exitosamente:", { phoneId: metaConfig.phoneId, token: metaConfig.accessToken ? '***' : '' });

  if (!chats.find(c => c.id === 'system')) {
    chats.push({
      id: 'system',
      name: 'Meta API (Sistema)',
      platform: 'wpp',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 1,
      isStarred: true,
      avatar: 'WA',
      phone: '',
      email: '',
      messages: [
        { id: 'msg_welcome', content: `¡Conexión guardada! 🎉\n\nTu token y Phone ID han sido registrados.\n\nPara que los mensajes de tus clientes lleguen aquí en tiempo real, ve a Facebook Developers y configura el Webhook usando la URL de este servidor (p.ej con Ngrok) apuntando a la ruta: \n/webhook \n\nToken de verificación: ${metaConfig.verifyToken}`, sender: 'user', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' }
      ]
    });
  }

  res.json({ success: true, verifyToken: metaConfig.verifyToken });
});

// WEBHOOK de Meta (Verificación inicial requerida por Facebook)
app.get('/webhook', (req, res) => {
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === metaConfig.verifyToken) {
      console.log('🟢 WEBHOOK VERIFICADO POR META!');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
});

// WEBHOOK de Meta (Recibir mensajes entrantes)
app.post('/webhook', async (req, res) => {
  console.log('📡 [WEBHOOK] Petición recibida en /webhook', JSON.stringify(req.body, null, 2));
  let body = req.body;
  if (body.object) {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
      const value = body.entry[0].changes[0].value;
      const contact = value.contacts ? value.contacts[0] : null;
      const msg = value.messages[0];

      let phoneNumber = contact ? contact.wa_id : msg.from;
      let name = contact?.profile?.name || `Cliente ${phoneNumber}`;

      let msgText = msg.text ? msg.text.body : '';
      let imageUrl = null;
      let type = msg.type;

      if (msg.type === 'image') {
        msgText = msg.image.caption || 'Imagen';
        const imageId = msg.image.id;
        if (metaConfig.accessToken) {
          try {
            const imgRes = await fetch(`https://graph.facebook.com/v20.0/${imageId}`, {
              headers: { 'Authorization': `Bearer ${metaConfig.accessToken}` }
            });
            const imgData = await imgRes.json();
            imageUrl = imgData.url;
          } catch (e) {
            console.error("Error fetching image URL:", e);
          }
        }
      } else if (msg.type === 'audio' || msg.type === 'voice') {
        msgText = 'Nota de voz';
        const audioId = msg.audio ? msg.audio.id : msg.voice.id;
        if (metaConfig.accessToken) {
          try {
            const audioRes = await fetch(`https://graph.facebook.com/v20.0/${audioId}`, {
              headers: { 'Authorization': `Bearer ${metaConfig.accessToken}` }
            });
            const audioData = await audioRes.json();
            imageUrl = audioData.url; // Reutilizamos imageUrl para el proxy o guardamos en newMessage.audioUrl
          } catch (e) {
            console.error("Error fetching audio URL:", e);
          }
        }
      }
      else if (!msgText && !msg.type) {
        msgText = 'Mensaje multimedia';
      }

      let chat = chats.find(c => c.phone === phoneNumber);
      if (!chat) {
        chat = {
          id: phoneNumber,
          name: name,
          platform: 'wpp',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: 1,
          isStarred: false,
          avatar: name.substring(0, 2).toUpperCase(),
          phone: phoneNumber,
          email: '',
          messages: [],
          needsIntervention: false
        };
        chats.push(chat);
      } else {
        chat.unread += 1;
        chat.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      chat.messages.push({
        id: msg.id,
        content: msgText,
        sender: 'user',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: type,
        imageUrl: imageUrl
      });
      saveChats(); // PERSIST
      console.log(`📩 Mensaje Entrante de ${name} (${phoneNumber}): ${msgText}${imageUrl ? ' [Imagen]' : ''}`);
    }
    return res.sendStatus(200);
  } else {
    return res.sendStatus(404);
  }
});

// Helper para crear chat nuevo (test interno)
app.post('/api/crm/chats', (req, res) => {
  const { name = 'Nuevo Cliente', platform = 'wpp', message = 'Hola, quisiera información.', phone = '123456789' } = req.body;
  const newChat = {
    id: Date.now().toString(),
    name,
    platform,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unread: 1,
    isStarred: false,
    avatar: name.substring(0, 2).toUpperCase(),
    phone: phone,
    email: '',
    messages: [
      { id: 'm1', content: message, sender: 'user', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text' }
    ]
  };
  chats.push(newChat);
  res.json(newChat);
});

// GET all chats
app.get('/api/crm/chats', (req, res) => {
  const result = chats.map(chat => {
    const lastMsg = chat.messages[chat.messages.length - 1];
    return {
      id: chat.id,
      name: chat.name,
      platform: chat.platform,
      lastMessage: lastMsg?.isCampaign ? lastMsg.campaignTitle : lastMsg?.content,
      time: chat.time,
      unread: chat.unread,
      isStarred: chat.isStarred,
      avatar: chat.avatar,
      needsIntervention: chat.needsIntervention,
      interventionReason: chat.interventionReason
    };
  });
  res.json(result);
});

// GET specific chat messages
app.get('/api/crm/chats/:id', (req, res) => {
  const chat = chats.find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  res.json(chat);
});

// POST new message (Saliente - Desde el Agente hacia WhatsApp)
app.post('/api/crm/chats/:id/messages', async (req, res) => {
  const chat = chats.find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  const { content, sender = 'agent' } = req.body;

  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMessage = {
    id: 'msg_' + Date.now(),
    content: content,
    sender: sender,
    time: timeString,
    type: 'text',
    read: true
  };

  chat.messages.push(newMessage);
  chat.time = timeString;

  // Mantenemos needsIntervention como esté. Solo el botón manual devuelve control a la IA.

  saveChats(); // PERSIST

  // Real outbound push to Meta WhatsApp API
  if (sender === 'agent' && metaConfig.accessToken && metaConfig.phoneId && chat.phone && chat.id !== 'system') {
    console.log(`🚀 Enviando mensaje en la vida real a ${chat.phone} usando Graph API...`);
    try {
      const resp = await fetch(`https://graph.facebook.com/v20.0/${metaConfig.phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaConfig.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: chat.phone,
          type: "text",
          text: { preview_url: false, body: content }
        })
      });
      const data = await resp.json();
      console.log('📡 Respuesta de Meta Graph API:', data);
    } catch (e) {
      console.error("❌ Error conectando a Meta API:", e);
    }
  }

  res.json(newMessage);
});

// PUT update status/starred
app.put('/api/crm/chats/:id', (req, res) => {
  const chatIndex = chats.findIndex(c => c.id === req.params.id);
  if (chatIndex === -1) return res.status(404).json({ error: 'Chat not found' });

  chats[chatIndex] = { ...chats[chatIndex], ...req.body };
  res.json(chats[chatIndex]);
});

// POST flag for human intervention
app.post('/api/crm/chats/intervention/:phone', (req, res) => {
  const { phone } = req.params;
  const { reason, type = 'danger' } = req.body;

  const chat = chats.find(c => c.phone === phone);
  if (chat) {
    chat.needsIntervention = true;
    chat.interventionReason = reason;
    chat.interventionType = type; // 'danger' or 'payment'
    console.log(`⚠️ ALERTA (${type}): Intervención humana requerida para ${phone}. Razón: ${reason}`);
    saveChats(); // PERSIST
    res.json({ success: true, chat });
  } else {
    // Si no existe el chat, creamos uno básico
    const newChat = {
      id: phone,
      name: `Cliente ${phone}`,
      platform: 'wpp',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: 1,
      isStarred: false,
      avatar: 'C',
      phone: phone,
      email: '',
      messages: [],
      needsIntervention: true,
      interventionReason: reason,
      interventionType: type
    };
    chats.push(newChat);
    saveChats(); // PERSIST
    res.json({ success: true, chat: newChat });
  }
});

// POST stop/pause agent (Cambiar de IA a Humano)
app.post('/api/crm/chats/stop/:id', async (req, res) => {
  const chat = chats.find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  chat.needsIntervention = true;
  chat.interventionReason = "Control manual (Asesor)";

  try {
    await fetch(`http://localhost:3000/api/agent/session/stop/${chat.phone}`, { method: 'POST' });
    console.log(`👨‍💻 Chat ${chat.phone} tomado bajo control humano.`);
  } catch (e) {
    console.error("Error notificando parada al agente:", e.message);
  }

  saveChats(); // PERSIST
  res.json({ success: true, chat });
});

// POST release chat back to agent (IA)
app.post('/api/crm/chats/release/:id', async (req, res) => {
  const chat = chats.find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  chat.needsIntervention = false;
  chat.interventionReason = null;

  // Notificar al Agente AI para que retome el control (Puerto 3000)
  try {
    await fetch(`http://localhost:3000/api/agent/session/reset/${chat.phone}`, { method: 'POST' });
    console.log(`🤖 Chat ${chat.phone} devuelto a la IA.`);
  } catch (e) {
    console.error("Error notificando al agente:", e.message);
  }

  saveChats(); // PERSIST
  res.json({ success: true, chat });
});

// Endpoint para proxy de imágenes (WhatsApp bloquea los enlaces directos en el navegador)
app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.sendStatus(400);

  try {
    console.log("📷 Proxying image from Meta:", imageUrl.substring(0, 50) + "...");
    const response = await fetch(imageUrl, {
      headers: { 'Authorization': `Bearer ${metaConfig.accessToken}` }
    });
    const buffer = await response.arrayBuffer();
    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("❌ Error proxying image:", err);
    res.sendStatus(500);
  }
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`CRM WhatsApp Backend running on port ${PORT}`);
});
