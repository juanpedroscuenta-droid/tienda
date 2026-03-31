require('dotenv').config();
const axios = require('axios');

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    try {
        console.log(`🔍 Intentando listar modelos para la clave: ${key.substring(0, 10)}...`);
        // Probar v1 (estable) y v1beta (beta)
        const versions = ['v1', 'v1beta'];
        for (const v of versions) {
            console.log(`\n--- Probando API ${v} ---`);
            try {
                const url = `https://generativelanguage.googleapis.com/${v}/models?key=${key}`;
                const res = await axios.get(url);
                console.log(`✅ ${v} funciona!`);
                const visModels = res.data.models.filter(m => m.supportedGenerationMethods?.includes('generateContent') && (m.name.includes('vision') || m.name.includes('flash')));
                console.log('Modelos recomendados:', visModels.map(m => m.name));
            } catch (e) {
                console.error(`❌ ${v} falló:`, e.response ? e.response.status : e.message);
                if (e.response && e.response.data) console.log(JSON.stringify(e.response.data));
            }
        }
    } catch (error) {
        console.error('Error total:', error.message);
    }
}

listModels();
