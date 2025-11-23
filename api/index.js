const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS configuration for Vercel
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    /^https:\/\/.*\.vercel\.app$/,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176'
  ],
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
}

// Import and use routes
try {
  app.use('/auth', require('../backend/routes/auth'));
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Auth routes error:', error.message);
}

try {
  app.use('/admin', require('../backend/routes/admin'));
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.error('❌ Admin routes error:', error.message);
}

try {
  app.use('/customer', require('../backend/routes/customer'));
  console.log('✅ Customer routes loaded');
} catch (error) {
  console.error('❌ Customer routes error:', error.message);
}

try {
  app.use('/orders', require('../backend/routes/orders'));
  console.log('✅ Orders routes loaded');
} catch (error) {
  console.error('❌ Orders routes error:', error.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'E-commerce API is running!' });
});

// Export for Vercel serverless functions
module.exports = app;