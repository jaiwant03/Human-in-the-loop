const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const Decision = require('./models/Decision');
const { calculateScores, calculateConfidence } = require('./services/scoringService');
const { analyzeDecisionWithN8N } = require('./services/n8nService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Core Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Human-in-the-Loop Decision Intelligence',
    philosophy: 'AI recommends. Humans decide.',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/decisions', require('./routes/decisionRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Auto-seed initial demo supplier decision if DB is fresh
const autoSeedIfEmpty = async () => {
  try {
    const count = await Decision.countDocuments();
    if (count === 0) {
      console.log('[AutoSeed] Database is fresh. Seeding initial Supplier Selection demo...');
      const demoCriteria = [
        { key: 'cost', name: 'Cost Efficiency', weight: 20, description: 'Affordability and bulk pricing discounts' },
        { key: 'quality', name: 'Product Quality', weight: 30, description: 'Material grade and defect rate standards' },
        { key: 'delivery', name: 'Delivery Performance', weight: 20, description: 'On-time delivery rate and lead times' },
        { key: 'reliability', name: 'Operational Reliability', weight: 20, description: 'Financial stability and SLA consistency' },
        { key: 'risk', name: 'Risk Management', weight: 10, description: 'Supply chain redundancy and compliance' },
      ];

      const demoOptions = [
        {
          id: 'opt-supplier-a',
          name: 'Supplier A',
          description: 'Premium tier supplier known for exceptional quality and reliability.',
          criteria: { cost: 78, quality: 92, delivery: 88, reliability: 91, risk: 85 },
        },
        {
          id: 'opt-supplier-b',
          name: 'Supplier B',
          description: 'Cost-effective logistics specialist with rapid delivery capability.',
          criteria: { cost: 90, quality: 82, delivery: 94, reliability: 85, risk: 78 },
        },
        {
          id: 'opt-supplier-c',
          name: 'Supplier C',
          description: 'Budget domestic alternative with lower overhead and moderate reliability.',
          criteria: { cost: 86, quality: 74, delivery: 80, reliability: 79, risk: 72 },
        },
      ];

      const demoWeights = { cost: 20, quality: 30, delivery: 20, reliability: 20, risk: 10 };
      const calculatedScores = calculateScores(demoOptions, demoWeights);
      const criteriaKeys = demoCriteria.map(c => c.key);
      const confidenceAnalysis = calculateConfidence(demoOptions, criteriaKeys, calculatedScores);

      const decision = new Decision({
        title: 'Select Best Supplier for Raw Materials',
        description: 'Strategic supplier selection for industrial precision manufacturing based on total cost, quality assurance, fulfillment speed, and supply chain reliability.',
        category: 'Supplier Selection',
        options: demoOptions,
        criteria: demoCriteria,
        weights: demoWeights,
        calculatedScores,
        status: 'AWAITING_HUMAN_DECISION',
        auditLogs: [
          {
            action: 'INITIAL_DEMO_SEEDED',
            timestamp: new Date(),
            details: { benchmark: 'Supplier Evaluation Model v1.0' },
          },
        ],
      });

      const { aiAnalysis } = await analyzeDecisionWithN8N(decision);
      decision.aiAnalysis = aiAnalysis;
      await decision.save();
      console.log('[AutoSeed] Canonical Supplier Selection decision seeded successfully.');
    }
  } catch (err) {
    console.warn('[AutoSeed] Warning during initial seed:', err.message);
  }
};

// Start Server
const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 HITL Decision Intelligence Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚖️  Philosophy: AI recommends → Humans decide.`);
  console.log(`=======================================================`);

  // Allow Mongoose connection to establish, then check seed
  setTimeout(autoSeedIfEmpty, 1500);
});

module.exports = app;
