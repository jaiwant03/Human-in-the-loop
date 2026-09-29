import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, RotateCw, Sliders, AlertTriangle, Calendar,
  Bot, UserCheck, Info, ExternalLink
} from 'lucide-react';
import { decisionAPI } from '../services/api';
import RecommendationCard from '../components/RecommendationCard';
import EvidenceCard from '../components/EvidenceCard';
import RiskCard from '../components/RiskCard';
import AlternativeCard from '../components/AlternativeCard';
import HumanDecisionPanel from '../components/HumanDecisionPanel';
import ScoreChart from '../components/ScoreChart';
import ConfidenceIndicator from '../components/ConfidenceIndicator';

export default function DecisionAnalysis() {
  const { id } = useParams();
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState(null);
  const [preselectedAlt, setPreselectedAlt] = useState(null);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const res = await decisionAPI.getDecisionById(id);
      if (res.success && res.data) setDecision(res.data);
      else setError('Decision not found.');
    } catch (e) {
      setError(e.response?.data?.message || 'Error loading decision.');
    } finally { setLoading(false); }
  };

  const handleReanalyze = async () => {
    try {
      setAnalyzing(true);
      const res = await decisionAPI.analyzeDecision(id);
      if (res.success && res.data) setDecision(res.data);
    } catch (e) {
      alert('Re-analysis failed: ' + (e.response?.data?.message || e.message));
    } finally { setAnalyzing(false); }
  };

  const handleFinalize = async (payload) => {
    try {
      setFinalizing(true);
      const res = await decisionAPI.finalizeDecision(id, payload);
      if (res.success && res.data) setDecision(res.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save decision.');
    } finally { setFinalizing(false); }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <p>Loading decision intelligence…</p>
    </div>
  );

  if (error || !decision) return (
    <div className="hitl-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 500, margin: '4rem auto' }}>
      <AlertTriangle size={36} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
      <h2 style={{ marginBottom: '0.5rem' }}>Unable to Load Decision</h2>
      <p style={{ marginBottom: '1.5rem' }}>{error || 'Decision record does not exist.'}</p>
      <Link to="/dashboard" className="btn btn-secondary"><ArrowLeft size={15} /> Back to Dashboard</Link>
    </div>
  );

  const isFinalized = !!decision.humanDecision;
  const conf = decision.aiAnalysis?.confidence;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/dashboard" className="btn btn-sm btn-secondary">
          <ArrowLeft size={15} /> Dashboard
        </Link>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleReanalyze} disabled={analyzing} className="btn btn-sm btn-secondary">
            <RotateCw size={14} style={analyzing ? { animation: 'spin 0.8s linear infinite' } : {}} />
            {analyzing ? 'Analyzing…' : 'Re-run AI'}
          </button>
          <Link to={`/decisions/${id}/simulate`} className="btn btn-sm btn-outline-primary">
            <Sliders size={14} /> What-If Simulator
          </Link>
          <Link to={`/decisions/${id}/details`} className="btn btn-sm btn-secondary">
            <ExternalLink size={14} /> Audit Trail
          </Link>
        </div>
      </div>

      {/* Decision header */}
      <div className="decision-layout-header">
        <div>
          <div className="decision-badge-row">
            <span className="badge badge-gray">{decision.category}</span>
            {isFinalized ? (
              <span className={`badge ${decision.humanDecision.type === 'ACCEPT_AI' ? 'badge-success' : decision.humanDecision.type === 'OVERRIDE_AI' ? 'badge-danger' : 'badge-purple'}`}>
                {decision.humanDecision.type === 'ACCEPT_AI' ? '✓ AI Accepted' : decision.humanDecision.type === 'OVERRIDE_AI' ? '↑ Human Override' : '⎇ Alternative Chosen'}
              </span>
            ) : (
              <span className="badge badge-warning">Awaiting Human Decision</span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={12} /> {new Date(decision.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="decision-title-main">{decision.title}</h1>
          <p className="decision-desc-main">{decision.description}</p>
        </div>
      </div>

      {/* HITL advisory banner */}
      <div className="alert-banner alert-advisory" style={{ marginBottom: 0 }}>
        <Bot size={16} />
        <span>
          <strong>AI Advisory Only.</strong> The recommendation below is generated by Groq AI via n8n workflow and is purely advisory.
          You must make the final decision using the panel on the right.
        </span>
      </div>

      {/* Main two-column grid */}
      <div className="analysis-grid">

        {/* Left — AI analysis */}
        <div className="analysis-main-column">
          <RecommendationCard aiAnalysis={decision.aiAnalysis} calculatedScores={decision.calculatedScores} />
          <EvidenceCard evidence={decision.aiAnalysis?.evidence} />
          <RiskCard risks={decision.aiAnalysis?.risks} />
          <AlternativeCard
            alternatives={decision.aiAnalysis?.alternatives}
            onSelectAlternative={setPreselectedAlt}
          />
          <ScoreChart
            calculatedScores={decision.calculatedScores}
            criteria={decision.criteria}
            options={decision.options}
          />
        </div>

        {/* Right — confidence + human decision */}
        <div className="analysis-side-column">
          <ConfidenceIndicator
            confidence={conf}
            confidenceCategory={decision.aiAnalysis?.confidenceCategory}
          />

          <HumanDecisionPanel
            decision={decision}
            onFinalizeDecision={handleFinalize}
            isSubmitting={finalizing}
            preselectedAlternative={preselectedAlt}
          />

          {/* What-If trigger */}
          <div className="hitl-card" style={{ padding: '1.15rem', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Sliders size={17} color="#16A34A" />
              <h4 style={{ fontSize: '0.95rem' }}>Test Sensitivity</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Change criteria weights to see if rankings shift — without modifying the original decision.
            </p>
            <Link to={`/decisions/${id}/simulate`} className="btn btn-sm btn-outline-primary" style={{ width: '100%' }}>
              Open What-If Simulator
            </Link>
          </div>

          {/* Criteria weights summary */}
          <div className="hitl-card" style={{ padding: '1.15rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.85rem', color: 'var(--text-primary)' }}>Criteria Weights</h4>
            {decision.criteria.map(c => {
              const w = decision.weights instanceof Map ? decision.weights.get(c.key) : decision.weights?.[c.key];
              return (
                <div key={c.key} style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>{w}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${w}%`, background: 'var(--primary)', borderRadius: '99px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tradeoffs */}
      {decision.aiAnalysis?.tradeoffs?.length > 0 && (
        <div className="hitl-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
            Key Trade-offs
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.25rem' }}>
            {decision.aiAnalysis.tradeoffs.map((t, i) => (
              <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
