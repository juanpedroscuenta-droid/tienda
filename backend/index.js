require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
// xss-clean no es compatible con Express 5 (req.query es getter-only)
// Usamos un sanitizador manual compatible

const app = express();
const port = process.env.PORT || 3001;

// --- SEGURIDAD AVANZADA ---
// 1. Helmet para headers de seguridad (XSS, Clickjacking, CSP, etc)
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar si causa problemas con imagenes externas
  crossOriginEmbedderPolicy: false
}));

// 2. Rate Limiting para prevenir ataques de fuerza bruta o DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Limitar cada IP a 1000 solicitudes por windowMs (protección general)
  message: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 3. CORS más restrictivo (permitir solo el frontend conocido o localhost en desarrollo)
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  process.env.FRONTEND_URL || '*'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Acceso no permitido por CRS'));
    }
  },
  credentials: true
}));

// 4. Limpieza de datos contra inyecciones XSS y Parameter Pollution
app.use(express.json({ limit: '10kb' })); // Limitar tamaño de body para prevenir DoS

// Sanitizador XSS manual compatible con Express 5 (req.query es getter-only en Express 5)
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    }
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const key of Object.keys(obj)) result[key] = sanitize(obj[key]);
      return result;
    }
    return obj;
  };
  if (req.body) req.body = sanitize(req.body);
  next();
});

app.use(hpp());

// Middlewares estándar

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
const aiEnrichmentRouter = require('./routes/ai_enrichment');
const suppliersRouter = require('./routes/suppliers');


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
app.use('/api/ai-enrichment', aiEnrichmentRouter);
app.use('/api/suppliers', suppliersRouter);


// Basic health check endpoint
app.get('/api/health', (req, res) => {
  console.log('>>> [DEBUG] Health check hit!');
  res.json({ status: 'ok', message: 'Backend is running', timestamp: new Date() });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
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
