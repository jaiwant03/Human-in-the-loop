import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, CheckCircle2, AlertTriangle, Gauge, GitFork,
  ArrowRight, PlusCircle, RefreshCw, Bot, UserCheck
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { dashboardAPI } from '../services/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const res = await dashboardAPI.getStats();
      if (res.success) setStats(res.data);
    } catch (e) {
      setError('Cannot reach backend. Make sure the server is running on port 5000.');
    } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <p>Loading dashboard metrics…</p>
    </div>
  );

  const sum = stats?.summary || {};
  const charts = stats?.charts || {};
  const recent = stats?.recentDecisions || [];

  /* ── Chart data ── */
  const outcomeData = {
    labels: ['AI Accepted', 'Human Override', 'Alternative', 'Pending'],
    datasets: [{
      data: [
        charts.outcomes?.ACCEPT_AI || 0,
        charts.outcomes?.OVERRIDE_AI || 0,
        charts.outcomes?.SELECT_ALTERNATIVE || 0,
        charts.outcomes?.AWAITING_DECISION || 0,
      ],
      backgroundColor: ['#16A34A', '#EF4444', '#7C3AED', '#F59E0B'],
      borderColor: '#fff',
      borderWidth: 3,
    }],
  };

  const outcomeOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#475569', font: { family: 'Plus Jakarta Sans', size: 11 }, boxWidth: 12, padding: 12 } },
      tooltip: { backgroundColor: '#0F172A', titleColor: '#fff', bodyColor: '#94A3B8' },
    },
    cutout: '68%',
  };

  const confData = {
    labels: ['High (≥80%)', 'Medium (60–79%)', 'Low (<60%)'],
    datasets: [{
      label: 'Decisions',
      data: [charts.confidenceDistribution?.High || 0, charts.confidenceDistribution?.Medium || 0, charts.confidenceDistribution?.Low || 0],
      backgroundColor: ['rgba(22,163,74,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'],
      borderColor: ['#16A34A', '#F59E0B', '#EF4444'],
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  const confOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0F172A', titleColor: '#fff', bodyColor: '#94A3B8' },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94A3B8', font: { family: 'Plus Jakarta Sans' } }, grid: { color: '#F1F5F9' } },
      x: { ticks: { color: '#475569', font: { family: 'Plus Jakarta Sans' } }, grid: { display: false } },
    },
  };

  const statCards = [
    { label: 'Total Decisions', value: sum.totalDecisions ?? 0, icon: <Layers size={18} color="#16A34A" />, cls: '' },
    { label: 'AI Accepted', value: sum.aiAccepted ?? 0, icon: <CheckCircle2 size={18} color="#10B981" />, cls: 'stat-success', sub: `${sum.aiAcceptancePercent ?? 0}% acceptance rate` },
    { label: 'Human Overrides', value: sum.humanOverrides ?? 0, icon: <AlertTriangle size={18} color="#F59E0B" />, cls: 'stat-warning', sub: `${sum.humanOverridePercent ?? 0}% override rate` },
    { label: 'Avg Confidence', value: `${sum.averageConfidence ?? 85}%`, icon: <Gauge size={18} color="#14B8A6" />, cls: 'stat-teal' },
    { label: 'Alternatives Chosen', value: sum.alternativeSelected ?? 0, icon: <GitFork size={18} color="#7C3AED" />, cls: 'stat-purple' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>Decision Intelligence Dashboard</h1>
          <p>Real-time analytics on AI advisory outputs, human override rates and confidence distribution.</p>
        </div>
        <div className="dashboard-actions">
          <button onClick={load} className="btn btn-secondary">
            <RefreshCw size={15} /> Refresh
          </button>
          <Link to="/create" className="btn btn-primary">
            <PlusCircle size={15} /> New Decision
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-warning">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((c) => (
          <div key={c.label} className={`hitl-card stat-card ${c.cls}`}>
            <div className="stat-header">
              <span className="stat-label">{c.label}</span>
              <div className="stat-icon-wrapper">{c.icon}</div>
            </div>
            <div className="stat-value">{c.value}</div>
            {c.sub && <div className="stat-meta">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="hitl-card">
          <div className="chart-card-header">
            <div>
              <h3>Decision Outcome Distribution</h3>
              <p>AI Accepted vs Override vs Alternative vs Pending</p>
            </div>
          </div>
          <div className="chart-container">
            <Doughnut data={outcomeData} options={outcomeOptions} />
          </div>
        </div>

        <div className="hitl-card">
          <div className="chart-card-header">
            <div>
              <h3>Confidence Distribution</h3>
              <p>Number of decisions per confidence tier</p>
            </div>
          </div>
          <div className="chart-container">
            <Bar data={confData} options={confOptions} />
          </div>
        </div>
      </div>

      {/* Recent Decisions */}
      <div className="hitl-card">
        <div className="recent-section-header">
          <div>
            <h3>Recent Decision Pipeline</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Latest AI advisory + human outcomes</p>
          </div>
          <Link to="/history" className="btn btn-sm btn-secondary">
            View All <ArrowRight size={13} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <Layers size={36} />
            <h3>No decisions yet</h3>
            <p>Click "Seed Demo" or "New Decision" to get started.</p>
          </div>
        ) : (
          <div className="decisions-table-container">
            <table className="decisions-table">
              <thead>
                <tr>
                  <th>Decision</th>
                  <th>Category</th>
                  <th>AI Recommendation</th>
                  <th>Confidence</th>
                  <th>Human Decision</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((d) => (
                  <tr key={d._id}>
                    <td className="decision-title-cell">
                      <Link to={`/decisions/${d._id}`}>{d.title}</Link>
                    </td>
                    <td><span className="badge badge-gray">{d.category}</span></td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#166534' }}>
                        <Bot size={13} color="#16A34A" />{d.aiRecommendation}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: d.confidence >= 80 ? '#16A34A' : d.confidence >= 60 ? '#D97706' : '#DC2626', fontSize: '0.875rem' }}>
                        {d.confidence}%
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: d.humanDecision !== 'Pending Review' ? '#0F172A' : '#94A3B8' }}>
                        {d.humanDecision}
                      </span>
                    </td>
                    <td>
                      {d.decisionType === 'ACCEPT_AI' && <span className="badge badge-success">AI Accepted</span>}
                      {d.decisionType === 'OVERRIDE_AI' && <span className="badge badge-danger">Override</span>}
                      {d.decisionType === 'SELECT_ALTERNATIVE' && <span className="badge badge-purple">Alternative</span>}
                      {(d.decisionType === 'AWAITING_REVIEW' || !d.decisionType) && <span className="badge badge-warning">Pending</span>}
                    </td>
                    <td>
                      <Link to={`/decisions/${d._id}`} className="btn btn-sm btn-secondary">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HITL principle banner */}
      <div style={{
        background: 'var(--primary-very-light)',
        border: '1px solid var(--primary-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <UserCheck size={22} color="#16A34A" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem', marginBottom: '0.15rem' }}>
            Human-in-the-Loop Principle
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569' }}>
            The AI recommendation is <strong>never</strong> automatically saved as the final decision.
            Every outcome in this dashboard reflects an explicit human choice.
          </div>
        </div>
        <Link to="/create" className="btn btn-sm btn-primary">Create Decision</Link>
      </div>
    </div>
  );
}
