const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema(
  {
    decisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Decision',
      required: true,
    },
    simulationName: { type: String, default: 'What-If Simulation' },
    originalWeights: {
      type: Map,
      of: Number,
      required: true,
    },
    simulatedWeights: {
      type: Map,
      of: Number,
      required: true,
    },
    originalScores: [
      {
        name: String,
        score: Number,
        rank: Number,
      },
    ],
    simulatedScores: [
      {
        name: String,
        score: Number,
        rank: Number,
      },
    ],
    originalTopOption: { type: String, required: true },
    simulatedTopOption: { type: String, required: true },
    changed: { type: Boolean, required: true },
    explanation: { type: String, default: '' },
    deltas: {
      type: Map,
      of: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Simulation', SimulationSchema);
