import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, History, Bot, UserCheck, Calendar,
  CheckCircle2, AlertTriangle, Layers, ShieldCheck, Clock
} from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function DecisionDetails() {
  const { id } = useParams();
  const [decision, setDecision] = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await decisionAPI.getDecisionById(id);
      if (res.success) { setDecision(res.data); setSimulations(res.simulations || []); }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  if (loading || !decision) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <p>Loading audit record…</p>
    </div>
  );

  const hd = decision.humanDecision;
  const ai = decision.aiAnalysis;
  const isFinalized = !!hd;

  const outcomeTypeLabel = (type) => {
    if (type === 'ACCEPT_AI') return 'AI Accepted';
    if (type === 'OVERRIDE_AI') return 'Human Override';
    if (type === 'SELECT_ALTERNATIVE') return 'Alternative Chosen';
    return type || '—';
  };

  const logActionColor = (action) => {
    if (action.includes('HUMAN')) return '#16A34A';
    if (action.includes('AI'))    return '#3B82F6';
    return '#94A3B8';
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to={`/decisions/${id}`} className="btn btn-sm btn-secondary">
          <ArrowLeft size={15} /> Back to Analysis
        </Link>
        <Link to="/history" className="btn btn-sm btn-secondary">
          <History size={14} /> All Decisions
        </Link>
      </div>

      {/* Header */}
      <div className="decision-layout-header">
        <div>
          <div className="decision-badge-row">
            <span className="badge badge-gray">{decision.category}</span>
            <span className="badge badge-advisory">Audit Trail Record</span>
            {isFinalized ? (
              <span className={`badge ${hd.type === 'ACCEPT_AI' ? 'badge-success' : hd.type === 'OVERRIDE_AI' ? 'badge-danger' : 'badge-purple'}`}>
                {outcomeTypeLabel(hd.type)}
              </span>
            ) : (
              <span className="badge badge-warning">Pending Decision</span>
            )}
          </div>
          <h1 className="decision-title-main">{decision.title}</h1>
          <p className="decision-desc-main">{decision.description}</p>
        </div>
      </div>

      {/* Dual Outcome Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* AI Advisory Box */}
        <div className="hitl-card" style={{ border: '1px solid #BFDBFE', background: '#EFF6FF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Bot size={18} color="#2563EB" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AI Recommendation (Advisory)
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1E3A8A', marginBottom: '0.4rem' }}>
            {ai?.recommendation?.option || 'N/A'}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#3B82F6', fontWeight: 600, marginBottom: '0.4rem' }}>
            Score: <strong>{ai?.recommendation?.score} / 100</strong>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#2563EB' }}>
            Confidence: <strong>{ai?.confidence}%</strong>
            {' '}({ai?.confidenceCategory || 'N/A'})
          </div>
          {ai?.summary && (
            <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.75rem', lineHeight: 1.55, borderTop: '1px solid #DBEAFE', paddingTop: '0.75rem' }}>
              "{ai.summary}"
            </p>
          )}
        </div>

        {/* Human Decision Box */}
        <div className="hitl-card" style={{
          border: isFinalized ? '1px solid #BBF7D0' : '1px solid #FCD34D',
          background: isFinalized ? '#F0FDF4' : '#FFFBEB',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <UserCheck size={18} color={isFinalized ? '#16A34A' : '#D97706'} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isFinalized ? '#166534' : '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Final Human Decision {isFinalized ? '(Recorded)' : '(Pending)'}
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: isFinalized ? '#166534' : '#92400E', marginBottom: '0.4rem' }}>
            {isFinalized ? hd.option : 'Not Yet Decided'}
          </div>
          {isFinalized && (
            <>
              <div style={{ fontSize: '0.875rem', color: '#16A34A', fontWeight: 600, marginBottom: '0.4rem' }}>
                Type: <strong>{outcomeTypeLabel(hd.type)}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} /> {new Date(hd.decidedAt).toLocaleString()}
              </div>
              <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.82rem', color: '#166534', lineHeight: 1.55 }}>
                <strong>Justification:</strong> "{hd.reason}"
              </div>
            </>
          )}
        </div>
      </div>

      {/* Score Table */}
      <div className="hitl-card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Calculated Scores</h3>
        {decision.calculatedScores?.length > 0 ? (
          <div className="decisions-table-container">
            <table className="decisions-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Option</th>
                  <th>Score</th>
                  {decision.criteria.map(c => <th key={c.key}>{c.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {decision.calculatedScores.map(s => (
                  <tr key={s.name}>
                    <td>
                      <span style={{
                        width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                        background: s.rank === 1 ? '#16A34A' : s.rank === 2 ? '#F59E0B' : '#CBD5E1',
                        color: s.rank <= 2 ? '#fff' : '#475569',
                      }}>
                        {s.rank}
                      </span>
                    </td>
                    <td style={{ fontWeight: s.rank === 1 ? 700 : 500, color: s.rank === 1 ? '#166534' : 'var(--text-primary)' }}>
                      {s.name}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.rank === 1 ? '#16A34A' : '#475569' }}>
                        {s.score}
                      </span>
                    </td>
                    {decision.criteria.map(c => {
                      const opt = decision.options.find(o => o.name === s.name);
                      const val = opt ? (opt.criteria instanceof Map ? opt.criteria.get(c.key) : opt.criteria?.[c.key]) : '—';
                      return <td key={c.key} style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{val}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>No scores calculated.</p>}
      </div>

      {/* Criteria weights table */}
      <div className="hitl-card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Decision Model — Criteria &amp; Weights</h3>
        <div className="decisions-table-container">
          <table className="decisions-table">
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Weight</th>
                <th>Description</th>
                {decision.options.map(o => <th key={o.name}>{o.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {decision.criteria.map(c => {
                const w = decision.weights instanceof Map ? decision.weights.get(c.key) : decision.weights?.[c.key];
                return (
                  <tr key={c.key}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#16A34A', fontWeight: 700 }}>{w}%</span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.description || '—'}</td>
                    {decision.options.map(opt => {
                      const oc = opt.criteria instanceof Map ? Object.fromEntries(opt.criteria) : opt.criteria || {};
                      return <td key={opt.name} style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{oc[c.key] ?? '—'}</td>;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <History size={18} color="#16A34A" />
          <h3 style={{ fontSize: '1.1rem' }}>Chronological Audit Log</h3>
        </div>

        <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: '7px', top: '4px', bottom: '4px', width: '2px', background: '#E2E8F0', borderRadius: '1px' }} />

          {(decision.auditLogs || []).map((log, idx) => (
            <div key={idx} style={{ position: 'relative', marginBottom: '1.25rem', paddingBottom: '0.25rem' }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: '-1.45rem', top: '4px',
                width: '12px', height: '12px', borderRadius: '50%',
                background: logActionColor(log.action),
                border: '2px solid #fff',
                boxShadow: '0 0 0 2px ' + logActionColor(log.action) + '30',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {log.action.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>

              {log.details && Object.keys(log.details).length > 0 && (
                <div style={{
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#64748B',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  lineHeight: 1.6,
                }}>
                  {Object.entries(log.details).map(([k, v]) => (
                    <div key={k}>
                      <span style={{ color: '#16A34A' }}>{k}</span>: {String(v)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Simulations (if any) */}
      {simulations.length > 0 && (
        <div className="hitl-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>What-If Simulations</h3>
          {simulations.map(sim => (
            <div key={sim._id} style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '0.75rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{sim.simulationName}</span>
                {sim.changed ? (
                  <span className="badge badge-warning">Rank Changed</span>
                ) : (
                  <span className="badge badge-success">Rank Stable</span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Original: <strong>{sim.originalTopOption}</strong> → Simulated: <strong style={{ color: sim.changed ? '#D97706' : '#16A34A' }}>{sim.simulatedTopOption}</strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sim.explanation}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
