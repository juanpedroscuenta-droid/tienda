const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Use memory storage for multer
const upload = multer({ storage: multer.memoryStorage() });

// Upload a generic file to bucket '24'
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const bucket = '24';
        const folder = req.body.folder || 'general';
        const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        res.json({ url: publicUrl, path: fileName });
    } catch (error) {
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
