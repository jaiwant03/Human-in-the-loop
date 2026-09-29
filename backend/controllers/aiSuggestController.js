/**
 * AI Suggestion Controller
 * Provides structured AI suggestions for criteria and options.
 * All suggestions are labelled, not final — human review and approval required.
 */

const axios = require('axios');

// ──────────────────────────────────────────────────────────────
// Groq helper (reuses same pattern as chatController)
// ──────────────────────────────────────────────────────────────
async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set in backend .env');

  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2048,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const raw = response.data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from Groq');
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

// ──────────────────────────────────────────────────────────────
// POST /api/ai/suggest-criteria
// Suggests evaluation criteria based on decision context.
// Returns suggestions ONLY — human must approve before use.
// ──────────────────────────────────────────────────────────────
const suggestCriteria = async (req, res, next) => {
  try {
    const { title, description, category, constraints, successCriteria } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Decision title and description are required.',
      });
    }

    const systemPrompt = `You are an expert decision analysis assistant in a Human-in-the-Loop platform.

Your ONLY job is to suggest relevant evaluation criteria for a decision problem.
These suggestions will be reviewed, edited, and approved by the human before use.
You are NOT making the decision — you are structuring the evaluation framework.

Rules:
- Suggest 4-6 criteria relevant to the specific decision domain.
- Each criterion must have a clear, measurable name and description.
- Suggest a reasonable weight percentage for each criterion.
- All weights MUST sum to exactly 100.
- Weights should reflect the typical importance in this domain.
- Do NOT invent external facts — only suggest generic evaluation dimensions.
- Mark all suggestions clearly as AI-generated.

Return ONLY valid JSON:
{
  "criteria": [
    {
      "key": "snake_case_unique_key",
      "name": "Criterion Name",
      "description": "Clear description of what this measures and why it matters",
      "suggestedWeight": 25,
      "rationale": "One sentence explaining why this criterion matters for this decision"
    }
  ],
  "totalWeight": 100,
  "suggestion_note": "Brief explanation of the suggested framework"
}`;

    const userPrompt = `Suggest evaluation criteria for this decision:

Title: ${title}
Category: ${category || 'General'}
Problem Statement: ${description}
${constraints ? `Constraints: ${constraints}` : ''}
${successCriteria ? `Success Criteria: ${successCriteria}` : ''}

Suggest 4-6 relevant criteria with weights summing to exactly 100.`;

    let result;
    try {
      result = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
    } catch (groqErr) {
      // Fallback: return generic criteria based on category
      console.warn('[aiSuggest] Groq unavailable, using domain fallback:', groqErr.message);
      result = generateFallbackCriteria(category, title);
    }

    // Validate structure
    if (!result.criteria || !Array.isArray(result.criteria)) {
      return res.status(422).json({
        success: false,
        message: 'AI returned invalid criteria structure. Please try again.',
      });
    }

    // Ensure weights sum to 100 (fix rounding drift)
    const rawTotal = result.criteria.reduce((sum, c) => sum + (parseFloat(c.suggestedWeight) || 0), 0);
    if (rawTotal !== 100 && rawTotal > 0) {
      const scale = 100 / rawTotal;
      result.criteria.forEach(c => {
        c.suggestedWeight = Math.round(c.suggestedWeight * scale);
      });
      // Fix residual rounding on last criterion
      const newTotal = result.criteria.reduce((s, c) => s + c.suggestedWeight, 0);
      result.criteria[result.criteria.length - 1].suggestedWeight += (100 - newTotal);
    }

    // Tag each criterion as AI-suggested
    result.criteria = result.criteria.map((c, idx) => ({
      key: c.key || `ai_crit_${idx + 1}`,
      name: c.name || `Criterion ${idx + 1}`,
      description: c.description || '',
      suggestedWeight: parseInt(c.suggestedWeight) || 10,
      rationale: c.rationale || '',
      source: 'ai_suggested',   // always labelled
      approved: false,          // human must approve
    }));

    res.json({
      success: true,
      source: result.criteria[0]?.source === 'fallback' ? 'fallback' : 'ai_groq',
      note: result.suggestion_note || 'AI suggested criteria based on your decision context.',
      criteria: result.criteria,
      totalWeight: result.criteria.reduce((s, c) => s + c.suggestedWeight, 0),
      disclaimer: 'These are AI suggestions only. Review, edit and approve each criterion before proceeding.',
    });

  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/ai/suggest-options
// Suggests candidate options based on decision context + approved criteria.
// Returns suggestions ONLY — human must review and approve.
// ──────────────────────────────────────────────────────────────
const suggestOptions = async (req, res, next) => {
  try {
    const { title, description, category, constraints, criteria } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const criteriaList = Array.isArray(criteria) && criteria.length > 0
      ? criteria.map(c => `${c.name} (${c.suggestedWeight || c.weight}%): ${c.description}`).join('\n')
      : 'No specific criteria provided.';

    const systemPrompt = `You are an expert decision analysis assistant in a Human-in-the-Loop platform.

Your job is to suggest 2-5 realistic candidate OPTIONS for a decision problem.
These are suggestions only. The human will review, edit, and approve them.
You must also suggest a plausible score (0-100) for each option on each criterion.

IMPORTANT SCORING RULES:
- Scores are educated estimates based on general domain knowledge.
- Every score you suggest is labelled "AI Estimated" — the human can and should adjust them.
- Do NOT invent specific proprietary data or pricing.
- Use relative comparisons based on widely-known characteristics.
- Scores must be between 0 and 100.
- A score of 0 = very poor; 100 = excellent/best possible.

Return ONLY valid JSON:
{
  "options": [
    {
      "name": "Option Name",
      "description": "Brief description of this option",
      "scores": {
        "criterion_key": {
          "value": 85,
          "rationale": "One sentence explaining this score estimate"
        }
      }
    }
  ],
  "suggestion_note": "Brief explanation of why these options were suggested"
}`;

    const userPrompt = `Suggest candidate options for this decision:

Title: ${title}
Category: ${category || 'General'}
Problem Statement: ${description}
${constraints ? `Constraints: ${constraints}` : ''}

Approved Evaluation Criteria:
${criteriaList}

Suggest 2-5 realistic options and estimate their scores on each criterion.
All scores are labelled as AI estimates and will be reviewed by the human.`;

    let result;
    try {
      result = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
    } catch (groqErr) {
      console.warn('[aiSuggest] Groq unavailable for options:', groqErr.message);
      return res.json({
        success: true,
        source: 'fallback',
        options: [],
        note: 'AI is unavailable. Please add options manually.',
        disclaimer: 'All options and scores require human review.',
      });
    }

    if (!result.options || !Array.isArray(result.options)) {
      return res.status(422).json({ success: false, message: 'AI returned invalid options structure.' });
    }

    // Tag each option and score as AI-suggested
    const formattedOptions = result.options.map((opt, idx) => {
      const criteriaScores = {};
      const scoreMetadata = {};

      if (opt.scores && typeof opt.scores === 'object') {
        for (const [key, val] of Object.entries(opt.scores)) {
          const score = typeof val === 'object' ? val.value : val;
          const rationale = typeof val === 'object' ? val.rationale : 'AI estimate';
          criteriaScores[key] = Math.min(100, Math.max(0, parseInt(score) || 50));
          scoreMetadata[key] = {
            value: criteriaScores[key],
            rationale: rationale || 'AI estimate',
            source: 'ai_estimated',   // labelled clearly
            humanAdjusted: false,
          };
        }
      }

      return {
        id: `opt-${Date.now()}-${idx}`,
        name: opt.name || `Option ${idx + 1}`,
        description: opt.description || '',
        criteria: criteriaScores,
        scoreMetadata,
        source: 'ai_suggested',
        approved: false,
      };
    });

    res.json({
      success: true,
      source: 'ai_groq',
      note: result.suggestion_note || 'AI suggested options based on your decision context and criteria.',
      options: formattedOptions,
      disclaimer: 'All options and scores are AI estimates. Review, adjust, and approve each one before calculating results.',
    });

  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────
// Domain-specific fallback when Groq is unavailable
// ──────────────────────────────────────────────────────────────
function generateFallbackCriteria(category, title) {
  const domain = (category || '').toLowerCase();

  const fallbacks = {
    default: [
      { key: 'cost', name: 'Cost', description: 'Total cost and value for money', suggestedWeight: 25, rationale: 'Cost is typically a primary constraint in most decisions.' },
      { key: 'quality', name: 'Quality', description: 'Overall quality and reliability', suggestedWeight: 30, rationale: 'Quality directly impacts outcome success.' },
      { key: 'ease', name: 'Ease of Use', description: 'Usability and adoption ease', suggestedWeight: 20, rationale: 'Adoption is critical for long-term success.' },
      { key: 'support', name: 'Support', description: 'Vendor support and documentation', suggestedWeight: 15, rationale: 'Good support reduces operational risk.' },
      { key: 'risk', name: 'Risk', description: 'Implementation and operational risk', suggestedWeight: 10, rationale: 'Risk assessment protects against project failure.' },
    ],
  };

  const criteria = fallbacks.default.map(c => ({ ...c, source: 'fallback' }));
  return { criteria, suggestion_note: 'Default criteria shown (AI unavailable). Adjust to fit your specific needs.' };
}

module.exports = { suggestCriteria, suggestOptions };
