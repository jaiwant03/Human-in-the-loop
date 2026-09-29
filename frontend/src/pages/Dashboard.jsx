import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart2, 
  PieChart, 
  CheckCircle2, 
  AlertTriangle, 
  Gauge, 
  UserCheck, 
  PlusCircle, 
  Sparkles, 
  ArrowRight,
  Clock,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { dashboardAPI, decisionAPI } from '../services/api';

export default function Dashboard() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      if (res.success) {
        setStatsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Unable to load analytics. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      await decisionAPI.seedDemo();
      await loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Aggregating decision intelligence metrics...</p>
      </div>
    );
  }

  const summary = statsData?.summary || {
    totalDecisions: 0,
    aiAccepted: 0,
    humanOverrides: 0,
    alternativeSelected: 0,
    averageConfidence: 85,
    humanOverridePercent: 0,
    aiAcceptancePercent: 0,
  };

  const charts = statsData?.charts || {};
  const recentDecisions = statsData?.recentDecisions || [];

  // Doughnut Chart for Outcomes
  const outcomeData = {
    labels: ['AI Accepted', 'Human Override', 'Alternative Chosen', 'Awaiting Review'],
    datasets: [
      {
        data: [
          charts.outcomes?.ACCEPT_AI || 0,
          charts.outcomes?.OVERRIDE_AI || 0,
          charts.outcomes?.SELECT_ALTERNATIVE || 0,
          charts.outcomes?.AWAITING_DECISION || 0,
        ],
        backgroundColor: [
          '#10b981', // green
          '#ef4444', // red
          '#8b5cf6', // purple
          '#f59e0b', // amber
        ],
        borderColor: '#131b2e',
        borderWidth: 2,
      },
    ],
  };

  const outcomeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#fff',
      },
    },
    cutout: '70%',
  };

  // Confidence Distribution Bar Chart
  const confidenceData = {
    labels: ['High (80-100%)', 'Medium (60-79%)', 'Low (<60%)'],
    datasets: [
      {
        label: 'Decisions',
        data: [
          charts.confidenceDistribution?.High || 0,
          charts.confidenceDistribution?.Medium || 0,
          charts.confidenceDistribution?.Low || 0,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.75)',
          'rgba(245, 158, 11, 0.75)',
          'rgba(239, 68, 68, 0.75)',
        ],
        borderColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const confidenceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>Decision Intelligence Dashboard</h1>
          <p>
            Real-time analytics on AI advisory acceptance, human overrides, and confidence distribution.
          </p>
        </div>

        <div className="dashboard-actions">
          <button onClick={handleSeedDemo} className="btn btn-secondary">
            <Sparkles size={16} color="#a5b4fc" />
            Seed Demo Supplier
          </button>
          <Link to="/create" className="btn btn-primary">
            <PlusCircle size={16} />
            Create Decision
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-warning">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="stats-grid">
        {/* Total Decisions */}
        <div className="hitl-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Decisions</span>
            <div className="stat-icon-wrapper">
              <Layers size={18} color="#a5b4fc" />
            </div>
          </div>
          <div className="stat-value">{summary.totalDecisions}</div>
          <div className="stat-meta">
            Across enterprise multi-criteria evaluations
          </div>
        </div>

        {/* AI Accepted */}
        <div className="hitl-card stat-card stat-success">
          <div className="stat-header">
            <span className="stat-label">AI Accepted</span>
            <div className="stat-icon-wrapper">
              <CheckCircle2 size={18} color="#10b981" />
            </div>
          </div>
          <div className="stat-value">{summary.aiAccepted}</div>
          <div className="stat-meta">
            <span style={{ color: '#6ee7b7', fontWeight: 700 }}>{summary.aiAcceptancePercent}%</span> of finalized cases
          </div>
        </div>

        {/* Human Overrides */}
        <div className="hitl-card stat-card stat-warning">
          <div className="stat-header">
            <span className="stat-label">Human Overrides</span>
            <div className="stat-icon-wrapper">
              <AlertTriangle size={18} color="#f59e0b" />
            </div>
          </div>
          <div className="stat-value">{summary.humanOverrides}</div>
          <div className="stat-meta">
            <span style={{ color: '#fde68a', fontWeight: 700 }}>{summary.humanOverridePercent}%</span> human intervention rate
          </div>
        </div>

        {/* Average Confidence */}
        <div className="hitl-card stat-card stat-cyan">
          <div className="stat-header">
            <span className="stat-label">Avg Confidence</span>
            <div className="stat-icon-wrapper">
              <Gauge size={18} color="#06b6d4" />
            </div>
          </div>
          <div className="stat-value">{summary.averageConfidence}%</div>
          <div className="stat-meta">
            Analytical mathematical certainty
          </div>
        </div>

        {/* Alternative Selections */}
        <div className="hitl-card stat-card stat-purple">
          <div className="stat-header">
            <span className="stat-label">Alternatives Picked</span>
            <div className="stat-icon-wrapper">
              <UserCheck size={18} color="#8b5cf6" />
            </div>
          </div>
          <div className="stat-value">{summary.alternativeSelected}</div>
          <div className="stat-meta">
            Secondary candidates ratified
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="charts-grid">
        <div className="hitl-card">
          <div className="chart-card-header">
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Decision Outcome Distribution</h3>
              <p style={{ fontSize: '0.8rem' }}>AI Accepted vs Human Override vs Alternative vs Pending</p>
            </div>
          </div>
          <div className="chart-container">
            <Doughnut data={outcomeData} options={outcomeOptions} />
          </div>
        </div>

        <div className="hitl-card">
          <div className="chart-card-header">
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>AI Confidence Distribution</h3>
              <p style={{ fontSize: '0.8rem' }}>Distribution of mathematical confidence ratings</p>
            </div>
          </div>
          <div className="chart-container">
            <Bar data={confidenceData} options={confidenceOptions} />
          </div>
        </div>
      </div>

      {/* Recent Decisions Table */}
      <div className="hitl-card">
        <div className="recent-section-header">
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Recent Decision Pipeline</h3>
            <p style={{ fontSize: '0.85rem' }}>Active and finalized decision-support scenarios</p>
          </div>
          <Link to="/history" className="btn btn-sm btn-secondary">
            View All History <ArrowRight size={14} />
          </Link>
        </div>

        {recentDecisions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            No decisions logged yet. Click "Seed Demo Supplier" or "Create Decision" to begin.
          </div>
        ) : (
          <div className="decisions-table-container">
            <table className="decisions-table">
              <thead>
                <tr>
                  <th>Decision Title</th>
                  <th>Category</th>
                  <th>AI Recommendation</th>
                  <th>Confidence</th>
                  <th>Human Decision</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentDecisions.map((d) => (
                  <tr key={d._id}>
                    <td className="decision-title-cell">
                      <Link to={`/decisions/${d._id}`}>{d.title}</Link>
                    </td>
                    <td>
                      <span className="badge badge-gray">{d.category}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#cbd5e1' }}>{d.aiRecommendation}</strong>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#a5b4fc', fontWeight: 600 }}>
                        {d.confidence}%
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: d.humanDecision !== 'Pending Review' ? '#ffffff' : 'var(--text-muted)' }}>
                        {d.humanDecision}
                      </span>
                    </td>
                    <td>
                      {d.decisionType === 'ACCEPT_AI' && (
                        <span className="badge badge-success">AI Accepted</span>
                      )}
                      {d.decisionType === 'OVERRIDE_AI' && (
                        <span className="badge badge-danger">Human Override</span>
                      )}
                      {d.decisionType === 'SELECT_ALTERNATIVE' && (
                        <span className="badge badge-purple">Alternative</span>
                      )}
                      {d.decisionType === 'AWAITING_REVIEW' && (
                        <span className="badge badge-warning">Awaiting Review</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/decisions/${d._id}`} className="btn btn-sm btn-secondary">
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
