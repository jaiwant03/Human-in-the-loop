import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Sliders, 
  ArrowLeft, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Save,
  Info
} from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function WhatIfSimulator() {
  const { id } = useParams();
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSim, setSavingSim] = useState(false);
  const [simName, setSimName] = useState('Cost-Focused Sensitivity Scenario');

  // Weights state: map of criterion key -> percentage (0-100)
  const [weights, setWeights] = useState({});
  const [simulatedScores, setSimulatedScores] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadDecision();
  }, [id]);

  const loadDecision = async () => {
    try {
      setLoading(true);
      const res = await decisionAPI.getDecisionById(id);
      if (res.success && res.data) {
        setDecision(res.data);
        const originalWeights = res.data.weights instanceof Map 
          ? Object.fromEntries(res.data.weights) 
          : res.data.weights || {};

        setWeights({ ...originalWeights });
        recalculateSimulation(res.data, originalWeights);
      }
    } catch (err) {
      console.error('Failed to load decision:', err);
    } finally {
      setLoading(false);
    }
  };

  // Deterministic local simulation calculation
  const recalculateSimulation = (currentDecision, currentWeights) => {
    if (!currentDecision) return;

    const options = currentDecision.options || [];
    const criteria = currentDecision.criteria || [];

    // Sum weights
    let totalWeight = 0;
    criteria.forEach(c => {
      totalWeight += parseFloat(currentWeights[c.key] || 0);
    });

    // Calculate score for each option
    const calculated = options.map(opt => {
      let total = 0;
      const optCriteria = opt.criteria instanceof Map ? Object.fromEntries(opt.criteria) : opt.criteria || {};

      criteria.forEach(c => {
        const val = parseFloat(optCriteria[c.key] || 0);
        const w = totalWeight > 0 ? (parseFloat(currentWeights[c.key] || 0) / totalWeight) : (1 / criteria.length);
        total += val * w;
      });

      return {
        name: opt.name,
        score: Math.round(total * 10) / 10,
      };
    });

    calculated.sort((a, b) => b.score - a.score);
    calculated.forEach((c, idx) => { c.rank = idx + 1; });
    setSimulatedScores(calculated);

    // Explain trade-off shifts
    const originalTop = currentDecision.calculatedScores?.[0]?.name;
    const newTop = calculated[0]?.name;

    if (originalTop && newTop && originalTop !== newTop) {
      setExplanation(`The top recommendation shifted from ${originalTop} to ${newTop}. This transition occurred because criteria where ${newTop} excels were given higher prioritization in this simulation.`);
    } else {
      setExplanation(`${originalTop} maintains the #1 rank under this weighting configuration, demonstrating strong cross-criteria stability.`);
    }
  };

  const handleWeightSliderChange = (key, value) => {
    const val = parseInt(value, 10);
    const updated = { ...weights, [key]: val };
    setWeights(updated);
    recalculateSimulation(decision, updated);
  };

  const handleReset = () => {
    if (!decision) return;
    const original = decision.weights instanceof Map ? Object.fromEntries(decision.weights) : decision.weights;
    setWeights({ ...original });
    recalculateSimulation(decision, original);
  };

  // Quick preset: Priority on Cost
  const handlePresetCostPriority = () => {
    const updated = { ...weights };
    Object.keys(updated).forEach(k => { updated[k] = 15; });
    if (updated.cost !== undefined) updated.cost = 45;
    setWeights(updated);
    recalculateSimulation(decision, updated);
  };

  // Quick preset: Priority on Quality
  const handlePresetQualityPriority = () => {
    const updated = { ...weights };
    Object.keys(updated).forEach(k => { updated[k] = 15; });
    if (updated.quality !== undefined) updated.quality = 45;
    setWeights(updated);
    recalculateSimulation(decision, updated);
  };

  // Save simulation record to backend
  const handleSaveSimulation = async () => {
    try {
      setSavingSim(true);
      await decisionAPI.simulateWhatIf(id, {
        simulatedWeights: weights,
        simulationName: simName,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save simulation scenario.');
    } finally {
      setSavingSim(false);
    }
  };

  if (loading || !decision) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading simulation model...</p>
      </div>
    );
  }

  const originalTop = decision.calculatedScores?.[0];
  const simulatedTop = simulatedScores[0];
  const hasShifted = originalTop?.name !== simulatedTop?.name;
  const totalWeight = Object.values(weights).reduce((a, b) => a + (parseFloat(b) || 0), 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to={`/decisions/${id}`} className="btn btn-sm btn-secondary">
          <ArrowLeft size={16} /> Back to Decision Analysis
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleReset} className="btn btn-sm btn-secondary">
            <RotateCcw size={14} /> Reset Original Weights
          </button>
        </div>
      </div>

      <div className="decision-layout-header">
        <div>
          <div className="decision-badge-row">
            <span className="badge badge-purple">What-If Sensitivity Engine</span>
            <span className="badge badge-advisory">Safe Sandbox Mode</span>
          </div>
          <h1 className="decision-title-main">Dynamic What-If Simulator</h1>
          <p className="decision-desc-main">
            Simulate altered business priorities without modifying the baseline decision. Recalculates candidate scores deterministically in real time.
          </p>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="alert-banner alert-advisory" style={{ marginBottom: 0 }}>
        <Info size={18} />
        <span>
          <strong>Zero Risk Policy:</strong> Adjusting criteria weights here runs in isolated simulation memory. The original decision and AI recommendation remain untouched.
        </span>
      </div>

      {/* Simulator Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Interactive Sliders Column */}
        <div className="hitl-card what-if-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Adjust Criteria Weights</h3>
            <span className="badge badge-gray">Sum: {totalWeight}%</span>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button onClick={handlePresetCostPriority} className="btn btn-sm btn-outline-primary">
              ⚡ Prioritize Cost (45%)
            </button>
            <button onClick={handlePresetQualityPriority} className="btn btn-sm btn-outline-primary">
              ⚡ Prioritize Quality (45%)
            </button>
          </div>

          <div className="weight-slider-group">
            {decision.criteria.map((c) => {
              const currentVal = weights[c.key] !== undefined ? weights[c.key] : c.weight;
              return (
                <div key={c.key} className="slider-row">
                  <div className="slider-labels">
                    <span style={{ color: '#ffffff' }}>{c.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#a5b4fc', fontWeight: 700 }}>
                      {currentVal}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="slider-input"
                    value={currentVal}
                    onChange={(e) => handleWeightSliderChange(c.key, e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Baseline: {c.weight}%</span>
                    <span>Delta: {currentVal - c.weight > 0 ? `+${currentVal - c.weight}` : currentVal - c.weight}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Outcomes & Comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Shift Banner */}
          <div className="hitl-card" style={{
            border: hasShifted ? '2px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-accent)',
            background: hasShifted ? 'linear-gradient(180deg, rgba(30, 27, 20, 0.9) 0%, rgba(19, 27, 46, 0.95) 100%)' : 'var(--bg-card)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Simulation Outcome
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              {hasShifted ? (
                <AlertTriangle size={22} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={22} color="#10b981" />
              )}
              <h3 style={{ fontSize: '1.25rem', color: hasShifted ? '#fde68a' : '#6ee7b7' }}>
                {hasShifted ? 'Recommendation Inversion Detected!' : 'Recommendation Stable'}
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {explanation}
            </p>

            {/* Side by side comparison */}
            <div className="comparison-box">
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Original Top Pick
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                  {originalTop?.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 600 }}>
                  Score: {originalTop?.score}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: hasShifted ? '#fde68a' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Simulated Top Pick
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: hasShifted ? '#fde68a' : '#6ee7b7', marginTop: '0.2rem' }}>
                  {simulatedTop?.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: hasShifted ? '#fde68a' : '#6ee7b7', fontWeight: 600 }}>
                  Score: {simulatedTop?.score}
                </div>
              </div>
            </div>
          </div>

          {/* Full Simulated Ranking List */}
          <div className="hitl-card">
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Simulated Leaderboard</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {simulatedScores.map((s, idx) => {
                const orig = decision.calculatedScores?.find(o => o.name === s.name);
                const delta = orig ? Math.round((s.score - orig.score) * 10) / 10 : 0;
                return (
                  <div
                    key={s.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: idx === 0 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: idx === 0 ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}>
                        {s.rank}
                      </span>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>{s.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: delta > 0 ? '#34d399' : delta < 0 ? '#f87171' : 'var(--text-muted)',
                      }}>
                        {delta > 0 ? `+${delta}` : delta} pts
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#e2e8f0' }}>
                        {s.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Scenario Form */}
          <div className="hitl-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Archive Simulation Scenario</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                placeholder="Scenario label"
              />
              <button
                onClick={handleSaveSimulation}
                disabled={savingSim}
                className="btn btn-secondary"
                style={{ flexShrink: 0 }}
              >
                <Save size={16} />
                {savingSim ? 'Saving...' : 'Save'}
              </button>
            </div>
            {savedSuccess && (
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.4rem', display: 'block' }}>
                ✓ Simulation scenario saved to database!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
