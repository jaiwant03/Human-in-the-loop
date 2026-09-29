const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  criteria: {
    type: Map,
    of: Number,
    required: true,
  },
});

const CriterionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  name: { type: String, required: true },
  weight: { type: Number, required: true }, // percentage 0-100 or normalized
  description: { type: String, default: '' },
});

const CalculatedScoreSchema = new mongoose.Schema({
  optionId: { type: String },
  name: { type: String, required: true },
  score: { type: Number, required: true },
  rank: { type: Number, required: true },
  breakdown: { type: Map, of: Number },
});

const EvidenceSchema = new mongoose.Schema({
  factor: { type: String, required: true },
  value: { type: Number, required: true },
  impact: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'positive' },
  explanation: { type: String, required: true },
});

const RiskSchema = new mongoose.Schema({
  risk: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  explanation: { type: String, required: true },
});

const AlternativeSchema = new mongoose.Schema({
  option: { type: String, required: true },
  score: { type: Number, required: true },
  reason: { type: String, required: true },
});

const AiAnalysisSchema = new mongoose.Schema({
  recommendation: {
    option: { type: String, required: true },
    score: { type: Number, required: true },
  },
  confidence: { type: Number, required: true },
  confidenceCategory: {
    type: String,
    enum: ['High Confidence', 'Medium Confidence', 'Low Confidence'],
    default: 'High Confidence',
  },
  summary: { type: String, default: '' },
  reasons: [{ type: String }],
  evidence: [EvidenceSchema],
  risks: [RiskSchema],
  alternatives: [AlternativeSchema],
  tradeoffs: [{ type: String }],
  source: { type: String, default: 'n8n_groq' },
  analyzedAt: { type: Date, default: Date.now },
});

const HumanDecisionSchema = new mongoose.Schema({
  option: { type: String, required: true },
  type: {
    type: String,
    enum: ['ACCEPT_AI', 'SELECT_ALTERNATIVE', 'OVERRIDE_AI'],
    required: true,
  },
  reason: { type: String, default: '' },
  decidedAt: { type: Date, default: Date.now },
});

const DecisionSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'analyst-1' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Supplier Selection',
        'Project Selection',
        'Product Selection',
        'Career Decision',
        'Event Selection',
        'Vendor Selection',
        'Investment Selection',
        'Resource Allocation',
        'Custom',
      ],
      default: 'Supplier Selection',
    },
    options: [OptionSchema],
    criteria: [CriterionSchema],
    weights: {
      type: Map,
      of: Number,
      required: true,
    },
    calculatedScores: [CalculatedScoreSchema],
    aiAnalysis: {
      type: AiAnalysisSchema,
      default: null,
    },
    humanDecision: {
      type: HumanDecisionSchema,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING_ANALYSIS', 'AWAITING_HUMAN_DECISION', 'FINALIZED'],
      default: 'PENDING_ANALYSIS',
    },
    auditLogs: [
      {
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Decision', DecisionSchema);
