const Decision = require('../models/Decision');
const Simulation = require('../models/Simulation');
const { calculateScores, calculateConfidence } = require('../services/scoringService');
const { analyzeDecisionWithN8N } = require('../services/n8nService');

/**
 * Create a new decision
 * POST /api/decisions
 */
const createDecision = async (req, res, next) => {
  try {
    const { title, description, category, options, criteria, weights } = req.body;

    const formattedOptions = options.map((opt, idx) => ({
      id: opt.id || `opt-${idx + 1}`,
      name: opt.name.trim(),
      description: opt.description || '',
      criteria: opt.criteria,
    }));

    const calculatedScores = calculateScores(formattedOptions, weights);
    const criteriaKeys = criteria.map(c => c.key);
    calculateConfidence(formattedOptions, criteriaKeys, calculatedScores);

    const newDecision = new Decision({
      title: title.trim(),
      description: description.trim(),
      category: category || 'Custom',
      options: formattedOptions,
      criteria,
      weights,
      calculatedScores,
      status: 'AWAITING_HUMAN_DECISION',
      auditLogs: [
        {
          action: 'DECISION_CREATED',
          timestamp: new Date(),
          details: {
            title: title.trim(),
            optionsCount: options.length,
            criteriaCount: criteria.length,
          },
        },
      ],
    });

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
      console.warn('[DecisionController] AI analysis error:', aiErr.message);
    }

    const saved = await newDecision.save();

    res.status(201).json({
      success: true,
      message: 'Decision created and analyzed.',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Re-run AI analysis on an existing decision
 * POST /api/decisions/:id/analyze
 */
const analyzeDecision = async (req, res, next) => {
  try {
    const decision = await Decision.findById(req.params.id);
    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found.' });
    }

    const { calculatedScores, aiAnalysis } = await analyzeDecisionWithN8N(decision);

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
      message: 'AI analysis completed.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List decisions with optional filters
 * GET /api/decisions
 */
const getDecisions = async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    const query = {};

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const decisions = await Decision.find(query).sort({ createdAt: -1 });

    res.json({ success: true, count: decisions.length, data: decisions });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single decision by ID
 * GET /api/decisions/:id
 */
const getDecisionById = async (req, res, next) => {
  try {
    const decision = await Decision.findById(req.params.id);
    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found.' });
    }

    const simulations = await Simulation.find({ decisionId: decision._id }).sort({ createdAt: -1 });

    res.json({ success: true, data: decision, simulations });
  } catch (error) {
    next(error);
  }
};

/**
 * Record human final decision
 * POST /api/decisions/:id/finalize
 *
 * HITL rules enforced:
 * - AI recommendation is NEVER modified.
 * - Human explicitly sets the final choice.
 * - Override requires a justification reason.
 */
const finalizeDecision = async (req, res, next) => {
  try {
    const { option, type, reason } = req.body;
    const decision = await Decision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found.' });
    }

    const validOption = decision.options.find(o => o.name === option);
    if (!validOption) {
      return res.status(400).json({
        success: false,
        message: `"${option}" is not a valid option for this decision.`,
      });
    }

    const aiRecOption = decision.aiAnalysis?.recommendation?.option;

    decision.humanDecision = {
      option,
      type,
      reason: reason || (type === 'ACCEPT_AI'
        ? 'Accepted AI recommendation.'
        : 'Alternative selected.'),
      decidedAt: new Date(),
    };

    decision.status = 'FINALIZED';

    decision.auditLogs.push({
      action: 'HUMAN_DECISION_RECORDED',
      timestamp: new Date(),
      details: {
        humanChoice: option,
        aiRecommendation: aiRecOption,
        decisionType: type,
        reason: decision.humanDecision.reason,
      },
    });

    const saved = await decision.save();

    res.json({
      success: true,
      message: 'Human decision recorded.',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Run What-If simulation (never modifies the original decision)
 * POST /api/decisions/:id/simulate
 */
const simulateWhatIf = async (req, res, next) => {
  try {
    const { simulatedWeights, simulationName } = req.body;
    const decision = await Decision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ success: false, message: 'Decision not found.' });
    }

    if (!simulatedWeights || typeof simulatedWeights !== 'object') {
      return res.status(400).json({ success: false, message: 'simulatedWeights is required.' });
    }

    const options = decision.options.map(opt => ({
      id: opt.id,
      name: opt.name,
      criteria: opt.criteria instanceof Map ? Object.fromEntries(opt.criteria) : opt.criteria,
    }));

    const originalScores = decision.calculatedScores.map(s => ({ name: s.name, score: s.score, rank: s.rank }));
    const simulatedScores = calculateScores(options, simulatedWeights);

    const originalTop = originalScores[0]?.name;
    const simulatedTop = simulatedScores[0]?.name;
    const changed = originalTop !== simulatedTop;

    const deltas = {};
    simulatedScores.forEach(sim => {
      const orig = originalScores.find(o => o.name === sim.name);
      deltas[sim.name] = orig ? Math.round((sim.score - orig.score) * 10) / 10 : 0;
    });

    const explanation = changed
      ? `The recommendation shifted from ${originalTop} to ${simulatedTop} because ${simulatedTop} performs stronger in the criteria now weighted higher.`
      : `${originalTop} holds the top rank under the modified weights, showing cross-criteria robustness.`;

    const simulation = new Simulation({
      decisionId: decision._id,
      simulationName: simulationName || `Simulation ${new Date().toLocaleString()}`,
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

    res.json({ success: true, data: savedSim });
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
};
