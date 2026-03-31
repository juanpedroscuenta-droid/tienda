const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const sharp = require('sharp'); // Importar sharp

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const bucket = '24';
        const folder = req.body.folder || 'general';
        
        // Log file details
        console.log('[STORAGE UPLOAD]', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            encoding: file.encoding,
            buffer_size: file.buffer.length
        });
        
        // 1. USAR EL BUFFER ORIGINAL (SIN OPTIMIZACIÓN)
        const finalBuffer = file.buffer;
        const finalFileName = file.originalname.replace(/\s+/g, '_');
        const contentType = file.mimetype;

        const remotePath = `${folder}/${Date.now()}-${finalFileName}`;

        console.log('[STORAGE UPLOAD] Uploading to:', remotePath, 'with contentType:', contentType);

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(remotePath, finalBuffer, {
                contentType: contentType,
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(remotePath);

        console.log('[STORAGE UPLOAD] Success:', { publicUrl, remotePath });
        res.json({ url: publicUrl, path: remotePath });
    } catch (error) {
        console.error('[STORAGE ERROR]:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Delete a file from bucket '24'
router.post('/delete', async (req, res) => {
    try {
        const { path } = req.body;
        if (!path) {
            return res.status(400).json({ error: 'No path provided' });
        }

        const { error } = await supabase.storage
            .from('24')
            .remove([path]);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
