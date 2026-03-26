/**
 * CHAT DE CONSOLA (SIMULACIÓN LOCAL)
 * ---------------------------------
 * Prueba tu agente sin necesidad de Meta Developers, Webhooks, ni Internet.
 * ---------------------------------
 */

const readline = require('readline');

// CONFIGURACIÓN MOCK (Simulamos los datos de index.js)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * EL CEREBRO DE TU AGENTE (Copiado de index.js)
 * Aquí es donde pones toda la lógica que quieras.
 */
function processAgentLogic(text) {
    const userInput = text.toLowerCase().trim();
    
    // --- LÓGICA DE RESPUESTA ---
    if (userInput.includes('hola') || userInput === 'inicio') {
        return "¡Hola! Soy tu asistente virtual inteligente. 👋\n¿En qué puedo apoyarte hoy?\n\n1. Ver servicios\n2. Hablar con soporte técnico\n3. Ver mis pedidos\n\nResponde con el número de tu opción.";
    } 
    else if (userInput === '1') {
        return "Nuestros servicios estrella son:\n✨ Consultoría IA\n✨ Automatización de Chatbots\n✨ Desarrollo Web Premium\n\n¿Te gustaría agendar una demo?";
    }
    else if (userInput === '2') {
        return "Te estoy conectando con un experto en soporte. Por favor, espera un momento... ⏳";
    }
    else if (userInput === '3') {
        return "Por favor, ingresa tu número de orden para consultar el estado. 📦";
    }
    else {
        return `Recibí tu mensaje: "${text}".\nSi quieres volver al menú principal, escribe "Menu" o "Inicio".`;
    }
}

console.log('--- 🤖 CHAT DE SIMULACIÓN LOCAL ---');
console.log('Escribe tus mensajes y el agente te responderá aquí mismo.');
console.log('Escribe "salir" para terminar.\n');

function ask() {
  rl.question('Tú: ', (input) => {
    if (input.toLowerCase() === 'salir') {
      console.log('\n¡Hasta pronto! 👋');
      rl.close();
      return;
    }

    const response = processAgentLogic(input);
    
    console.log(`\n🤖 AGENTE: \n${response}\n`);
    ask(); // Volver a preguntar
  });
}

ask();
