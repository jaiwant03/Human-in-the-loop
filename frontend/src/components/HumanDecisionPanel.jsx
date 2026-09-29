import React, { useState } from 'react';
import { 
  UserCheck, 
  CheckCircle, 
  AlertTriangle, 
  GitFork, 
  Send, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';

export default function HumanDecisionPanel({ 
  decision, 
  onFinalizeDecision, 
  isSubmitting,
  preselectedAlternative 
}) {
  const aiRecommendation = decision.aiAnalysis?.recommendation?.option || 'N/A';
  const humanDecision = decision.humanDecision;
  const isFinalized = !!humanDecision;

  // Selected mode: 'ACCEPT_AI' | 'SELECT_ALTERNATIVE' | 'OVERRIDE_AI'
  const [decisionMode, setDecisionMode] = useState(
    preselectedAlternative ? 'SELECT_ALTERNATIVE' : 'ACCEPT_AI'
  );

  const [selectedOption, setSelectedOption] = useState(
    preselectedAlternative || aiRecommendation
  );

  const [overrideReason, setOverrideReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle mode switches
  const handleModeChange = (mode) => {
    setDecisionMode(mode);
    setErrorMsg('');
    if (mode === 'ACCEPT_AI') {
      setSelectedOption(aiRecommendation);
    } else if (mode === 'SELECT_ALTERNATIVE') {
      const firstAlt = decision.aiAnalysis?.alternatives?.[0]?.option;
      setSelectedOption(firstAlt || decision.options.find(o => o.name !== aiRecommendation)?.name || '');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedOption) {
      setErrorMsg('Please select an option.');
      return;
    }

    if (decisionMode === 'OVERRIDE_AI') {
      if (!overrideReason || overrideReason.trim().length < 5) {
        setErrorMsg('Human justification reason is required when overriding the AI recommendation.');
        return;
      }
    }

    const payload = {
      option: selectedOption,
      type: decisionMode,
      reason: decisionMode === 'OVERRIDE_AI' 
        ? overrideReason.trim() 
        : decisionMode === 'SELECT_ALTERNATIVE' 
          ? (overrideReason.trim() || 'Selected viable alternative runner-up.') 
          : 'Accepted AI recommendation based on supporting evidence.',
    };

    onFinalizeDecision(payload);
  };

  // If already finalized, show recorded decision audit status
  if (isFinalized) {
    return (
      <div className="human-decision-panel" style={{ border: '2px solid rgba(16, 185, 129, 0.4)' }}>
        <div className="panel-flag-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileCheck2 size={22} color="#10b981" />
            <div>
              <div className="panel-header-title" style={{ color: '#6ee7b7' }}>
                Human Decision Finalized
              </div>
              <div className="panel-subtitle">
                Immutable audit trail entry stored in database
              </div>
            </div>
          </div>
          <span className="badge badge-success">
            Recorded
          </span>
        </div>

        <div className="recorded-decision-banner">
          <div className="recorded-title-row">
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Final Human Choice
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                {humanDecision.option}
              </div>
            </div>
            <span className={`badge ${humanDecision.type === 'ACCEPT_AI' ? 'badge-success' : humanDecision.type === 'OVERRIDE_AI' ? 'badge-danger' : 'badge-purple'}`}>
              {humanDecision.type === 'ACCEPT_AI' ? 'AI Accepted' : humanDecision.type === 'OVERRIDE_AI' ? 'Human Override' : 'Alternative Chosen'}
            </span>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Human Rationale
            </div>
            <p style={{ fontSize: '0.9rem', color: '#e2e8f0', marginTop: '0.2rem' }}>
              "{humanDecision.reason}"
            </p>
          </div>

          <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Original AI Rec: <strong>{aiRecommendation}</strong></span>
            <span>Recorded at: {new Date(humanDecision.decidedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="human-decision-panel">
      {/* Header */}
      <div className="panel-flag-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <UserCheck size={22} color="#6366f1" />
          <div>
            <div className="panel-header-title">
              Final Human Decision
            </div>
            <div className="panel-subtitle">
              AI recommendation is advisory only. You maintain full final control.
            </div>
          </div>
        </div>
        <span className="badge badge-warning">
          Action Required
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="decision-mode-selector">
        <button
          type="button"
          onClick={() => handleModeChange('ACCEPT_AI')}
          className={`mode-tab-btn ${decisionMode === 'ACCEPT_AI' ? 'active accept' : ''}`}
        >
          <CheckCircle size={18} />
          Accept AI Rec
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('SELECT_ALTERNATIVE')}
          className={`mode-tab-btn ${decisionMode === 'SELECT_ALTERNATIVE' ? 'active alternative' : ''}`}
        >
          <GitFork size={18} />
          Choose Alternative
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('OVERRIDE_AI')}
          className={`mode-tab-btn ${decisionMode === 'OVERRIDE_AI' ? 'active override' : ''}`}
        >
          <AlertTriangle size={18} />
          Override AI
        </button>
      </div>

      {/* Form Action Area */}
      <form onSubmit={handleSubmit}>
        {/* ACCEPT AI MODE */}
        {decisionMode === 'ACCEPT_AI' && (
          <div className="decision-action-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={20} color="#10b981" />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                Ratify Recommendation: {aiRecommendation}
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              You agree with the deterministic scores and supporting evidence provided by the AI analysis layer.
            </p>
          </div>
        )}

        {/* CHOOSE ALTERNATIVE MODE */}
        {decisionMode === 'SELECT_ALTERNATIVE' && (
          <div className="decision-action-box">
            <div className="form-group">
              <label className="form-label">Select Validated Alternative Candidate:</label>
              <select
                className="form-select"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
              >
                {decision.options
                  .filter(o => o.name !== aiRecommendation)
                  .map(o => (
                    <option key={o.id || o.name} value={o.name}>
                      {o.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Context / Preference Note (Optional):</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Prioritizing expedited fulfillment over pure quality score"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* OVERRIDE AI MODE */}
        {decisionMode === 'OVERRIDE_AI' && (
          <div className="decision-action-box" style={{ border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fde68a', textTransform: 'uppercase' }}>
                Executive Override Triggered
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Select Desired Final Option:</label>
              <select
                className="form-select"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
              >
                {decision.options.map(o => (
                  <option key={o.id || o.name} value={o.name}>
                    {o.name} {o.name === aiRecommendation ? '(Original AI Rec)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Required Override Justification Reason <span style={{ color: 'var(--danger)' }}>*</span>:
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Example: Budget constraint is prioritized over material quality for Q3 prototype phase."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="alert-banner alert-warning" style={{ margin: '0.75rem 0' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Final Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn btn-lg ${decisionMode === 'ACCEPT_AI' ? 'btn-success' : decisionMode === 'OVERRIDE_AI' ? 'btn-warning' : 'btn-primary'}`}
          style={{ width: '100%', marginTop: '0.5rem', gap: '0.6rem' }}
        >
          {isSubmitting ? (
            <>
              <div className="spinner" />
              <span>Recording Human Decision...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>
                {decisionMode === 'ACCEPT_AI' ? `Ratify & Save Decision (${selectedOption})` : decisionMode === 'OVERRIDE_AI' ? `Commit Human Override (${selectedOption})` : `Commit Alternative Choice (${selectedOption})`}
              </span>
            </>
          )}
        </button>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
          Decision will be timestamped and permanently logged in the MongoDB audit trail.
        </div>
      </form>
    </div>
  );
}
