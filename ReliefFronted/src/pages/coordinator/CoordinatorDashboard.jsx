import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  Leaf, LogOut, RefreshCw, Users, FileText, CheckCircle,
  AlertCircle, Clock, MapPin, Zap, TrendingUp, Activity,
  Search, UserCheck, BarChart2, Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import { dashboardAPI, needsAPI, volunteersAPI, tasksAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AssignVolunteerModal from './AssignVolunteerModal';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const CATEGORY_ICONS = { FOOD: '🥫', MEDICAL: '🏥', SHELTER: '🏠', WATER: '💧', OTHER: '📦' };

const URGENCY_CFG = {
  CRITICAL: { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', label: 'Critical' },
  HIGH:     { color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', label: 'High'     },
  MEDIUM:   { color: '#EAB308', bg: '#FEFCE8', border: '#FEF08A', label: 'Medium'   },
  LOW:      { color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', label: 'Low'      },
};

const STATUS_CFG = {
  OPEN:        { color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', label: 'Open'        },
  ASSIGNED:    { color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', label: 'Assigned'    },
  IN_PROGRESS: { color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', label: 'In Progress' },
  RESOLVED:    { color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', label: 'Resolved'    },
};

const isVolAvailable = (v) => v.available ?? v.isAvailable ?? false;

// ── ATOMS ─────────────────────────────────────────────────────────────────────
function Badge({ text, color, bg, border }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 9999, background: bg, border: `1px solid ${border}`, fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {text}
    </span>
  );
}

function UrgencyBadge({ urgency }) {
  const c = URGENCY_CFG[urgency]; if (!c) return null;
  return <Badge text={c.label} color={c.color} bg={c.bg} border={c.border} />;
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status]; if (!c) return null;
  return <Badge text={c.label} color={c.color} bg={c.bg} border={c.border} />;
}

function Skeleton({ h = 80 }) {
  return (
    <div style={{ height: h, borderRadius: 16, background: 'linear-gradient(90deg,#F0FFF4 25%,#DCFCE7 50%,#F0FFF4 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
  );
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
function Topbar({ onRefresh, loading }) {
  const { user, logout } = useAuth();
  return (
    <header style={{ height: 60, background: 'white', borderBottom: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 4px rgba(22,163,74,0.08)' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#22C55E,#15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(34,197,94,0.3)' }}>
          <Leaf size={17} color="white" fill="white" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#14532D', lineHeight: 1 }}>ReliefNet</div>
          <div style={{ fontSize: 9, color: '#86BFAA', letterSpacing: '0.08em', marginTop: 1 }}>COORDINATOR DASHBOARD</div>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#F0FFF4', border: '1px solid #A7F3D0', borderRadius: 9999, fontSize: 12, fontWeight: 600, color: '#15803D' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          System Active
        </div>
        <button onClick={onRefresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9999, border: '1.5px solid #A7F3D0', background: 'white', color: '#15803D', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F0FFF4'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
          <RefreshCw size={13} style={loading ? { animation: 'spin .7s linear infinite' } : {}} />
          Refresh
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#F0FFF4', border: '1px solid #D1FAE5', borderRadius: 9999 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#DCFCE7', border: '1.5px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#166634' }}>
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F2419', lineHeight: 1 }}>{user?.name || 'Coordinator'}</div>
            <div style={{ fontSize: 10, color: '#86BFAA', marginTop: 1 }}>{user?.role === 'ADMIN' ? 'Administrator' : 'Coordinator'}</div>
          </div>
        </div>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9999, border: '1.5px solid #D1FAE5', background: 'white', color: '#4B7A5E', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1FAE5'; e.currentTarget.style.color = '#4B7A5E'; }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </header>
  );
}

// ── STAT CARDS ────────────────────────────────────────────────────────────────
function StatCards({ stats, volunteers }) {
  const totalVols     = volunteers.length;
  const availableVols = volunteers.filter(isVolAvailable).length;

  if (!stats) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} h={110} />)}
    </div>
  );

  const cards = [
    { label: 'Total Reports',    value: stats.totalNeeds,    icon: <FileText size={20} />,    color: '#16A34A', bg: '#DCFCE7', border: '#A7F3D0', sub: `${stats.openNeeds} open`           },
    { label: 'Critical Needs',   value: stats.criticalNeeds, icon: <AlertCircle size={20} />, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', sub: `${stats.highNeeds} high urgency`   },
    { label: 'Total Volunteers', value: totalVols,           icon: <Users size={20} />,       color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', sub: `${availableVols} available now`    },
    { label: 'Active Tasks',     value: stats.activeTasks,   icon: <Activity size={20} />,    color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', sub: `${stats.completedTasks} completed` },
    { label: 'Open Needs',       value: stats.openNeeds,     icon: <Clock size={20} />,       color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', sub: 'Awaiting assignment'               },
    { label: 'Assigned',         value: stats.assignedNeeds, icon: <Target size={20} />,      color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', sub: 'Being processed'                   },
    { label: 'Resolved',         value: stats.resolvedNeeds, icon: <CheckCircle size={20} />, color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', sub: 'Successfully closed'               },
    { label: 'Available Now',    value: availableVols,       icon: <UserCheck size={20} />,   color: '#16A34A', bg: '#DCFCE7', border: '#A7F3D0', sub: `of ${totalVols} volunteers`        },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
      {cards.map((c, i) => (
        <div key={i} className="stat-card" style={{ background: 'white', border: `1.5px solid ${c.border}`, borderRadius: 20, padding: '18px 20px', boxShadow: `0 2px 12px ${c.color}15`, opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#86BFAA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>{c.icon}</div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 36, color: c.color, lineHeight: 1, marginBottom: 5 }}>{c.value ?? '—'}</div>
          <div style={{ fontSize: 12, color: '#86BFAA' }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── NEEDS TABLE ───────────────────────────────────────────────────────────────
// FIX ③: added onAssign to the signature
function NeedsTable({ needs, loading, onAnalyze, onAssign }) {
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('ALL');
  const [urgencyF, setUrgencyF] = useState('ALL');

  const filtered = needs.filter(n => {
    const ms  = !search  || n.title?.toLowerCase().includes(search.toLowerCase()) || n.locationName?.toLowerCase().includes(search.toLowerCase());
    const mst = statusF  === 'ALL' || n.status  === statusF;
    const mu  = urgencyF === 'ALL' || n.urgency === urgencyF;
    return ms && mst && mu;
  });

  const selStyle = { padding: '8px 14px', borderRadius: 10, border: '1.5px solid #D1FAE5', background: '#F6FEF9', fontSize: 13, color: '#0F2419', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ background: 'white', border: '1.5px solid #D1FAE5', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(22,163,74,0.06)' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#0F2419', marginBottom: 2 }}>All Community Needs</div>
          <div style={{ fontSize: 12, color: '#86BFAA' }}>{filtered.length} of {needs.length} reports</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#F6FEF9', border: '1.5px solid #D1FAE5', borderRadius: 10, minWidth: 200 }}>
            <Search size={14} color="#86BFAA" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search needs..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#0F2419', width: '100%', fontFamily: 'inherit' }} />
          </div>
          <select value={statusF}  onChange={e => setStatusF(e.target.value)}  style={selStyle}>
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select value={urgencyF} onChange={e => setUrgencyF(e.target.value)} style={selStyle}>
            <option value="ALL">All Urgency</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} h={56} />)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#86BFAA' }}>
          <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: '#4B7A5E' }}>No needs found</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F6FEF9', borderBottom: '1px solid #D1FAE5' }}>
                {['ID', 'Title', 'Category', 'Status', 'Urgency', 'Score', 'Location', 'AI Reasoning', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#86BFAA', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(need => (
                <tr key={need.id} style={{ borderBottom: '1px solid #F0FFF4', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F6FEF9'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '14px 16px', fontSize: 12, fontFamily: 'monospace', color: '#16A34A', fontWeight: 700 }}>#{need.id}</td>
                  <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0F2419', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{need.title}</div>
                    <div style={{ fontSize: 11, color: '#86BFAA', marginTop: 2 }}>{need.source || 'TEXT'}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4B7A5E', fontWeight: 500 }}>
                      {CATEGORY_ICONS[need.category] || '📦'} {need.category || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={need.status} /></td>
                  <td style={{ padding: '14px 16px' }}><UrgencyBadge urgency={need.urgency} /></td>
                  <td style={{ padding: '14px 16px' }}>
                    {need.priorityScore ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 50, height: 5, background: '#F0FFF4', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${need.priorityScore}%`, background: need.priorityScore >= 80 ? '#EF4444' : need.priorityScore >= 60 ? '#F97316' : '#22C55E', borderRadius: 9999 }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: need.priorityScore >= 80 ? '#EF4444' : need.priorityScore >= 60 ? '#F97316' : '#22C55E' }}>{need.priorityScore}</span>
                      </div>
                    ) : <span style={{ fontSize: 12, color: '#86BFAA' }}>Pending</span>}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#4B7A5E', whiteSpace: 'nowrap' }}>
                    {need.locationName ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{need.locationName}</span> : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                    {need.aiReasoning
                      ? <div style={{ fontSize: 11, color: '#4B7A5E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{need.aiReasoning}</div>
                      : <span style={{ fontSize: 11, color: '#86BFAA' }}>Not analyzed</span>
                    }
                  </td>

                  {/* FIX ④: action cell with both Analyze and Assign buttons */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {/* Analyze */}
                      <button
                        onClick={() => onAnalyze(need.id)}
                        title="Trigger AI analysis"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #A7F3D0', background: '#F0FFF4', color: '#15803D', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#DCFCE7'; e.currentTarget.style.borderColor = '#6EE7B7'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F0FFF4'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
                      >
                        <Zap size={12} /> Analyze
                      </button>

                      {/* Assign — only show when not already resolved */}
                      {need.status !== 'RESOLVED' && (
                        <button
                          onClick={() => onAssign(need)}
                          title="Assign a volunteer"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#DBEAFE'; e.currentTarget.style.borderColor = '#93C5FD'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                        >
                          <UserCheck size={12} /> Assign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── VOLUNTEERS PANEL ──────────────────────────────────────────────────────────
function VolunteersPanel({ volunteers, loading }) {
  const [search, setSearch] = useState('');
  const filtered = volunteers.filter(v =>
    !search || v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.skills?.toLowerCase().includes(search.toLowerCase()) ||
    v.locationName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: 'white', border: '1.5px solid #D1FAE5', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(22,163,74,0.06)' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#0F2419', marginBottom: 2 }}>Volunteers</div>
          <div style={{ fontSize: 12, color: '#86BFAA' }}>{filtered.length} of {volunteers.length} registered</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#F6FEF9', border: '1.5px solid #D1FAE5', borderRadius: 10, minWidth: 180 }}>
          <Search size={14} color="#86BFAA" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search volunteers..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#0F2419', width: '100%', fontFamily: 'inherit' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3, 4].map(i => <Skeleton key={i} h={64} />)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#86BFAA' }}>
          <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
          <div style={{ fontWeight: 700, color: '#4B7A5E' }}>No volunteers found</div>
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {filtered.map(v => {
            const avail = isVolAvailable(v);
            return (
              <div key={v.id} style={{ padding: '14px 24px', borderBottom: '1px solid #F0FFF4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F6FEF9'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: avail ? '#DCFCE7' : '#F3F4F6', border: `2px solid ${avail ? '#A7F3D0' : '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: avail ? '#15803D' : '#9CA3AF', flexShrink: 0 }}>
                    {v.name?.[0]?.toUpperCase() || 'V'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0F2419' }}>{v.name}</div>
                    <div style={{ fontSize: 12, color: '#86BFAA', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                      {v.locationName && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{v.locationName}</span>}
                      {v.skills && <span>🛠 {v.skills.split(',').slice(0, 2).join(', ')}{v.skills.split(',').length > 2 ? '...' : ''}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 9999, background: avail ? '#F0FDF4' : '#F9FAFB', border: `1px solid ${avail ? '#BBF7D0' : '#E5E7EB'}`, fontSize: 11, fontWeight: 700, color: avail ? '#22C55E' : '#9CA3AF' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: avail ? '#22C55E' : '#9CA3AF', display: 'inline-block' }} />
                    {avail ? 'Available' : 'Unavailable'}
                  </span>
                  {v.radiusKm && <div style={{ fontSize: 11, color: '#86BFAA' }}>{v.radiusKm}km radius</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── TASKS PANEL ───────────────────────────────────────────────────────────────
function TasksPanel({ tasks, loading }) {
  const TASK_STATUS = {
    ASSIGNED:    { color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', label: 'Assigned'    },
    IN_PROGRESS: { color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', label: 'In Progress' },
    COMPLETED:   { color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', label: 'Completed'   },
    CANCELLED:   { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', label: 'Cancelled'   },
  };

  return (
    <div style={{ background: 'white', border: '1.5px solid #D1FAE5', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(22,163,74,0.06)' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #D1FAE5' }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: '#0F2419', marginBottom: 2 }}>All Tasks</div>
        <div style={{ fontSize: 12, color: '#86BFAA' }}>{tasks.length} tasks total</div>
      </div>
      {loading ? (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3].map(i => <Skeleton key={i} h={64} />)}</div>
      ) : tasks.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#86BFAA' }}>
          <CheckCircle size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
          <div style={{ fontWeight: 700, color: '#4B7A5E' }}>No tasks yet</div>
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {tasks.map(task => {
            const sc = TASK_STATUS[task.status] || TASK_STATUS.ASSIGNED;
            return (
              <div key={task.id} style={{ padding: '14px 24px', borderBottom: '1px solid #F0FFF4', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F6FEF9'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: task.notes ? 6 : 0 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0F2419' }}>Task #{task.id}</div>
                    <div style={{ fontSize: 11, color: '#86BFAA', marginTop: 2 }}>
                      Need #{task.needId || task.need?.id} → {task.volunteerName || task.volunteer?.name || 'Unassigned'}
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 9999, background: sc.bg, border: `1px solid ${sc.border}`, fontSize: 11, fontWeight: 700, color: sc.color }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.color, display: 'inline-block' }} />
                    {sc.label}
                  </span>
                </div>
                {task.notes && <div style={{ fontSize: 12, color: '#4B7A5E', background: '#F6FEF9', padding: '6px 10px', borderRadius: 8 }}>{task.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function CoordinatorDashboard() {
  const [stats,        setStats]        = useState(null);
  const [needs,        setNeeds]        = useState([]);
  const [volunteers,   setVolunteers]   = useState([]);
  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('overview');
  // FIX ②: state is inside the component
  const [assigningNeed, setAssigningNeed] = useState(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.cd-hero',  { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1  });
      gsap.fromTo('.cd-tabs', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.22 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!stats) return;
    const t = setTimeout(() => {
      gsap.fromTo('.stat-card', { opacity: 0, y: 24, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)', clearProps: 'transform' });
    }, 60);
    return () => clearTimeout(t);
  }, [stats]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, needsRes, volsRes, tasksRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        needsAPI.getAll({}),
        volunteersAPI.getAll(false),
        tasksAPI.getAll(),
      ]);

      if (volsRes.status === 'fulfilled') {
        const vols = volsRes.value.data || [];
        setVolunteers(vols);
        if (statsRes.status === 'fulfilled') {
          const s = statsRes.value.data;
          s.totalVolunteers     = vols.length;
          s.availableVolunteers = vols.filter(isVolAvailable).length;
          setStats(s);
        }
      } else if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      if (needsRes.status === 'fulfilled') setNeeds(needsRes.value.data || []);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data || []);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleAnalyze = async (needId) => {
    try {
      toast.loading('Analyzing...', { id: 'analyze' });
      await needsAPI.analyze(needId);
      toast.success('AI analysis triggered!', { id: 'analyze' });
      setTimeout(loadAll, 1500);
    } catch {
      toast.error('Analysis failed', { id: 'analyze' });
    }
  };

  const TABS = [
    { id: 'overview',   label: 'Overview',   icon: <BarChart2 size={15} /> },
    { id: 'needs',      label: 'All Needs',  icon: <FileText  size={15} /> },
    { id: 'volunteers', label: 'Volunteers', icon: <Users     size={15} /> },
    { id: 'tasks',      label: 'Tasks',      icon: <Activity  size={15} /> },
  ];

  return (
    <div ref={pageRef} style={{ minHeight: '100vh', background: '#F8FFFE', fontFamily: 'inherit' }}>
      <style>{`
        @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <Topbar onRefresh={loadAll} loading={loading} />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px' }}>

        {/* Hero */}
        <div className="cd-hero" style={{ marginBottom: 28, opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 30, color: '#0F2419', marginBottom: 6 }}>Coordinator Dashboard</h1>
              <p style={{ fontSize: 15, color: '#4B7A5E', lineHeight: 1.6 }}>
                Monitor all community needs, manage volunteers, and track mission resolution in real time.
              </p>
            </div>
            {stats && (
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'CRITICAL', value: stats.criticalNeeds,      border: '#FECACA', color: '#EF4444', shadow: 'rgba(239,68,68,0.1)'  },
                  { label: 'READY',    value: stats.availableVolunteers, border: '#A7F3D0', color: '#16A34A', shadow: 'rgba(22,163,74,0.1)'  },
                  { label: 'ACTIVE',   value: stats.activeTasks,         border: '#BFDBFE', color: '#3B82F6', shadow: 'rgba(59,130,246,0.1)' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '14px 20px', background: 'white', border: `1.5px solid ${item.border}`, borderRadius: 16, textAlign: 'center', minWidth: 100, boxShadow: `0 2px 10px ${item.shadow}` }}>
                    <div style={{ fontWeight: 800, fontSize: 28, color: item.color, lineHeight: 1 }}>{item.value ?? '—'}</div>
                    <div style={{ fontSize: 11, color: '#86BFAA', marginTop: 3, fontWeight: 600 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="cd-tabs" style={{ display: 'flex', gap: 4, background: '#F0FFF4', padding: 4, borderRadius: 16, border: '1px solid #D1FAE5', marginBottom: 24, opacity: 0, width: 'fit-content' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: active ? 'white' : 'transparent', color: active ? '#15803D' : '#86BFAA', boxShadow: active ? '0 1px 4px rgba(22,163,74,0.12)' : 'none' }}>
                {tab.icon}{tab.label}
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            <StatCards stats={stats} volunteers={volunteers} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Critical needs */}
              <div style={{ background: 'white', border: '1.5px solid #FECACA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(239,68,68,0.08)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #FEE2E2', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={18} color="#EF4444" />
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#991B1B' }}>Critical & High Priority</div>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {loading ? [1, 2, 3].map(i => <div key={i} style={{ padding: '12px 20px' }}><Skeleton h={50} /></div>) :
                    needs.filter(n => ['CRITICAL', 'HIGH'].includes(n.urgency) && n.status !== 'RESOLVED')
                      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)).slice(0, 8)
                      .map(need => (
                        <div key={need.id} style={{ padding: '12px 20px', borderBottom: '1px solid #FEF2F2', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 15 }}>{CATEGORY_ICONS[need.category] || '📦'}</span>
                              <span style={{ fontWeight: 600, fontSize: 13, color: '#0F2419', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{need.title}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#86BFAA', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontFamily: 'monospace', color: '#EF4444' }}>#{need.id}</span>
                              {need.locationName && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{need.locationName}</span>}
                            </div>
                            {need.aiReasoning && <div style={{ fontSize: 11, color: '#7F1D1D', marginTop: 5, background: '#FFF5F5', padding: '5px 8px', borderRadius: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{need.aiReasoning}</div>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                            <UrgencyBadge urgency={need.urgency} />
                            <StatusBadge status={need.status} />
                            {need.priorityScore && <span style={{ fontWeight: 800, fontSize: 18, color: '#EF4444' }}>{need.priorityScore}</span>}
                          </div>
                        </div>
                      ))
                  }
                  {!loading && needs.filter(n => ['CRITICAL', 'HIGH'].includes(n.urgency) && n.status !== 'RESOLVED').length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#86BFAA' }}>
                      <CheckCircle size={28} color="#22C55E" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontWeight: 700, color: '#15803D' }}>No critical needs!</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent submissions */}
              <div style={{ background: 'white', border: '1.5px solid #D1FAE5', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(22,163,74,0.06)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={18} color="#16A34A" />
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0F2419' }}>Recent Submissions</div>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {loading ? [1, 2, 3].map(i => <div key={i} style={{ padding: '12px 20px' }}><Skeleton h={50} /></div>) :
                    [...needs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8).map(need => (
                      <div key={need.id} style={{ padding: '12px 20px', borderBottom: '1px solid #F0FFF4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F6FEF9'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[need.category] || '📦'}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#0F2419', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{need.title}</div>
                            <div style={{ fontSize: 11, color: '#86BFAA', marginTop: 2 }}>
                              {need.createdAt ? new Date(need.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <StatusBadge status={need.status} />
                          {need.urgency && <UrgencyBadge urgency={need.urgency} />}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Volunteer availability */}
              <div style={{ background: 'white', border: '1.5px solid #D1FAE5', borderRadius: 20, padding: '20px 24px', boxShadow: '0 1px 4px rgba(22,163,74,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Users size={18} color="#16A34A" />
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0F2419' }}>Volunteer Availability</div>
                </div>
                {loading ? <Skeleton h={140} /> : (
                  <>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      {[
                        { label: 'Available', value: volunteers.filter(isVolAvailable).length, color: '#22C55E', bg: '#F0FDF4' },
                        { label: 'Total',     value: volunteers.length,                        color: '#3B82F6', bg: '#EFF6FF' },
                      ].map((item, i) => (
                        <div key={i} style={{ flex: 1, padding: '14px 16px', background: item.bg, borderRadius: 12, textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: 32, color: item.color }}>{item.value}</div>
                          <div style={{ fontSize: 12, color: '#86BFAA', marginTop: 4 }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                    {volunteers.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#86BFAA', marginBottom: 6 }}>
                          <span>Availability rate</span>
                          <span style={{ fontWeight: 700, color: '#15803D' }}>
                            {Math.round((volunteers.filter(isVolAvailable).length / volunteers.length) * 100)}%
                          </span>
                        </div>
                        <div style={{ height: 8, background: '#F0FFF4', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(volunteers.filter(isVolAvailable).length / volunteers.length) * 100}%`, background: 'linear-gradient(90deg,#22C55E,#16A34A)', borderRadius: 9999 }} />
                        </div>
                      </div>
                    )}
                    {volunteers.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#86BFAA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Top Skills</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {Object.entries(
                            volunteers.reduce((acc, v) => {
                              (v.skills || '').split(',').forEach(s => { const t = s.trim(); if (t) { acc[t] = (acc[t] || 0) + 1; } });
                              return acc;
                            }, {})
                          ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([skill, count]) => (
                            <span key={skill} style={{ padding: '4px 10px', borderRadius: 9999, background: '#F0FFF4', border: '1px solid #A7F3D0', fontSize: 12, color: '#15803D', fontWeight: 500 }}>
                              {skill} <strong>({count})</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Resolution overview */}
              <div style={{ background: 'white', border: '1.5px solid #D1FAE5', borderRadius: 20, padding: '20px 24px', boxShadow: '0 1px 4px rgba(22,163,74,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <TrendingUp size={18} color="#16A34A" />
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0F2419' }}>Resolution Overview</div>
                </div>
                {loading || !stats ? <Skeleton h={140} /> : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      {[
                        { label: 'Open',           value: stats.openNeeds,      color: '#3B82F6' },
                        { label: 'Assigned',        value: stats.assignedNeeds,  color: '#F97316' },
                        { label: 'Resolved',        value: stats.resolvedNeeds,  color: '#22C55E' },
                        { label: 'Completed Tasks', value: stats.completedTasks, color: '#8B5CF6' },
                      ].map((item, i) => (
                        <div key={i} style={{ padding: '12px 14px', background: '#F6FEF9', borderRadius: 12, border: '1px solid #D1FAE5' }}>
                          <div style={{ fontSize: 11, color: '#86BFAA', fontWeight: 600, marginBottom: 5 }}>{item.label}</div>
                          <div style={{ fontWeight: 800, fontSize: 26, color: item.color }}>{item.value ?? '—'}</div>
                        </div>
                      ))}
                    </div>
                    {stats.totalNeeds > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#86BFAA', marginBottom: 6 }}>
                          <span>Resolution rate</span>
                          <span style={{ fontWeight: 700, color: '#15803D' }}>{Math.round((stats.resolvedNeeds / stats.totalNeeds) * 100)}%</span>
                        </div>
                        <div style={{ height: 8, background: '#F0FFF4', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(stats.resolvedNeeds / stats.totalNeeds) * 100}%`, background: 'linear-gradient(90deg,#22C55E,#16A34A)', borderRadius: 9999 }} />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* FIX ⑤: pass onAssign to NeedsTable */}
        {activeTab === 'needs'      && <NeedsTable     needs={needs}           loading={loading} onAnalyze={handleAnalyze} onAssign={setAssigningNeed} />}
        {activeTab === 'volunteers' && <VolunteersPanel volunteers={volunteers} loading={loading} />}
        {activeTab === 'tasks'      && <TasksPanel      tasks={tasks}           loading={loading} />}
      </div>

      {/* FIX ⑥: modal rendered inside the component, outside the scrollable div */}
      {assigningNeed && (
        <AssignVolunteerModal
          need={assigningNeed}
          onClose={() => setAssigningNeed(null)}
          onAssigned={loadAll}
        />
      )}
    </div>
  );
}