import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Bot, 
  UserCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Sliders, 
  Database,
  Workflow
} from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function Landing() {
  const navigate = useNavigate();

  const handleLaunchDemo = async () => {
    try {
      const res = await decisionAPI.seedDemo();
      if (res.data?._id) {
        navigate(`/decisions/${res.data._id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (e) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '3rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', maxWidth: '900px', margin: '2rem auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div className="badge badge-advisory" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.5rem' }}>
          <Sparkles size={14} color="#a5b4fc" />
          <span>Next-Generation Decision Support System</span>
        </div>

        <h1 style={{ fontSize: '3.4rem', lineHeight: 1.15, fontWeight: 800 }}>
          Human-in-the-Loop <br />
          <span className="gradient-text">Decision Intelligence</span>
        </h1>

        <p style={{ fontSize: '1.25rem', color: '#cbd5e1', maxWidth: '720px', lineHeight: 1.6 }}>
          AI-powered recommendations. <strong style={{ color: '#ffffff' }}>Human-controlled decisions.</strong>
          <br />
          Deterministic mathematics calculate rankings. Groq AI synthesizes evidence. You hold absolute final authority.
        </p>

        {/* Philosophy Flow Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#cbd5e1',
          margin: '0.5rem 0 1rem',
        }}>
          <span>AI Recommends</span>
          <ArrowRight size={14} color="#6366f1" />
          <span>AI Explains</span>
          <ArrowRight size={14} color="#6366f1" />
          <span style={{ color: '#38bdf8' }}>Human Evaluates</span>
          <ArrowRight size={14} color="#10b981" />
          <span style={{ color: '#34d399' }}>Human Decides</span>
          <ArrowRight size={14} color="#8b5cf6" />
          <span style={{ color: '#c084fc' }}>System Records</span>
        </div>

        {/* Action CTAs */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/create" className="btn btn-lg btn-primary">
            Create New Decision <ArrowRight size={18} />
          </Link>

          <button onClick={handleLaunchDemo} className="btn btn-lg btn-secondary">
            <Sparkles size={18} color="#a5b4fc" />
            Explore Supplier Demo
          </button>

          <Link to="/dashboard" className="btn btn-lg btn-secondary">
            View Analytics Dashboard
          </Link>
        </div>
      </section>

      {/* Interactive Architecture Pillars */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Bot size={22} color="#a5b4fc" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Deterministic Grounding</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            No hallucinations. All scores and rankings are calculated deterministically via weighted multi-criteria algorithms. The LLM only interprets empirical reality.
          </p>
        </div>

        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <UserCheck size={22} color="#34d399" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Mandatory Human Control</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            The AI recommendation is explicitly advisory. You can accept the AI recommendation, pick a validated alternative, or fully override it with an executive justification.
          </p>
        </div>

        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Sliders size={22} color="#fbbf24" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>What-If Simulation</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Test hypothetical trade-offs by shifting criteria weights in real time. Observe instant rank changes without contaminating the baseline decision record.
          </p>
        </div>

        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Workflow size={22} color="#c084fc" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>n8n + Groq Automation</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Orchestrated through modular n8n workflow nodes connecting high-speed Groq LPU inference for instant natural language trade-off analysis.
          </p>
        </div>

        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <ShieldCheck size={22} color="#38bdf8" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Analytical Confidence</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Confidence is calculated from mathematical completeness, score separation, and criteria coverage. Clearly communicated as an analytical indicator, never a guarantee.
          </p>
        </div>

        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Database size={22} color="#f87171" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Immutable Audit Trail</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Every interaction preserves both what the AI recommended and what the human chose. Overrides require justification notes stored in MongoDB.
          </p>
        </div>
      </section>

      {/* Demo Scenario Highlight */}
      <section className="hitl-card" style={{
        background: 'linear-gradient(135deg, rgba(19, 27, 46, 0.9) 0%, rgba(30, 41, 69, 0.7) 100%)',
        border: '1px solid var(--border-accent)',
        padding: '2.5rem',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '0.75rem' }}>
              Canonical Hackathon Benchmark
            </span>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              Strategic Supplier Selection
            </h2>
            <p style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Demonstrates a real-world enterprise procurement trade-off between <strong>Supplier A</strong> (superior quality & reliability at higher cost) and <strong>Supplier B</strong> (lower cost & rapid delivery).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#e2e8f0' }}>
                <CheckCircle2 size={16} color="#10b981" /> Weighted multi-criteria scoring across 5 key dimensions
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#e2e8f0' }}>
                <CheckCircle2 size={16} color="#10b981" /> Groq AI highlights trade-offs and operational risks
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#e2e8f0' }}>
                <CheckCircle2 size={16} color="#10b981" /> Human evaluates and makes the definitive call
              </div>
            </div>
            <button onClick={handleLaunchDemo} className="btn btn-primary">
              Launch Benchmark Scenario <ArrowRight size={16} />
            </button>
          </div>

          <div style={{
            background: 'rgba(8, 12, 21, 0.8)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Simulated Evaluation Preview
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Supplier A</span>
              <span style={{ color: '#a5b4fc', fontWeight: 700 }}>87.5 / 100 (Rank #1)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Supplier B</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>84.4 / 100 (Runner-up)</span>
            </div>
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              fontSize: '0.825rem',
              color: '#c7d2fe',
            }}>
              <strong>Human Override Test:</strong> Switch weights in What-If Simulator to cost priority → Supplier B takes the lead → Human commits override with justification!
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
