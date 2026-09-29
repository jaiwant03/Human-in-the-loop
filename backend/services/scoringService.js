/**
 * Deterministic Weighted Scoring Engine
 * Computes reproducible, mathematically precise ranking and confidence metrics.
 * The LLM NEVER invents numerical scores.
 */

/**
 * Normalizes weights so they sum to 1.0 (100%)
 * Accepts either decimal weights (0.2, 0.3) or percentage weights (20, 30).
 */
function normalizeWeights(weights) {
  const normalized = {};
  let total = 0;

  for (const [key, val] of Object.entries(weights)) {
    const num = parseFloat(val) || 0;
    total += num;
  }

  if (total === 0) {
    throw new Error('Total weight cannot be zero.');
  }

  for (const [key, val] of Object.entries(weights)) {
    const num = parseFloat(val) || 0;
    // Normalize to decimal 0.0 - 1.0
    normalized[key] = num / total;
  }

  return { normalized, rawTotal: total };
}

/**
 * Calculates weighted scores for each option
 * @param {Array} options - List of options with criteria scores
 * @param {Object} weights - Criterion weights (raw or normalized)
 * @returns {Array} Sorted list of options with score, rank, and breakdown
 */
function calculateScores(options, weights) {
  const { normalized } = normalizeWeights(weights);

  const calculated = options.map((option) => {
    let totalScore = 0;
    const breakdown = {};
    const criteriaMap = option.criteria instanceof Map ? Object.fromEntries(option.criteria) : option.criteria || {};

    for (const [criterionKey, weightDecimal] of Object.entries(normalized)) {
      const rawScore = criteriaMap[criterionKey] !== undefined ? parseFloat(criteriaMap[criterionKey]) : 0;
      const contribution = rawScore * weightDecimal;
      breakdown[criterionKey] = Math.round(contribution * 100) / 100;
      totalScore += contribution;
    }

    const roundedScore = Math.round(totalScore * 10) / 10;

    return {
      optionId: option.id || option._id?.toString() || option.name,
      name: option.name,
      score: roundedScore,
      breakdown,
      rawCriteria: criteriaMap,
    };
  });

  // Sort descending by score
  calculated.sort((a, b) => b.score - a.score);

  // Assign ranks
  calculated.forEach((item, index) => {
    item.rank = index + 1;
  });

  return calculated;
}

/**
 * Calculates deterministic analytical confidence metric
 * Formula:
 * Confidence = (Data Completeness * 30%) + (Score Separation * 30%) + (Evidence Strength * 20%) + (Criteria Coverage * 20%)
 */
function calculateConfidence(options, criteriaKeys, calculatedScores) {
  if (!calculatedScores || calculatedScores.length === 0) {
    return {
      score: 50,
      category: 'Low Confidence',
      breakdown: { completeness: 0, separation: 0, strength: 0, coverage: 0 },
    };
  }

  // 1. Data Completeness (30%): Fraction of options having valid non-zero values for all criteria
  let totalDataPoints = 0;
  let validDataPoints = 0;

  options.forEach((opt) => {
    const map = opt.criteria instanceof Map ? Object.fromEntries(opt.criteria) : opt.criteria || {};
    criteriaKeys.forEach((key) => {
      totalDataPoints++;
      if (map[key] !== undefined && map[key] !== null && !isNaN(map[key])) {
        validDataPoints++;
      }
    });
  });

  const dataCompleteness = totalDataPoints > 0 ? (validDataPoints / totalDataPoints) : 1;

  // 2. Score Separation (30%): Difference between #1 and #2 option
  let scoreSeparation = 0;
  if (calculatedScores.length >= 2) {
    const diff = calculatedScores[0].score - calculatedScores[1].score;
    // Difference of 15+ points indicates clear separation (1.0). 0 difference gives 0.1
    scoreSeparation = Math.min(1.0, Math.max(0.1, diff / 15));
  } else {
    scoreSeparation = 0.5;
  }

  // 3. Evidence Strength (20%): Proportion of criteria where the top option scored >= 75
  const topOption = calculatedScores[0];
  const topCriteria = topOption.rawCriteria || {};
  let strongCriteriaCount = 0;

  criteriaKeys.forEach((key) => {
    if ((topCriteria[key] || 0) >= 75) {
      strongCriteriaCount++;
    }
  });

  const evidenceStrength = criteriaKeys.length > 0 ? (strongCriteriaCount / criteriaKeys.length) : 0.5;

  // 4. Criteria Coverage (20%): Standard benchmark is 5+ comprehensive criteria
  const criteriaCoverage = Math.min(1.0, Math.max(0.4, criteriaKeys.length / 5));

  // Compute final combined weighted confidence (scaled to 100)
  const rawConfidence = (
    dataCompleteness * 30 +
    scoreSeparation * 30 +
    evidenceStrength * 20 +
    criteriaCoverage * 20
  );

  // Bound realistically between 45 and 96
  const finalScore = Math.min(96, Math.max(45, Math.round(rawConfidence)));

  let category = 'Medium Confidence';
  if (finalScore >= 80) category = 'High Confidence';
  else if (finalScore < 60) category = 'Low Confidence';

  return {
    score: finalScore,
    category,
    breakdown: {
      dataCompleteness: Math.round(dataCompleteness * 100),
      scoreSeparation: Math.round(scoreSeparation * 100),
      evidenceStrength: Math.round(evidenceStrength * 100),
      criteriaCoverage: Math.round(criteriaCoverage * 100),
    },
    disclaimer: 'Confidence is an analytical indicator, not a guarantee.',
  };
}

module.exports = {
  normalizeWeights,
  calculateScores,
  calculateConfidence,
};
