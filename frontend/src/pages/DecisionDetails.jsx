import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Bot, 
  UserCheck, 
  Clock, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Layers,
  Sparkles
} from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function DecisionDetails() {
  const { id } = useParams();
  const [decision, setDecision] = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecisionDetails();
  }, [id]);

  const loadDecisionDetails = async () => {
    try {
      setLoading(true);
      const res = await decisionAPI.getDecisionById(id);
      if (res.success) {
        setDecision(res.data);
        setSimulations(res.simulations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !decision) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading comprehensive audit record...</p>
      </div>
    );
  }

  const humanDecision = decision.humanDecision;
  const isFinalized = !!humanDecision;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to={`/decisions/${id}`} className="btn btn-sm btn-secondary">
          <ArrowLeft size={16} /> Back to Analysis View
        </Link>
        <Link to="/history" className="btn btn-sm btn-secondary">
          <History size={16} /> All Decision Logs
        </Link>
      </div>

      {/* Header */}
      <div className="decision-layout-header">
        <div>
          <div className="decision-badge-row">
            <span className="badge badge-gray">{decision.category}</span>
            <span className="badge badge-purple">Audit Trail Record</span>
            {isFinalized ? (
              <span className={`badge ${humanDecision.type === 'ACCEPT_AI' ? 'badge-success' : humanDecision.type === 'OVERRIDE_AI' ? 'badge-danger' : 'badge-purple'}`}>
                {humanDecision.type === 'ACCEPT_AI' ? 'AI Accepted' : humanDecision.type === 'OVERRIDE_AI' ? 'Human Override' : 'Alternative Selected'}
              </span>
            ) : (
              <span className="badge badge-warning">Pending Final Decision</span>
            )}
          </div>
          <h1 className="decision-title-main">{decision.title}</h1>
          <p className="decision-desc-main">{decision.description}</p>
        </div>
      </div>

      {/* Side-by-side Dual Outcome Card */}
      <div className="hitl-card" style={{
        background: 'linear-gradient(135deg, rgba(19, 27, 46, 0.95) 0%, rgba(26, 38, 64, 0.9) 100%)',
        border: '1px solid var(--border-accent)',
        padding: '2rem',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* AI Advisory Record */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Bot size={18} />
              AI Recommendation (Advisory)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
              {decision.aiAnalysis?.recommendation?.option || 'N/A'}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
              Deterministic Score: <strong>{decision.aiAnalysis?.recommendation?.score} / 100</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>
              Analytical Confidence: <strong>{decision.aiAnalysis?.confidence}%</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              "{decision.aiAnalysis?.summary}"
            </p>
          </div>

          {/* Final Human Decision Record */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            paddingLeft: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <UserCheck size={18} />
              Final Human Decision (Definitive)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: isFinalized ? '#ffffff' : 'var(--text-muted)' }}>
              {isFinalized ? humanDecision.option : 'Not Decided Yet'}
            </div>
            <div style={{ fontSize: '0.9rem', color: isFinalized ? '#6ee7b7' : 'var(--text-muted)' }}>
              Outcome Type: <strong>{humanDecision ? humanDecision.type : 'Awaiting Review'}</strong>
            </div>
            {isFinalized && (
              <>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Decided At: {new Date(humanDecision.decidedAt).toLocaleString()}
                </div>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: '#e2e8f0',
                  marginTop: '0.25rem',
                }}>
                  <strong>Human Justification:</strong><br />
                  "{humanDecision.reason}"
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Criteria & Deterministic Weights Table */}
      <div className="hitl-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Original Decision Model & Weights</h3>
        <div className="decisions-table-container">
          <table className="decisions-table">
            <thead>
              <tr>
                <th>Criterion Name</th>
                <th>Assigned Weight</th>
                <th>Description</th>
                {decision.options.map(opt => (
                  <th key={opt.name}>{opt.name} Score</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decision.criteria.map((c) => {
                const weight = decision.weights instanceof Map ? decision.weights.get(c.key) : decision.weights?.[c.key];
                return (
                  <tr key={c.key}>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>{c.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#a5b4fc', fontWeight: 700 }}>{weight}%</td>
                    <td>{c.description || '—'}</td>
                    {decision.options.map((opt) => {
                      const optCrit = opt.criteria instanceof Map ? Object.fromEntries(opt.criteria) : opt.criteria || {};
                      return (
                        <td key={opt.name} style={{ fontFamily: 'var(--font-mono)' }}>
                          {optCrit[c.key] || 0}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="hitl-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <History size={20} color="#a5b4fc" />
          <h3 style={{ fontSize: '1.2rem' }}>Chronological Audit Log</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid rgba(99, 102, 241, 0.3)', paddingLeft: '1.25rem', marginLeft: '0.5rem' }}>
          {decision.auditLogs && decision.auditLogs.map((log, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '-1.65rem',
                top: '4px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: log.action.includes('HUMAN') ? 'var(--success)' : log.action.includes('AI') ? 'var(--primary)' : '#94a3b8',
                border: '2px solid var(--bg-primary)',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                  {log.action.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>

              {log.details && (
                <div style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '0.35rem',
                }}>
                  {JSON.stringify(log.details)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
