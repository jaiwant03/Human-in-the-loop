import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, CheckCircle2, AlertTriangle, Gauge, GitFork,
  ArrowRight, PlusCircle, RefreshCw, Calendar, TrendingUp,
  ChevronDown, MoreVertical, Eye, ExternalLink, Award
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { dashboardAPI } from '../services/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ── Mini trend sparkline SVG ──────────────────────────────────
function TrendSparkline({ trend = 'up', color = '#16A34A' }) {
  const points = trend === 'up' 
    ? '0,20 10,18 20,15 30,12 40,8 50,5 60,3'
    : trend === 'down'
    ? '0,3 10,5 20,8 30,12 40,15 50,18 60,20'
    : '0,12 10,13 20,11 30,12 40,13 50,11 60,12';
  
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Stat Card matching screenshot ─────────────────────────────
function StatCard({ icon, label, value, meta, trend, trendValue, color, bgColor }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: '14px',
      padding: '1.25rem 1.35rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Icon circle */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: bgColor || 'rgba(22,163,74,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Label */}
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.01em' }}>
        {label}
      </div>

      {/* Value + trend */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
          {value}
        </div>
        {trend && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
            <TrendSparkline trend={trend} color={color || '#16A34A'} />
          </div>
        )}
      </div>

      {/* Meta */}
      {meta && (
        <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {trendValue && (
            <span style={{ color: color || '#16A34A', fontWeight: 700 }}>
              {trendValue}
            </span>
          )}
          {meta}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [outcomeFilter, setOutcomeFilter] = useState('Last 30 days');
  const [confidenceFilter, setConfidenceFilter] = useState('Last 30 days');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const res = await dashboardAPI.getStats();
      if (res.success) setStats(res.data);
      else setError(res.message || 'Failed to load dashboard data.');
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

  // ── Donut chart: outcomes ────────────────────────────────────
  const totalOutcomes = 
    (charts.outcomes?.ACCEPT_AI || 0) + 
    (charts.outcomes?.OVERRIDE_AI || 0) + 
    (charts.outcomes?.SELECT_ALTERNATIVE || 0) +
    (charts.outcomes?.AWAITING_DECISION || 0);

  const outcomeData = {
    labels: ['AI Accepted', 'Human Override', 'Alternative Chosen', 'Pending'],
    datasets: [{
      data: [
        charts.outcomes?.ACCEPT_AI || 0,
        charts.outcomes?.OVERRIDE_AI || 0,
        charts.outcomes?.SELECT_ALTERNATIVE || 0,
        charts.outcomes?.AWAITING_DECISION || 0,
      ],
      backgroundColor: ['#16A34A', '#DC2626', '#7C3AED', '#F59E0B'],
      borderColor: '#fff',
      borderWidth: 4,
    }],
  };

  const outcomeOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#0F172A', 
        titleColor: '#fff', 
        bodyColor: '#94A3B8',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    cutout: '70%',
  };

  // ── Bar chart: confidence ────────────────────────────────────
  const confData = {
    labels: ['High (≥80%)', 'Medium (60–79%)', 'Low (<60%)'],
    datasets: [{
      label: 'Decisions',
      data: [
        charts.confidenceDistribution?.High || 0, 
        charts.confidenceDistribution?.Medium || 0, 
        charts.confidenceDistribution?.Low || 0
      ],
      backgroundColor: ['rgba(34,197,94,0.85)', 'rgba(251,191,36,0.85)', 'rgba(239,68,68,0.85)'],
      borderColor: ['#22C55E', '#FBBF24', '#EF4444'],
      borderWidth: 0,
      borderRadius: 8,
    }],
  };

  const confOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#0F172A', 
        titleColor: '#fff', 
        bodyColor: '#94A3B8',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { stepSize: 2, color: '#94A3B8', font: { family: 'Plus Jakarta Sans', size: 11 } }, 
        grid: { color: '#F1F5F9', drawBorder: false },
        border: { display: false },
      },
      x: { 
        ticks: { color: '#475569', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }, 
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* ── TOP BAR ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem',
        background: '#fff',
        borderBottom: '1px solid #E2E8F0',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
              border: '1px solid #BBF7D0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Layers size={16} color="#16A34A" />
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Decision Intelligence Dashboard
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem', marginLeft: '2.35rem' }}>
            Real-time analytics on AI advisory outputs, human override rates and confidence distribution.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Date badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.85rem', borderRadius: '8px',
            border: '1px solid #E2E8F0', background: '#F8FAFC',
            fontSize: '0.78rem', fontWeight: 600, color: '#475569',
          }}>
            <Calendar size={13} color="#64748B" />
            Jul 19, 2026
          </div>

          {/* Refresh */}
          <button onClick={load} style={{
            padding: '0.4rem 0.9rem', borderRadius: '8px',
            border: '1px solid #E2E8F0', background: '#fff',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#475569',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <RefreshCw size={13} /> Refresh
          </button>

          {/* New Decision */}
          <Link to="/create" style={{
            padding: '0.5rem 1.1rem', borderRadius: '10px',
            background: '#16A34A', color: '#fff',
            textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
          }}>
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
      <div style={{ padding: '1.75rem 2rem' }}>

        {error && (
          <div className="alert-banner alert-warning" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 1fr)', 
          gap: '1rem', 
          marginBottom: '1.75rem' 
        }}>
          <StatCard
            icon={<Layers size={20} color="#16A34A" />}
            label="Total Decisions"
            value={sum.totalDecisions || 12}
            meta="+3 this week"
            trend="up"
            trendValue=""
            color="#16A34A"
            bgColor="rgba(22,163,74,0.08)"
          />
          <StatCard
            icon={<CheckCircle2 size={20} color="#3B82F6" />}
            label="AI Accepted"
            value={sum.aiAccepted || 9}
            meta="75% acceptance rate"
            trend="up"
            trendValue=""
            color="#3B82F6"
            bgColor="rgba(59,130,246,0.08)"
          />
          <StatCard
            icon={<AlertTriangle size={20} color="#F59E0B" />}
            label="Human Overrides"
            value={sum.humanOverrides || 3}
            meta="25% override rate"
            trend="up"
            trendValue=""
            color="#F59E0B"
            bgColor="rgba(245,158,11,0.08)"
          />
          <StatCard
            icon={<TrendingUp size={20} color="#10B981" />}
            label="Avg Confidence"
            value={`${sum.averageConfidence || 85}%`}
            meta="+12%"
            trend="up"
            trendValue=""
            color="#10B981"
            bgColor="rgba(16,185,129,0.08)"
          />
          <StatCard
            icon={<GitFork size={20} color="#7C3AED" />}
            label="Alternatives Chosen"
            value={sum.alternativeSelected || 4}
            meta="33% of decisions"
            trend="flat"
            trendValue=""
            color="#7C3AED"
            bgColor="rgba(124,58,237,0.08)"
          />
        </div>

        {/* ── CHARTS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
          
          {/* Donut: Outcomes */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px',
            padding: '1.35rem 1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="#16A34A" />
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                    Decision Outcome Distribution
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.1rem' }}>
                    AI Accepted vs Human Override vs Alternative vs Pending
                  </p>
                </div>
              </div>
              <button style={{
                padding: '0.3rem 0.7rem', borderRadius: '6px',
                border: '1px solid #E2E8F0', background: '#F8FAFC',
                cursor: 'pointer', fontSize: '0.72rem', color: '#64748B',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                {outcomeFilter} <ChevronDown size={11} />
              </button>
            </div>

            <div style={{ position: 'relative', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '240px', height: '240px' }}>
                <Doughnut data={outcomeData} options={outcomeOptions} />
              </div>
              {/* Center label */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A' }}>
                  {totalOutcomes}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8' }}>
                  Total<br/>Decisions
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
              {[
                { label: 'AI Accepted', count: charts.outcomes?.ACCEPT_AI || 9, pct: '75%', color: '#16A34A' },
                { label: 'Human Override', count: charts.outcomes?.OVERRIDE_AI || 3, pct: '25%', color: '#DC2626' },
                { label: 'Alternative Chosen', count: charts.outcomes?.SELECT_ALTERNATIVE || 0, pct: '0%', color: '#7C3AED' },
                { label: 'Pending', count: charts.outcomes?.AWAITING_DECISION || 0, pct: '0%', color: '#F59E0B' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{item.count}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>{item.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bar: Confidence */}
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px',
            padding: '1.35rem 1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} color="#10B981" />
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                    Confidence Distribution
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.1rem' }}>
                    Number of decisions per confidence tier
                  </p>
                </div>
              </div>
              <button style={{
                padding: '0.3rem 0.7rem', borderRadius: '6px',
                border: '1px solid #E2E8F0', background: '#F8FAFC',
                cursor: 'pointer', fontSize: '0.72rem', color: '#64748B',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                {confidenceFilter} <ChevronDown size={11} />
              </button>
            </div>

            <div style={{ height: '240px', marginTop: '1rem' }}>
              <Bar data={confData} options={confOptions} />
            </div>
          </div>
        </div>

        {/* ── RECENT DECISIONS TABLE ── */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px',
          padding: '1.35rem 1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="#16A34A" />
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  Recent Decision Pipeline
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.1rem' }}>
                  Latest AI advisory + human outcomes
                </p>
              </div>
            </div>
            <button style={{
              padding: '0.35rem 0.85rem', borderRadius: '8px',
              border: '1px solid #E2E8F0', background: '#fff',
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#16A34A',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              View All <ArrowRight size={12} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="empty-state">
              <Layers size={36} />
              <h3>No decisions yet</h3>
              <p>Create your first decision to see it here.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {['#', 'DECISION', 'CATEGORY', 'AI RECOMMENDATION', 'CONFIDENCE', 'HUMAN DECISION', 'STATUS', 'CREATED AT', 'ACTIONS'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '0.65rem 0.85rem',
                        fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: '#F8FAFC',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((d, i) => {
                    const aiRec = d.aiAnalysis?.recommendation?.option || '—';
                    const conf = d.aiAnalysis?.confidence || 0;
                    const humanDec = d.humanDecision?.finalOption || '—';
                    const status = d.status === 'completed' 
                      ? d.humanDecision?.type === 'ACCEPT_AI' ? 'AI ACCEPTED' 
                        : d.humanDecision?.type === 'OVERRIDE_AI' ? 'HUMAN OVERRIDE'
                        : 'ALTERNATIVE'
                      : 'AWAITING_DECISION';
                    
                    const statusColor = status === 'AI ACCEPTED' ? '#10B981' 
                      : status === 'HUMAN OVERRIDE' ? '#F59E0B'
                      : status === 'ALTERNATIVE' ? '#7C3AED' : '#94A3B8';
                    
                    const statusBg = status === 'AI ACCEPTED' ? '#D1FAE5' 
                      : status === 'HUMAN OVERRIDE' ? '#FEF3C7'
                      : status === 'ALTERNATIVE' ? '#F3E8FF' : '#F1F5F9';

                    return (
                      <tr key={d._id || i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '0.85rem 0.85rem', color: '#94A3B8', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem', color: '#0F172A', fontWeight: 600 }}>
                          {d.title}
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem' }}>
                          <span style={{
                            padding: '0.25rem 0.65rem', borderRadius: '6px',
                            fontSize: '0.7rem', fontWeight: 600,
                            background: d.category === 'Product Selection' ? '#EFF6FF' : 
                                       d.category === 'Technology' ? '#F3E8FF' :
                                       d.category === 'Project Planning' ? '#FEF3C7' : '#F0FDF4',
                            color: d.category === 'Product Selection' ? '#1E40AF' : 
                                  d.category === 'Technology' ? '#6D28D9' :
                                  d.category === 'Project Planning' ? '#92400E' : '#166534',
                          }}>
                            {d.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '6px',
                              background: '#DBEAFE', border: '1px solid #93C5FD',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <span style={{ fontSize: '0.65rem' }}>🤖</span>
                            </div>
                            <span style={{ color: '#475569', fontWeight: 500 }}>{aiRec}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden', minWidth: '60px' }}>
                              <div style={{
                                width: `${conf}%`, height: '100%',
                                background: conf >= 80 ? '#22C55E' : conf >= 60 ? '#FBBF24' : '#EF4444',
                                borderRadius: '999px',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                              {conf}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem', color: '#0F172A', fontWeight: 600 }}>
                          {humanDec}
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem' }}>
                          <span style={{
                            padding: '0.3rem 0.75rem', borderRadius: '8px',
                            fontSize: '0.7rem', fontWeight: 700,
                            background: statusBg, color: statusColor,
                            textTransform: 'uppercase', letterSpacing: '0.03em',
                          }}>
                            {status}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem', color: '#64748B', fontSize: '0.78rem' }}>
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem' }}>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <Link to={`/decisions/${d._id}`} style={{
                              padding: '0.35rem 0.65rem', borderRadius: '6px',
                              border: '1px solid #E2E8F0', background: '#fff',
                              cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: '#16A34A',
                              textDecoration: 'none', display: 'flex', alignItems: 'center',
                            }}>
                              View
                            </Link>
                            <button style={{
                              padding: '0.35rem', borderRadius: '6px',
                              border: '1px solid #E2E8F0', background: '#fff',
                              cursor: 'pointer', color: '#94A3B8',
                              display: 'flex', alignItems: 'center',
                            }}>
                              <MoreVertical size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
