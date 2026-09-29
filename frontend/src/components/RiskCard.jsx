import React from 'react';
import { AlertOctagon, ShieldAlert, AlertTriangle, Info } from 'lucide-react';

export default function RiskCard({ risks = [] }) {
  if (!risks || risks.length === 0) {
    return null;
  }

  const getSeverityBadge = (severity) => {
    const s = severity?.toLowerCase() || 'medium';
    if (s === 'high') {
      return (
        <span className="badge badge-danger">
          <AlertOctagon size={12} /> High Severity
        </span>
      );
    }
    if (s === 'medium') {
      return (
        <span className="badge badge-warning">
          <AlertTriangle size={12} /> Medium Severity
        </span>
      );
    }
    return (
      <span className="badge badge-success">
        <Info size={12} /> Low Severity
      </span>
    );
  };

  return (
    <div className="hitl-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={18} color="#f87171" />
          <h3 style={{ fontSize: '1.15rem' }}>Potential Operational Risks</h3>
        </div>
        <span className="badge badge-advisory" style={{ fontSize: '0.7rem' }}>
          Risk Assessment
        </span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Identified vulnerability areas and criteria where recommended option exhibits vulnerability.
      </p>

      <div className="risk-grid">
        {risks.map((item, idx) => {
          const sev = item.severity?.toLowerCase() || 'medium';
          return (
            <div key={idx} className={`risk-item-card ${sev}`}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: sev === 'high' ? 'rgba(239, 68, 68, 0.2)' : sev === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ShieldAlert size={18} color={sev === 'high' ? '#ef4444' : sev === 'medium' ? '#f59e0b' : '#10b981'} />
              </div>

              <div className="risk-content-main">
                <div className="risk-title-row">
                  <span className="risk-title">{item.risk}</span>
                  {getSeverityBadge(item.severity)}
                </div>
                <p className="risk-explanation">
                  {item.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
