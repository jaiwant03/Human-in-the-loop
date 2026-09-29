import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  HelpCircle, 
  Sparkles,
  ShieldAlert,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

export default function Sidebar() {
  return (
    <aside style={{
      width: '240px',
      background: 'rgba(15, 23, 42, 0.4)',
      borderRight: '1px solid var(--border-subtle)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
    }}>
      <div>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '0 0.75rem',
          marginBottom: '0.75rem',
        }}>
          Decision Engine
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <NavLink
            to="/dashboard"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            })}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/create"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            })}
          >
            <PlusCircle size={18} />
            New Decision
          </NavLink>

          <NavLink
            to="/history"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
            })}
          >
            <History size={18} />
            Audit History
          </NavLink>
        </div>
      </div>

      {/* HITL Principle Badge Card */}
      <div style={{
        marginTop: 'auto',
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <ShieldAlert size={16} color="#a5b4fc" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase' }}>
            Core Principle
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
          AI recommends with mathematical evidence. <strong>Human preserves 100% final authority.</strong>
        </p>
      </div>
    </aside>
  );
}
