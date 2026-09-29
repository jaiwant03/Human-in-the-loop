import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, FileText } from 'lucide-react';

export default function EvidenceCard({ evidence = [] }) {
  if (!evidence || evidence.length === 0) {
    return null;
  }

  const positiveEvidence = evidence.filter(e => e.impact === 'positive');
  const negativeEvidence = evidence.filter(e => e.impact === 'negative' || e.impact === 'neutral');

  return (
    <div className="hitl-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="#a5b4fc" />
          <h3 style={{ fontSize: '1.15rem' }}>Supporting Evidence Base</h3>
        </div>
        <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
          {evidence.length} Evaluated Factors
        </span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Empirical breakdown showing positive score drivers and relative trade-offs.
      </p>

      {/* Positive Drivers */}
      {positiveEvidence.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#6ee7b7',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <CheckCircle2 size={14} /> Positive Performance Drivers
          </div>
          <div className="evidence-grid">
            {positiveEvidence.map((item, idx) => (
              <div key={idx} className="evidence-item-card positive">
                <div className="evidence-top-row">
                  <span className="evidence-factor-name">
                    <CheckCircle2 size={14} color="#10b981" />
                    {item.factor}
                  </span>
                  <span className="evidence-value-badge">
                    {item.value} / 100
                  </span>
                </div>
                <p className="evidence-explanation">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negative Trade-off Factors */}
      {negativeEvidence.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#fde68a',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <AlertTriangle size={14} /> Performance Disadvantages & Bottlenecks
          </div>
          <div className="evidence-grid">
            {negativeEvidence.map((item, idx) => (
              <div key={idx} className="evidence-item-card negative">
                <div className="evidence-top-row">
                  <span className="evidence-factor-name">
                    <AlertTriangle size={14} color="#f59e0b" />
                    {item.factor}
                  </span>
                  <span className="evidence-value-badge">
                    {item.value} / 100
                  </span>
                </div>
                <p className="evidence-explanation">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
