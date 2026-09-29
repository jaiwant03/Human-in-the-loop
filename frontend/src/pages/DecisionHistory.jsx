import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History, Search, PlusCircle, Bot, UserCheck,
  AlertTriangle, CheckCircle2, ExternalLink, RefreshCw
} from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function DecisionHistory() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => { load(); }, [categoryFilter, statusFilter]);

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await decisionAPI.getDecisions(params);
      if (res.success) setDecisions(res.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const badge = (d) => {
    if (!d.humanDecision) return <span className="badge badge-warning">Pending</span>;
    if (d.humanDecision.type === 'ACCEPT_AI') return <span className="badge badge-success">AI Accepted</span>;
    if (d.humanDecision.type === 'OVERRIDE_AI') return <span className="badge badge-danger">Override</span>;
    return <span className="badge badge-purple">Alternative</span>;
  };

  const confColor = (c) => c >= 80 ? '#16A34A' : c >= 60 ? '#D97706' : '#DC2626';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header */}
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <History size={22} color="#16A34A" />
            <h1 style={{ fontSize: '1.85rem' }}>Decision Audit Trail</h1>
          </div>
          <p style={{ fontSize: '0.9rem' }}>Chronological record of all AI recommendations and human final decisions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={load} className="btn btn-secondary"><RefreshCw size={14} /></button>
          <Link to="/create" className="btn btn-primary"><PlusCircle size={15} /> New Decision</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="hitl-card" style={{ padding: '1.15rem' }}>
        <form onSubmit={e => { e.preventDefault(); load(); }}
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label className="form-label">Search</label>
            <input className="form-input" placeholder="Search by title…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ minWidth: '180px' }}>
            <label className="form-label">Category</label>
            <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {['Supplier Selection','Project Selection','Product Selection','Vendor Selection','Investment Selection','Custom'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '160px' }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="FINALIZED">Finalized</option>
              <option value="AWAITING_HUMAN_DECISION">Pending</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>
            <Search size={15} /> Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="hitl-card">
        {loading ? (
          <div className="loading-screen" style={{ padding: '3rem' }}>
            <div className="spinner" />
            <p>Loading audit trail…</p>
          </div>
        ) : decisions.length === 0 ? (
          <div className="empty-state">
            <History size={36} />
            <h3>No decisions found</h3>
            <p>Try adjusting the filters or create a new decision.</p>
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
                  <th>Outcome</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map(d => (
                  <tr key={d._id}>
                    <td className="decision-title-cell">
                      <Link to={`/decisions/${d._id}`}>{d.title}</Link>
                      <small>{d.description?.slice(0, 70)}{d.description?.length > 70 ? '…' : ''}</small>
                    </td>
                    <td><span className="badge badge-gray">{d.category}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#166534', fontSize: '0.875rem' }}>
                        <Bot size={13} color="#16A34A" />
                        {d.aiAnalysis?.recommendation?.option || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: confColor(d.aiAnalysis?.confidence || 0) }}>
                        {d.aiAnalysis?.confidence ? `${d.aiAnalysis.confidence}%` : '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: d.humanDecision ? '#0F172A' : '#94A3B8', fontSize: '0.875rem' }}>
                        {d.humanDecision && <UserCheck size={13} color="#16A34A" />}
                        {d.humanDecision?.option || 'Pending'}
                      </div>
                    </td>
                    <td>{badge(d)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(d.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <Link to={`/decisions/${d._id}`} className="btn btn-sm btn-secondary">View</Link>
                        <Link to={`/decisions/${d._id}/details`} className="btn btn-sm btn-secondary" title="Audit Log">
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary footer */}
      {decisions.length > 0 && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Showing {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
