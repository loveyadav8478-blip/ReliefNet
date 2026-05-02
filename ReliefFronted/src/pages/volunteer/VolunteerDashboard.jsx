import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  Leaf, LogOut, RefreshCw, MapPin, Clock, CheckCircle,
  AlertCircle, Zap, Activity, FileText, User,
  ToggleLeft, ToggleRight, Phone, Mail, Radius
} from 'lucide-react';
import toast from 'react-hot-toast';
import { needsAPI, volunteersAPI, tasksAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const CATEGORY_ICONS = { FOOD: '🥫', MEDICAL: '🏥', SHELTER: '🏠', WATER: '💧', OTHER: '📦' };

const URGENCY_CFG = {
  CRITICAL: { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', label: 'Critical' },
  HIGH:     { color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', label: 'High'     },
  MEDIUM:   { color: '#EAB308', bg: '#FEFCE8', border: '#FEF08A', label: 'Medium'   },
  LOW:      { color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', label: 'Low'      },
};

const TASK_STATUS_CFG = {
  ASSIGNED:    { color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', label: 'Assigned',    progress: '25%'  },
  IN_PROGRESS: { color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', label: 'In Progress', progress: '65%'  },
  COMPLETED:   { color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', label: 'Completed',   progress: '100%' },
  CANCELLED:   { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', label: 'Cancelled',   progress: '0%'   },
};

// ── HELPERS ────────────────────────────────────────────────────────────────────
// VolunteerResponse uses @JsonProperty("isAvailable") so it comes as "isAvailable"
// const isVolAvailable = (v) => v?.isAvailable ?? v?.available ?? false;
const isVolAvailable = (v) => !!v?.isAvailable;

// ── ATOMS ──────────────────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  const c = URGENCY_CFG[urgency];
  if (!c) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 9999, background: c.bg, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

function TaskBadge({ status }) {
  const c = TASK_STATUS_CFG[status];
  if (!c) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 9999, background: c.bg, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 700, color: c.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

function Skeleton({ h = 80 }) {
  return (
    <div style={{ height: h, borderRadius: 16, background: 'linear-gradient(90deg,#F0FFF4 25%,#DCFCE7 50%,#F0FFF4 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
  );
}

// ── TOPBAR ─────────────────────────────────────────────────────────────────────
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
          <div style={{ fontSize: 9, color: '#86BFAA', letterSpacing: '0.08em', marginTop: 1 }}>VOLUNTEER PORTAL</div>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onRefresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9999, border: '1.5px solid #A7F3D0', background: 'white', color: '#15803D', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F0FFF4'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
          <RefreshCw size={13} style={loading ? { animation: 'spin .7s linear infinite' } : {}} />
          Refresh
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#F0FFF4', border: '1px solid #D1FAE5', borderRadius: 9999 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#DCFCE7', border: '1.5px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#166634' }}>
            {user?.name?.[0]?.toUpperCase() || 'V'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F2419', lineHeight: 1 }}>{user?.name || 'Volunteer'}</div>
            <div style={{ fontSize: 10, color: '#86BFAA', marginTop: 1 }}>Field Volunteer</div>
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

// ── AVAILABILITY TOGGLE CARD ───────────────────────────────────────────────────
function AvailabilityCard({ volunteer, onToggle, toggling }) {
  if (!volunteer) return <Skeleton h={130} />;

  const avail = isVolAvailable(volunteer);

  return (
    <div style={{
      background: avail
        ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)'
        : 'linear-gradient(135deg, #F9FAFB, #F3F4F6)',
      border: `2px solid ${avail ? '#86EFAC' : '#D1D5DB'}`,
      borderRadius: 20, padding: '24px 28px',
      boxShadow: avail ? '0 4px 24px rgba(22,163,74,0.15)' : '0 4px 24px rgba(0,0,0,0.06)',
      transition: 'all .4s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: avail ? '#15803D' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Your Status
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: avail ? '#14532D' : '#374151', marginBottom: 4 }}>
            {avail ? '✅ Available for missions' : '⏸️ Currently unavailable'}
          </div>
          <div style={{ fontSize: 13, color: avail ? '#166534' : '#6B7280' }}>
            {avail
              ? 'Coordinators can assign you to active needs.'
              : 'Toggle on when you\'re ready to help.'}
          </div>
        </div>

        <button
          onClick={() => onToggle(!avail)}
          disabled={toggling}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: toggling ? 'not-allowed' : 'pointer',
            opacity: toggling ? 0.6 : 1, transition: 'all .2s', padding: 8,
          }}>
          {avail
            ? <ToggleRight size={56} color="#16A34A" strokeWidth={1.5} />
            : <ToggleLeft  size={56} color="#9CA3AF" strokeWidth={1.5} />}
          <span style={{ fontSize: 11, fontWeight: 700, color: avail ? '#16A34A' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {toggling ? 'Updating…' : avail ? 'Mark Unavailable' : 'Mark Available'}
          </span>
        </button>
      </div>

      {/* Profile chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
        {volunteer.email && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: 'white', borderRadius: 9999, border: '1px solid #D1FAE5', fontSize: 12, color: '#4B7A5E' }}>
            <Mail size={11} color="#16A34A" />{volunteer.email}
          </span>
        )}
        {volunteer.phone && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: 'white', borderRadius: 9999, border: '1px solid #D1FAE5', fontSize: 12, color: '#4B7A5E' }}>
            <Phone size={11} color="#16A34A" />{volunteer.phone}
          </span>
        )}
        {volunteer.locationName && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: 'white', borderRadius: 9999, border: '1px solid #D1FAE5', fontSize: 12, color: '#4B7A5E' }}>
            <MapPin size={11} color="#16A34A" />{volunteer.locationName}
          </span>
        )}
        {volunteer.radiusKm && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: 'white', borderRadius: 9999, border: '1px solid #D1FAE5', fontSize: 12, color: '#4B7A5E' }}>
            <Radius size={11} color="#16A34A" />{volunteer.radiusKm}km radius
          </span>
        )}
        {volunteer.skillList?.filter(s => s.trim()).map(skill => (
          <span key={skill} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: avail ? '#DCFCE7' : '#F3F4F6', borderRadius: 9999, border: `1px solid ${avail ? '#A7F3D0' : '#E5E7EB'}`, fontSize: 12, color: avail ? '#15803D' : '#6B7280', fontWeight: 600 }}>
            🛠 {skill.trim()}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── STAT CARDS ─────────────────────────────────────────────────────────────────
function StatCards({ needs, myTasks }) {
  const openNeeds     = needs.filter(n => n.status === 'OPEN').length;
  const criticalNeeds = needs.filter(n => n.urgency === 'CRITICAL').length;
  const myActive      = myTasks.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
  const myCompleted   = myTasks.filter(t => t.status === 'COMPLETED').length;

  const cards = [
    { label: 'Open Needs',      value: openNeeds,     color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', icon: <FileText   size={18} />, sub: 'Awaiting help'     },
    { label: 'Critical Needs',  value: criticalNeeds, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: <AlertCircle size={18}/>, sub: 'Urgent attention'  },
    { label: 'My Active Tasks', value: myActive,      color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', icon: <Activity   size={18} />, sub: 'In progress'       },
    { label: 'Completed',       value: myCompleted,   color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', icon: <CheckCircle size={18}/>, sub: 'Missions resolved' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
      {cards.map((c, i) => (
        <div key={i} className="stat-card" style={{ background: 'white', border: `1.5px solid ${c.border}`, borderRadius: 20, padding: '18px 20px', boxShadow: `0 2px 12px ${c.color}18`, opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#86BFAA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>{c.icon}</div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 36, color: c.color, lineHeight: 1, marginBottom: 4 }}>{c.value}</div>
          <div style={{ fontSize: 12, color: '#86BFAA' }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── MY TASKS PANEL ─────────────────────────────────────────────────────────────
function MyTasksPanel({ tasks, loading, onUpdateStatus }) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2].map(i => <Skeleton key={i} h={90} />)}
    </div>
  );

  if (tasks.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 24px', background: 'white', borderRadius: 20, border: '1.5px solid #D1FAE5' }}>
      <CheckCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.3, color: '#16A34A' }} />
      <div style={{ fontWeight: 700, fontSize: 16, color: '#4B7A5E', marginBottom: 4 }}>No tasks assigned yet</div>
      <div style={{ fontSize: 13, color: '#86BFAA' }}>A coordinator will assign you to a need when you're available.</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {tasks.map(task => {
        const sc = TASK_STATUS_CFG[task.status] || TASK_STATUS_CFG.ASSIGNED;
        const uc = URGENCY_CFG[task.needUrgency];
        return (
          <div key={task.id} className="task-card" style={{ background: 'white', border: `1.5px solid ${sc.border}`, borderLeft: `5px solid ${sc.color}`, borderRadius: 20, padding: '20px 24px', opacity: 0, transition: 'box-shadow .2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(22,163,74,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[task.needCategory] || '📦'}</span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#0F2419' }}>{task.needTitle}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#86BFAA', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', color: '#16A34A', fontWeight: 700, background: '#F0FFF4', padding: '1px 7px', borderRadius: 6 }}>Task #{task.id}</span>
                  {task.needCategory && <span>📂 {task.needCategory}</span>}
                  {task.assignedAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {new Date(task.assignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <TaskBadge status={task.status} />
                {task.needUrgency && <UrgencyBadge urgency={task.needUrgency} />}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#86BFAA', marginBottom: 5 }}>
                <span>Task progress</span>
                <span style={{ fontWeight: 700, color: sc.color }}>{sc.progress}</span>
              </div>
              <div style={{ height: 5, background: '#F0FFF4', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: sc.progress, background: sc.color, borderRadius: 9999, transition: 'width 1s ease' }} />
              </div>
            </div>

            {task.notes && (
              <div style={{ fontSize: 12, color: '#4B7A5E', background: '#F6FEF9', padding: '8px 12px', borderRadius: 10, marginBottom: 14, border: '1px solid #D1FAE5' }}>
                📝 {task.notes}
              </div>
            )}

            {/* Action buttons — only show relevant transitions */}
            {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {task.status === 'ASSIGNED' && (
                  <button onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #A7F3D0', background: '#F0FFF4', color: '#15803D', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F0FFF4'}>
                    <Activity size={13} /> Start Task
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button onClick={() => onUpdateStatus(task.id, 'COMPLETED')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #86EFAC', background: 'linear-gradient(135deg,#16A34A,#15803D)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s', boxShadow: '0 3px 10px rgba(22,163,74,0.25)' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = ''}>
                    <CheckCircle size={13} /> Mark Complete
                  </button>
                )}
              </div>
            )}

            {task.status === 'COMPLETED' && task.completedAt && (
              <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={13} /> Completed on {new Date(task.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── COMMUNITY NEEDS PANEL ──────────────────────────────────────────────────────
function CommunityNeedsPanel({ needs, loading }) {
  const [urgencyF, setUrgencyF] = useState('ALL');

  const filtered = urgencyF === 'ALL'
    ? needs
    : needs.filter(n => n.urgency === urgencyF);

  const btnStyle = (active, color) => ({
    padding: '6px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, transition: 'all .2s',
    background: active ? color : 'white',
    color:      active ? 'white' : '#86BFAA',
    outline:    active ? 'none'  : '1.5px solid #D1FAE5',
    boxShadow:  active ? `0 2px 8px ${color}40` : 'none',
  });

  return (
    <div style={{ background: 'white', border: '1.5px solid #D1FAE5', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(22,163,74,0.06)' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#0F2419', marginBottom: 2 }}>Community Needs</div>
          <div style={{ fontSize: 12, color: '#86BFAA' }}>{filtered.length} of {needs.length} open needs</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(u => (
            <button key={u} onClick={() => setUrgencyF(u)}
              style={btnStyle(urgencyF === u, u === 'ALL' ? '#16A34A' : URGENCY_CFG[u]?.color || '#16A34A')}>
              {u === 'ALL' ? 'All' : URGENCY_CFG[u]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} h={80} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#86BFAA' }}>
          <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontWeight: 700, fontSize: 15, color: '#4B7A5E' }}>No needs found</div>
        </div>
      ) : (
        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {filtered.map(need => {
            const uc = URGENCY_CFG[need.urgency];
            const leftColor = uc ? uc.color : '#D1FAE5';
            return (
              <div key={need.id} style={{ padding: '16px 24px', borderBottom: '1px solid #F0FFF4', borderLeft: `4px solid ${leftColor}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F6FEF9'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[need.category] || '📦'}</span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#0F2419', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{need.title}</span>
                  </div>

                  {need.description && (
                    <p style={{ fontSize: 12, color: '#4B7A5E', lineHeight: 1.55, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {need.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#86BFAA', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', color: '#16A34A', fontWeight: 700 }}>#{need.id}</span>
                    {need.locationName && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={10} />{need.locationName}
                      </span>
                    )}
                    {need.createdAt && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} />{new Date(need.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {need.source && (
                      <span style={{ padding: '1px 7px', borderRadius: 9999, background: '#F0FFF4', border: '1px solid #D1FAE5', color: '#16A34A', fontWeight: 600 }}>{need.source}</span>
                    )}
                  </div>

                  {need.aiReasoning && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'flex-start', padding: '7px 10px', background: '#F0FFF4', border: '1px solid #A7F3D0', borderRadius: 8, fontSize: 11, color: '#1A4731', lineHeight: 1.5 }}>
                      <Zap size={11} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span><strong style={{ color: '#15803D' }}>AI: </strong>{need.aiReasoning}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  {need.urgency && <UrgencyBadge urgency={need.urgency} />}
                  {need.priorityScore && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: 20, color: need.priorityScore >= 80 ? '#EF4444' : need.priorityScore >= 60 ? '#F97316' : '#EAB308', lineHeight: 1 }}>{need.priorityScore}</div>
                      <div style={{ fontSize: 9, color: '#86BFAA' }}>priority</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [volunteer,  setVolunteer]  = useState(null);
  const [needs,      setNeeds]      = useState([]);
  const [myTasks,    setMyTasks]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [toggling,   setToggling]   = useState(false);
  const [activeTab,  setActiveTab]  = useState('overview');
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.vd-hero', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 });
      gsap.fromTo('.vd-tabs', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.22 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      gsap.fromTo('.stat-card', { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.07, ease: 'back.out(1.4)', clearProps: 'transform' });
    }, 60);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      gsap.fromTo('.task-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', clearProps: 'transform' });
    }, 80);
    return () => clearTimeout(t);
  }, [loading, activeTab]);

  // Find volunteer profile matching the logged-in user's email
//   const findMyVolunteerProfile = useCallback(async () => {
//     try {
//       const res = await volunteersAPI.getAll(false);
//       const all = res.data || [];
//       // Match by email (set during auto-creation in AuthService)
//       const mine = all.find(v => v.email === user?.email);
//       return mine || null;
//     } catch {
//       return null;
//     }
//   }, [user?.email]);

// const findMyVolunteerProfile = useCallback(async () => {
//   try {
//     const res = await volunteersAPI.getMe();
//     return res.data;
//   } catch {
//     return null;
//   }
// }, []);
const findMyVolunteerProfile = useCallback(async () => {
  try {
    const res = await volunteersAPI.getAll(false);
    const all = res.data || [];

    // ✅ Match logged-in user with volunteer
    const mine = all.find(v => v.email === user?.email);

    return mine || null;
  } catch (err) {
    console.error("Error fetching volunteer:", err);
    return null;
  }
}, [user?.email]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [volProfile, needsRes] = await Promise.allSettled([
        findMyVolunteerProfile(),
        needsAPI.getAll({ status: 'OPEN' }),
      ]);

      const vol = volProfile.status === 'fulfilled' ? volProfile.value : null;
      setVolunteer(vol);

      if (needsRes.status === 'fulfilled') setNeeds(needsRes.value.data || []);

      // Load my tasks if we found the volunteer profile
      if (vol?.id) {
        try {
          const tasksRes = await tasksAPI.getByVolunteer(vol.id);
          setMyTasks(tasksRes.data || []);
        } catch {
          setMyTasks([]);
        }
      }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [findMyVolunteerProfile]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleToggleAvailability = async (newVal) => {
    if (!volunteer?.id) {
      toast.error('Volunteer profile not found. Contact your coordinator.');
      return;
    }
    setToggling(true);
    try {
      const res = await volunteersAPI.updateAvailability(volunteer.id, newVal);
      setVolunteer(res.data);
      toast.success(newVal ? '✅ You are now available!' : '⏸️ Marked as unavailable');
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setToggling(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
      toast.success(`Task marked as ${newStatus.replace('_', ' ').toLowerCase()}`);
      // Refresh tasks
      if (volunteer?.id) {
        const res = await tasksAPI.getByVolunteer(volunteer.id);
        setMyTasks(res.data || []);
      }
    } catch {
      toast.error('Failed to update task status');
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview',         icon: <Activity  size={14} /> },
    { id: 'needs',    label: 'Community Needs',  icon: <FileText  size={14} /> },
    { id: 'tasks',    label: `My Tasks${myTasks.length ? ` (${myTasks.length})` : ''}`, icon: <CheckCircle size={14} /> },
  ];

  return (
    <div ref={pageRef} style={{ minHeight: '100vh', background: '#F8FFFE', fontFamily: 'inherit' }}>
      <style>{`
        @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      <Topbar onRefresh={loadAll} loading={loading} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>

        {/* Hero */}
        <div className="vd-hero" style={{ marginBottom: 28, opacity: 0 }}>
          <h1 style={{ fontWeight: 800, fontSize: 30, color: '#0F2419', marginBottom: 6 }}>
            Welcome, {user?.name?.split(' ')[0] || 'Volunteer'} 👋
          </h1>
          <p style={{ fontSize: 15, color: '#4B7A5E', lineHeight: 1.6 }}>
            View open community needs, manage your tasks, and update your availability below.
          </p>
        </div>

        {/* Availability toggle — always visible */}
        <div style={{ marginBottom: 24 }}>
          {loading
            ? <Skeleton h={130} />
            : <AvailabilityCard volunteer={volunteer} onToggle={handleToggleAvailability} toggling={toggling} />
          }
        </div>

        {/* Stat cards */}
        {!loading && <StatCards needs={needs} myTasks={myTasks} />}

        {/* Tabs */}
        <div className="vd-tabs" style={{ display: 'flex', gap: 4, background: '#F0FFF4', padding: 4, borderRadius: 16, border: '1px solid #D1FAE5', marginBottom: 24, opacity: 0, width: 'fit-content' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Critical needs snapshot */}
            <div style={{ background: 'white', border: '1.5px solid #FECACA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(239,68,68,0.07)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #FEE2E2', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} color="#EF4444" />
                <span style={{ fontWeight: 800, fontSize: 15, color: '#991B1B' }}>Critical & High Priority</span>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {loading ? [1, 2, 3].map(i => <div key={i} style={{ padding: '12px 20px' }}><Skeleton h={50} /></div>) :
                  needs.filter(n => ['CRITICAL', 'HIGH'].includes(n.urgency))
                    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
                    .slice(0, 6).map(need => (
                      <div key={need.id} style={{ padding: '12px 20px', borderBottom: '1px solid #FEF2F2', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span>{CATEGORY_ICONS[need.category] || '📦'}</span>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#0F2419', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{need.title}</span>
                          </div>
                          {need.locationName && (
                            <span style={{ fontSize: 11, color: '#86BFAA', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <MapPin size={9} />{need.locationName}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <UrgencyBadge urgency={need.urgency} />
                          {need.priorityScore && <span style={{ fontWeight: 800, fontSize: 16, color: '#EF4444' }}>{need.priorityScore}</span>}
                        </div>
                      </div>
                    ))
                }
                {!loading && needs.filter(n => ['CRITICAL', 'HIGH'].includes(n.urgency)).length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#86BFAA' }}>
                    <CheckCircle size={24} color="#22C55E" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 700, color: '#15803D', fontSize: 13 }}>No critical needs right now</div>
                  </div>
                )}
              </div>
            </div>

            {/* My tasks snapshot */}
            <div style={{ background: 'white', border: '1.5px solid #D1FAE5', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(22,163,74,0.06)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} color="#16A34A" />
                <span style={{ fontWeight: 800, fontSize: 15, color: '#0F2419' }}>My Active Tasks</span>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {loading ? [1, 2].map(i => <div key={i} style={{ padding: '12px 20px' }}><Skeleton h={60} /></div>) :
                  myTasks.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#86BFAA' }}>
                      <Activity size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                      <div style={{ fontWeight: 700, color: '#4B7A5E', fontSize: 13 }}>No active tasks</div>
                    </div>
                  ) : myTasks.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).map(task => {
                    const sc = TASK_STATUS_CFG[task.status];
                    return (
                      <div key={task.id} style={{ padding: '12px 20px', borderBottom: '1px solid #F0FFF4', borderLeft: `3px solid ${sc.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#0F2419', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.needTitle}</span>
                          <TaskBadge status={task.status} />
                        </div>
                        <div style={{ height: 4, background: '#F0FFF4', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: sc.progress, background: sc.color, borderRadius: 9999 }} />
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        )}

        {/* ── NEEDS TAB ── */}
        {activeTab === 'needs' && (
          <CommunityNeedsPanel needs={needs} loading={loading} />
        )}

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#0F2419', marginBottom: 4 }}>My Assigned Tasks</div>
              <div style={{ fontSize: 13, color: '#86BFAA' }}>Tasks assigned to you by coordinators. Update status as you progress.</div>
            </div>
            <MyTasksPanel tasks={myTasks} loading={loading} onUpdateStatus={handleUpdateTaskStatus} />
          </div>
        )}
      </div>
    </div>
  );
}