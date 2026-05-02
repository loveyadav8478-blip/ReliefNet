import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, LogOut } from 'lucide-react';

// ── Real dashboard imports ────────────────────────────────────────────────────
import VolunteerDashboardPage  from './volunteer/VolunteerDashboard';
import CoordinatorDashboardPage from './coordinator/CoordinatorDashboard';

// ── Placeholder (reused for pages not yet built) ──────────────────────────────
function PlaceholderDashboard({ title, subtitle, color }) {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{
        background: 'white', borderBottom: '1px solid var(--border)',
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#22C55E,#16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={16} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--green-900)' }}>ReliefNet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: 'var(--text3)' }}>
            Signed in as <strong style={{ color: 'var(--text)' }}>{user?.name}</strong>
            <span style={{
              marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px',
              borderRadius: 99, background: 'var(--green-100)', color: 'var(--green-800)',
            }}>{user?.role}</span>
          </span>
          <button onClick={logout} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: `${color}15`, border: `2px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
        }}>
          {subtitle.split(' ')[0]}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>{title}</h1>
        <p style={{ color: 'var(--text3)', fontSize: 15, textAlign: 'center', maxWidth: 400 }}>{subtitle}</p>
        <div style={{
          marginTop: 8, padding: '16px 24px', background: 'var(--green-50)',
          border: '1px solid var(--border2)', borderRadius: 'var(--r)',
          fontSize: 14, color: 'var(--green-800)',
        }}>
          ✅ Login successful — connect your backend dashboard components here.
        </div>
      </div>
    </div>
  );
}

// ── Exports ───────────────────────────────────────────────────────────────────

// Real pages
export function CoordinatorDashboard() {
  return <CoordinatorDashboardPage />;
}

export function VolunteerDashboard() {
  return <VolunteerDashboardPage />;
}

// Placeholders (replace when ready)
export function AdminDashboard() {
  return <PlaceholderDashboard
    title="Admin Dashboard"
    subtitle="⚙️ Manage users, create coordinator accounts, view system stats."
    color="#14532D"
  />;
}