import React from 'react';
import { Bot, CheckCircle2, AlertCircle, Sparkles, Scale } from 'lucide-react';

export default function RecommendationCard({ aiAnalysis, calculatedScores = [] }) {
  if (!aiAnalysis || !aiAnalysis.recommendation) {
    return (
      <div className="hitl-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <Bot size={36} color="#6366f1" style={{ margin: '0 auto 1rem' }} />
        <h3>AI Analysis In Progress</h3>
        <p>Awaiting completion from the n8n decision workflow...</p>
      </div>
    );
  }

  const { recommendation, summary, reasons = [], tradeoffs = [], source } = aiAnalysis;
  const topCalculated = calculatedScores[0];
  const displayScore = topCalculated?.score || recommendation.score;

  return (
    <div className="hitl-card recommendation-card">
      {/* Header advisory strip */}
      <div className="recommendation-header-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Bot size={16} color="#a5b4fc" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI Advisory Recommendation
          </span>
        </div>

        <span className="badge badge-advisory">
          <AlertCircle size={12} /> Advisory Only — Human Decides
        </span>
      </div>

      {/* Main Title & Calculated Score */}
      <div className="rec-title-group">
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recommended Candidate
          </div>
          <div className="rec-option-name">
            {recommendation.option}
          </div>
        </div>

        <div className="rec-score-pill">
          <Sparkles size={16} />
          <span>{displayScore} / 100</span>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="rec-summary">
        {summary}
      </div>

      {/* Why AI recommended this option */}
      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Key Justification Factors
        </div>
        <div className="rec-reasons-list">
          {reasons.map((reason, idx) => (
            <div key={idx} className="rec-reason-item">
              <CheckCircle2 size={16} className="rec-reason-check" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trade-off summary if present */}
      {tradeoffs && tradeoffs.length > 0 && (
        <div style={{
          marginTop: '1.25rem',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}>
          <Scale size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fde68a', textTransform: 'uppercase' }}>
              Identified Trade-Off
            </div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
              {tradeoffs[0]}
            </div>
          </div>
        </div>
      )}

      {/* Workflow Engine Attribution */}
      <div style={{
        marginTop: '1.25rem',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>Orchestration: n8n Workflow + Groq Reasoning Layer</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>Mode: {source || 'n8n_groq'}</span>
      </div>
    </div>
  );
}
