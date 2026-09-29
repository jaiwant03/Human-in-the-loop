import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, UserCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function DecisionCard({ decision }) {
  const aiRec = decision.aiAnalysis?.recommendation?.option || 'Pending AI';
  const confidence = decision.aiAnalysis?.confidence || 0;
  const humanChoice = decision.humanDecision?.option;
  const decisionType = decision.humanDecision?.type;

  const renderStatusBadge = () => {
    if (!humanChoice) {
      return (
        <span className="badge badge-warning">
          <Clock size={12} /> Awaiting Human Review
        </span>
      );
    }

    if (decisionType === 'ACCEPT_AI') {
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={12} /> AI Accepted
        </span>
      );
    }

    if (decisionType === 'OVERRIDE_AI') {
      return (
        <span className="badge badge-danger">
          <AlertTriangle size={12} /> Human Override
        </span>
      );
    }

    return (
      <span className="badge badge-purple">
        <UserCheck size={12} /> Alternative Chosen
      </span>
    );
  };

  return (
    <div className="hitl-card hitl-card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <span className="badge badge-gray">{decision.category}</span>
        {renderStatusBadge()}
      </div>

      <div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: '#ffffff' }}>
          <Link to={`/decisions/${decision._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {decision.title}
          </Link>
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {decision.description}
        </p>
      </div>

      {/* Comparison Strip */}
      <div style={{
        background: 'rgba(8, 12, 21, 0.6)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        border: '1px solid var(--border-subtle)',
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Bot size={13} color="#a5b4fc" /> AI Rec
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0e7ff', marginTop: '0.2rem' }}>
            {aiRec}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Conf: <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{confidence}%</span>
          </div>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <UserCheck size={13} color="#34d399" /> Human Choice
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: humanChoice ? '#ffffff' : 'var(--text-muted)', marginTop: '0.2rem' }}>
            {humanChoice || 'Pending Decision'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {humanChoice ? 'Decision Stored' : 'Action Required'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {new Date(decision.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <Link to={`/decisions/${decision._id}`} className="btn btn-sm btn-secondary" style={{ gap: '0.35rem' }}>
          Review Decision <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
