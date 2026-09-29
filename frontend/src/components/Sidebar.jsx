import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck, LayoutDashboard, PlusCircle, History,
  ChevronLeft, ChevronRight, Brain, MessageSquare
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard',  icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/create',     icon: <PlusCircle size={20} />,      label: 'New Decision' },
    { path: '/chat',       icon: <MessageSquare size={20} />,   label: 'Chat Assistant' },
    { path: '/history',    icon: <History size={20} />,         label: 'Audit Trail' },
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
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar__tagline">
          <Brain size={12} />
          <span>AI Recommends · Humans Decide</span>
        </div>
      )}

      <div className="sidebar__divider" />

      {/* Main navigation */}
      <nav className="sidebar__nav">
        {!collapsed && <span className="sidebar__section-label">Navigation</span>}
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar__nav-item ${isActive(item.path) ? 'sidebar__nav-item--active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar__nav-label">{item.label}</span>}
            {isActive(item.path) && !collapsed && <span className="sidebar__active-dot" />}
          </Link>
        ))}
      </nav>

      {/* Bottom tagline */}
      <div className="sidebar__bottom">
        <div className="sidebar__divider" />
        {!collapsed ? (
          <div className="sidebar__philosophy">
            <div className="sidebar__philosophy-flow">
              <span>AI</span>
              <span className="sidebar__arrow">→</span>
              <span>Evidence</span>
              <span className="sidebar__arrow">→</span>
              <span className="sidebar__philosophy-human">Human</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
            <ShieldCheck size={18} color="rgba(255,255,255,0.4)" />
          </div>
        )}
      </div>
    </aside>
  );
}
