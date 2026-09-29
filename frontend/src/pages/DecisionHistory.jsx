import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  Search, 
  Filter, 
  ArrowRight, 
  Bot, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function DecisionHistory() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadDecisions();
  }, [categoryFilter, statusFilter]);

  const loadDecisions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await decisionAPI.getDecisions(params);
      if (res.success) {
        setDecisions(res.data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDecisions();
  };

  const renderOutcomeBadge = (humanDecision) => {
    if (!humanDecision) {
      return <span className="badge badge-warning">Awaiting Review</span>;
    }
    if (humanDecision.type === 'ACCEPT_AI') {
      return <span className="badge badge-success">AI Accepted</span>;
    }
    if (humanDecision.type === 'OVERRIDE_AI') {
      return <span className="badge badge-danger">Human Override</span>;
    }
    return <span className="badge badge-purple">Alternative Chosen</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <History size={24} color="#a5b4fc" />
            <h1>Decision Audit Trail</h1>
          </div>
          <p>
            Immutable chronological ledger capturing AI advisory outputs and human executive determinations.
          </p>
        </div>

        <Link to="/create" className="btn btn-primary">
          + New Decision
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="hitl-card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search decisions by title or context keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Supplier Selection">Supplier Selection</option>
              <option value="Project Selection">Project Selection</option>
              <option value="Product Selection">Product Selection</option>
              <option value="Vendor Selection">Vendor Selection</option>
              <option value="Investment Selection">Investment Selection</option>
              <option value="Custom">Custom Domain</option>
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="FINALIZED">Finalized</option>
              <option value="AWAITING_HUMAN_DECISION">Awaiting Review</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Search size={16} /> Filter
          </button>
        </form>
      </div>

      {/* Table Container */}
      <div className="hitl-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="spinner" />
            <p style={{ marginTop: '0.85rem', color: 'var(--text-secondary)' }}>Loading audit trail...</p>
          </div>
        ) : decisions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
            No decisions match the current query filter.
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
                  <th>Outcome Type</th>
                  <th>Date Logged</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d) => (
                  <tr key={d._id}>
                    <td className="decision-title-cell" style={{ maxWidth: '280px' }}>
                      <Link to={`/decisions/${d._id}`}>{d.title}</Link>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.description}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{d.category}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1', fontWeight: 600 }}>
                        <Bot size={14} color="#a5b4fc" />
                        {d.aiAnalysis?.recommendation?.option || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#a5b4fc', fontWeight: 700 }}>
                        {d.aiAnalysis?.confidence ? `${d.aiAnalysis.confidence}%` : '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: d.humanDecision ? '#ffffff' : 'var(--text-muted)' }}>
                        {d.humanDecision?.option || 'Pending'}
                      </div>
                    </td>
                    <td>
                      {renderOutcomeBadge(d.humanDecision)}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(d.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <Link to={`/decisions/${d._id}/details`} className="btn btn-sm btn-secondary" title="View Full Audit Record">
                        Audit Log
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
