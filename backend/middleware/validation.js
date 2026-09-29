/**
 * Request validation middleware
 */

const validateDecisionInput = (req, res, next) => {
  const { title, description, options, criteria, weights } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Decision title is required.',
    });
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Decision description is required.',
    });
  }

  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'At least 2 decision options are required.',
    });
  }

  if (options.length > 10) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 10 options allowed.',
    });
  }

  if (!Array.isArray(criteria) || criteria.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'At least 2 decision criteria are required.',
    });
  }

  // Validate criteria
  for (const crit of criteria) {
    if (!crit.key || !crit.name) {
      return res.status(400).json({
        success: false,
        message: 'Each criterion must have a valid key and name.',
      });
    }
  }

  // Validate option criteria scores
  for (const opt of options) {
    if (!opt.name || !opt.name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Each option must have a name.',
      });
    }

    if (!opt.criteria || typeof opt.criteria !== 'object') {
      return res.status(400).json({
        success: false,
        message: `Option "${opt.name}" is missing criteria scores.`,
      });
    }

    for (const crit of criteria) {
      const val = opt.criteria[crit.key];
      if (val === undefined || val === null || isNaN(val)) {
        return res.status(400).json({
          success: false,
          message: `Option "${opt.name}" is missing score for criterion "${crit.name}".`,
        });
      }

      const numVal = parseFloat(val);
      if (numVal < 0 || numVal > 100) {
        return res.status(400).json({
          success: false,
          message: `Score for "${crit.name}" in option "${opt.name}" must be between 0 and 100.`,
        });
      }
    }
  }

  // Validate weights
  if (!weights || typeof weights !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Criteria weights are required.',
    });
  }

  let totalWeight = 0;
  for (const crit of criteria) {
    const w = parseFloat(weights[crit.key]);
    if (isNaN(w) || w < 0) {
      return res.status(400).json({
        success: false,
        message: `Criterion "${crit.name}" must have a non-negative weight.`,
      });
    }
    totalWeight += w;
  }

  // Allow either sum to 100 (percentage) or sum to 1.0 (decimals)
  const is100Percent = Math.abs(totalWeight - 100) < 0.5;
  const isDecimalOne = Math.abs(totalWeight - 1.0) < 0.05;

  if (!is100Percent && !isDecimalOne) {
    return res.status(400).json({
      success: false,
      message: `Total criteria weight must sum to 100%. Current sum: ${Math.round(totalWeight * 10) / 10}%`,
    });
  }

  next();
};

const validateFinalizeInput = (req, res, next) => {
  const { option, type, reason } = req.body;

  if (!option || typeof option !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Selected final option is required.',
    });
  }

  const validTypes = ['ACCEPT_AI', 'SELECT_ALTERNATIVE', 'OVERRIDE_AI'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid decision type. Must be one of: ${validTypes.join(', ')}`,
    });
  }

  // RULE: Override requires an explicit reason
  if (type === 'OVERRIDE_AI') {
    if (!reason || typeof reason !== 'string' || !reason.trim() || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A detailed rationale is required when overriding the AI recommendation.',
      });
    }
  }

  next();
};

module.exports = {
  validateDecisionInput,
  validateFinalizeInput,
};
