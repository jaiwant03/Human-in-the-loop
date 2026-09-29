import React from 'react';
import { GitFork, ArrowUpRight } from 'lucide-react';

export default function AlternativeCard({ alternatives = [], onSelectAlternative }) {
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  return (
    <div className="hitl-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitFork size={18} color="#a5b4fc" />
          <h3 style={{ fontSize: '1.15rem' }}>Evaluated Alternative Options</h3>
        </div>
        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
          Viable Candidates
        </span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Strong runner-up candidates that offer alternative trade-off balances or specialized strengths.
      </p>

      <div className="alternatives-grid">
        {alternatives.map((alt, idx) => (
          <div key={idx} className="alternative-card-item">
            <div>
              <div className="alt-top-row">
                <span className="alt-name">{alt.option}</span>
                <span className="alt-score">{alt.score} pts</span>
              </div>
              <p className="alt-reason" style={{ marginTop: '0.5rem' }}>
                {alt.reason}
              </p>
            </div>

            {onSelectAlternative && (
              <button
                type="button"
                onClick={() => onSelectAlternative(alt.option)}
                className="btn btn-sm btn-outline-primary"
                style={{ width: '100%', marginTop: '0.85rem' }}
              >
                Consider as Final Choice <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
