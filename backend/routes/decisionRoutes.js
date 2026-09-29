const express = require('express');
const router = express.Router();
const {
  createDecision,
  analyzeDecision,
  getDecisions,
  getDecisionById,
  finalizeDecision,
  simulateWhatIf,
  seedDemoSupplierDecision,
} = require('../controllers/decisionController');
const { validateDecisionInput, validateFinalizeInput } = require('../middleware/validation');

// Specific routes first
router.post('/seed-demo', seedDemoSupplierDecision);

// Core CRUD & HITL actions
router.route('/')
  .get(getDecisions)
  .post(validateDecisionInput, createDecision);

router.route('/:id')
  .get(getDecisionById);

router.post('/:id/analyze', analyzeDecision);
router.post('/:id/finalize', validateFinalizeInput, finalizeDecision);
router.post('/:id/simulate', simulateWhatIf);

module.exports = router;
