import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Bot, UserCheck, BarChart3,
  Sliders, Database, CheckCircle2, Brain, GitFork, TrendingUp
} from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function Landing() {
  const navigate = useNavigate();

  const handleLaunchDemo = async () => {
    try {
      const res = await decisionAPI.seedDemo();
      if (res.data?._id) navigate(`/decisions/${res.data._id}`);
      else navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  const steps = [
    { icon: <Brain size={18} />,     label: 'Define Decision',        color: '#16A34A' },
    { icon: <Sliders size={18} />,   label: 'Set Criteria & Weights', color: '#14B8A6' },
    { icon: <BarChart3 size={18} />, label: 'System Scores Options',  color: '#3B82F6' },
    { icon: <Bot size={18} />,       label: 'AI Explains Results',    color: '#7C3AED' },
    { icon: <UserCheck size={18} />, label: 'Human Decides',          color: '#16A34A' },
    { icon: <Database size={18} />,  label: 'Audit Trail Saved',      color: '#F59E0B' },
  ];

  const features = [
    {
      icon: <Bot size={22} />, bg: '#F0FDF4', iconColor: '#16A34A',
      title: 'Deterministic Scoring',
      desc: 'Weighted multi-criteria algorithm calculates objective scores before AI sees them. No hallucinated numbers.',
    },
    {
      icon: <UserCheck size={22} />, bg: '#D1FAE5', iconColor: '#059669',
      title: 'Human Final Authority',
      desc: 'Accept the AI recommendation, choose an alternative, or override entirely. The AI never makes the final call.',
    },
    {
      icon: <Sliders size={22} />, bg: '#FEF3C7', iconColor: '#D97706',
      title: 'What-If Simulator',
      desc: 'Adjust criteria weights and see rankings shift in real time — without touching the original decision.',
    },
    {
      icon: <GitFork size={22} />, bg: '#EDE9FE', iconColor: '#7C3AED',
      title: 'n8n + Groq AI',
      desc: 'Groq AI accessed through n8n workflow nodes. API key never exposed to the frontend.',
    },
    {
      icon: <TrendingUp size={22} />, bg: '#DBEAFE', iconColor: '#2563EB',
      title: 'Analytical Confidence',
      desc: 'Confidence calculated from data completeness, score separation, and criteria coverage.',
    },
    {
      icon: <Database size={22} />, bg: '#FEE2E2', iconColor: '#DC2626',
      title: 'Immutable Audit Trail',
      desc: 'Every AI recommendation and human decision stored separately in MongoDB with full timestamps.',
    },
  ];

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

        {/* Flow bar — informational only */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
          justifyContent: 'center', background: '#fff', padding: '0.65rem 1.5rem',
          borderRadius: '999px', border: '1px solid #D1FAE5',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontSize: '0.82rem',
          fontWeight: 600, color: '#475569', marginBottom: '2rem',
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

        {/* Two primary actions only */}
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
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Six clear steps from problem to auditable human decision</p>
        </div>
        <div style={{ display: 'flex', gap: '0', justifyContent: 'center', flexWrap: 'wrap' }}>
          {steps.map((step, idx) => (
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
                  <span style={{ display: 'block', fontSize: '0.65rem', color: '#94A3B8', marginBottom: '0.1rem' }}>Step {idx + 1}</span>
                  {step.label}
                </div>
              </div>
              {idx < steps.length - 1 && <ArrowRight size={16} color="#CBD5E1" style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.65rem', color: '#0F172A', marginBottom: '0.5rem' }}>Platform Features</h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Built for responsible AI decision-making</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1.25rem' }}>
          {features.map((f, idx) => (
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

      {/* ── DEMO SCENARIO ── */}
      <section>
        <div className="hitl-card" style={{
          background: 'linear-gradient(135deg, #F0FDF4 0%, #fff 100%)',
          border: '1px solid #BBF7D0', padding: '2.5rem',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <div className="badge badge-green" style={{ marginBottom: '1rem' }}>Live Demo Scenario</div>
              <h2 style={{ fontSize: '1.75rem', color: '#0F172A', marginBottom: '0.85rem' }}>
                Strategic Supplier Selection
              </h2>
              <p style={{ color: '#475569', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                A real-world enterprise procurement evaluation across Cost, Quality,
                Delivery, Reliability and Risk — demonstrating the full HITL workflow.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[
                  'Weighted deterministic scoring across 5 criteria',
                  'Groq AI explains trade-offs via n8n workflow',
                  'Human accepts, overrides, or picks alternative',
                  'Full audit trail stored in MongoDB',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                    <CheckCircle2 size={15} color="#16A34A" />
                    {item}
                  </div>
                ))}
              </div>
              {/* Single demo button */}
              <button onClick={handleLaunchDemo} className="btn btn-primary">
                Launch Demo <ArrowRight size={16} />
              </button>
            </div>

            {/* Static preview card */}
            <div className="hitl-card" style={{ border: '1px solid #D1FAE5' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Evaluation Preview
              </div>
              {[
                { name: 'Supplier A', score: 87.5, rank: 1 },
                { name: 'Supplier B', score: 84.4, rank: 2 },
                { name: 'Supplier C', score: 78.2, rank: 3 },
              ].map((s) => (
                <div key={s.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '0.5rem',
                  background: s.rank === 1 ? '#F0FDF4' : '#F8FAFC',
                  border: s.rank === 1 ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: s.rank === 1 ? '#16A34A' : '#CBD5E1',
                      color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{s.rank}</span>
                    <span style={{ fontWeight: s.rank === 1 ? 700 : 500, color: s.rank === 1 ? '#166534' : '#475569', fontSize: '0.9rem' }}>
                      {s.name}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.rank === 1 ? '#16A34A' : '#94A3B8', fontSize: '0.875rem' }}>
                    {s.score}
                  </span>
                </div>
              ))}
              <div style={{
                marginTop: '0.75rem', padding: '0.7rem', borderRadius: '8px',
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                fontSize: '0.78rem', color: '#1E40AF', lineHeight: 1.5,
              }}>
                <strong>Try it:</strong> Use the What-If Simulator to change weights and see Supplier B take the lead.
              </div>
            </div>
          </div>
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
