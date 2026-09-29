const axios = require('axios');
const { calculateScores, calculateConfidence } = require('../services/scoringService');
const { analyzeDecisionWithN8N } = require('../services/n8nService');
const Decision = require('../models/Decision');

// ──────────────────────────────────────────────────────────────────────────────
// GROQ SYSTEM PROMPT — Natural Language → Decision Structure Parser
// ──────────────────────────────────────────────────────────────────────────────
const PARSE_SYSTEM_PROMPT = `You are a decision-structure extraction assistant.

The user will describe a decision problem in plain language.
Your job is to extract a structured multi-criteria decision model from their message.

Rules:
- Extract a clear decision title from the user's message.
- Identify the candidate options the user mentioned (minimum 2).
- Identify evaluation criteria that matter for this decision.
- Assign sensible weights to each criterion (must sum to exactly 100).
- Estimate plausible performance scores (0-100) for each option on each criterion based on general knowledge.
- Scores must be grounded and realistic — do not fabricate random numbers.
- If the user provides explicit scores or preferences, use them.
- The category must be one of: Supplier Selection, Project Selection, Product Selection, Vendor Selection, Investment Selection, Resource Allocation, Career Decision, Event Selection, Custom.

Return ONLY valid JSON — no markdown, no explanation, just the JSON object:
{
  "title": "<concise decision title>",
  "description": "<one sentence describing the decision context>",
  "category": "<one of the allowed categories>",
  "options": [
    {
      "id": "opt-1",
      "name": "<option name>",
      "description": "<brief description>",
      "criteria": {
        "<criterion_key>": <score 0-100>,
        "<criterion_key>": <score 0-100>
      }
    }
  ],
  "criteria": [
    { "key": "<snake_case_key>", "name": "<display name>", "weight": <integer>, "description": "<what this measures>" }
  ],
  "weights": {
    "<criterion_key>": <integer>
  }
}

Important:
- weights must sum to exactly 100
- all criterion keys must be consistent across options, criteria, and weights
- minimum 2 options and 2 criteria
- scores must be realistic integers between 0 and 100`;

// ──────────────────────────────────────────────────────────────────────────────
// GROQ CONVERSATION SYSTEM PROMPT — ongoing chat about an existing decision
// ──────────────────────────────────────────────────────────────────────────────
const CONVERSATION_SYSTEM_PROMPT = `You are a Decision Intelligence Assistant inside a Human-in-the-Loop platform.

You have access to a completed decision analysis. When the user asks questions, answer them based ONLY on this analysis data.

Rules:
- Answer questions about why an option was recommended.
- Explain trade-offs, risks, evidence from the analysis.
- If the user asks about weight changes, mention the What-If Simulator.
- Never invent scores or data not present in the analysis.
- Always remind the user that the AI recommendation is advisory — they make the final decision.
- Keep answers concise (2-4 sentences unless more detail is requested).
- Do NOT say "As an AI" — just answer directly.

Return plain text (not JSON) for conversational answers.`;

// ──────────────────────────────────────────────────────────────────────────────
// Helper: Call Groq directly for parsing / conversation
// ──────────────────────────────────────────────────────────────────────────────
async function callGroq(messages, jsonMode = false) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set in backend .env');

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const body = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 2048,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    body,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return response.data.choices[0].message.content;
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/chat/analyze
// Accepts a natural language message, parses it into a decision, runs analysis.
// ──────────────────────────────────────────────────────────────────────────────
const analyzeFromChat = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a decision description (at least 10 characters).',
      });
    }

    // ── STEP 1: Parse natural language → decision structure via Groq ──
    let parsedDecision;
    try {
      const raw = await callGroq(
        [
          { role: 'system', content: PARSE_SYSTEM_PROMPT },
          { role: 'user', content: message.trim() },
        ],
        true // JSON mode
      );
      parsedDecision = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (parseErr) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract a decision structure from your message. Try describing your options and criteria more clearly.',
        hint: 'Example: "Help me choose between Laptop A (fast, expensive) and Laptop B (slow, cheap) based on price and performance"',
      });
    }

    // ── STEP 2: Validate parsed structure ──
    if (
      !parsedDecision.options || parsedDecision.options.length < 2 ||
      !parsedDecision.criteria || parsedDecision.criteria.length < 2 ||
      !parsedDecision.weights
    ) {
      return res.status(422).json({
        success: false,
        message: 'Your message needs at least 2 options and 2 evaluation criteria.',
        hint: 'Try: "Compare Option A vs Option B based on cost and quality"',
      });
    }

    // ── STEP 3: Normalise weights to exactly 100 ──
    const rawWeights = parsedDecision.weights;
    let weightSum = Object.values(rawWeights).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    if (weightSum === 0) weightSum = 100;
    const normWeights = {};
    for (const [k, v] of Object.entries(rawWeights)) {
      normWeights[k] = Math.round((parseFloat(v) / weightSum) * 100);
    }
    // Fix rounding drift on last key
    const keys = Object.keys(normWeights);
    const drift = 100 - Object.values(normWeights).reduce((a, b) => a + b, 0);
    if (keys.length > 0) normWeights[keys[keys.length - 1]] += drift;
    parsedDecision.weights = normWeights;
    parsedDecision.criteria = parsedDecision.criteria.map(c => ({
      ...c,
      weight: normWeights[c.key] || c.weight,
    }));

    // ── STEP 4: Build a Decision document (in-memory, not yet saved) ──
    const tempDecision = {
      _id: { toString: () => `chat-${Date.now()}` },
      title: parsedDecision.title || 'Chat Decision',
      description: parsedDecision.description || message.trim().slice(0, 200),
      category: parsedDecision.category || 'Custom',
      options: parsedDecision.options.map((opt, i) => ({
        id: opt.id || `opt-${i + 1}`,
        name: opt.name,
        description: opt.description || '',
        criteria: opt.criteria,
      })),
      criteria: parsedDecision.criteria,
      weights: parsedDecision.weights,
    };

    // ── STEP 5: Run through the full AI analysis pipeline (n8n → Groq) ──
    const { calculatedScores, aiAnalysis } = await analyzeDecisionWithN8N(tempDecision);

    // ── STEP 6: Optionally save to MongoDB (creates a real decision for audit) ──
    let savedId = null;
    try {
      const newDecision = new Decision({
        title: tempDecision.title,
        description: tempDecision.description,
        category: tempDecision.category,
        options: tempDecision.options,
        criteria: tempDecision.criteria,
        weights: tempDecision.weights,
        calculatedScores,
        aiAnalysis,
        status: 'AWAITING_HUMAN_DECISION',
        auditLogs: [
          {
            action: 'CHAT_DECISION_CREATED',
            timestamp: new Date(),
            details: { source: 'chat_assistant', originalMessage: message.trim().slice(0, 300) },
          },
          {
            action: 'AI_ANALYSIS_COMPLETED',
            timestamp: new Date(),
            details: {
              recommendation: aiAnalysis.recommendation.option,
              confidence: aiAnalysis.confidence,
              source: aiAnalysis.source,
            },
          },
        ],
      });
      const saved = await newDecision.save();
      savedId = saved._id.toString();
    } catch (saveErr) {
      console.warn('[ChatController] Could not persist decision to MongoDB:', saveErr.message);
    }

    // ── STEP 7: Return full structured response ──
    return res.json({
      success: true,
      decisionId: savedId,
      parsedDecision: {
        title: tempDecision.title,
        description: tempDecision.description,
        category: tempDecision.category,
        options: tempDecision.options,
        criteria: tempDecision.criteria,
        weights: tempDecision.weights,
      },
      calculatedScores,
      aiAnalysis,
      humanDecisionRequired: true,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/chat/message
// Conversational follow-up questions about an existing decision analysis.
// ──────────────────────────────────────────────────────────────────────────────
const chatMessage = async (req, res, next) => {
  try {
    const { message, decisionId, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Load decision context if decisionId provided
    let decisionContext = '';
    if (decisionId) {
      try {
        const decision = await Decision.findById(decisionId);
        if (decision && decision.aiAnalysis) {
          const ai = decision.aiAnalysis;
          const scores = decision.calculatedScores || [];
          decisionContext = `
CURRENT DECISION CONTEXT:
Title: ${decision.title}
Category: ${decision.category}
AI Recommended: ${ai.recommendation?.option} (Score: ${ai.recommendation?.score}/100)
Confidence: ${ai.confidence}% (${ai.confidenceCategory})
Summary: ${ai.summary}

Calculated Scores:
${scores.map(s => `  ${s.rank}. ${s.name}: ${s.score}`).join('\n')}

Key Reasons: ${(ai.reasons || []).slice(0, 3).join('; ')}

Risks: ${(ai.risks || []).map(r => `${r.risk} (${r.severity})`).join(', ') || 'None identified'}

Alternatives: ${(ai.alternatives || []).map(a => `${a.option} (${a.score})`).join(', ') || 'None'}

Human Decision: ${decision.humanDecision ? `${decision.humanDecision.option} (${decision.humanDecision.type})` : 'Not yet decided'}
`;
        }
      } catch {
        // Decision not found — answer without context
      }
    }

    // Build conversation history
    const messages = [
      {
        role: 'system',
        content: CONVERSATION_SYSTEM_PROMPT + (decisionContext ? '\n\n' + decisionContext : ''),
      },
    ];

    // Add past messages (last 8 only to stay within token limits)
    const recent = Array.isArray(history) ? history.slice(-8) : [];
    for (const h of recent) {
      if (h.role && h.content) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    messages.push({ role: 'user', content: message.trim() });

    const reply = await callGroq(messages, false);

    return res.json({
      success: true,
      reply: reply.trim(),
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/chat/quick-analyze
// Lightweight: just returns scores + recommendation without saving to DB.
// Used for quick "what's best?" queries.
// ──────────────────────────────────────────────────────────────────────────────
const quickAnalyze = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required.' });

    // Parse
    let parsed;
    try {
      const raw = await callGroq(
        [
          { role: 'system', content: PARSE_SYSTEM_PROMPT },
          { role: 'user', content: message.trim() },
        ],
        true
      );
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return res.status(422).json({ success: false, message: 'Could not parse decision from message.' });
    }

    if (!parsed.options?.length || !parsed.criteria?.length || !parsed.weights) {
      return res.status(422).json({ success: false, message: 'Need at least 2 options and 2 criteria.' });
    }

    const weights = parsed.weights;
    const scores = calculateScores(
      parsed.options.map((o, i) => ({ id: `opt-${i}`, name: o.name, criteria: o.criteria })),
      weights
    );
    const criteriaKeys = parsed.criteria.map(c => c.key);
    const confidence = calculateConfidence(parsed.options, criteriaKeys, scores);

    return res.json({
      success: true,
      title: parsed.title,
      top: scores[0],
      scores,
      confidence,
      humanDecisionRequired: true,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyzeFromChat, chatMessage, quickAnalyze };
