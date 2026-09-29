import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Send, Bot, UserCheck, Sparkles, ArrowRight,
  CheckCircle2, AlertTriangle, BarChart3, Lightbulb,
  RefreshCw, ExternalLink, Info, ChevronDown, ChevronUp,
  ShieldCheck, Loader2
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { chatAPI, decisionAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ── Example prompts shown as quick-start suggestions ──
const EXAMPLES = [
  'Help me choose between Laptop A (fast CPU, $1500, 6hr battery) and Laptop B (mid CPU, $900, 10hr battery) based on price, performance, and battery.',
  'Should I go with Supplier A (quality 90, cost 70, delivery 85) or Supplier B (quality 75, cost 95, delivery 90) for our new product line?',
  'Compare three cloud providers: AWS (reliability 95, cost 65, support 88), Azure (reliability 90, cost 72, support 92), GCP (reliability 88, cost 80, support 78).',
  'I need to pick a marketing agency. Agency A is creative but slow. Agency B is reliable but expensive. Agency C is affordable but new.',
];

// ── A single chat bubble ──
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';

  if (isSystem) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', margin: '0.5rem 0',
      }}>
        <span style={{
          fontSize: '0.75rem', color: 'var(--text-muted)',
          background: 'var(--bg-secondary)', padding: '0.25rem 0.85rem',
          borderRadius: '999px', border: '1px solid var(--border-subtle)',
        }}>
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      margin: '0.4rem 0',
      gap: '0.6rem',
      alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'var(--primary-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Bot size={15} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '75%',
        padding: '0.7rem 1rem',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--primary-gradient)' : 'var(--bg-card)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        border: isUser ? 'none' : '1px solid var(--border-subtle)',
        fontSize: '0.875rem',
        lineHeight: 1.6,
        boxShadow: 'var(--shadow-sm)',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
      {isUser && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: '#F0FDF4', border: '2px solid var(--primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <UserCheck size={14} color="#16A34A" />
        </div>
      )}
    </div>
  );
}

// ── Score bar chart ──
function ScoreBarChart({ scores }) {
  if (!scores || scores.length === 0) return null;
  const sorted = [...scores].sort((a, b) => (a.rank || 0) - (b.rank || 0));

  const data = {
    labels: sorted.map(s => s.name || s.option),
    datasets: [{
      label: 'Weighted Score',
      data: sorted.map(s => s.score || s.weightedScore || 0),
      backgroundColor: sorted.map((s, i) =>
        i === 0 ? 'rgba(22,163,74,0.85)' : 'rgba(22,163,74,0.35)'
      ),
      borderColor: sorted.map((s, i) =>
        i === 0 ? '#16A34A' : '#86EFAC'
      ),
      borderWidth: 2,
      borderRadius: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleColor: '#fff',
        bodyColor: '#94A3B8',
        callbacks: { label: ctx => `Score: ${ctx.parsed.y} / 100` },
      },
    },
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { color: '#94A3B8', font: { family: 'Plus Jakarta Sans' } },
        grid: { color: '#F1F5F9' },
      },
      x: {
        ticks: { color: '#0F172A', font: { weight: '600', family: 'Plus Jakarta Sans' } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: '200px', position: 'relative' }}>
      <Bar data={data} options={options} />
    </div>
  );
}

// ── Full decision analysis result panel ──
function DecisionResultPanel({ result, onViewFull, onFinalize }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [showRisks, setShowRisks] = useState(false);
  const [decisionMode, setDecisionMode] = useState('ACCEPT_AI');
  const [selectedOption, setSelectedOption] = useState('');
  const [reason, setReason] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(null);

  const ai = result.aiAnalysis;
  const scores = result.calculatedScores || [];
  const top = scores[0] || {};
  const conf = ai?.confidence || 0;
  const confColor = conf >= 80 ? '#16A34A' : conf >= 60 ? '#D97706' : '#DC2626';

  const handleFinalize = async () => {
    if (!result.decisionId) return;
    if (decisionMode === 'OVERRIDE_AI' && (!reason || reason.trim().length < 5)) {
      alert('Please enter a justification reason for the override.');
      return;
    }
    const option = decisionMode === 'ACCEPT_AI'
      ? ai.recommendation.option
      : selectedOption;
    if (!option) { alert('Please select an option.'); return; }

    try {
      setFinalizing(true);
      await decisionAPI.finalizeDecision(result.decisionId, {
        option,
        type: decisionMode,
        reason: reason || (decisionMode === 'ACCEPT_AI' ? 'Accepted AI recommendation.' : 'Alternative selected.'),
      });
      setFinalized({ option, type: decisionMode, reason });
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save decision.');
    } finally {
      setFinalizing(false);
    }
  };

  if (!ai) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Title */}
      <div style={{
        background: 'var(--primary-very-light)', border: '1px solid var(--primary-light)',
        borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
          Decision Analysis Complete
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {result.parsedDecision?.title || 'Decision'}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {result.parsedDecision?.category} · {scores.length} options · {result.parsedDecision?.criteria?.length} criteria
        </div>
      </div>

      {/* Scores chart */}
      <div className="hitl-card" style={{ padding: '1.15rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
          Weighted Scores
        </div>
        <ScoreBarChart scores={scores} />
      </div>

      {/* Recommendation + Confidence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="hitl-card" style={{
          padding: '1rem', background: 'linear-gradient(135deg,#F0FDF4,#fff)',
          border: '1px solid #BBF7D0',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            AI Recommendation
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#166534' }}>
            {ai.recommendation?.option}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: '#16A34A' }}>
            {ai.recommendation?.score} / 100
          </div>
          <div className="badge badge-advisory" style={{ marginTop: '0.5rem', fontSize: '0.65rem' }}>
            Advisory Only
          </div>
        </div>

        <div className="hitl-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            Confidence
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: confColor }}>
            {conf}%
          </div>
          <div style={{ fontSize: '0.8rem', color: confColor, fontWeight: 600 }}>
            {ai.confidenceCategory || (conf >= 80 ? 'High' : conf >= 60 ? 'Medium' : 'Low')}
          </div>
          <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '99px', marginTop: '0.5rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${conf}%`, background: confColor, borderRadius: '99px', transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Summary */}
      {ai.summary && (
        <div className="hitl-card" style={{ padding: '1rem', background: '#F8FAFC' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            AI Summary
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>{ai.summary}</p>
        </div>
      )}

      {/* Reasons */}
      {ai.reasons?.length > 0 && (
        <div className="hitl-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
            Key Reasons
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {ai.reasons.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: '3px' }} />
                {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence toggle */}
      {ai.evidence?.length > 0 && (
        <div className="hitl-card" style={{ padding: '1rem' }}>
          <button
            onClick={() => setShowEvidence(v => !v)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Supporting Evidence ({ai.evidence.length})
            </span>
            {showEvidence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showEvidence && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              {ai.evidence.map((e, i) => (
                <div key={i} style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${e.impact === 'positive' ? '#16A34A' : '#F59E0B'}`,
                  background: e.impact === 'positive' ? '#F0FDF4' : '#FFFBEB',
                  fontSize: '0.82rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{e.factor || e.criterion}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: e.impact === 'positive' ? '#16A34A' : '#D97706' }}>
                      {e.value}/100
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{e.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Risks toggle */}
      {ai.risks?.length > 0 && (
        <div className="hitl-card" style={{ padding: '1rem' }}>
          <button
            onClick={() => setShowRisks(v => !v)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Risks ({ai.risks.length})
            </span>
            {showRisks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showRisks && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              {ai.risks.map((r, i) => {
                const sev = r.severity?.toLowerCase() || 'medium';
                const col = sev === 'high' ? '#DC2626' : sev === 'medium' ? '#D97706' : '#16A34A';
                return (
                  <div key={i} style={{
                    padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)',
                    background: sev === 'high' ? '#FEE2E2' : sev === 'medium' ? '#FEF3C7' : '#D1FAE5',
                    border: `1px solid ${sev === 'high' ? '#FCA5A5' : sev === 'medium' ? '#FCD34D' : '#6EE7B7'}`,
                    fontSize: '0.82rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.risk}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: col, textTransform: 'uppercase' }}>{sev}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.explanation}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Alternatives */}
      {ai.alternatives?.length > 0 && (
        <div className="hitl-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
            Alternative Options
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ai.alternatives.map((a, i) => (
              <div key={i} style={{
                padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)',
                background: '#F8FAFC', border: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                    {a.option}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{a.reason}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#64748B', fontSize: '0.875rem', flexShrink: 0 }}>
                  {a.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HUMAN DECISION PANEL ── */}
      <div className="hitl-card" style={{
        border: '2px solid var(--primary-light)',
        background: 'linear-gradient(135deg,#F0FDF4,#fff)',
        padding: '1.25rem',
      }}>
        {finalized ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <ShieldCheck size={18} color="#16A34A" />
              <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem' }}>Human Decision Recorded</span>
            </div>
            <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', marginBottom: '0.25rem' }}>{finalized.option}</div>
              <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 600, marginBottom: finalized.reason ? '0.4rem' : 0 }}>
                {finalized.type === 'ACCEPT_AI' ? '✓ AI Recommendation Accepted'
                  : finalized.type === 'OVERRIDE_AI' ? '↑ Human Override'
                  : '⎇ Alternative Chosen'}
              </div>
              {finalized.reason && finalized.type !== 'ACCEPT_AI' && (
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>"{finalized.reason}"</div>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>AI recommended: <strong>{ai.recommendation?.option}</strong></span>
              {result.decisionId && (
                <Link to={`/decisions/${result.decisionId}`} style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  View Full Analysis <ExternalLink size={11} />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <UserCheck size={18} color="#16A34A" />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Your Decision</span>
              <span className="badge badge-warning" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>Action Required</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.55 }}>
              The AI recommendation is advisory. You have the final say.
            </p>

            {/* Mode selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '1rem' }}>
              {[
                { mode: 'ACCEPT_AI', label: 'Accept AI', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
                { mode: 'SELECT_ALTERNATIVE', label: 'Alternative', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                { mode: 'OVERRIDE_AI', label: 'Override', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
              ].map(tab => (
                <button
                  key={tab.mode}
                  onClick={() => {
                    setDecisionMode(tab.mode);
                    if (tab.mode === 'ACCEPT_AI') setSelectedOption(ai.recommendation?.option || '');
                    else if (tab.mode === 'SELECT_ALTERNATIVE') setSelectedOption(ai.alternatives?.[0]?.option || scores[1]?.name || '');
                    else setSelectedOption('');
                  }}
                  style={{
                    padding: '0.55rem 0.4rem', fontSize: '0.75rem', fontWeight: 700,
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                    border: `1px solid ${decisionMode === tab.mode ? tab.border : 'var(--border-subtle)'}`,
                    background: decisionMode === tab.mode ? tab.bg : 'var(--bg-secondary)',
                    color: decisionMode === tab.mode ? tab.color : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Accept — just confirm */}
            {decisionMode === 'ACCEPT_AI' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '0.85rem', fontSize: '0.875rem', color: '#166534' }}>
                Accept <strong>{ai.recommendation?.option}</strong> as the final decision based on the AI analysis.
              </div>
            )}

            {/* Alternative — option selector */}
            {decisionMode === 'SELECT_ALTERNATIVE' && (
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                  Select alternative:
                </label>
                <select
                  className="form-select"
                  value={selectedOption}
                  onChange={e => setSelectedOption(e.target.value)}
                >
                  {(result.parsedDecision?.options || [])
                    .filter(o => o.name !== ai.recommendation?.option)
                    .map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
                </select>
              </div>
            )}

            {/* Override — any option + required reason */}
            {decisionMode === 'OVERRIDE_AI' && (
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                  Select your choice:
                </label>
                <select
                  className="form-select"
                  value={selectedOption}
                  onChange={e => setSelectedOption(e.target.value)}
                  style={{ marginBottom: '0.6rem' }}
                >
                  <option value="">-- Select option --</option>
                  {(result.parsedDecision?.options || []).map(o => (
                    <option key={o.name} value={o.name}>
                      {o.name}{o.name === ai.recommendation?.option ? ' (AI Recommended)' : ''}
                    </option>
                  ))}
                </select>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                  Justification (required):
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Why are you overriding the AI recommendation?"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            )}

            <button
              onClick={handleFinalize}
              disabled={finalizing || !result.decisionId}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {finalizing ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</> :
                decisionMode === 'ACCEPT_AI' ? `Confirm: Accept ${ai.recommendation?.option}` :
                decisionMode === 'SELECT_ALTERNATIVE' ? `Confirm: Choose ${selectedOption || '…'}` :
                `Confirm: Override → ${selectedOption || '…'}`
              }
            </button>

            {!result.decisionId && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                Decision was not saved to database — finalization unavailable.
              </p>
            )}
          </>
        )}
      </div>

      {/* View full analysis link */}
      {result.decisionId && (
        <Link
          to={`/decisions/${result.decisionId}`}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <ExternalLink size={14} /> View Full Analysis Page
        </Link>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function DecisionChat() {
  const navigate = useNavigate();

  // Chat state
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm the Decision Intelligence Assistant.\n\nDescribe a decision you need to make — the options you're considering, what matters to you, and any scores or context you have. I'll analyze it using AI and show you a full recommendation with evidence, risks, and alternatives.\n\nYou always make the final call. AI recommends. Humans decide.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [currentDecisionId, setCurrentDecisionId] = useState(null);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    addMessage('user', text);

    setLoading(true);

    // Decide: is this a decision analysis request or a follow-up question?
    const isFollowUp = currentResult !== null && (
      text.length < 120 ||
      /^(why|what|how|can you|tell me|explain|compare|should i|which|is it|does|what if)/i.test(text.trim())
    );

    if (isFollowUp) {
      // ── Conversational follow-up ──
      setLoadingStage('Thinking…');
      try {
        const history = messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role, content: m.content }));

        const res = await chatAPI.sendMessage(text, currentDecisionId, history);
        if (res.success) {
          addMessage('assistant', res.reply);
        } else {
          addMessage('assistant', 'I had trouble answering that. Could you rephrase?');
        }
      } catch (e) {
        addMessage('assistant', 'Connection error. Please check the backend is running.');
      }
    } else {
      // ── Full decision analysis ──
      setLoadingStage('Parsing your decision…');
      try {
        setTimeout(() => setLoadingStage('Calculating scores…'), 2000);
        setTimeout(() => setLoadingStage('Asking Groq AI for analysis…'), 4000);
        setTimeout(() => setLoadingStage('Validating AI output…'), 8000);

        const res = await chatAPI.analyzeFromChat(text);

        if (!res.success) {
          setError(res.message || 'Analysis failed.');
          addMessage('assistant', `I couldn't complete the analysis: ${res.message || 'Unknown error.'}\n\n${res.hint || ''}`);
        } else {
          setCurrentResult(res);
          setCurrentDecisionId(res.decisionId);
          const top = res.calculatedScores?.[0];
          const conf = res.aiAnalysis?.confidence;
          addMessage('assistant',
            `Analysis complete for **${res.parsedDecision?.title}**.\n\n` +
            `📊 ${res.calculatedScores?.length} options scored.\n` +
            `🏆 Top recommendation: **${top?.name || top?.option}** (${top?.score}/100)\n` +
            `📈 Confidence: ${conf}% (${res.aiAnalysis?.confidenceCategory})\n\n` +
            `The full breakdown is shown below. You can ask me follow-up questions, or use the panel to record your final decision.`
          );
          addMessage('system', '↓ Decision analysis results ↓');
        }
      } catch (e) {
        const msg = e.response?.data?.message || e.message || 'Unknown error';
        setError(msg);
        addMessage('assistant', `Analysis failed: ${msg}\n\nMake sure the backend server is running on port 5000.`);
      }
    }

    setLoading(false);
    setLoadingStage('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExample = (ex) => {
    setInput(ex);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: `Hello! I'm the Decision Intelligence Assistant.\n\nDescribe a decision you need to make — the options you're considering, what matters to you, and any scores or context you have.`,
    }]);
    setCurrentResult(null);
    setCurrentDecisionId(null);
    setError(null);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 5rem)', gap: 0 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={17} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Decision Chat Assistant
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Describe your decision in plain language. AI analyses it. You decide.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-advisory">AI Advisory</span>
          <button onClick={handleReset} className="btn btn-sm btn-secondary">
            <RefreshCw size={13} /> New Chat
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT: Chat left, Results right ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: currentResult ? '1fr 420px' : '1fr',
        gap: '1.25rem',
        flex: 1,
        minHeight: 0,
        alignItems: 'start',
      }}>

        {/* ── LEFT: Chat panel ── */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          height: '100%', minHeight: '500px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>

          {/* Chat header */}
          <div style={{
            padding: '0.85rem 1.15rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'var(--bg-secondary)',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#16A34A', boxShadow: '0 0 0 2px #BBF7D0',
            }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Decision Intelligence Assistant
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Powered by Groq + n8n
            </span>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '1.15rem',
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
          }}>
            {messages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} />
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Loader2 size={15} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} />
                </div>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: '16px 16px 16px 4px', padding: '0.65rem 1rem',
                  fontSize: '0.875rem', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  {loadingStage || 'Processing…'}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Example prompts (shown only before first analysis) */}
          {!currentResult && messages.length <= 2 && (
            <div style={{
              padding: '0.85rem 1.15rem',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
                Try an example
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {EXAMPLES.slice(0, 2).map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleExample(ex)}
                    style={{
                      textAlign: 'left', background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                      padding: '0.55rem 0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)',
                      cursor: 'pointer', lineHeight: 1.4, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = '#16A34A'; e.target.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.color = 'var(--text-secondary)'; }}
                  >
                    <Lightbulb size={12} style={{ display: 'inline', marginRight: '5px', color: '#F59E0B' }} />
                    {ex.slice(0, 90)}…
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div style={{
            padding: '0.85rem 1.15rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex', gap: '0.6rem', alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              className="form-textarea"
              style={{
                flex: 1, minHeight: '48px', maxHeight: '120px',
                resize: 'none', fontSize: '0.9rem', lineHeight: 1.5,
                borderRadius: 'var(--radius-md)',
              }}
              placeholder={currentResult
                ? 'Ask a follow-up question about this decision…'
                : 'Describe your decision: options, criteria, context…'
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{ height: '48px', width: '48px', padding: 0, borderRadius: 'var(--radius-md)', flexShrink: 0 }}
            >
              {loading
                ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                : <Send size={18} />
              }
            </button>
          </div>
        </div>

        {/* ── RIGHT: Decision result panel ── */}
        {currentResult && (
          <div style={{
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 10rem)',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            <DecisionResultPanel
              result={currentResult}
              onViewFull={() => navigate(`/decisions/${currentResult.decisionId}`)}
            />
          </div>
        )}
      </div>

      {/* Advisory footer */}
      <div style={{
        marginTop: '0.85rem',
        padding: '0.6rem 1rem',
        background: 'var(--primary-very-light)',
        border: '1px solid var(--primary-light)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        fontSize: '0.78rem', color: 'var(--primary-dark)',
      }}>
        <Info size={13} />
        AI recommendations are advisory. Scores are calculated deterministically via the scoring engine, not invented by the AI.
        The final decision is always yours.
      </div>
    </div>
  );
}
