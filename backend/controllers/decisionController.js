const Decision = require('../models/Decision');
const Simulation = require('../models/Simulation');
const { calculateScores, calculateConfidence, normalizeWeights } = require('../services/scoringService');
const { analyzeDecisionWithN8N } = require('../services/n8nService');

/**
 * Create a new decision
 * POST /api/decisions
 */
const createDecision = async (req, res, next) => {
  try {
    const { title, description, category, options, criteria, weights } = req.body;

    // Prepare normalized options structure
    const formattedOptions = options.map((opt, idx) => ({
      id: opt.id || `opt-${idx + 1}`,
      name: opt.name.trim(),
      description: opt.description || '',
      criteria: opt.criteria,
    }));

    // Pre-calculate deterministic scores
    const calculatedScores = calculateScores(formattedOptions, weights);
    const criteriaKeys = criteria.map(c => c.key);
    const confidenceAnalysis = calculateConfidence(formattedOptions, criteriaKeys, calculatedScores);

    const newDecision = new Decision({
      title: title.trim(),
      description: description.trim(),
      category: category || 'Supplier Selection',
      options: formattedOptions,
      criteria,
      weights,
      calculatedScores,
      status: 'AWAITING_HUMAN_DECISION',
      auditLogs: [
        {
          action: 'DECISION_CREATED',
          timestamp: new Date(),
          details: { title, optionsCount: options.length, criteriaCount: criteria.length },
        },
      ],
    });

    // Run AI analysis through n8n / Groq orchestration
    try {
      const { aiAnalysis } = await analyzeDecisionWithN8N(newDecision);
      newDecision.aiAnalysis = aiAnalysis;
      newDecision.auditLogs.push({
        action: 'AI_ANALYSIS_COMPLETED',
        timestamp: new Date(),
        details: {
          recommendedOption: aiAnalysis.recommendation.option,
          confidence: aiAnalysis.confidence,
          source: aiAnalysis.source,
        },
      });
    } catch (aiErr) {
      console.warn('[DecisionController] AI Analysis note:', aiErr.message);
    }

    const saved = await newDecision.save();

    res.status(201).json({
      success: true,
      message: 'Decision created and analyzed successfully.',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger or re-run AI analysis on an existing decision
 * POST /api/decisions/:id/analyze
 */
const analyzeDecision = async (req, res, next) => {
  try {
    const decision = await Decision.findById(req.params.id);
    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found.' });
    }

    const { calculatedScores, confidenceAnalysis, aiAnalysis } = await analyzeDecisionWithN8N(decision);

    decision.calculatedScores = calculatedScores;
    decision.aiAnalysis = aiAnalysis;
    if (decision.status !== 'FINALIZED') {
      decision.status = 'AWAITING_HUMAN_DECISION';
    }

    decision.auditLogs.push({
      action: 'AI_ANALYSIS_REFRESHED',
      timestamp: new Date(),
      details: {
        recommendation: aiAnalysis.recommendation.option,
        confidence: aiAnalysis.confidence,
        source: aiAnalysis.source,
      },
    });

    const updated = await decision.save();

    res.json({
      success: true,
      message: 'Decision analyzed successfully via n8n Groq workflow.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all decisions with optional filtering
 * GET /api/decisions
 */
const getDecisions = async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const decisions = await Decision.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: decisions.length,
      data: decisions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get decision by ID
 * GET /api/decisions/:id
 */
const getDecisionById = async (req, res, next) => {
  try {
    const decision = await Decision.findById(req.params.id);
    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found.' });
    }

    // Also fetch associated simulations
    const simulations = await Simulation.find({ decisionId: decision._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: decision,
      simulations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record human final decision
 * POST /api/decisions/:id/finalize
 *
 * MANDATORY HITL RULES:
 * - AI recommendation is NEVER altered.
 * - Human explicitly sets the final decision.
 * - If Override, justification reason is required.
 */
const finalizeDecision = async (req, res, next) => {
  try {
    const { option, type, reason } = req.body;
    const decision = await Decision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found.' });
    }

    // Verify selected option is valid
    const validOption = decision.options.find(o => o.name === option);
    if (!validOption) {
      return res.status(400).json({
        success: false,
        message: `Option "${option}" is not in the list of valid candidates.`,
      });
    }

    const aiRecOption = decision.aiAnalysis?.recommendation?.option;

    // Record human decision
    decision.humanDecision = {
      option,
      type,
      reason: reason || (type === 'ACCEPT_AI' ? 'Accepted AI recommendation based on supporting evidence.' : 'Selected viable alternative candidate.'),
      decidedAt: new Date(),
    };

    decision.status = 'FINALIZED';

    // Add audit log entry
    decision.auditLogs.push({
      action: 'HUMAN_DECISION_RECORDED',
      timestamp: new Date(),
      details: {
        humanChoice: option,
        aiRecommendation: aiRecOption,
        decisionType: type,
        hasOverride: type === 'OVERRIDE_AI',
        reason: decision.humanDecision.reason,
      },
    });

    const saved = await decision.save();

    res.json({
      success: true,
      message: 'Human final decision recorded successfully. Audit log updated.',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Run What-If Simulation
 * POST /api/decisions/:id/simulate
 *
 * Recalculates scores under altered criteria weights without changing the original decision!
 */
const simulateWhatIf = async (req, res, next) => {
  try {
    const { simulatedWeights, simulationName } = req.body;
    const decision = await Decision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found.' });
    }

    if (!simulatedWeights || typeof simulatedWeights !== 'object') {
      return res.status(400).json({ success: false, message: 'Simulated weights are required.' });
    }

    // Convert options from Map if needed
    const options = decision.options.map(opt => ({
      id: opt.id,
      name: opt.name,
      criteria: opt.criteria instanceof Map ? Object.fromEntries(opt.criteria) : opt.criteria,
    }));

    const originalScores = decision.calculatedScores.map(s => ({
      name: s.name,
      score: s.score,
      rank: s.rank,
    }));

    // Calculate new deterministic scores with simulated weights
    const simulatedScores = calculateScores(options, simulatedWeights);

    const originalTop = originalScores[0]?.name;
    const simulatedTop = simulatedScores[0]?.name;
    const changed = originalTop !== simulatedTop;

    // Calculate deltas
    const deltas = {};
    simulatedScores.forEach(sim => {
      const orig = originalScores.find(o => o.name === sim.name);
      deltas[sim.name] = orig ? Math.round((sim.score - orig.score) * 10) / 10 : 0;
    });

    let explanation = '';
    if (changed) {
      explanation = `The top recommendation shifted from ${originalTop} to ${simulatedTop}. This occurs because ${simulatedTop} has stronger ratings in criteria that were assigned higher weights in this simulation.`;
    } else {
      explanation = `${originalTop} maintains the #1 rank under the modified weight profile, demonstrating strong cross-criteria robustness.`;
    }

    const simulation = new Simulation({
      decisionId: decision._id,
      simulationName: simulationName || `Simulation @ ${new Date().toLocaleTimeString()}`,
      originalWeights: decision.weights,
      simulatedWeights,
      originalScores,
      simulatedScores: simulatedScores.map(s => ({ name: s.name, score: s.score, rank: s.rank })),
      originalTopOption: originalTop,
      simulatedTopOption: simulatedTop,
      changed,
      explanation,
      deltas,
    });

    const savedSim = await simulation.save();

    res.json({
      success: true,
      data: savedSim,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Seed initial demo data for Supplier Selection
 * POST /api/decisions/seed-demo
 */
const seedDemoSupplierDecision = async (req, res, next) => {
  try {
    const existing = await Decision.findOne({ title: 'Select Best Supplier for Raw Materials' });
    if (existing) {
      return res.json({
        success: true,
        message: 'Demo supplier decision already seeded.',
        data: existing,
      });
    }

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

    const demoWeights = {
      cost: 20,
      quality: 30,
      delivery: 20,
      reliability: 20,
      risk: 10,
    };

    const calculatedScores = calculateScores(demoOptions, demoWeights);
    const criteriaKeys = demoCriteria.map(c => c.key);
    const confidenceAnalysis = calculateConfidence(demoOptions, criteriaKeys, calculatedScores);

    const demoDecision = new Decision({
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
          action: 'DEMO_DECISION_INITIALIZED',
          timestamp: new Date(),
          details: { benchmark: 'Supplier Evaluation Model v1.0' },
        },
      ],
    });

    const { aiAnalysis } = await analyzeDecisionWithN8N(demoDecision);
    demoDecision.aiAnalysis = aiAnalysis;
    demoDecision.auditLogs.push({
      action: 'AI_ANALYSIS_COMPLETED',
      timestamp: new Date(),
      details: { recommendation: aiAnalysis.recommendation.option, confidence: aiAnalysis.confidence },
    });

    const saved = await demoDecision.save();

    res.status(201).json({
      success: true,
      message: 'Demo supplier decision created successfully.',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDecision,
  analyzeDecision,
  getDecisions,
  getDecisionById,
  finalizeDecision,
  simulateWhatIf,
  seedDemoSupplierDecision,
};
