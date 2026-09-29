const axios = require('axios');
const { calculateScores, calculateConfidence } = require('./scoringService');

/**
 * Service to orchestrate the AI Decision Intelligence workflow.
 * Primary route: n8n Webhook -> Groq AI -> Structured Output
 * Resilient fallback: Direct Groq or Deterministic Reasoning Engine if n8n is offline.
 */

const GROQ_SYSTEM_PROMPT = `You are an explainable decision-support AI within the Human-in-the-Loop Decision Intelligence Platform.
You are NOT the final decision-maker.
Analyze the provided decision data.
Identify the highest-scoring option based on the deterministic scores supplied.
Explain why that option is recommended using only the supplied evidence.
Identify important positive factors.
Identify negative factors and trade-offs.
Identify potential risks.
Provide one or more reasonable alternatives based on the supplied data.
Do not invent facts.
Do not create unsupported numerical values.
If data is missing, explicitly state that the evidence is insufficient.
The final human decision must remain separate from the AI recommendation.
Return ONLY valid structured JSON matching this exact schema:
{
  "recommendation": {
    "option": "Name of top option",
    "score": 87
  },
  "confidence": 87,
  "summary": "Concise high-level rationale based on scores",
  "reasons": ["Reason 1", "Reason 2"],
  "evidence": [
    { "factor": "Criterion name", "value": 92, "impact": "positive", "explanation": "..." },
    { "factor": "Criterion name", "value": 78, "impact": "negative", "explanation": "..." }
  ],
  "risks": [
    { "risk": "Description of risk", "severity": "low|medium|high", "explanation": "..." }
  ],
  "alternatives": [
    { "option": "Name of alternative option", "score": 82, "reason": "Why consider it" }
  ],
  "tradeoffs": [
    "Tradeoff description"
  ]
}`;

/**
 * Validates and normalizes AI analysis structure
 */
function sanitizeAiAnalysis(aiData, calculatedScores, deterministicConfidence) {
  if (!aiData || typeof aiData !== 'object') {
    throw new Error('Invalid AI response format: Expected JSON object.');
  }

  const topOption = calculatedScores[0];

  // Guarantee that recommendation respects deterministic #1 rank
  const recommendation = {
    option: topOption.name,
    score: topOption.score,
    optionId: topOption.optionId,
  };

  const confidence = deterministicConfidence.score || aiData.confidence || 85;
  const confidenceCategory = deterministicConfidence.category || (confidence >= 80 ? 'High Confidence' : confidence >= 60 ? 'Medium Confidence' : 'Low Confidence');

  const summary = aiData.summary || `${topOption.name} achieves the highest overall weighted score (${topOption.score}/100) based on evaluated criteria.`;

  const reasons = Array.isArray(aiData.reasons) && aiData.reasons.length > 0
    ? aiData.reasons
    : [`Ranked #1 with total score of ${topOption.score}`, 'Strong performance on weighted decision criteria'];

  const evidence = Array.isArray(aiData.evidence) && aiData.evidence.length > 0
    ? aiData.evidence.map(e => ({
        factor: String(e.factor || 'Factor'),
        value: Number(e.value) || 0,
        impact: ['positive', 'negative', 'neutral'].includes(e.impact) ? e.impact : 'positive',
        explanation: String(e.explanation || ''),
      }))
    : [];

  const risks = Array.isArray(aiData.risks) && aiData.risks.length > 0
    ? aiData.risks.map(r => ({
        risk: String(r.risk || 'Operational Risk'),
        severity: ['low', 'medium', 'high'].includes(r.severity?.toLowerCase()) ? r.severity.toLowerCase() : 'medium',
        explanation: String(r.explanation || ''),
      }))
    : [];

  // Build alternatives from remaining ranked options if missing or unpopulated
  let alternatives = [];
  if (Array.isArray(aiData.alternatives) && aiData.alternatives.length > 0) {
    alternatives = aiData.alternatives.map(a => ({
      option: String(a.option),
      score: Number(a.score) || 0,
      reason: String(a.reason || 'Viable alternative runner-up'),
    }));
  } else if (calculatedScores.length > 1) {
    alternatives = calculatedScores.slice(1, 3).map(opt => ({
      option: opt.name,
      score: opt.score,
      reason: `Runner-up (Rank #${opt.rank}) with strong competitive attributes.`,
    }));
  }

  const tradeoffs = Array.isArray(aiData.tradeoffs) && aiData.tradeoffs.length > 0
    ? aiData.tradeoffs
    : ['Balance between higher priority criteria and secondary trade-offs'];

  return {
    recommendation,
    confidence,
    confidenceCategory,
    summary,
    reasons,
    evidence,
    risks,
    alternatives,
    tradeoffs,
  };
}

/**
 * Deterministic Reasoning Engine
 * Used when external n8n/Groq network calls are unavailable or as an instant baseline.
 * Grounded 100% in empirical numbers without hallucination.
 */
function generateDeterministicReasoning(decision, calculatedScores, deterministicConfidence) {
  const top = calculatedScores[0];
  const runnerUp = calculatedScores.length > 1 ? calculatedScores[1] : null;
  const criteriaList = decision.criteria || [];
  const topCriteria = top.rawCriteria || {};
  const runnerUpCriteria = runnerUp?.rawCriteria || {};

  const evidence = [];
  const risks = [];
  const tradeoffs = [];
  const reasons = [];

  // Evaluate each criterion
  criteriaList.forEach((crit) => {
    const key = crit.key;
    const name = crit.name;
    const topVal = topCriteria[key] || 0;
    const runnerVal = runnerUpCriteria[key] || 0;

    if (topVal >= 85) {
      evidence.push({
        factor: name,
        value: topVal,
        impact: 'positive',
        explanation: `${top.name} demonstrates superior rating (${topVal}/100) in ${name.toLowerCase()}.`,
      });
      reasons.push(`Superior ${name} rating (${topVal})`);
    } else if (topVal < 75) {
      evidence.push({
        factor: name,
        value: topVal,
        impact: 'negative',
        explanation: `${top.name} exhibits a lower performance score (${topVal}/100) in ${name.toLowerCase()}.`,
      });
      risks.push({
        risk: `Suboptimal ${name}`,
        severity: topVal < 60 ? 'high' : 'medium',
        explanation: `${top.name} scored ${topVal}/100 in ${name}. Consider if project priorities require higher performance in this domain.`,
      });
    } else {
      evidence.push({
        factor: name,
        value: topVal,
        impact: 'positive',
        explanation: `${top.name} maintains solid capability (${topVal}/100) in ${name.toLowerCase()}.`,
      });
    }

    // Trade-off identification
    if (runnerUp && runnerVal > topVal) {
      tradeoffs.push(
        `${runnerUp.name} leads in ${name} (${runnerVal} vs ${topVal}), creating a trade-off against ${top.name}'s overall advantage.`
      );
    }
  });

  if (reasons.length === 0) {
    reasons.push(`Achieved top weighted score of ${top.score}/100 across evaluated criteria.`);
  }

  if (tradeoffs.length === 0) {
    tradeoffs.push(`${top.name} balances multiple performance criteria without critical single-point vulnerabilities.`);
  }

  const alternatives = [];
  if (runnerUp) {
    alternatives.push({
      option: runnerUp.name,
      score: runnerUp.score,
      reason: `Closest runner-up with score ${runnerUp.score}. Strong candidate if weighting priorities shift.`,
    });
  }
  if (calculatedScores.length > 2) {
    alternatives.push({
      option: calculatedScores[2].name,
      score: calculatedScores[2].score,
      reason: `Alternative option with score ${calculatedScores[2].score}.`,
    });
  }

  return {
    recommendation: {
      option: top.name,
      score: top.score,
    },
    confidence: deterministicConfidence.score,
    summary: `${top.name} ranks highest with an aggregate weighted score of ${top.score}/100, outperforming ${runnerUp ? runnerUp.name : 'other candidates'}.`,
    reasons,
    evidence,
    risks: risks.length > 0 ? risks : [{ risk: 'Moderate Score Margin', severity: 'low', explanation: 'Top candidate exhibits balanced scores with minimal critical liabilities.' }],
    alternatives,
    tradeoffs,
  };
}

/**
 * Direct Groq API call fallback
 */
async function callGroqDirect(payload) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: GROQ_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Decision Context:\nTitle: ${payload.title}\nDescription: ${payload.description}\nCategory: ${payload.category}\nOptions & Criteria: ${JSON.stringify(payload.options, null, 2)}\nWeights: ${JSON.stringify(payload.weights, null, 2)}\nDeterministic Calculated Scores: ${JSON.stringify(payload.calculatedScores, null, 2)}\nDeterministic Confidence: ${JSON.stringify(payload.confidenceAnalysis, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  const rawJson = response.data?.choices?.[0]?.message?.content;
  return JSON.parse(rawJson);
}

/**
 * Main orchestration entry point
 * 1. Checks n8n webhook URL
 * 2. If n8n succeeds, parses response
 * 3. If n8n fails or is unset, uses direct Groq or deterministic engine
 * 4. Ensures strict schema and returns validated AI analysis
 */
async function analyzeDecisionWithN8N(decision) {
  const options = decision.options.map(opt => ({
    id: opt.id || opt._id?.toString(),
    name: opt.name,
    criteria: opt.criteria instanceof Map ? Object.fromEntries(opt.criteria) : opt.criteria,
  }));

  const weights = decision.weights instanceof Map ? Object.fromEntries(decision.weights) : decision.weights;
  const criteriaKeys = decision.criteria.map(c => c.key);

  // 1. Calculate deterministic scores
  const calculatedScores = calculateScores(options, weights);

  // 2. Calculate deterministic confidence
  const confidenceAnalysis = calculateConfidence(options, criteriaKeys, calculatedScores);

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  let rawAiResult = null;
  let source = 'n8n_groq';

  const payload = {
    decisionId: decision._id.toString(),
    title: decision.title,
    description: decision.description,
    category: decision.category,
    options,
    criteria: decision.criteria,
    weights,
    calculatedScores,
    confidenceAnalysis,
  };

  // Attempt 1: Call n8n webhook if configured
  if (webhookUrl && !webhookUrl.includes('your-n8n-instance') && !webhookUrl.includes('example.com')) {
    try {
      console.log(`[n8nService] Dispatching decision payload to n8n webhook: ${webhookUrl}`);
      const response = await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      if (response.data && (response.data.recommendation || response.data.aiAnalysis || response.data.data)) {
        rawAiResult = response.data.aiAnalysis || response.data.data || response.data;
        source = 'n8n_groq';
        console.log('[n8nService] Successfully received AI analysis from n8n webhook.');
      } else {
        console.warn('[n8nService] n8n returned unexpected data structure, falling back.');
      }
    } catch (err) {
      console.warn(`[n8nService] n8n webhook error (${err.message}). Proceeding with resilient fallback.`);
    }
  }

  // Attempt 2: If n8n did not return data, attempt direct Groq if key is set
  if (!rawAiResult && process.env.GROQ_API_KEY) {
    try {
      console.log('[n8nService] Querying Groq API directly...');
      rawAiResult = await callGroqDirect(payload);
      source = 'direct_groq';
      console.log('[n8nService] Received analysis from Groq directly.');
    } catch (err) {
      console.warn(`[n8nService] Direct Groq call failed (${err.message}). Falling back to Deterministic AI Engine.`);
    }
  }

  // Attempt 3: Deterministic Grounded Engine fallback
  if (!rawAiResult) {
    console.log('[n8nService] Generating grounded empirical reasoning via Deterministic Engine.');
    rawAiResult = generateDeterministicReasoning(decision, calculatedScores, confidenceAnalysis);
    source = 'deterministic_engine';
  }

  // Sanitize and guarantee validity
  const sanitized = sanitizeAiAnalysis(rawAiResult, calculatedScores, confidenceAnalysis);
  sanitized.source = source;
  sanitized.analyzedAt = new Date();

  return {
    calculatedScores,
    confidenceAnalysis,
    aiAnalysis: sanitized,
  };
}

module.exports = {
  analyzeDecisionWithN8N,
  GROQ_SYSTEM_PROMPT,
};
