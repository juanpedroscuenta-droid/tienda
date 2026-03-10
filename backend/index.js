require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3001;

// Basic logger before anything else
app.use((req, res, next) => {
  console.log(`[EARLY DEBUG] Incoming: ${req.method} ${req.url}`);
  next();
});

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const ordersRouter = require('./routes/orders');
const companyRouter = require('./routes/company');
const infoRouter = require('./routes/info');
const usersRouter = require('./routes/users');
const filtersRouter = require('./routes/filters');
const storageRouter = require('./routes/storage');
const chatbotRouter = require('./routes/chatbot');
const paymentsRouter = require('./routes/payments');
const mailRouter = require('./routes/mail');

app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/company', companyRouter);
app.use('/api/info', infoRouter);
app.use('/api/users', usersRouter);
app.use('/api/filters', filtersRouter);
app.use('/api/storage', storageRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/mail', mailRouter);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  console.log('>>> [DEBUG] Health check hit!');
  res.json({ status: 'ok', message: 'Backend is running', timestamp: new Date() });
});

// Start the server
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Backend server listening at http://127.0.0.1:${port}`);
});

// Manejo de errores del servidor (ej. puerto ocupado)
server.on('error', (err) => {
  console.error('>>> [CRITICAL] Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`>>> El puerto ${port} ya está ocupado. Intenta cerrar otros procesos de Node.`);
  }
});

// Capturar errores que normalmente cerrarían el proceso silenciosamente
process.on('uncaughtException', (err) => {
  console.error('>>> [CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('>>> [CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});
