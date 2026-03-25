const express = require('express');
const router = express.Router();
const https = require('https');
const sharp = require('sharp');
const { callAI } = require('../utils/ai');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Función para subir un Buffer directamente a Supabase Storage
 */
function uploadToSupabase(buffer, remotePath, contentType = 'image/webp') {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/storage/v1/object/24/${remotePath}`);
        
        const options = {
            method: 'POST',
            headers: {
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': contentType
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/24/${remotePath}`;
                    resolve(publicUrl);
                } else {
                    reject(new Error(`Supabase Error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (err) => reject(new Error('Network error uploading to Supabase: ' + err.message)));
        req.write(buffer);
        req.end();
    });
}

/**
 * Llama a la API de Imagen 3 en Google AI Studio (Gemini)
 */
async function generateGeminiImage(prompt) {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY no configurada en el backend");

    // En 2026, los modelos de imagen usan generateContent para multimodalidad
    const modelName = 'gemini-2.5-flash-image';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    
    // Payload estándar de generateContent
    const body = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.9,
            topP: 1,
            topK: 1
        }
    };

    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (res.statusCode !== 200) {
                        return reject(new Error(response.error?.message || `Gemini API Error ${res.statusCode}`));
                    }

                    // En generateContent, la imagen viene en candidates[0].content.parts[0].inlineData
                    const parts = response.candidates?.[0]?.content?.parts;
                    const imagePart = parts?.find(p => p.inlineData);
                    
                    if (imagePart && imagePart.inlineData.data) {
                        resolve(Buffer.from(imagePart.inlineData.data, 'base64'));
                    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                        // A veces si hay un error de política devuelve texto explicando por qué no generó
                        reject(new Error("La IA respondió con texto (posible bloqueo de seguridad): " + response.candidates[0].content.parts[0].text));
                    } else {
                        reject(new Error("No se recibió imagen. Respuesta: " + JSON.stringify(response)));
                    }
                } catch (e) {
                    reject(new Error("Error parseando respuesta de Gemini: " + e.message));
                }
            });
        });

        req.on('error', (err) => reject(new Error('Network error calling Gemini: ' + err.message)));
        req.write(JSON.stringify(body));
        req.end();
    });
}

// Endpoint principal para generar y asociar imagen - PROTEGIDO (Admin)
router.post('/generate-image', authenticateToken, isAdmin, async (req, res) => {
    const { productId, productName, category } = req.body;
    
    if (!productName) {
        return res.status(400).json({ error: 'Se requiere el nombre del producto' });
    }

    try {
        // Crear nombre de archivo limpio
        const cleanName = productName.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_');
        
        const timestamp = Date.now();
        const folder = category?.toLowerCase().replace(/\s+/g, '_') || 'varios';
        const remotePath = `products/${folder}/${cleanName}_${timestamp}.webp`; // Cambio a .webp

        // Prompt optimizado con marca de agua
        const imagePrompt = `Professional product studio photography of ${productName}, solid white background, high resolution 4k, cinematic lighting, sharp focus on mechanical details, industrial spare part aesthetic, with a small subtle semi-transparent watermark text 'r.repuestos 24/7' in the bottom right corner.`;

        // 1. Generar imagen
        const imageBufferPng = await generateGeminiImage(imagePrompt);

        // 2. CONVERTIR A WEBP (optimización)
        const imageBufferWebp = await sharp(imageBufferPng)
            .webp({ quality: 80 })
            .toBuffer();

        // 3. Subir a Supabase
        const imageUrl = await uploadToSupabase(imageBufferWebp, remotePath, 'image/webp');

        res.json({
            success: true,
            imageUrl: imageUrl,
            productId: productId,
            productName: productName
        });

    } catch (error) {
        console.error('[AI ENRICH ERROR]:', error.message);
        res.status(500).json({ 
            error: 'Error en el proceso de enriquecimiento',
            details: error.message 
        });
    }
});

module.exports = router;
