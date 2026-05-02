import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  Leaf, Plus, RefreshCw, MapPin, Clock, CheckCircle,
  FileText, LogOut, ChevronRight, Zap, TrendingUp,
  AlertCircle, Activity, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { needsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_ICONS = {
  FOOD:'🥫', MEDICAL:'🏥', SHELTER:'🏠', WATER:'💧', OTHER:'📦',
};

const URGENCY_CFG = {
  CRITICAL:{ color:'#EF4444', bg:'#FEF2F2', border:'#FECACA', label:'Critical' },
  HIGH:    { color:'#F97316', bg:'#FFF7ED', border:'#FED7AA', label:'High'     },
  MEDIUM:  { color:'#EAB308', bg:'#FEFCE8', border:'#FEF08A', label:'Medium'   },
  LOW:     { color:'#22C55E', bg:'#F0FDF4', border:'#BBF7D0', label:'Low'      },
};

const STATUS_CFG = {
  OPEN:        { color:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE', label:'Open',        progress:'8%'   },
  ASSIGNED:    { color:'#F97316', bg:'#FFF7ED', border:'#FED7AA', label:'Assigned',    progress:'35%'  },
  IN_PROGRESS: { color:'#8B5CF6', bg:'#F5F3FF', border:'#DDD6FE', label:'In Progress', progress:'65%'  },
  RESOLVED:    { color:'#22C55E', bg:'#F0FDF4', border:'#BBF7D0', label:'Resolved',    progress:'100%' },
};

const STATUS_FILTERS = [
  { id:'ALL',         label:'All'         },
  { id:'OPEN',        label:'Open'        },
  { id:'ASSIGNED',    label:'Assigned'    },
  { id:'IN_PROGRESS', label:'In Progress' },
  { id:'RESOLVED',    label:'Resolved'    },
];

function UrgencyBadge({ urgency }) {
  const c = URGENCY_CFG[urgency];
  if (!c) return null;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 10px', borderRadius:9999,
      background:c.bg, border:`1px solid ${c.border}`,
      fontSize:11, fontWeight:700, color:c.color,
      letterSpacing:'0.05em', textTransform:'uppercase', flexShrink:0,
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:c.color, display:'inline-block' }}/>
      {c.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status];
  if (!c) return null;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'4px 12px', borderRadius:9999,
      background:c.bg, border:`1px solid ${c.border}`,
      fontSize:12, fontWeight:600, color:c.color, flexShrink:0,
    }}>
      {c.label}
    </span>
  );
}

function Topbar() {
  const { user, logout } = useAuth();
  return (
    <header style={{
      height:60, background:'white', borderBottom:'1px solid #D1FAE5',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 32px', position:'sticky', top:0, zIndex:50,
      boxShadow:'0 1px 4px rgba(22,163,74,0.08)',
    }}>
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
        <div style={{
          width:34, height:34, borderRadius:10,
          background:'linear-gradient(135deg,#22C55E,#15803D)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 3px 10px rgba(34,197,94,0.3)',
        }}>
          <Leaf size={17} color="white" fill="white"/>
        </div>
        <div>
          <div style={{ fontWeight:800, fontSize:17, color:'#14532D', lineHeight:1 }}>ReliefNet</div>
          <div style={{ fontSize:9, color:'#86BFAA', letterSpacing:'0.08em', marginTop:1 }}>CRISIS COORDINATION</div>
        </div>
      </Link>

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <Link to="/reporter/submit" style={{
          display:'inline-flex', alignItems:'center', gap:7,
          padding:'9px 20px', borderRadius:9999,
          background:'linear-gradient(135deg,#16A34A,#15803D)',
          color:'white', fontSize:14, fontWeight:700,
          textDecoration:'none', transition:'all .2s',
          boxShadow:'0 4px 12px rgba(22,163,74,0.3)',
        }}>
          <Plus size={15}/> Report New Need
        </Link>

        <div style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'6px 14px', background:'#F0FFF4',
          border:'1px solid #D1FAE5', borderRadius:9999,
        }}>
          <div style={{
            width:28, height:28, borderRadius:'50%', background:'#DCFCE7',
            border:'1.5px solid #A7F3D0', display:'flex', alignItems:'center',
            justifyContent:'center', fontWeight:800, fontSize:12, color:'#166634',
          }}>
            {user?.name?.[0]?.toUpperCase() || 'R'}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#0F2419', lineHeight:1 }}>
              {user?.name || 'Reporter'}
            </div>
            <div style={{ fontSize:10, color:'#86BFAA', marginTop:1 }}>Community Reporter</div>
          </div>
        </div>

        <button onClick={logout} style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'8px 14px', borderRadius:9999,
          border:'1.5px solid #D1FAE5', background:'white',
          color:'#4B7A5E', fontSize:13, fontWeight:500,
          cursor:'pointer', transition:'all .2s',
        }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor='#EF4444'; e.currentTarget.style.color='#EF4444'; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor='#D1FAE5'; e.currentTarget.style.color='#4B7A5E'; }}>
          <LogOut size={14}/> Sign out
        </button>
      </div>
    </header>
  );
}

function StatCards({ needs }) {
  const total    = needs.length;
  const open     = needs.filter(n=>n.status==='OPEN').length;
  const active   = needs.filter(n=>['ASSIGNED','IN_PROGRESS'].includes(n.status)).length;
  const resolved = needs.filter(n=>n.status==='RESOLVED').length;

  const cards = [
    { label:'Total Reports',  value:total,    color:'#16A34A', bg:'#DCFCE7', border:'#A7F3D0', icon:<FileText size={18}/>    },
    { label:'Open Needs',     value:open,     color:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE', icon:<AlertCircle size={18}/> },
    { label:'Being Actioned', value:active,   color:'#8B5CF6', bg:'#F5F3FF', border:'#DDD6FE', icon:<Activity size={18}/>    },
    { label:'Resolved',       value:resolved, color:'#22C55E', bg:'#F0FDF4', border:'#BBF7D0', icon:<CheckCircle size={18}/> },
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
      {cards.map((c,i)=>(
        <div key={i} className="stat-card" style={{
          background:'white', border:`1.5px solid ${c.border}`,
          borderRadius:20, padding:'20px 22px',
          boxShadow:`0 2px 12px ${c.color}15`, opacity:0,
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#86BFAA', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {c.label}
            </div>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:c.bg, border:`1px solid ${c.border}`,
              display:'flex', alignItems:'center', justifyContent:'center', color:c.color,
            }}>
              {c.icon}
            </div>
          </div>
          <div style={{ fontWeight:800, fontSize:40, color:c.color, lineHeight:1 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function NeedCard({ need }) {
  const uc = URGENCY_CFG[need.urgency];
  const sc = STATUS_CFG[need.status] || STATUS_CFG.OPEN;
  const leftColor = uc ? uc.color : '#D1FAE5';

  return (
    <div className="need-card" style={{
      background:'white', borderRadius:20,
      border:'1.5px solid #D1FAE5',
      borderLeft:`5px solid ${leftColor}`,
      padding:'20px 24px', opacity:0,
      transition:'box-shadow .22s, transform .22s, border-color .22s',
    }}
      onMouseEnter={e=>{
        e.currentTarget.style.boxShadow='0 6px 28px rgba(22,163,74,0.12)';
        e.currentTarget.style.transform='translateY(-2px)';
        e.currentTarget.style.borderColor='#A7F3D0';
      }}
      onMouseLeave={e=>{
        e.currentTarget.style.boxShadow='';
        e.currentTarget.style.transform='';
        e.currentTarget.style.borderColor='#D1FAE5';
      }}>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{CATEGORY_ICONS[need.category]||'📦'}</span>
            <h3 style={{ fontWeight:700, fontSize:16, color:'#0F2419', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {need.title}
            </h3>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', fontSize:12, color:'#86BFAA' }}>
            <span style={{ fontFamily:'monospace', color:'#16A34A', fontWeight:700, background:'#F0FFF4', border:'1px solid #D1FAE5', padding:'1px 8px', borderRadius:6 }}>
              #{need.id}
            </span>
            {need.category && <span>📂 {need.category}</span>}
            {need.locationName && (
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <MapPin size={11}/>{need.locationName}
              </span>
            )}
            {need.createdAt && (
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <Clock size={11}/>
                {new Date(need.createdAt).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}
              </span>
            )}
            {need.source && (
              <span style={{ padding:'1px 8px', borderRadius:9999, background:'#F0FFF4', border:'1px solid #D1FAE5', color:'#16A34A', fontWeight:600, fontSize:11 }}>
                {need.source}
              </span>
            )}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
          <StatusBadge status={need.status}/>
          {need.urgency && <UrgencyBadge urgency={need.urgency}/>}
          {need.priorityScore && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontWeight:800, fontSize:22, color: need.priorityScore>=80?'#EF4444':need.priorityScore>=60?'#F97316':'#EAB308', lineHeight:1 }}>
                {need.priorityScore}
              </div>
              <div style={{ fontSize:10, color:'#86BFAA' }}>/ 100</div>
            </div>
          )}
        </div>
      </div>

      {need.description && (
        <p style={{ fontSize:13, color:'#4B7A5E', lineHeight:1.65, margin:'0 0 12px', overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
          {need.description}
        </p>
      )}

      {need.aiReasoning && (
        <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'10px 14px', background:'#F0FFF4', border:'1px solid #A7F3D0', borderLeft:'3px solid #22C55E', borderRadius:12, marginBottom:12, fontSize:12, color:'#1A4731', lineHeight:1.6 }}>
          <Zap size={13} color="#16A34A" style={{ flexShrink:0, marginTop:2 }}/>
          <span><strong style={{ color:'#15803D' }}>AI: </strong>{need.aiReasoning}</span>
        </div>
      )}

      <div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#86BFAA', marginBottom:5 }}>
          <span>Resolution progress</span>
          <span style={{ color:sc.color, fontWeight:600 }}>{sc.label}</span>
        </div>
        <div style={{ height:5, background:'#F0FFF4', borderRadius:9999, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:9999, background:sc.color, width:sc.progress, transition:'width 1s ease' }}/>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ background:'white', borderRadius:20, padding:'20px 24px', border:'1.5px solid #D1FAE5', borderLeft:'5px solid #D1FAE5' }}>
      {[['55%',18],['35%',12],['100%',13],['90%',13],['100%',5]].map(([w,h],i)=>(
        <div key={i} style={{ width:w, height:h, borderRadius:6, marginBottom:10, background:'linear-gradient(90deg,#F0FFF4 25%,#DCFCE7 50%,#F0FFF4 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }}/>
      ))}
    </div>
  );
}

function EmptyState({ isFiltered }) {
  return (
    <div style={{ textAlign:'center', padding:'72px 32px', background:'white', borderRadius:24, border:'1.5px solid #D1FAE5' }}>
      <div style={{ width:72, height:72, borderRadius:20, background:'#F0FFF4', border:'2px solid #A7F3D0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:32 }}>
        {isFiltered ? '🔍' : '📋'}
      </div>
      <h3 style={{ fontWeight:800, fontSize:20, color:'#0F2419', marginBottom:8 }}>
        {isFiltered ? 'No reports match this filter' : 'No reports yet'}
      </h3>
      <p style={{ fontSize:15, color:'#86BFAA', marginBottom:28, maxWidth:360, margin:'0 auto 28px' }}>
        {isFiltered
          ? 'Try selecting a different status filter.'
          : "You haven't submitted any needs yet. Start by reporting an issue."}
      </p>
      <Link to="/reporter/submit" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:9999, background:'linear-gradient(135deg,#16A34A,#15803D)', color:'white', fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:'0 6px 20px rgba(22,163,74,0.32)' }}>
        <Plus size={17}/> Report Your First Need
      </Link>
    </div>
  );
}

export default function ReporterHome() {
  const { user }                         = useAuth();
  const [needs,        setNeeds]         = useState([]);
  const [loading,      setLoading]       = useState(true);
  const [statusFilter, setStatusFilter]  = useState('ALL');
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.rh-hero',    { opacity:0, y:24 }, { opacity:1, y:0, duration:0.65, ease:'power3.out', delay:0.1 });
      gsap.fromTo('.rh-toolbar', { opacity:0, y:14 }, { opacity:1, y:0, duration:0.5,  ease:'power2.out', delay:0.25 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      gsap.fromTo('.stat-card', { opacity:0, y:24, scale:0.96 }, { opacity:1, y:0, scale:1, duration:0.5, stagger:0.08, ease:'back.out(1.4)', clearProps:'transform' });
    }, 60);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      gsap.fromTo('.need-card', { opacity:0, y:18 }, { opacity:1, y:0, duration:0.4, stagger:0.07, ease:'power2.out', clearProps:'transform' });
    }, 40);
    return () => clearTimeout(t);
  }, [loading, statusFilter]);

  // Calls GET /api/needs/my → NeedsService.getMyNeeds()
  // which uses SecurityContextHolder to find the logged-in user
  // and returns needRepository.findByCreatedBy(user)
  const loadNeeds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await needsAPI.getMyNeeds();
      setNeeds(res.data || []);
    } catch (err) {
      toast.error(
        err.response?.status === 403
          ? 'Access denied. Please log in again.'
          : 'Could not load your reports.'
      );
      setNeeds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNeeds(); }, [loadNeeds]);

  const filtered   = statusFilter === 'ALL' ? needs : needs.filter(n => n.status === statusFilter);
  const resolved   = needs.filter(n => n.status === 'RESOLVED').length;
  const impactPct  = needs.length > 0 ? Math.round((resolved / needs.length) * 100) : 0;

  return (
    <div ref={pageRef} style={{ minHeight:'100vh', background:'#F8FFFE', fontFamily:'inherit' }}>
      <style>{`
        @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      <Topbar/>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'36px 32px' }}>

        {/* Greeting */}
        <div className="rh-hero" style={{ marginBottom:32, opacity:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
            <div>
              <h1 style={{ fontWeight:800, fontSize:30, color:'#0F2419', marginBottom:6 }}>
                Welcome back, {user?.name?.split(' ')[0] || 'Reporter'} 👋
              </h1>
              <p style={{ fontSize:16, color:'#4B7A5E', lineHeight:1.6 }}>
                Here are all your submitted community needs and their current resolution status.
              </p>
            </div>

            {needs.length > 0 && (
              <div style={{ padding:'16px 22px', background:'white', border:'1.5px solid #A7F3D0', borderRadius:20, boxShadow:'0 2px 12px rgba(22,163,74,0.1)', textAlign:'center', minWidth:130 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, justifyContent:'center', marginBottom:5 }}>
                  <TrendingUp size={13} color="#16A34A"/>
                  <span style={{ fontSize:10, fontWeight:700, color:'#86BFAA', textTransform:'uppercase', letterSpacing:'0.06em' }}>Impact</span>
                </div>
                <div style={{ fontWeight:800, fontSize:34, color:'#16A34A', lineHeight:1 }}>{impactPct}%</div>
                <div style={{ fontSize:11, color:'#86BFAA', marginTop:3 }}>{resolved}/{needs.length} resolved</div>
              </div>
            )}
          </div>
        </div>

        {/* Stat cards */}
        {!loading && needs.length > 0 && <StatCards needs={needs}/>}

        {/* Toolbar */}
        <div className="rh-toolbar" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap', opacity:0 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {STATUS_FILTERS.map(f => {
              const active = statusFilter === f.id;
              return (
                <button key={f.id} onClick={() => setStatusFilter(f.id)} style={{
                  padding:'7px 16px', borderRadius:9999, border:'none', cursor:'pointer',
                  fontSize:13, fontWeight:600, transition:'all .2s',
                  background: active ? '#16A34A' : 'white',
                  color:      active ? 'white'   : '#4B7A5E',
                  outline:    active ? 'none'     : '1.5px solid #D1FAE5',
                  boxShadow:  active ? '0 3px 10px rgba(22,163,74,0.25)' : 'none',
                }}>
                  {f.label}
                </button>
              );
            })}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={loadNeeds} disabled={loading} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9999,
              border:'1.5px solid #A7F3D0', background:'white', color:'#15803D',
              fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .2s',
            }}
              onMouseEnter={e=>e.currentTarget.style.background='#F0FFF4'}
              onMouseLeave={e=>e.currentTarget.style.background='white'}>
              <RefreshCw size={13} style={loading?{animation:'spin .7s linear infinite'}:{}}/>
              Refresh
            </button>

            <Link to="/reporter/submit" style={{
              display:'inline-flex', alignItems:'center', gap:8, padding:'9px 22px', borderRadius:9999,
              background:'linear-gradient(135deg,#16A34A,#15803D)', color:'white',
              fontSize:14, fontWeight:700, textDecoration:'none', transition:'all .2s',
              boxShadow:'0 4px 14px rgba(22,163,74,0.3)',
            }}
              onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 7px 20px rgba(22,163,74,0.4)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 14px rgba(22,163,74,0.3)'; }}>
              <Plus size={15}/> Report New Need <ChevronRight size={14}/>
            </Link>
          </div>
        </div>

        {/* Count */}
        {!loading && needs.length > 0 && (
          <div style={{ fontSize:13, color:'#86BFAA', marginBottom:16 }}>
            Showing <strong style={{ color:'#0F2419' }}>{filtered.length}</strong> of {needs.length} report{needs.length!==1?'s':''}
            {statusFilter !== 'ALL' && (
              <button onClick={()=>setStatusFilter('ALL')} style={{ marginLeft:8, background:'none', border:'none', color:'#16A34A', fontWeight:600, cursor:'pointer', fontSize:13, display:'inline-flex', alignItems:'center', gap:3 }}>
                <X size={11}/> Clear filter
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Skeleton/><Skeleton/><Skeleton/>
          </div>
        ) : needs.length === 0 ? (
          <EmptyState isFiltered={false}/>
        ) : filtered.length === 0 ? (
          <EmptyState isFiltered={true}/>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {filtered.map(need => <NeedCard key={need.id} need={need}/>)}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && needs.length > 0 && (
          <div style={{ marginTop:40, padding:'28px 32px', background:'linear-gradient(135deg,#14532D,#166534)', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontWeight:800, fontSize:20, color:'white', marginBottom:5 }}>See something that needs help?</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)' }}>Submit a new need and our AI will route the right help immediately.</div>
            </div>
            <Link to="/reporter/submit" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'13px 28px', borderRadius:9999, background:'white', color:'#15803D', fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', flexShrink:0 }}>
              <Plus size={17}/> Report New Need
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}