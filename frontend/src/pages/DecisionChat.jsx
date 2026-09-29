import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Send, Bot, UserCheck, Sparkles, ArrowRight,
  CheckCircle2, AlertTriangle, BarChart3,
  RefreshCw, ExternalLink, Info, ChevronDown, ChevronUp,
  Loader2, Paperclip, Globe, PlusCircle, Zap
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { chatAPI, decisionAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ── Example cards matching the screenshot ─────────────────────
const EXAMPLES = [
  {
    icon: '💻',
    title: 'Compare laptops for AI/ML development',
    desc: 'Find the best laptop based on performance, price, battery life and more.',
    color: '#E0F2FE',
    iconBg: '#BFDBFE',
  },
  {
    icon: '☁️',
    title: 'Choose the best cloud provider',
    desc: 'Compare AWS, Azure, GCP based on cost, performance, security and scalability.',
    color: '#F0FDF4',
    iconBg: '#BBF7D0',
  },
  {
    icon: '🤝',
    title: 'Compare suppliers',
    desc: 'Evaluate suppliers based on cost, quality, delivery time and reliability.',
    color: '#FFF7ED',
    iconBg: '#FED7AA',
  },
  {
    icon: '</>',
    title: 'Evaluate project technology options',
    desc: 'Compare different technology stacks for a new project.',
    color: '#FAF5FF',
    iconBg: '#E9D5FF',
  },
];

// ── 5-step workflow cards ──────────────────────────────────────
const WORKFLOW_STEPS = [
  {
    icon: <Bot size={18} />,
    title: 'AI Suggests',
    step: 1,
    desc: 'I analyze your request and suggest options, criteria and evidence.',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
  },
  {
    icon: <UserCheck size={18} />,
    title: 'You Review',
    step: 2,
    desc: 'You check, edit or add based on your requirements.',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
  },
  {
    icon: <Zap size={18} />,
    title: 'System Calculates',
    step: 3,
    desc: 'Scores are calculated deterministically using your criteria and weights.',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    icon: <Sparkles size={18} />,
    title: 'AI Explains',
    step: 4,
    desc: 'I explain the results, trade-offs, risks and key insights.',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
  },
  {
    icon: <CheckCircle2 size={18} />,
    title: 'You Decide',
    step: 5,
    desc: 'You make the final decision. AI advises. You control the outcome.',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    highlight: true,
  },
];

// ── Robot SVG illustration ──────────────────────────────────────
function RobotIllustration() {
  return (
    <div style={{
      width: '110px', height: '110px', flexShrink: 0,
      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2px solid #BBF7D0',
    }}>
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        {/* Body */}
        <rect x="12" y="22" width="36" height="28" rx="8" fill="#16A34A" opacity="0.15" stroke="#16A34A" strokeWidth="1.5" />
        {/* Head */}
        <rect x="16" y="8" width="28" height="20" rx="6" fill="#16A34A" opacity="0.2" stroke="#16A34A" strokeWidth="1.5" />
        {/* Eyes */}
        <circle cx="23" cy="17" r="3.5" fill="#16A34A" />
        <circle cx="37" cy="17" r="3.5" fill="#16A34A" />
        <circle cx="24" cy="16" r="1.2" fill="white" />
        <circle cx="38" cy="16" r="1.2" fill="white" />
        {/* Mouth */}
        <path d="M24 23 Q30 27 36 23" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Antenna */}
        <line x1="30" y1="8" x2="30" y2="3" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="30" cy="2.5" r="2" fill="#16A34A" />
        {/* Arms */}
        <rect x="4" y="26" width="8" height="16" rx="4" fill="#16A34A" opacity="0.3" stroke="#16A34A" strokeWidth="1" />
        <rect x="48" y="26" width="8" height="16" rx="4" fill="#16A34A" opacity="0.3" stroke="#16A34A" strokeWidth="1" />
        {/* Chest icons */}
        <rect x="22" y="30" width="16" height="10" rx="3" fill="#16A34A" opacity="0.25" />
        <line x1="26" y1="35" x2="34" y2="35" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ── Browser/chart illustration on right side of hero ───────────
function BrowserIllustration() {
  return (
    <div style={{
      width: '160px', height: '110px', flexShrink: 0,
      background: '#fff', borderRadius: '12px',
      border: '1.5px solid #E2E8F0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Browser chrome */}
      <div style={{ background: '#F8FAFC', padding: '6px 8px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '4px', alignItems: 'center' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FCA5A5' }} />
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FCD34D' }} />
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6EE7B7' }} />
      </div>
      {/* Content */}
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {[85, 65, 45].map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '0.55rem', color: '#94A3B8', width: '24px' }}>Opt {i + 1}</div>
            <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${w}%`, height: '100%', background: i === 0 ? '#16A34A' : '#86EFAC', borderRadius: '3px' }} />
            </div>
            <div style={{ fontSize: '0.55rem', color: '#16A34A', fontWeight: 700 }}>{w}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Score bar chart ────────────────────────────────────────────
function ScoreBarChart({ scores }) {
  if (!scores || scores.length === 0) return null;
  const sorted = [...scores].sort((a, b) => (a.rank || 0) - (b.rank || 0));

  const data = {
    labels: sorted.map(s => s.name || s.option),
    datasets: [{
      label: 'Weighted Score',
      data: sorted.map(s => s.score || s.weightedScore || 0),
      backgroundColor: sorted.map((_, i) => i === 0 ? 'rgba(22,163,74,0.85)' : 'rgba(22,163,74,0.35)'),
      borderColor: sorted.map((_, i) => i === 0 ? '#16A34A' : '#86EFAC'),
      borderWidth: 2,
      borderRadius: 8,
    }],
  };

  return (
    <div style={{ height: '180px', position: 'relative' }}>
      <Bar data={data} options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0F172A', titleColor: '#fff', bodyColor: '#94A3B8' } },
        scales: {
          y: { min: 0, max: 100, ticks: { color: '#94A3B8' }, grid: { color: '#F1F5F9' } },
          x: { ticks: { color: '#0F172A', font: { weight: '600' } }, grid: { display: false } },
        },
      }} />
    </div>
  );
}

// ── Decision result panel ─────────────────────────────────────
function DecisionResultPanel({ result, onFinalize }) {
  const [showMore, setShowMore] = useState(false);
  const [mode, setMode] = useState('ACCEPT_AI');
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
    if (mode === 'OVERRIDE_AI' && reason.trim().length < 5) { alert('Enter a justification reason.'); return; }
    const option = mode === 'ACCEPT_AI' ? ai.recommendation.option : selectedOption;
    if (!option) { alert('Select an option.'); return; }
    try {
      setFinalizing(true);
      await decisionAPI.finalizeDecision(result.decisionId, {
        option, type: mode,
        reason: reason || (mode === 'ACCEPT_AI' ? 'Accepted AI recommendation.' : 'Alternative selected.'),
      });
      setFinalized({ option, type: mode });
    } catch (e) { alert(e.response?.data?.message || 'Failed to save.'); }
    finally { setFinalizing(false); }
  };

  if (!ai) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Header */}
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '1rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
          Analysis Complete
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{result.parsedDecision?.title || 'Decision'}</div>
        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem' }}>{scores.length} options · {result.parsedDecision?.criteria?.length} criteria</div>
      </div>

      {/* Scores */}
      <div className="hitl-card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Scores</div>
        <ScoreBarChart scores={scores} />
      </div>

      {/* Recommendation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Recommended</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534' }}>{ai.recommendation?.option}</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#16A34A', fontSize: '0.85rem' }}>{ai.recommendation?.score}/100</div>
          <span style={{ fontSize: '0.6rem', background: '#DBEAFE', color: '#1E40AF', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 700 }}>Advisory Only</span>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Confidence</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: confColor }}>{conf}%</div>
          <div style={{ fontSize: '0.75rem', color: confColor, fontWeight: 600 }}>{ai.confidenceCategory?.replace(' Confidence', '') || 'Medium'}</div>
          <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '999px', marginTop: '0.4rem' }}>
            <div style={{ width: `${conf}%`, height: '100%', background: confColor, borderRadius: '999px' }} />
          </div>
        </div>
      </div>

      {/* Summary */}
      {ai.summary && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem', fontSize: '0.825rem', color: '#475569', lineHeight: 1.6 }}>
          {ai.summary}
        </div>
      )}

      {/* Show more */}
      {(ai.evidence?.length > 0 || ai.risks?.length > 0) && (
        <button onClick={() => setShowMore(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#16A34A', fontWeight: 600 }}>
          {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showMore ? 'Hide details' : 'Show evidence & risks'}
        </button>
      )}

      {showMore && (
        <>
          {ai.evidence?.slice(0, 4).map((e, i) => (
            <div key={i} style={{
              padding: '0.65rem 0.85rem', borderRadius: '8px',
              borderLeft: `3px solid ${e.impact === 'positive' ? '#16A34A' : '#F59E0B'}`,
              background: e.impact === 'positive' ? '#F0FDF4' : '#FFFBEB',
              fontSize: '0.8rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{e.factor || e.criterion}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: e.impact === 'positive' ? '#16A34A' : '#D97706' }}>{e.value}/100</span>
              </div>
              <p style={{ color: '#475569', lineHeight: 1.4, margin: 0 }}>{e.explanation}</p>
            </div>
          ))}
        </>
      )}

      {/* Human decision */}
      {finalized ? (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ fontWeight: 700, color: '#166534', marginBottom: '0.25rem' }}>✓ Human Decision Recorded</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>{finalized.option}</div>
          {result.decisionId && (
            <Link to={`/decisions/${result.decisionId}`} style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', textDecoration: 'none' }}>
              View full analysis <ExternalLink size={11} />
            </Link>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '2px solid #DCFCE7', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Your Decision</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginBottom: '0.85rem' }}>
            {[['ACCEPT_AI', 'Accept AI', '#D1FAE5', '#16A34A'], ['SELECT_ALTERNATIVE', 'Alternative', '#DBEAFE', '#2563EB'], ['OVERRIDE_AI', 'Override', '#FEF3C7', '#D97706']].map(([m, label, bg, color]) => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '0.5rem', fontSize: '0.72rem', fontWeight: 700,
                border: `1px solid ${mode === m ? color : '#E2E8F0'}`,
                borderRadius: '8px', cursor: 'pointer',
                background: mode === m ? bg : '#F8FAFC',
                color: mode === m ? color : '#64748B',
              }}>{label}</button>
            ))}
          </div>
          {mode !== 'ACCEPT_AI' && (
            <select className="form-select" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }} value={selectedOption} onChange={e => setSelectedOption(e.target.value)}>
              <option value="">-- Select option --</option>
              {(result.parsedDecision?.options || []).filter(o => mode === 'OVERRIDE_AI' || o.name !== ai.recommendation?.option).map(o => (
                <option key={o.name} value={o.name}>{o.name}</option>
              ))}
            </select>
          )}
          {mode === 'OVERRIDE_AI' && (
            <textarea className="form-textarea" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Justification required…" style={{ marginBottom: '0.5rem', fontSize: '0.82rem' }} />
          )}
          <button onClick={handleFinalize} disabled={finalizing || !result.decisionId} className="btn btn-primary" style={{ width: '100%', fontSize: '0.82rem' }}>
            {finalizing ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : `Confirm: ${mode === 'ACCEPT_AI' ? ai.recommendation?.option : selectedOption || '…'}`}
          </button>
          {!result.decisionId && <p style={{ fontSize: '0.7rem', color: '#94A3B8', textAlign: 'center', marginTop: '0.35rem' }}>Not saved to DB — finalization unavailable.</p>}
        </div>
      )}

      {result.decisionId && (
        <Link to={`/decisions/${result.decisionId}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}>
          <ExternalLink size={13} /> Open Full Analysis Page
        </Link>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function DecisionChat() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [currentDecisionId, setCurrentDecisionId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const showingWelcome = messages.length === 0 && !currentResult;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const addMessage = (role, content) => setMessages(prev => [...prev, { role, content }]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    addMessage('user', text);
    setLoading(true);

    const isFollowUp = currentResult !== null && (
      text.length < 120 ||
      /^(why|what|how|can you|tell me|explain|compare|should|which|is it)/i.test(text)
    );

    if (isFollowUp) {
      setLoadingStage('Thinking…');
      try {
        const history = messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content }));
        const res = await chatAPI.sendMessage(text, currentDecisionId, history);
        addMessage('assistant', res.success ? res.reply : 'I had trouble answering that. Could you rephrase?');
      } catch { addMessage('assistant', 'Connection error. Please check the backend.'); }
    } else {
      setLoadingStage('Parsing your decision…');
      try {
        setTimeout(() => setLoadingStage('Calculating deterministic scores…'), 2500);
        setTimeout(() => setLoadingStage('Running Groq AI analysis…'), 5000);
        setTimeout(() => setLoadingStage('Validating AI output…'), 9000);

        const res = await chatAPI.analyzeFromChat(text);
        if (!res.success) {
          addMessage('assistant', `Analysis failed: ${res.message || 'Unknown error.'}\n\n${res.hint || ''}`);
        } else {
          setCurrentResult(res);
          setCurrentDecisionId(res.decisionId);
          const top = res.calculatedScores?.[0];
          addMessage('assistant',
            `Analysis complete for **${res.parsedDecision?.title}**.\n\n` +
            `🏆 Top recommendation: **${top?.name || top?.option}** (${top?.score}/100)\n` +
            `📈 Confidence: ${res.aiAnalysis?.confidence}% (${res.aiAnalysis?.confidenceCategory})\n\n` +
            `The breakdown is on the right. Ask me follow-up questions, or use the panel to record your final decision.`
          );
          addMessage('system', '↓ Full analysis shown on the right ↓');
        }
      } catch (e) {
        addMessage('assistant', `Analysis failed: ${e.response?.data?.message || e.message}`);
      }
    }

    setLoading(false);
    setLoadingStage('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleExample = (ex) => {
    setInput(ex.desc + ' ' + ex.title);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setMessages([]); setCurrentResult(null); setCurrentDecisionId(null); setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── TOP BAR ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.9rem 1.75rem',
        background: '#fff',
        borderBottom: '1px solid #E2E8F0',
        flexShrink: 0,
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={18} color="#16A34A" />
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Decision Intelligence Copilot
            </h1>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.1rem', marginLeft: '1.65rem' }}>
            Describe your decision. AI structures the problem, evaluates evidence, and explains the trade-offs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* AI Advisory badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 0.85rem', borderRadius: '999px',
            border: '1px solid #BFDBFE', background: '#EFF6FF',
            fontSize: '0.72rem', fontWeight: 700, color: '#2563EB',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3B82F6' }} />
            AI ADVISORY
          </div>

          {/* New Decision button */}
          <Link to="/create" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
            <PlusCircle size={14} /> New Decision
          </Link>

          {/* User avatar */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: '#166534', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
          }}>
            JK
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT: Chat + Welcome area ── */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          flex: 1, overflow: 'hidden',
          background: '#FAFAFA',
        }}>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>

            {/* WELCOME SCREEN */}
            {showingWelcome && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Hero card */}
                <div style={{
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 60%, #ECFDF5 100%)',
                  border: '1px solid #BBF7D0',
                  borderRadius: '16px',
                  padding: '1.75rem 2rem',
                  display: 'flex', alignItems: 'center', gap: '1.75rem',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Decorative leaf */}
                  <div style={{ position: 'absolute', top: '-30px', right: '200px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(22,163,74,0.07)', pointerEvents: 'none' }} />

                  <RobotIllustration />

                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', lineHeight: 1.2 }}>
                      How can I help you <span style={{ color: '#16A34A' }}>make a decision?</span>
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, maxWidth: '440px' }}>
                      Describe the decision you're facing in plain language.
                      I'll help structure the options, criteria, evidence and trade-offs.
                    </p>
                  </div>

                  {/* Right: AI advisory note */}
                  <div style={{
                    background: '#fff', border: '2px solid #16A34A',
                    borderRadius: '12px', padding: '0.85rem 1rem',
                    minWidth: '160px', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', gap: '0.4rem',
                    alignItems: 'center', textAlign: 'center',
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CheckCircle2 size={16} color="#fff" />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                      AI Recommendations are advisory.
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 600 }}>
                      You make the final decision.
                    </div>
                  </div>
                </div>

                {/* 5-step workflow */}
                <div style={{
                  background: '#fff', borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  padding: '1.25rem 1.5rem',
                }}>
                  <div style={{ display: 'flex', gap: '0', alignItems: 'stretch', flexWrap: 'wrap' }}>
                    {WORKFLOW_STEPS.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <div style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem',
                          flex: 1, minWidth: '110px', padding: '0.65rem 0.75rem',
                          background: step.highlight ? '#F0FDF4' : 'transparent',
                          borderRadius: step.highlight ? '10px' : 0,
                          border: step.highlight ? '1px solid #BBF7D0' : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '8px',
                              background: step.iconBg, color: step.iconColor,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {step.icon}
                            </div>
                            <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>{idx + 1}</span>
                          </div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{step.title}</div>
                          <div style={{ fontSize: '0.73rem', color: '#64748B', lineHeight: 1.45 }}>{step.desc}</div>
                        </div>
                        {idx < WORKFLOW_STEPS.length - 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.15rem' }}>
                            <ArrowRight size={14} color="#CBD5E1" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Example cards */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: '#F59E0B' }}>★</span> Start with an example
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#64748B' }}>Click on an example to try it. You can also type your own decision.</p>
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      View more examples <ArrowRight size={12} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
                    {EXAMPLES.map((ex, i) => (
                      <button key={i} onClick={() => handleExample(ex)} style={{
                        background: ex.color, border: '1px solid #E2E8F0',
                        borderRadius: '12px', padding: '1rem',
                        textAlign: 'left', cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        display: 'flex', flexDirection: 'column', gap: '0.5rem',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: ex.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                          {ex.icon}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A', lineHeight: 1.35 }}>{ex.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.45 }}>{ex.desc}</div>
                        <div style={{ alignSelf: 'flex-end', marginTop: 'auto' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowRight size={12} color="#64748B" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CHAT MESSAGES */}
            {messages.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.map((msg, i) => {
                  if (msg.role === 'system') {
                    return (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', background: '#F1F5F9', padding: '0.2rem 0.85rem', borderRadius: '999px', border: '1px solid #E2E8F0' }}>
                          {msg.content}
                        </span>
                      </div>
                    );
                  }
                  const isUser = msg.role === 'user';
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: '0.5rem', alignItems: 'flex-end' }}>
                      {!isUser && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#16A34A,#15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Bot size={14} color="#fff" />
                        </div>
                      )}
                      <div style={{
                        maxWidth: '72%', padding: '0.7rem 1rem',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isUser ? 'linear-gradient(135deg,#16A34A,#15803D)' : '#fff',
                        color: isUser ? '#fff' : '#0F172A',
                        border: isUser ? 'none' : '1px solid #E2E8F0',
                        fontSize: '0.875rem', lineHeight: 1.6,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {msg.content}
                      </div>
                      {isUser && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#166534', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                          JK
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#16A34A,#15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 size={14} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} />
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px 16px 16px 4px', padding: '0.6rem 0.9rem', fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="spinner" style={{ width: '13px', height: '13px', borderWidth: '2px' }} />
                      {loadingStage || 'Processing…'}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* ── INPUT AREA ── */}
          <div style={{
            flexShrink: 0, padding: '1rem 1.75rem 1.25rem',
            background: '#fff',
            borderTop: '1px solid #E2E8F0',
          }}>
            <div style={{
              border: '1.5px solid #E2E8F0', borderRadius: '14px',
              background: '#fff', overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'border-color 0.18s, box-shadow 0.18s',
            }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)'; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
            >
              <textarea
                ref={inputRef}
                style={{
                  width: '100%', minHeight: '72px', maxHeight: '160px', resize: 'none',
                  border: 'none', outline: 'none', padding: '1rem 1rem 0',
                  fontFamily: 'var(--font-main)', fontSize: '0.9rem',
                  color: '#0F172A', background: 'transparent',
                  lineHeight: 1.6,
                }}
                placeholder="Describe your decision, options, criteria, constraints or context…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                disabled={loading}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem 0.65rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { icon: <Paperclip size={14} />, label: 'Attach Files' },
                    { icon: <Globe size={14} />, label: 'Web Search' },
                  ].map(btn => (
                    <button key={btn.label} style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.3rem 0.7rem', border: '1px solid #E2E8F0',
                      borderRadius: '8px', background: '#F8FAFC',
                      cursor: 'pointer', fontSize: '0.75rem', color: '#64748B',
                      fontWeight: 500,
                    }}>
                      {btn.icon} {btn.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{input.length}/2000</span>
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: input.trim() ? '#16A34A' : '#E2E8F0',
                      border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                  >
                    <Send size={16} color={input.trim() ? '#fff' : '#94A3B8'} />
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.65rem', fontSize: '0.72rem', color: '#64748B' }}>
              <Info size={12} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>AI recommendations are advisory. Scores are calculated deterministically via the scoring engine, not invented by the AI. The final decision is always yours.</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Decision result panel ── */}
        {currentResult && (
          <div style={{
            width: '360px', flexShrink: 0,
            borderLeft: '1px solid #E2E8F0',
            background: '#fff',
            overflowY: 'auto',
            padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>Analysis Results</h3>
              <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <RefreshCw size={11} /> New
              </button>
            </div>
            <DecisionResultPanel result={currentResult} />
          </div>
        )}
      </div>
    </div>
  );
}
