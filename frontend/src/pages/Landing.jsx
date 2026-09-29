import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Bot, UserCheck, BarChart3,
  Sliders, Database, Brain, GitFork, TrendingUp, MessageSquare
} from 'lucide-react';

const STEPS = [
  { icon: <Brain size={18} />,     label: 'Define Your Decision', color: '#16A34A' },
  { icon: <Sliders size={18} />,   label: 'Set Criteria & Weights', color: '#14B8A6' },
  { icon: <BarChart3 size={18} />, label: 'System Scores Options', color: '#3B82F6' },
  { icon: <Bot size={18} />,       label: 'AI Explains Results', color: '#7C3AED' },
  { icon: <UserCheck size={18} />, label: 'Human Decides', color: '#16A34A' },
  { icon: <Database size={18} />,  label: 'Audit Trail Saved', color: '#F59E0B' },
];

const FEATURES = [
  {
    icon: <Bot size={22} />, bg: '#F0FDF4', iconColor: '#16A34A',
    title: 'Deterministic Scoring',
    desc: 'Weighted multi-criteria algorithm calculates objective scores before AI sees them. No hallucinated numbers — ever.',
  },
  {
    icon: <UserCheck size={22} />, bg: '#D1FAE5', iconColor: '#059669',
    title: 'Human Final Authority',
    desc: 'Accept the AI recommendation, choose an alternative, or override entirely. The AI never makes the final call.',
  },
  {
    icon: <Sliders size={22} />, bg: '#FEF3C7', iconColor: '#D97706',
    title: 'What-If Simulator',
    desc: 'Adjust criteria weights and see rankings shift in real time — without touching the original decision record.',
  },
  {
    icon: <MessageSquare size={22} />, bg: '#EDE9FE', iconColor: '#7C3AED',
    title: 'Chat Assistant',
    desc: 'Describe your decision in plain language. The assistant parses it, scores it, and returns full AI analysis.',
  },
  {
    icon: <TrendingUp size={22} />, bg: '#DBEAFE', iconColor: '#2563EB',
    title: 'Analytical Confidence',
    desc: 'Confidence calculated from data completeness, score separation, and criteria coverage — not LLM guesswork.',
  },
  {
    icon: <Database size={22} />, bg: '#FEE2E2', iconColor: '#DC2626',
    title: 'Immutable Audit Trail',
    desc: 'Every AI recommendation and human decision stored separately in MongoDB with full timestamps and justifications.',
  },
];

export default function Landing() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', paddingBottom: '3rem' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #ECFDF5 100%)',
        border: '1px solid #BBF7D0',
        borderRadius: '20px',
        padding: '3.5rem 3rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(22,163,74,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(22,163,74,0.04)', pointerEvents: 'none' }} />

        <div className="badge badge-green" style={{ marginBottom: '1.25rem' }}>
          <ShieldCheck size={13} /> Human-in-the-Loop AI Platform
        </div>

        <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 800, color: '#0F172A', marginBottom: '1rem', lineHeight: 1.15 }}>
          Human-in-the-Loop<br />
          <span className="gradient-text">Decision Intelligence</span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#475569', maxWidth: '640px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
          AI-powered recommendations with transparent evidence, confidence, and alternatives —
          while keeping the <strong style={{ color: '#166534' }}>final decision in human hands</strong>.
        </p>

        {/* Flow indicator */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          flexWrap: 'wrap', justifyContent: 'center',
          background: '#fff', padding: '0.65rem 1.5rem',
          borderRadius: '999px', border: '1px solid #D1FAE5',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          fontSize: '0.82rem', fontWeight: 600, color: '#475569',
          marginBottom: '2rem',
        }}>
          <span>AI Recommends</span>
          <ArrowRight size={13} color="#16A34A" />
          <span>AI Explains</span>
          <ArrowRight size={13} color="#16A34A" />
          <span style={{ color: '#14B8A6' }}>Human Evaluates</span>
          <ArrowRight size={13} color="#16A34A" />
          <span style={{ color: '#16A34A', fontWeight: 700 }}>Human Decides</span>
          <ArrowRight size={13} color="#F59E0B" />
          <span style={{ color: '#D97706' }}>System Records</span>
        </div>

        {/* Two actions only — no demo */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/create" className="btn btn-lg btn-primary">
            <Brain size={18} /> Create a Decision
          </Link>
          <Link to="/dashboard" className="btn btn-lg btn-secondary">
            <BarChart3 size={18} /> View Dashboard
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.65rem', color: '#0F172A', marginBottom: '0.5rem' }}>How It Works</h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Six steps from problem to auditable human decision</p>
        </div>
        <div style={{ display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap' }}>
          {STEPS.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.25rem 1rem', minWidth: '100px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: step.color + '18', border: `1px solid ${step.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.color,
                }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', textAlign: 'center', lineHeight: 1.4 }}>
                  <span style={{ display: 'block', fontSize: '0.62rem', color: '#94A3B8', marginBottom: '0.1rem' }}>Step {idx + 1}</span>
                  {step.label}
                </div>
              </div>
              {idx < STEPS.length - 1 && <ArrowRight size={16} color="#CBD5E1" style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.65rem', color: '#0F172A', marginBottom: '0.5rem' }}>Platform Features</h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Built for responsible, explainable AI decision-making</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1.25rem' }}>
          {FEATURES.map((f, idx) => (
            <div key={idx} className="hitl-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: f.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: f.iconColor,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#0F172A' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TWO WAYS TO START ── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Create Decision */}
        <div className="hitl-card" style={{
          background: 'linear-gradient(135deg, #F0FDF4 0%, #fff 100%)',
          border: '1px solid #BBF7D0', padding: '2rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={24} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#0F172A', marginBottom: '0.5rem' }}>Create a Decision</h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Define your options, evaluation criteria and weights using the step-by-step form.
              The system calculates objective scores and runs AI analysis automatically.
            </p>
          </div>
          <Link to="/create" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Get Started <ArrowRight size={16} />
          </Link>
        </div>

        {/* Chat Assistant */}
        <div className="hitl-card" style={{
          background: 'linear-gradient(135deg, #F3E8FF 0%, #fff 100%)',
          border: '1px solid #DDD6FE', padding: '2rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageSquare size={24} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#0F172A', marginBottom: '0.5rem' }}>Chat Assistant</h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Describe your decision in plain language. The AI assistant extracts options and criteria,
              scores them, and returns a full analysis — all in one conversation.
            </p>
          </div>
          <Link to="/chat" className="btn" style={{
            alignSelf: 'flex-start', background: '#7C3AED', color: '#fff',
            boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
          }}>
            Open Chat <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── PHILOSOPHY BANNER ── */}
      <section style={{
        background: 'var(--bg-sidebar)', borderRadius: '16px',
        padding: '2.5rem', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '1.75rem', color: '#fff', marginBottom: '0.75rem' }}>
          AI recommends. <span style={{ color: '#86EFAC' }}>Humans decide.</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.65, fontSize: '0.95rem' }}>
          Every recommendation is explained, challenged, and ultimately owned by a human.
          No AI output is ever automatically saved as the final decision.
        </p>
      </section>

    </div>
  );
}
