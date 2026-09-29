import React from 'react';
import { Gauge, Info, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ConfidenceIndicator({ confidence = 85, confidenceCategory = 'High Confidence', breakdown }) {
  const getCategoryColor = () => {
    if (confidence >= 80) return { bg: 'var(--success-bg)', text: '#6ee7b7', border: 'var(--success-border)', borderClass: 'border-emerald' };
    if (confidence >= 60) return { bg: 'var(--warning-bg)', text: '#fde68a', border: 'var(--warning-border)', borderClass: 'border-amber' };
    return { bg: 'var(--danger-bg)', text: '#fca5a5', border: 'var(--danger-border)', borderClass: 'border-red' };
  };

  const styleMeta = getCategoryColor();

  return (
    <div className="confidence-card">
      <div className="confidence-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Gauge size={18} color="#a5b4fc" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Confidence Indicator
          </span>
        </div>
        <span
          className="badge"
          style={{
            background: styleMeta.bg,
            color: styleMeta.text,
            border: `1px solid ${styleMeta.border}`,
          }}
        >
          {confidenceCategory}
        </span>
      </div>

      <div className="confidence-display">
        <div className="confidence-circle" style={{ borderColor: styleMeta.text }}>
          <span className="confidence-val">{confidence}%</span>
          <span className="confidence-pct">INDEX</span>
        </div>

        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.2rem' }}>
            {confidence >= 80 ? 'Robust Evidence Base' : confidence >= 60 ? 'Moderate Decision Clarity' : 'Sensitive Margin of Error'}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Derived deterministically from data completeness, score separation, and criteria coverage.
          </p>
        </div>
      </div>

      {/* Breakdown Dimensions */}
      <div className="confidence-breakdown-list">
        <div className="slider-row">
          <div className="breakdown-row">
            <span>Data Completeness (30%)</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{breakdown?.dataCompleteness || 100}%</span>
          </div>
          <div className="breakdown-bar-track">
            <div className="breakdown-bar-fill" style={{ width: `${breakdown?.dataCompleteness || 100}%` }} />
          </div>
        </div>

        <div className="slider-row">
          <div className="breakdown-row">
            <span>Score Separation (30%)</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{breakdown?.scoreSeparation || 85}%</span>
          </div>
          <div className="breakdown-bar-track">
            <div className="breakdown-bar-fill" style={{ width: `${breakdown?.scoreSeparation || 85}%`, background: 'var(--accent-blue)' }} />
          </div>
        </div>

        <div className="slider-row">
          <div className="breakdown-row">
            <span>Evidence Strength (20%)</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{breakdown?.evidenceStrength || 80}%</span>
          </div>
          <div className="breakdown-bar-track">
            <div className="breakdown-bar-fill" style={{ width: `${breakdown?.evidenceStrength || 80}%`, background: 'var(--accent-purple)' }} />
          </div>
        </div>

        <div className="slider-row">
          <div className="breakdown-row">
            <span>Criteria Coverage (20%)</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{breakdown?.criteriaCoverage || 100}%</span>
          </div>
          <div className="breakdown-bar-track">
            <div className="breakdown-bar-fill" style={{ width: `${breakdown?.criteriaCoverage || 100}%`, background: 'var(--accent-cyan)' }} />
          </div>
        </div>
      </div>

      <div className="confidence-disclaimer">
        <Info size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
        "Confidence is an analytical indicator, not a guarantee."
      </div>
    </div>
  );
}
