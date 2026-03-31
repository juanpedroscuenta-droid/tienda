const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// GET /api/suppliers — listar todos
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('[SUPPLIERS] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/suppliers — crear
router.post('/', async (req, res) => {
  try {
    const { name, contact_name, phone, email, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del proveedor es requerido' });

    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ name, contact_name, phone, email, address, notes }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('[SUPPLIERS] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/suppliers/:id — actualizar
router.put('/:id', async (req, res) => {
  try {
    const { name, contact_name, phone, email, address, notes } = req.body;
    const { data, error } = await supabase
      .from('suppliers')
      .update({ name, contact_name, phone, email, address, notes })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/suppliers/:id — eliminar
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
