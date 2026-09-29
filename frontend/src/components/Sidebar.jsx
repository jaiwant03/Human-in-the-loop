import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  History,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Home,
  Brain,
  GitFork,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { decisionAPI } from '../services/api';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLoadDemo = async () => {
    try {
      setSeeding(true);
      const res = await decisionAPI.seedDemo();
      if (res.data?._id) {
        navigate(`/decisions/${res.data._id}`);
      } else {
        navigate('/dashboard');
      }
    } catch {
      navigate('/dashboard');
    } finally {
      setSeeding(false);
    }
  };

  const navItems = [
    { path: '/', icon: <Home size={20} />, label: 'Home' },
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/create', icon: <PlusCircle size={20} />, label: 'New Decision' },
    { path: '/history', icon: <History size={20} />, label: 'Audit Trail' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <ShieldCheck size={22} color="#fff" />
        </div>
        {!collapsed && (
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">HITL</span>
            <span className="sidebar__brand-sub">Decision Intelligence</span>
          </div>
        )}
        <button
          className="sidebar__collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Philosophy badge */}
      {!collapsed && (
        <div className="sidebar__tagline">
          <Brain size={12} />
          <span>AI Recommends · Humans Decide</span>
        </div>
      )}

      <div className="sidebar__divider" />

      {/* Main Nav */}
      <nav className="sidebar__nav">
        {!collapsed && (
          <span className="sidebar__section-label">Navigation</span>
        )}

        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar__nav-item ${isActive(item.path) ? 'sidebar__nav-item--active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar__nav-label">{item.label}</span>}
            {isActive(item.path) && !collapsed && (
              <span className="sidebar__active-dot" />
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar__divider" />

      {/* Quick Actions */}
      <div className="sidebar__nav">
        {!collapsed && (
          <span className="sidebar__section-label">Quick Actions</span>
        )}

        <Link
          to="/create"
          className="sidebar__nav-item sidebar__nav-item--create"
          title={collapsed ? 'New Decision' : ''}
        >
          <span className="sidebar__nav-icon"><PlusCircle size={20} /></span>
          {!collapsed && <span className="sidebar__nav-label">Create Decision</span>}
        </Link>

        <button
          onClick={handleLoadDemo}
          disabled={seeding}
          className="sidebar__nav-item sidebar__nav-item--demo"
          title={collapsed ? 'Supplier Demo' : ''}
        >
          <span className="sidebar__nav-icon">
            <Sparkles size={20} />
          </span>
          {!collapsed && (
            <span className="sidebar__nav-label">
              {seeding ? 'Loading...' : 'Supplier Demo'}
            </span>
          )}
        </button>
      </div>

      {/* Bottom section */}
      <div className="sidebar__bottom">
        <div className="sidebar__divider" />
        {!collapsed && (
          <div className="sidebar__philosophy">
            <div className="sidebar__philosophy-flow">
              <span>AI</span>
              <span className="sidebar__arrow">→</span>
              <span>Evidence</span>
              <span className="sidebar__arrow">→</span>
              <span className="sidebar__philosophy-human">Human</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
            <ShieldCheck size={20} color="var(--primary)" />
          </div>
        )}
      </div>
    </aside>
  );
}
