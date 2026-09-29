import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Bot, 
  UserCheck, 
  Sliders, 
  RotateCw, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Calendar,
  Layers
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
  const [selectedAlternative, setSelectedAlternative] = useState(null);

  useEffect(() => {
    loadDecision();
  }, [id]);

  const loadDecision = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await decisionAPI.getDecisionById(id);
      if (res.success && res.data) {
        setDecision(res.data);
      } else {
        setError('Decision not found.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading decision details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    try {
      setAnalyzing(true);
      const res = await decisionAPI.analyzeDecision(id);
      if (res.success && res.data) {
        setDecision(res.data);
      }
    } catch (err) {
      console.error('Re-analysis error:', err);
      alert('Unable to re-analyze decision.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFinalize = async (payload) => {
    try {
      setFinalizing(true);
      const res = await decisionAPI.finalizeDecision(id, payload);
      if (res.success && res.data) {
        setDecision(res.data);
      }
    } catch (err) {
      console.error('Finalization error:', err);
      alert(err.response?.data?.message || 'Failed to record human decision.');
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
          Synthesizing multi-criteria decision intelligence...
        </p>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="hitl-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2>Unable to Load Decision</h2>
        <p style={{ margin: '0.5rem 0 1.5rem' }}>{error || 'Decision record does not exist.'}</p>
        <Link to="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const isFinalized = !!decision.humanDecision;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Navigation & Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/dashboard" className="btn btn-sm btn-secondary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleReanalyze}
            disabled={analyzing}
            className="btn btn-sm btn-secondary"
            title="Re-run n8n Groq Workflow"
          >
            <RotateCw size={14} className={analyzing ? 'spinner' : ''} />
            {analyzing ? 'Analyzing...' : 'Re-Run AI Analysis'}
          </button>

          <Link to={`/decisions/${id}/simulate`} className="btn btn-sm btn-outline-primary">
            <Sliders size={16} />
            What-If Simulator
          </Link>
        </div>
      </div>

      {/* Main Header Strip */}
      <div className="decision-layout-header">
        <div>
          <div className="decision-badge-row">
            <span className="badge badge-gray">{decision.category}</span>
            {isFinalized ? (
              <span className={`badge ${decision.humanDecision.type === 'ACCEPT_AI' ? 'badge-success' : decision.humanDecision.type === 'OVERRIDE_AI' ? 'badge-danger' : 'badge-purple'}`}>
                Finalized: {decision.humanDecision.type === 'ACCEPT_AI' ? 'AI Accepted' : decision.humanDecision.type === 'OVERRIDE_AI' ? 'Human Override' : 'Alternative Chosen'}
              </span>
            ) : (
              <span className="badge badge-warning">
                Awaiting Human Decision
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.5rem' }}>
              <Calendar size={13} /> {new Date(decision.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h1 className="decision-title-main">{decision.title}</h1>
          <p className="decision-desc-main">{decision.description}</p>
        </div>
      </div>

      {/* Two-Column Intelligence Grid */}
      <div className="analysis-grid">
        {/* Left / Main Intelligence Column */}
        <div className="analysis-main-column">
          {/* AI Recommendation */}
          <RecommendationCard
            aiAnalysis={decision.aiAnalysis}
            calculatedScores={decision.calculatedScores}
          />

          {/* Evidence Base */}
          <EvidenceCard evidence={decision.aiAnalysis?.evidence} />

          {/* Operational Risks */}
          <RiskCard risks={decision.aiAnalysis?.risks} />

          {/* Alternatives */}
          <AlternativeCard
            alternatives={decision.aiAnalysis?.alternatives}
            onSelectAlternative={(optName) => setSelectedAlternative(optName)}
          />

          {/* Chart.js Visualizations */}
          <ScoreChart
            calculatedScores={decision.calculatedScores}
            criteria={decision.criteria}
            options={decision.options}
          />
        </div>

        {/* Right Column: Analytical Confidence & Human Decision Authority */}
        <div className="analysis-side-column">
          {/* Confidence Indicator Widget */}
          <ConfidenceIndicator
            confidence={decision.aiAnalysis?.confidence}
            confidenceCategory={decision.aiAnalysis?.confidenceCategory}
          />

          {/* HUMAN DECISION PANEL - Core Platform Feature */}
          <HumanDecisionPanel
            decision={decision}
            onFinalizeDecision={handleFinalize}
            isSubmitting={finalizing}
            preselectedAlternative={selectedAlternative}
          />

          {/* What-If Simulation Trigger Card */}
          <div className="hitl-card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Sliders size={18} color="#a5b4fc" />
              <h4 style={{ fontSize: '1rem' }}>Test Sensitivity</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Simulate weight changes to observe if Supplier B or C overtakes Supplier A under different strategic priorities.
            </p>
            <Link
              to={`/decisions/${id}/simulate`}
              className="btn btn-sm btn-outline-primary"
              style={{ width: '100%' }}
            >
              Launch What-If Simulator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
