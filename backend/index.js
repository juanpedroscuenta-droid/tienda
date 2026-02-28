require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const ordersRouter = require('./routes/orders');
const companyRouter = require('./routes/company');
const infoRouter = require('./routes/info');
const usersRouter = require('./routes/users');
const filtersRouter = require('./routes/filters');
const storageRouter = require('./routes/storage');

app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/company', companyRouter);
app.use('/api/info', infoRouter);
app.use('/api/users', usersRouter);
app.use('/api/filters', filtersRouter);
app.use('/api/storage', storageRouter);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server listening at http://0.0.0.0:${port}`);
});
