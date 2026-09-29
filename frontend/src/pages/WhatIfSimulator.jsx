import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sliders, ArrowLeft, RotateCcw, CheckCircle2,
  AlertTriangle, Save, Info, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function WhatIfSimulator() {
  const { id } = useParams();
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [simName, setSimName] = useState('Custom Sensitivity Scenario');
  const [weights, setWeights] = useState({});
  const [simScores, setSimScores] = useState([]);
  const [explanation, setExplanation] = useState('');

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await decisionAPI.getDecisionById(id);
      if (res.success && res.data) {
        setDecision(res.data);
        const orig = res.data.weights instanceof Map
          ? Object.fromEntries(res.data.weights)
          : res.data.weights || {};
        setWeights({ ...orig });
        recalculate(res.data, orig);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const recalculate = (dec, w) => {
    if (!dec) return;
    const criteria = dec.criteria || [];
    const options = dec.options || [];

    let total = 0;
    criteria.forEach(c => { total += parseFloat(w[c.key] || 0); });

    const scored = options.map(opt => {
      let score = 0;
      const oc = opt.criteria instanceof Map ? Object.fromEntries(opt.criteria) : opt.criteria || {};
      criteria.forEach(c => {
        const val = parseFloat(oc[c.key] || 0);
        const wt = total > 0 ? parseFloat(w[c.key] || 0) / total : 1 / criteria.length;
        score += val * wt;
      });
      return { name: opt.name, score: Math.round(score * 10) / 10 };
    });

    scored.sort((a, b) => b.score - a.score);
    scored.forEach((s, i) => { s.rank = i + 1; });
    setSimScores(scored);

    const origTop = dec.calculatedScores?.[0]?.name;
    const newTop = scored[0]?.name;
    if (origTop && newTop && origTop !== newTop) {
      setExplanation(`The recommendation shifted from ${origTop} to ${newTop} because ${newTop} excels in criteria that now carry higher weight.`);
    } else {
      setExplanation(`${newTop} maintains the top rank under this configuration, showing strong cross-criteria robustness.`);
    }
  };

  const handleSlider = (key, val) => {
    const updated = { ...weights, [key]: parseInt(val, 10) };
    setWeights(updated);
    recalculate(decision, updated);
  };

  const handleReset = () => {
    if (!decision) return;
    const orig = decision.weights instanceof Map ? Object.fromEntries(decision.weights) : decision.weights || {};
    setWeights({ ...orig });
    recalculate(decision, orig);
  };

  const applyQuickPreset = (dominant) => {
    const updated = { ...weights };
    const keys = Object.keys(updated);
    keys.forEach(k => { updated[k] = 10; });
    if (updated[dominant] !== undefined) updated[dominant] = 50;
    setWeights(updated);
    recalculate(decision, updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await decisionAPI.simulateWhatIf(id, { simulatedWeights: weights, simulationName: simName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Save failed.'); } finally { setSaving(false); }
  };

  if (loading || !decision) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <p>Loading simulation model…</p>
    </div>
  );

  const origTop = decision.calculatedScores?.[0];
  const simTop = simScores[0];
  const hasShifted = origTop?.name !== simTop?.name;
  const totalW = Object.values(weights).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to={`/decisions/${id}`} className="btn btn-sm btn-secondary">
          <ArrowLeft size={15} /> Back to Analysis
        </Link>
        <button onClick={handleReset} className="btn btn-sm btn-secondary">
          <RotateCcw size={14} /> Reset to Original Weights
        </button>
      </div>

      {/* Header */}
      <div className="decision-layout-header">
        <div>
          <div className="decision-badge-row">
            <span className="badge badge-purple">What-If Sensitivity Engine</span>
            <span className="badge badge-advisory">Sandbox Mode — Original Preserved</span>
          </div>
          <h1 className="decision-title-main">What-If Simulator</h1>
          <p className="decision-desc-main">
            Adjust criteria weights to explore how changing priorities affects the recommendation.
            The original decision record is never modified.
          </p>
        </div>
      </div>

      <div className="alert-banner alert-advisory" style={{ marginBottom: 0 }}>
        <Info size={15} />
        <span>
          <strong>Zero-risk sandbox.</strong> Simulations run locally and can be optionally saved as separate records. The original decision and AI recommendation remain untouched.
        </span>
      </div>

      {/* Simulator grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.75rem', alignItems: 'start' }}>

        {/* LEFT — Sliders */}
        <div className="hitl-card what-if-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Adjust Criteria Weights</h3>
            <span className={`badge ${Math.abs(totalW - 100) < 1 ? 'badge-success' : 'badge-warning'}`}>
              Sum: {Math.round(totalW)}%
            </span>
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {decision.criteria.slice(0, 4).map(c => (
              <button key={c.key} onClick={() => applyQuickPreset(c.key)} className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.75rem' }}>
                ↑ {c.name}
              </button>
            ))}
          </div>

          <div className="weight-slider-group">
            {decision.criteria.map(c => {
              const current = weights[c.key] !== undefined ? weights[c.key] : c.weight;
              const orig = c.weight;
              const delta = current - orig;
              return (
                <div key={c.key} className="slider-row">
                  <div className="slider-labels">
                    <span style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                    <div style={{ display: 'flex', align: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: delta > 0 ? '#16A34A' : delta < 0 ? '#EF4444' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {delta > 0 ? `+${delta}` : delta !== 0 ? delta : '±0'}%
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>
                        {current}%
                      </span>
                    </div>
                  </div>
                  <input type="range" min={0} max={100} step={5}
                    className="slider-input" value={current}
                    onChange={e => handleSlider(c.key, e.target.value)} />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Original baseline: {orig}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Shift Banner */}
          <div className="hitl-card" style={{
            border: hasShifted ? '2px solid #FCD34D' : '1px solid #BBF7D0',
            background: hasShifted ? '#FFFBEB' : '#F0FDF4',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
              {hasShifted
                ? <AlertTriangle size={20} color="#D97706" />
                : <CheckCircle2 size={20} color="#16A34A" />
              }
              <h3 style={{ fontSize: '1.1rem', color: hasShifted ? '#92400E' : '#166534' }}>
                {hasShifted ? 'Recommendation Shifted!' : 'Recommendation Stable'}
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.15rem' }}>
              {explanation}
            </p>

            <div className="comparison-box">
              <div>
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                  Original Top Pick
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  {origTop?.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16A34A', fontSize: '0.875rem' }}>
                  {origTop?.score}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '1rem' }}>
                <div style={{ fontSize: '0.65rem', color: hasShifted ? '#D97706' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                  Simulated Top Pick
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: hasShifted ? '#92400E' : '#166534' }}>
                  {simTop?.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: hasShifted ? '#D97706' : '#16A34A', fontSize: '0.875rem' }}>
                  {simTop?.score}
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="hitl-card">
            <h4 style={{ fontSize: '1rem', marginBottom: '0.85rem' }}>Simulated Leaderboard</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {simScores.map(s => {
                const orig = decision.calculatedScores?.find(o => o.name === s.name);
                const delta = orig ? Math.round((s.score - orig.score) * 10) / 10 : 0;
                const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                const dColor = delta > 0 ? '#16A34A' : delta < 0 ? '#EF4444' : '#94A3B8';
                return (
                  <div key={s.name} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: s.rank === 1 ? (hasShifted ? '#FFFBEB' : '#F0FDF4') : '#F8FAFC',
                    border: s.rank === 1 ? `1px solid ${hasShifted ? '#FCD34D' : '#BBF7D0'}` : '1px solid #E2E8F0',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{
                        width: '22px', height: '22px', borderRadius: '50%', fontSize: '0.72rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: s.rank === 1 ? (hasShifted ? '#F59E0B' : '#16A34A') : '#CBD5E1',
                        color: s.rank <= 2 || !hasShifted ? '#fff' : '#475569',
                      }}>{s.rank}</span>
                      <span style={{ fontWeight: s.rank === 1 ? 700 : 500, color: '#0F172A', fontSize: '0.875rem' }}>{s.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: dColor, fontFamily: 'var(--font-mono)' }}>
                        <DeltaIcon size={12} />
                        {delta > 0 ? `+${delta}` : delta}
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.rank === 1 ? (hasShifted ? '#D97706' : '#16A34A') : '#64748B' }}>
                        {s.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Scenario */}
          <div className="hitl-card" style={{ padding: '1.15rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.65rem' }}>Save Scenario</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="form-input" value={simName} onChange={e => setSimName(e.target.value)} placeholder="Scenario name…" />
              <button onClick={handleSave} disabled={saving} className="btn btn-secondary" style={{ flexShrink: 0 }}>
                <Save size={14} /> {saving ? '…' : 'Save'}
              </button>
            </div>
            {saved && (
              <div style={{ fontSize: '0.8rem', color: '#16A34A', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={13} /> Simulation saved to database.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
