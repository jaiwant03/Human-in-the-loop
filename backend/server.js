const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Core Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'healthy',
    platform: 'Human-in-the-Loop Decision Intelligence',
    philosophy: 'AI recommends. Humans decide.',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    n8nConfigured: !!(process.env.N8N_WEBHOOK_URL && !process.env.N8N_WEBHOOK_URL.includes('your-n8n')),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/decisions', require('./routes/decisionRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/ai', require('./routes/aiSuggestRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralised Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log('=======================================================');
  console.log(`  HITL Decision Intelligence — running on port ${PORT}`);
  console.log(`  AI recommends → Humans decide.`);
  console.log('=======================================================');
});

module.exports = app;
