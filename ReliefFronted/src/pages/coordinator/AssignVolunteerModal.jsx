/**
 * src/pages/coordinator/AssignVolunteerModal.jsx
 *
 * ── HOW TO WIRE INTO CoordinatorDashboard.jsx ────────────────────────────────
 *
 * 1. Import at the top:
 *      import AssignVolunteerModal from './AssignVolunteerModal';
 *
 * 2. Add state:
 *      const [assigningNeed, setAssigningNeed] = useState(null);
 *
 * 3. In the NeedsTable component signature add the onAssign prop:
 *      function NeedsTable({ needs, loading, onAnalyze, onAssign }) { ... }
 *
 * 4. Inside NeedsTable's action <td>, add an Assign button next to Analyze:
 *
 *      <td style={{ padding: '14px 16px' }}>
 *        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
 *          <button onClick={() => onAnalyze(need.id)} ...><Zap size={12}/>Analyze</button>
 *
 *          <button
 *            onClick={() => onAssign(need)}
 *            style={{
 *              display: 'flex', alignItems: 'center', gap: 4,
 *              padding: '5px 10px', borderRadius: 8,
 *              border: '1px solid #BFDBFE', background: '#EFF6FF',
 *              color: '#1D4ED8', fontSize: 11, fontWeight: 600,
 *              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
 *            }}
 *            onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
 *            onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}
 *          >
 *            <UserCheck size={12} /> Assign
 *          </button>
 *        </div>
 *      </td>
 *
 * 5. Pass prop when rendering NeedsTable:
 *      <NeedsTable needs={needs} loading={loading}
 *                  onAnalyze={handleAnalyze} onAssign={setAssigningNeed} />
 *
 * 6. Render the modal at the bottom of CoordinatorDashboard's return:
 *      {assigningNeed && (
 *        <AssignVolunteerModal
 *          need={assigningNeed}
 *          onClose={() => setAssigningNeed(null)}
 *          onAssigned={loadAll}
 *        />
 *      )}
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * No backend changes needed — your existing TaskController + TaskService handle
 * POST /api/tasks with { needId, volunteerId, notes } perfectly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Users, MapPin, CheckCircle, UserCheck,
  Search, ChevronRight, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { volunteersAPI, tasksAPI } from '../../services/api';

// ── constants ──────────────────────────────────────────────────────────────────
const CATEGORY_ICONS = { FOOD: '🥫', MEDICAL: '🏥', SHELTER: '🏠', WATER: '💧', OTHER: '📦' };

const URGENCY_CFG = {
  CRITICAL: { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', label: 'Critical' },
  HIGH:     { color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', label: 'High'     },
  MEDIUM:   { color: '#EAB308', bg: '#FEFCE8', border: '#FEF08A', label: 'Medium'   },
  LOW:      { color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', label: 'Low'      },
};

// ── helpers ────────────────────────────────────────────────────────────────────
// Your Volunteer entity uses setIsAvailable / isAvailable
const isAvail = (v) => v?.isAvailable ?? v?.available ?? false;

function getSkills(v) {
  if (Array.isArray(v.skillList) && v.skillList.length)
    return v.skillList.map(s => s.trim()).filter(Boolean);
  if (v.skills)
    return v.skills.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton({ h = 88 }) {
  return (
    <div style={{
      height: h, borderRadius: 16,
      background: 'linear-gradient(90deg,#F0FFF4 25%,#DCFCE7 50%,#F0FFF4 75%)',
      backgroundSize: '200% 100%', animation: 'avm-shimmer 1.5s infinite',
    }} />
  );
}

// ── VolunteerCard ──────────────────────────────────────────────────────────────
function VolunteerCard({ volunteer, selected, onSelect }) {
  const avail      = isAvail(volunteer);
  const skills     = getSkills(volunteer);
  const isSelected = selected?.id === volunteer.id;

  return (
    <div
      role="button"
      tabIndex={avail ? 0 : -1}
      onClick={() => avail && onSelect(volunteer)}
      onKeyDown={e => e.key === 'Enter' && avail && onSelect(volunteer)}
      style={{
        padding: '16px 18px', borderRadius: 16, position: 'relative',
        border: `2px solid ${isSelected ? '#16A34A' : avail ? '#D1FAE5' : '#E5E7EB'}`,
        background: isSelected ? 'linear-gradient(135deg,#F0FDF4,#DCFCE7)' : avail ? 'white' : '#FAFAFA',
        cursor: avail ? 'pointer' : 'not-allowed',
        opacity: avail ? 1 : 0.5,
        transition: 'all .18s ease', outline: 'none',
        boxShadow: isSelected
          ? '0 0 0 3px rgba(22,163,74,0.15),0 4px 16px rgba(22,163,74,0.12)'
          : '0 1px 4px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => {
        if (!isSelected && avail) {
          e.currentTarget.style.borderColor = '#86EFAC';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,163,74,0.12)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = avail ? '#D1FAE5' : '#E5E7EB';
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
        }
      }}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 22, height: 22, borderRadius: '50%',
          background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={13} color="white" />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: isSelected ? '#DCFCE7' : avail ? '#F0FDF4' : '#F3F4F6',
          border: `2px solid ${isSelected ? '#86EFAC' : avail ? '#A7F3D0' : '#E5E7EB'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 15,
          color: isSelected ? '#14532D' : avail ? '#15803D' : '#9CA3AF',
        }}>
          {volunteer.name?.[0]?.toUpperCase() || 'V'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0F2419' }}>{volunteer.name}</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
              padding: '2px 8px', borderRadius: 9999,
              background: avail ? '#F0FDF4' : '#F9FAFB',
              border: `1px solid ${avail ? '#BBF7D0' : '#E5E7EB'}`,
              fontSize: 10, fontWeight: 700, color: avail ? '#22C55E' : '#9CA3AF',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: avail ? '#22C55E' : '#9CA3AF', display: 'inline-block' }} />
              {avail ? 'Available' : 'Unavailable'}
            </span>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#86BFAA', marginBottom: skills.length ? 8 : 0, flexWrap: 'wrap' }}>
            {volunteer.locationName && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={10} />{volunteer.locationName}
              </span>
            )}
            {volunteer.radiusKm && <span>{volunteer.radiusKm} km radius</span>}
            {volunteer.phone    && <span>📞 {volunteer.phone}</span>}
            {volunteer.email    && (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                {volunteer.email}
              </span>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {skills.slice(0, 5).map(skill => (
                <span key={skill} style={{
                  padding: '2px 8px', borderRadius: 9999,
                  background: isSelected ? '#DCFCE7' : '#F0FFF4',
                  border: `1px solid ${isSelected ? '#86EFAC' : '#A7F3D0'}`,
                  fontSize: 11, color: '#15803D', fontWeight: 500,
                }}>
                  🛠 {skill}
                </span>
              ))}
              {skills.length > 5 && (
                <span style={{ fontSize: 11, color: '#86BFAA', alignSelf: 'center' }}>
                  +{skills.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
export default function AssignVolunteerModal({ need, onClose, onAssigned }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showAll,    setShowAll]    = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [notes,      setNotes]      = useState('');
  const [assigning,  setAssigning]  = useState(false);
  const overlayRef = useRef(null);
  const modalRef   = useRef(null);

  // Load all volunteers (availableOnly=false → your api.js passes no param → returns all)
  useEffect(() => {
    (async () => {
      try {
        const res = await volunteersAPI.getAll(false);
        setVolunteers(res.data || []);
      } catch {
        toast.error('Could not load volunteers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Entrance animation (no extra deps — pure CSS transitions)
  useEffect(() => {
    const overlay = overlayRef.current;
    const modal   = modalRef.current;
    if (!overlay || !modal) return;
    overlay.style.opacity = '0';
    modal.style.opacity   = '0';
    modal.style.transform = 'scale(0.93) translateY(20px)';
    requestAnimationFrame(() => {
      overlay.style.transition = 'opacity 0.22s ease';
      modal.style.transition   = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease';
      overlay.style.opacity    = '1';
      modal.style.opacity      = '1';
      modal.style.transform    = 'scale(1) translateY(0)';
    });
  }, []);

  const handleClose = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '0';
      setTimeout(onClose, 200);
    } else onClose();
  }, [onClose]);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [handleClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Filter
  const availableVols = volunteers.filter(isAvail);
  const pool          = showAll ? volunteers : availableVols;
  const q             = search.toLowerCase();
  const filtered      = q
    ? pool.filter(v =>
        v.name?.toLowerCase().includes(q) ||
        v.locationName?.toLowerCase().includes(q) ||
        v.skills?.toLowerCase().includes(q) ||
        v.skillList?.some(s => s.toLowerCase().includes(q)) ||
        v.phone?.includes(q)
      )
    : pool;

  // Assign — calls tasksAPI.assign which maps to POST /api/tasks
  const handleAssign = async () => {
    if (!selected || assigning) return;
    setAssigning(true);
    try {
      await tasksAPI.assign({
        needId:      need.id,
        volunteerId: selected.id,
        notes:       notes.trim() || undefined,
      });
      toast.success(`✅ ${selected.name} assigned to "${need.title}"`);
      onAssigned?.();
      handleClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || 'Assignment failed';
      toast.error(typeof msg === 'string' ? msg : 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const uc = URGENCY_CFG[need?.urgency];

  return (
    <>
      <style>{`
        @keyframes avm-shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes avm-spin    { to{transform:rotate(360deg)} }
        .avm-scroll::-webkit-scrollbar       { width: 5px; }
        .avm-scroll::-webkit-scrollbar-track { background:#F0FFF4; border-radius:9999px; }
        .avm-scroll::-webkit-scrollbar-thumb { background:#A7F3D0; border-radius:9999px; }
      `}</style>

      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={e => { if (e.target === overlayRef.current) handleClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,36,25,0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}
      >
        {/* Modal shell */}
        <div
          ref={modalRef}
          style={{
            width: '100%', maxWidth: 660, maxHeight: '88vh',
            background: 'white', borderRadius: 24, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 32px 80px rgba(15,36,25,0.28),0 0 0 1px rgba(22,163,74,0.1)',
          }}
        >

          {/* ── HEADER ── */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #D1FAE5',
            background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg,#16A34A,#15803D)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 3px 10px rgba(22,163,74,0.3)',
                  }}>
                    <UserCheck size={17} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: '#0F2419', lineHeight: 1 }}>
                      Assign Volunteer
                    </div>
                    <div style={{ fontSize: 11, color: '#86BFAA', marginTop: 3 }}>
                      Volunteer will be marked unavailable automatically after assignment
                    </div>
                  </div>
                </div>

                {/* Need pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', background: 'white',
                  border: '1.5px solid #D1FAE5', borderRadius: 12, maxWidth: '100%',
                }}>
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{CATEGORY_ICONS[need?.category] || '📦'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: 13, color: '#0F2419',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320,
                    }}>
                      {need?.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#86BFAA', display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', color: '#16A34A', fontWeight: 700 }}>#{need?.id}</span>
                      {need?.locationName && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={9} />{need.locationName}
                        </span>
                      )}
                    </div>
                  </div>
                  {uc && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      padding: '3px 10px', borderRadius: 9999,
                      background: uc.bg, border: `1px solid ${uc.border}`,
                      fontSize: 10, fontWeight: 700, color: uc.color,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: uc.color, display: 'inline-block' }} />
                      {uc.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Close */}
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  border: '1.5px solid #D1FAE5', background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#86BFAA', transition: 'all .18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1FAE5'; e.currentTarget.style.color = '#86BFAA'; }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ── SEARCH + TOGGLE ── */}
          <div style={{
            padding: '12px 24px', borderBottom: '1px solid #F0FFF4',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 13px', background: '#F6FEF9',
              border: '1.5px solid #D1FAE5', borderRadius: 12,
            }}>
              <Search size={14} color="#86BFAA" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, skill, location, phone…"
                autoFocus
                style={{
                  border: 'none', background: 'none', outline: 'none',
                  fontSize: 13, color: '#0F2419', width: '100%', fontFamily: 'inherit',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#86BFAA', padding: 0, display: 'flex' }}>
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAll(s => !s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 12, whiteSpace: 'nowrap',
                border: `1.5px solid ${showAll ? '#D1D5DB' : '#A7F3D0'}`,
                background: showAll ? '#F9FAFB' : '#F0FFF4',
                color: showAll ? '#6B7280' : '#15803D',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .18s',
              }}
            >
              <Users size={13} />
              {showAll ? `All (${volunteers.length})` : `Available (${availableVols.length})`}
            </button>
          </div>

          {/* ── VOLUNTEER LIST ── */}
          <div className="avm-scroll" style={{
            flex: 1, overflowY: 'auto', padding: '14px 24px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {loading
              ? [1, 2, 3, 4].map(i => <Skeleton key={i} />)
              : filtered.length === 0
                ? (
                  <div style={{ textAlign: 'center', padding: '44px 24px', color: '#86BFAA' }}>
                    <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.22 }} />
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#4B7A5E', marginBottom: 6 }}>
                      {search ? 'No volunteers match your search' : 'No available volunteers right now'}
                    </div>
                    {!showAll && (
                      <button onClick={() => setShowAll(true)} style={{
                        color: '#16A34A', background: 'none', border: 'none',
                        fontWeight: 600, cursor: 'pointer', fontSize: 13, textDecoration: 'underline',
                      }}>
                        Show all volunteers
                      </button>
                    )}
                  </div>
                )
                : filtered.map(v => (
                  <VolunteerCard key={v.id} volunteer={v} selected={selected} onSelect={setSelected} />
                ))
            }
          </div>

          {/* ── FOOTER ── */}
          <div style={{
            padding: '14px 24px 18px',
            borderTop: '1px solid #D1FAE5',
            background: '#F8FFFE', flexShrink: 0,
          }}>
            {/* Notes */}
            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, color: '#86BFAA',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
              }}>
                Notes for volunteer (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Special instructions, contact details, or context…"
                rows={2}
                style={{
                  width: '100%', padding: '10px 13px', boxSizing: 'border-box',
                  borderRadius: 12, border: '1.5px solid #D1FAE5',
                  background: 'white', fontSize: 13, color: '#0F2419',
                  fontFamily: 'inherit', resize: 'none', outline: 'none', transition: 'border-color .18s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#86EFAC'}
                onBlur={e => e.currentTarget.style.borderColor = '#D1FAE5'}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              {/* Summary */}
              <div style={{ fontSize: 13, color: '#86BFAA', minWidth: 0 }}>
                {selected ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#15803D', fontWeight: 600 }}>
                    <CheckCircle size={14} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selected.name} selected
                    </span>
                  </span>
                ) : (
                  <span>Select a volunteer above</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '10px 18px', borderRadius: 12,
                    border: '1.5px solid #D1FAE5', background: 'white',
                    color: '#4B7A5E', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all .18s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#86EFAC'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#D1FAE5'}
                >
                  Cancel
                </button>

                <button
                  onClick={handleAssign}
                  disabled={!selected || assigning}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 20px', borderRadius: 12, border: 'none',
                    background: selected && !assigning ? 'linear-gradient(135deg,#16A34A,#15803D)' : '#E5E7EB',
                    color: selected && !assigning ? 'white' : '#9CA3AF',
                    fontSize: 13, fontWeight: 700,
                    cursor: selected && !assigning ? 'pointer' : 'not-allowed',
                    transition: 'all .18s',
                    boxShadow: selected && !assigning ? '0 4px 14px rgba(22,163,74,0.28)' : 'none',
                  }}
                  onMouseEnter={e => { if (selected && !assigning) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  {assigning
                    ? <><Loader2 size={14} style={{ animation: 'avm-spin .7s linear infinite' }} /> Assigning…</>
                    : <><UserCheck size={14} /> Assign Volunteer <ChevronRight size={14} /></>
                  }
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}