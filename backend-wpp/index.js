const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock Data
let chats = [];
let metaConfig = {
  accessToken: '',
  phoneId: '',
  businessId: '',
  verifyToken: 'fuego_shop_wpp_token_2026'
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
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      unread: 1,
      isStarred: true,
      avatar: 'WA',
      phone: '',
      email: '',
      messages: [
        { id: 'msg_welcome', content: `¡Conexión guardada! 🎉\n\nTu token y Phone ID han sido registrados.\n\nPara que los mensajes de tus clientes lleguen aquí en tiempo real, ve a Facebook Developers y configura el Webhook usando la URL de este servidor (p.ej con Ngrok) apuntando a la ruta: \n/webhook \n\nToken de verificación: ${metaConfig.verifyToken}`, sender: 'user', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), type: 'text' }
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
app.post('/webhook', (req, res) => {
  let body = req.body;
  if (body.object) {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
      let phoneNumber = body.entry[0].changes[0].value.contacts[0].wa_id;
      let name = body.entry[0].changes[0].value.contacts[0].profile.name;
      let msg = body.entry[0].changes[0].value.messages[0];
      let msgText = msg.text ? msg.text.body : 'Mensaje multimedia';
      
      let chat = chats.find(c => c.phone === phoneNumber);
      if (!chat) {
         chat = {
            id: phoneNumber, // usamos el teléfono como id
            name: name,
            platform: 'wpp',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            unread: 1,
            isStarred: false,
            avatar: name.substring(0,2).toUpperCase(),
            phone: phoneNumber,
            email: '',
            messages: []
         };
         chats.push(chat);
      } else {
         chat.unread += 1;
         chat.time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }
      
      chat.messages.push({
         id: msg.id,
         content: msgText,
         sender: 'user',
         time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
         type: 'text'
      });
      console.log(`📩 Mensaje Entrante de ${name} (${phoneNumber}): ${msgText}`);
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
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    unread: 1,
    isStarred: false,
    avatar: name.substring(0,2).toUpperCase(),
    phone: phone,
    email: '',
    messages: [
      { id: 'm1', content: message, sender: 'user', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), type: 'text' }
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
      avatar: chat.avatar
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
  
  const timeString = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

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
  
  // Real outbound push to Meta WhatsApp API
  if (sender === 'agent' && metaConfig.accessToken && metaConfig.phoneId && chat.phone && chat.id !== 'system') {
     console.log(`🚀 Enviando mensaje en la vida real a ${chat.phone} usando Graph API...`);
     try {
       const resp = await fetch(`https://graph.facebook.com/v18.0/${metaConfig.phoneId}/messages`, {
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
     } catch(e) {
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

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`CRM WhatsApp Backend running on port ${PORT}`);
});
