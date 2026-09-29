import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, MessageSquare,
  History, ChevronLeft, ChevronRight,
  Bot, User, Settings, CheckCircle2,
  ArrowRight
} from 'lucide-react';

// Leaf / plant SVG logo matching the screenshot
function LeafLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.2)" />
      <path d="M12 4c0 0-5 3-5 8 0 2.76 2.24 5 5 5s5-2.24 5-5c0-5-5-8-5-8z" fill="rgba(255,255,255,0.85)" />
      <path d="M12 12 L12 20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const FLOW_STEPS = [
  { icon: <Bot size={14} />, label: 'AI Suggests',     color: '#4ADE80' },
  { icon: <User size={14} />, label: 'Human Reviews',  color: '#86EFAC' },
  { icon: <Settings size={14} />, label: 'System Calculates', color: '#4ADE80' },
  { icon: <MessageSquare size={14} />, label: 'AI Explains',  color: '#86EFAC' },
  { icon: <CheckCircle2 size={14} />, label: 'Human Decides', color: '#4ADE80' },
];

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path) =>
    path === '/chat'
      ? location.pathname === '/chat' || location.pathname === '/'
      : location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/create',    icon: <PlusCircle size={18} />,      label: 'New Decision' },
    { path: '/chat',      icon: <MessageSquare size={18} />,   label: 'Chat Assistant' },
    { path: '/history',   icon: <History size={18} />,         label: 'Audit Trail' },
  ];

  return (
    <aside className="sidebar">

      {/* ── Brand ── */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <LeafLogo />
        </div>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">HITL</span>
          <span className="sidebar__brand-sub">Decision Intelligence</span>
        </div>
      </div>

      <div className="sidebar__tagline">
        <span>AI Recommends · Humans Decide</span>
      </div>

      <div className="sidebar__divider" />

      {/* ── Navigation ── */}
      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar__nav-item ${isActive(item.path) ? 'sidebar__nav-item--active' : ''}`}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            <span className="sidebar__nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* ── HITL Flow ── */}
      <div className="sidebar__flow-section">
        <div className="sidebar__divider" style={{ marginBottom: '1rem' }} />
        <div className="sidebar__flow-title">
          AI → Evidence → Human
        </div>
        <div className="sidebar__flow-list">
          {FLOW_STEPS.map((s, i) => (
            <div key={i} className="sidebar__flow-item">
              <div className="sidebar__flow-dot" style={{ background: s.color }}>
                {s.icon}
              </div>
              <span className="sidebar__flow-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Status Footer ── */}
      <div className="sidebar__bottom">
        <div className="sidebar__divider" style={{ marginBottom: '0.85rem' }} />
        <div className="sidebar__status">
          <div className="sidebar__status-dot" />
          <div>
            <div className="sidebar__status-title">AI System Online</div>
            <div className="sidebar__status-sub">Groq + n8n connected</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
