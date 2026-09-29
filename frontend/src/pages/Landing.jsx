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
        <div className="badge badge-green" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.5rem' }}>
          <Sparkles size={14} color="#16A34A" />
          <span>Next-Generation Decision Support System</span>
        </div>

        <h1 style={{ fontSize: '3.4rem', lineHeight: 1.15, fontWeight: 800, color: 'var(--text-primary)' }}>
          Human-in-the-Loop <br />
          <span className="gradient-text">Decision Intelligence</span>
        </h1>

        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '720px', lineHeight: 1.6 }}>
          AI-powered recommendations. <strong style={{ color: 'var(--primary-dark)' }}>Human-controlled decisions.</strong>
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
          background: 'var(--bg-card)',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-light)',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          margin: '0.5rem 0 1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span>AI Recommends</span>
          <ArrowRight size={14} color="#16A34A" />
          <span>AI Explains</span>
          <ArrowRight size={14} color="#16A34A" />
          <span style={{ color: '#14B8A6' }}>Human Evaluates</span>
          <ArrowRight size={14} color="#10b981" />
          <span style={{ color: '#10B981' }}>Human Decides</span>
          <ArrowRight size={14} color="#7C3AED" />
          <span style={{ color: '#7C3AED' }}>System Records</span>
        </div>

        {/* Action CTAs */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/create" className="btn btn-lg btn-primary">
            Create New Decision <ArrowRight size={18} />
          </Link>

          <button onClick={handleLaunchDemo} className="btn btn-lg btn-secondary">
            <Sparkles size={18} color="#16A34A" />
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
            background: 'var(--primary-very-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Bot size={22} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Deterministic Grounding</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            No hallucinations. All scores and rankings are calculated deterministically via weighted multi-criteria algorithms. The LLM only interprets empirical reality.
          </p>
        </div>

        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#D1FAE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <UserCheck size={22} color="#10B981" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Mandatory Human Control</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            The AI recommendation is explicitly advisory. You can accept the AI recommendation, pick a validated alternative, or fully override it with an executive justification.
          </p>
        </div>

        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#FEF3C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Sliders size={22} color="#F59E0B" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>What-If Simulation</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Test hypothetical trade-offs by shifting criteria weights in real time. Observe instant rank changes without contaminating the baseline decision record.
          </p>
        </div>

        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#F3E8FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Workflow size={22} color="#7C3AED" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>n8n + Groq Automation</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Orchestrated through modular n8n workflow nodes connecting high-speed Groq LPU inference for instant natural language trade-off analysis.
          </p>
        </div>

        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#E0F2FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <ShieldCheck size={22} color="#0EA5E9" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Analytical Confidence</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Confidence is calculated from mathematical completeness, score separation, and criteria coverage. Clearly communicated as an analytical indicator, never a guarantee.
          </p>
        </div>

        <div className="hitl-card">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Database size={22} color="#EF4444" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Immutable Audit Trail</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Every interaction preserves both what the AI recommended and what the human chose. Overrides require justification notes stored in MongoDB.
          </p>
        </div>
      </section>

      {/* Demo Scenario Highlight */}
      <section className="hitl-card" style={{
        background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.8) 0%, rgba(220, 252, 231, 0.6) 100%)',
        border: '1px solid var(--primary-light)',
        padding: '2.5rem',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '0.75rem' }}>
              Canonical Hackathon Benchmark
            </span>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Strategic Supplier Selection
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Demonstrates a real-world enterprise procurement trade-off between <strong style={{ color: 'var(--text-primary)' }}>Supplier A</strong> (superior quality & reliability at higher cost) and <strong style={{ color: 'var(--text-primary)' }}>Supplier B</strong> (lower cost & rapid delivery).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={16} color="#10b981" /> Weighted multi-criteria scoring across 5 key dimensions
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={16} color="#10b981" /> Groq AI highlights trade-offs and operational risks
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={16} color="#10b981" /> Human evaluates and makes the definitive call
              </div>
            </div>
            <button onClick={handleLaunchDemo} className="btn btn-primary">
              Launch Benchmark Scenario <ArrowRight size={16} />
            </button>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Simulated Evaluation Preview
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Supplier A</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>87.5 / 100 (Rank #1)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Supplier B</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>84.4 / 100 (Runner-up)</span>
            </div>
            <div style={{
              background: '#E0F2FE',
              border: '1px solid #7DD3FC',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              fontSize: '0.825rem',
              color: '#0C4A6E',
            }}>
              <strong>Human Override Test:</strong> Switch weights in What-If Simulator to cost priority → Supplier B takes the lead → Human commits override with justification!
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
