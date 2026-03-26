const axios = require('axios');

async function simulateMessage() {
    try {
        console.log('🚀 Simulando mensaje entrante de WhatsApp...');
        
        const response = await axios.post('http://localhost:3000/webhook', {
            object: 'whatsapp_business_account',
            entry: [{
                changes: [{
                    value: {
                        messages: [{
                            from: '573000000000',
                            text: { body: 'Hola' }
                        }]
                    },
                    field: 'messages'
                }]
            }]
        });

        console.log('✅ Respuesta del servidor:', response.data);
        console.log('\n--- Revisa la otra terminal donde corre index.js para ver la respuesta del Agente ---');
    } catch (error) {
        console.error('❌ Error al simular:', error.message);
        console.log('¿Aseguraste que "node index.js" esté corriendo en otra terminal?');
    }
}

simulateMessage();
