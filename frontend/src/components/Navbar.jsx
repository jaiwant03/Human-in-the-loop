import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle, LayoutDashboard, History, Sparkles, Sliders } from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);

  const handleLoadDemo = async () => {
    try {
      setSeeding(true);
      const res = await decisionAPI.seedDemo();
      if (res.data?._id) {
        navigate(`/decisions/${res.data._id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to load demo:', err);
      navigate('/dashboard');
    } finally {
      setSeeding(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'rgba(13, 20, 36, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.85rem 2.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.5rem',
    }}>
      {/* Brand logo & Philosophy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          }}>
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              HITL <span style={{ color: '#a5b4fc', fontWeight: 600 }}>Intelligence</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              AI Recommends • Humans Decide
            </div>
          </div>
        </Link>

        <span className="badge badge-advisory" style={{ fontSize: '0.7rem' }}>
          Advisory Support v1.0
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link
          to="/dashboard"
          className={`btn btn-sm ${isActive('/dashboard') ? 'btn-primary' : 'btn-secondary'}`}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>

        <Link
          to="/create"
          className={`btn btn-sm ${isActive('/create') ? 'btn-primary' : 'btn-secondary'}`}
        >
          <PlusCircle size={16} />
          Create Decision
        </Link>

        <Link
          to="/history"
          className={`btn btn-sm ${isActive('/history') ? 'btn-primary' : 'btn-secondary'}`}
        >
          <History size={16} />
          Audit Trail
        </Link>

        <button
          onClick={handleLoadDemo}
          disabled={seeding}
          className="btn btn-sm btn-outline-primary"
          title="Instantly open canonical Supplier Selection scenario"
          style={{ marginLeft: '0.5rem' }}
        >
          <Sparkles size={16} color="#a5b4fc" />
          {seeding ? 'Loading Demo...' : 'Supplier Demo'}
        </button>
      </div>
    </nav>
  );
}
