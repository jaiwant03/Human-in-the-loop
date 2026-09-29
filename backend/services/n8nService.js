const axios = require('axios');
const { calculateScores, calculateConfidence } = require('./scoringService');

// ──────────────────────────────────────────────────────────────
// GROQ SYSTEM PROMPT
// ──────────────────────────────────────────────────────────────
const GROQ_SYSTEM_PROMPT = `You are an explainable decision-support AI within the Human-in-the-Loop Decision Intelligence Platform.

You are NOT the final decision-maker. The human always retains final authority.

A deterministic scoring engine has already calculated the official weighted scores — these are provided as ground truth.
You MUST NOT recalculate or invent any numerical scores.
You MUST NOT fabricate data or external facts.

Your job:
1. Explain why the top-ranked option was recommended based on the scores and criteria provided.
2. Identify the strongest positive factors for the top option.
3. Identify negative factors or gaps.
4. Identify realistic risks based only on the supplied data.
5. Suggest viable alternative options from the supplied list only.
6. Summarise key trade-offs.

Return ONLY valid JSON — no markdown, no explanation outside JSON:
{
  "recommendation": { "option": "<exact name of rank #1 option>", "score": <number> },
  "summary": "<2-3 sentence summary>",
  "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
  "evidence": [
    { "factor": "<criterion name>", "value": <score 0-100>, "impact": "positive|negative|neutral", "explanation": "<one sentence>" }
  ],
  "risks": [
    { "risk": "<short title>", "severity": "low|medium|high", "explanation": "<one sentence>" }
  ],
  "alternatives": [
    { "option": "<option name>", "score": <number>, "reason": "<why consider this>" }
  ],
  "tradeoffs": ["<tradeoff 1>", "<tradeoff 2>"]
}`;

// ──────────────────────────────────────────────────────────────
// SANITIZE AI RESPONSE
// Enforces deterministic grounding — AI can never override scores
// ──────────────────────────────────────────────────────────────
function sanitizeAiAnalysis(aiData, calculatedScores, deterministicConfidence) {
  if (!aiData || typeof aiData !== 'object') {
    throw new Error('Invalid AI response: expected JSON object');
  }

  const top = calculatedScores[0];
  const runnerUp = calculatedScores[1] || null;

  // ALWAYS enforce deterministic winner — AI cannot change the top option
  const recommendation = {
    option: top.name,
    score: top.score,
    optionId: top.optionId || top.name,
  };

  const confidence     = deterministicConfidence.score || 75;
  const confidenceCategory = deterministicConfidence.category || 'Medium Confidence';

  const summary = (typeof aiData.summary === 'string' && aiData.summary.trim())
    ? aiData.summary
    : `${top.name} achieves the highest weighted score (${top.score}/100) based on the criteria and weights provided.`;

  const reasons = (Array.isArray(aiData.reasons) && aiData.reasons.length > 0)
    ? aiData.reasons.map(r => String(r))
    : [`Ranked #1 with score ${top.score}/100`, 'Strongest overall performance across weighted criteria'];

  const evidence = (Array.isArray(aiData.evidence) && aiData.evidence.length > 0)
    ? aiData.evidence.map(e => ({
        factor:      String(e.factor || e.criterion || 'Criterion'),
        value:       typeof e.value === 'number' ? e.value : parseFloat(e.value) || 0,
        impact:      ['positive','negative','neutral'].includes(String(e.impact).toLowerCase()) ? String(e.impact).toLowerCase() : 'positive',
        explanation: String(e.explanation || ''),
      }))
    : [];

  const risks = (Array.isArray(aiData.risks) && aiData.risks.length > 0)
    ? aiData.risks.map(r => ({
        risk:        String(r.risk || r.title || 'Risk'),
        severity:    ['low','medium','high'].includes(String(r.severity).toLowerCase()) ? String(r.severity).toLowerCase() : 'medium',
        explanation: String(r.explanation || ''),
      }))
    : [{ risk: 'Score Margin', severity: 'low', explanation: runnerUp ? `${runnerUp.name} is a close runner-up at ${runnerUp.score}.` : 'Monitor criteria performance over time.' }];

  // Alternatives must only reference submitted options and exclude the top option
  let alternatives = [];
  if (Array.isArray(aiData.alternatives) && aiData.alternatives.length > 0) {
    alternatives = aiData.alternatives
      .filter(a => String(a.option) !== top.name)
      .map(a => {
        const matched = calculatedScores.find(s => s.name === String(a.option));
        return {
          option: String(a.option),
          score:  matched ? matched.score : (typeof a.score === 'number' ? a.score : 0),
          reason: String(a.reason || 'Viable runner-up candidate'),
        };
      });
  }
  if (alternatives.length === 0 && runnerUp) {
    alternatives = [{
      option: runnerUp.name,
      score:  runnerUp.score,
      reason: `Runner-up with score ${runnerUp.score}. Consider if priorities shift.`,
    }];
    if (calculatedScores[2]) {
      alternatives.push({
        option: calculatedScores[2].name,
        score:  calculatedScores[2].score,
        reason: `Third option with score ${calculatedScores[2].score}.`,
      });
    }
  }

  const tradeoffs = (Array.isArray(aiData.tradeoffs) && aiData.tradeoffs.length > 0)
    ? aiData.tradeoffs.map(t => String(t))
    : [`${top.name} leads on overall score but individual criteria may differ from alternatives.`];

  return { recommendation, confidence, confidenceCategory, summary, reasons, evidence, risks, alternatives, tradeoffs };
}

// ──────────────────────────────────────────────────────────────
// DETERMINISTIC FALLBACK REASONING
// Pure math — no LLM, always works even without internet
// ──────────────────────────────────────────────────────────────
function generateDeterministicReasoning(decision, calculatedScores, conf) {
  const top      = calculatedScores[0];
  const runnerUp = calculatedScores[1] || null;
  const criteria = decision.criteria || [];
  const topCrit  = top.rawCriteria || {};
  const rnrCrit  = runnerUp?.rawCriteria || {};

  const evidence = [], risks = [], tradeoffs = [], reasons = [];

  criteria.forEach(c => {
    const key  = c.key;
    const name = c.name;
    const tv   = parseFloat(topCrit[key] || 0);
    const rv   = parseFloat(rnrCrit[key] || 0);

    if (tv >= 85) {
      evidence.push({ factor: name, value: tv, impact: 'positive', explanation: `${top.name} scores strongly (${tv}/100) on ${name}.` });
      reasons.push(`Strong ${name} performance (${tv}/100)`);
    } else if (tv < 70) {
      evidence.push({ factor: name, value: tv, impact: 'negative', explanation: `${top.name} scores lower (${tv}/100) on ${name}.` });
      risks.push({ risk: `Low ${name}`, severity: tv < 55 ? 'high' : 'medium', explanation: `${top.name} scored ${tv}/100 on ${name}. Reassess if this criterion becomes more important.` });
    } else {
      evidence.push({ factor: name, value: tv, impact: 'positive', explanation: `${top.name} shows adequate performance (${tv}/100) on ${name}.` });
    }

    if (runnerUp && rv > tv) {
      tradeoffs.push(`${runnerUp.name} outperforms on ${name} (${rv} vs ${tv}).`);
    }
  });

  if (reasons.length === 0) reasons.push(`Highest weighted score: ${top.score}/100`);
  if (tradeoffs.length === 0) tradeoffs.push(`${top.name} shows balanced performance across all criteria.`);

  const alts = calculatedScores.slice(1, 3).map(s => ({
    option: s.name, score: s.score,
    reason: `Rank #${s.rank} — viable if priorities shift.`,
  }));

  return {
    recommendation: { option: top.name, score: top.score },
    confidence: conf.score,
    summary: `${top.name} ranks #1 with a weighted score of ${top.score}/100, outperforming ${runnerUp ? runnerUp.name : 'all candidates'}.`,
    reasons, evidence,
    risks: risks.length > 0 ? risks : [{ risk: 'Score Margin', severity: 'low', explanation: 'Top option has a stable lead.' }],
    alternatives: alts, tradeoffs,
  };
}

// ──────────────────────────────────────────────────────────────
// DIRECT GROQ CALL
// Called when n8n is unavailable but GROQ_API_KEY is set
// ──────────────────────────────────────────────────────────────
async function callGroqDirect(payload) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const userContent =
    `Decision: ${payload.title}\n` +
    `Description: ${payload.description}\n` +
    `Category: ${payload.category}\n\n` +
    `Criteria & Weights:\n${payload.criteria.map(c => `  ${c.name}: ${payload.weights[c.key] || 0}%`).join('\n')}\n\n` +
    `Options & Scores:\n${payload.options.map(o => {
      const oc = o.criteria instanceof Map ? Object.fromEntries(o.criteria) : o.criteria || {};
      return `  ${o.name}:\n${payload.criteria.map(c => `    ${c.name}: ${oc[c.key] || 0}`).join('\n')}`;
    }).join('\n')}\n\n` +
    `DETERMINISTIC RESULTS (ground truth — do not modify):\n${payload.calculatedScores.map(s => `  Rank ${s.rank}: ${s.name} = ${s.score}`).join('\n')}\n\n` +
    `Top option: ${payload.calculatedScores[0].name} (score: ${payload.calculatedScores[0].score})\n` +
    `recommendation.option MUST be "${payload.calculatedScores[0].name}" and recommendation.score MUST be ${payload.calculatedScores[0].score}.`;

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: GROQ_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2048,
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    }
  );

  const raw = response.data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from Groq');
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

// ──────────────────────────────────────────────────────────────
// MAIN ORCHESTRATION ENTRY POINT
// Priority: n8n → Direct Groq → Deterministic Engine
// ──────────────────────────────────────────────────────────────
async function analyzeDecisionWithN8N(decision) {
  // Prepare options and weights (handle Mongoose Maps)
  const options = decision.options.map(opt => ({
    id:       opt.id || opt._id?.toString() || opt.name,
    name:     opt.name,
    criteria: opt.criteria instanceof Map ? Object.fromEntries(opt.criteria) : opt.criteria,
  }));
  const weights      = decision.weights instanceof Map ? Object.fromEntries(decision.weights) : decision.weights;
  const criteriaKeys = decision.criteria.map(c => c.key);

  // Always compute deterministic scores first (source of truth for scores)
  const calculatedScores  = calculateScores(options, weights);
  const confidenceAnalysis = calculateConfidence(options, criteriaKeys, calculatedScores);

  const webhookUrl = process.env.N8N_WEBHOOK_URL || '';
  let rawAiResult = null;
  let source = 'unknown';

  const payload = {
    decisionId:       decision._id.toString(),
    title:            decision.title,
    description:      decision.description,
    category:         decision.category,
    options,
    criteria:         decision.criteria,
    weights,
    calculatedScores,
    confidenceAnalysis,
  };

  // ── PATH 1: n8n webhook ──
  const n8nActive = webhookUrl &&
    !webhookUrl.includes('your-n8n') &&
    !webhookUrl.includes('example.com');

  if (n8nActive) {
    try {
      console.log(`[n8nService] → n8n: ${webhookUrl}`);
      const res = await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      const d = res.data;

      if (d?.success === true && d?.aiAnalysis) {
        rawAiResult = d.aiAnalysis;
        source = 'n8n_groq';
        console.log(`[n8nService] ✓ n8n success — top: ${rawAiResult.recommendation?.option}`);
      } else if (d?.recommendation || d?.data) {
        rawAiResult = d.data || d;
        source = 'n8n_groq';
        console.log('[n8nService] ✓ n8n legacy format');
      } else {
        console.warn('[n8nService] n8n returned unrecognised shape — falling back');
      }
    } catch (err) {
      console.warn(`[n8nService] n8n unreachable (${err.message}) — falling back to Groq direct`);
    }
  } else {
    console.log('[n8nService] n8n not configured or unavailable — using direct Groq');
  }

  // ── PATH 2: Direct Groq ──
  if (!rawAiResult && process.env.GROQ_API_KEY) {
    try {
      console.log('[n8nService] → Groq direct API...');
      rawAiResult = await callGroqDirect(payload);
      source = 'direct_groq';
      console.log(`[n8nService] ✓ Groq direct — top: ${rawAiResult?.recommendation?.option}`);
    } catch (err) {
      console.warn(`[n8nService] Groq direct failed (${err.message}) — falling back to deterministic engine`);
    }
  }

  // ── PATH 3: Deterministic engine (always works, no internet needed) ──
  if (!rawAiResult) {
    console.log('[n8nService] → Deterministic engine (offline fallback)');
    rawAiResult = generateDeterministicReasoning(decision, calculatedScores, confidenceAnalysis);
    source = 'deterministic_engine';
  }

  // Sanitize and enforce grounding
  const sanitized = sanitizeAiAnalysis(rawAiResult, calculatedScores, confidenceAnalysis);
  sanitized.source      = source;
  sanitized.analyzedAt  = new Date();

  return { calculatedScores, confidenceAnalysis, aiAnalysis: sanitized };
}

module.exports = { analyzeDecisionWithN8N, GROQ_SYSTEM_PROMPT };
