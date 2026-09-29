const express = require('express');
const router = express.Router();
const { suggestCriteria, suggestOptions } = require('../controllers/aiSuggestController');

// POST /api/ai/suggest-criteria
// Accepts decision context, returns AI-labelled criteria suggestions for human review
router.post('/suggest-criteria', suggestCriteria);

// POST /api/ai/suggest-options
// Accepts decision context + approved criteria, returns AI-labelled option suggestions
router.post('/suggest-options', suggestOptions);

module.exports = router;
