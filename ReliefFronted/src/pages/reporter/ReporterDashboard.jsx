    import React, { useState, useEffect, useRef, useCallback } from 'react';
    import { Link } from 'react-router-dom';
    import { gsap } from 'gsap';
    import { ScrollTrigger } from 'gsap/ScrollTrigger';
    import {
    Leaf, MapPin, Upload, X, Send, Loader, CheckCircle,
    Clock, FileText, RefreshCw,
    Camera, Type, Plus, Navigation, Zap, AlertCircle,
    LogOut
    } from 'lucide-react';
    import toast from 'react-hot-toast';
    import { needsAPI, reportsAPI } from '../../services/api';
    import { useAuth } from '../../context/AuthContext';

    gsap.registerPlugin(ScrollTrigger);

    const CATEGORY_ICONS = { FOOD:'🥫', MEDICAL:'🏥', SHELTER:'🏠', WATER:'💧', OTHER:'📦' };

    const URGENCY_CFG = {
    CRITICAL:{ color:'#EF4444', bg:'#FEF2F2', border:'#FECACA', label:'Critical' },
    HIGH:    { color:'#F97316', bg:'#FFF7ED', border:'#FED7AA', label:'High'     },
    MEDIUM:  { color:'#EAB308', bg:'#FEFCE8', border:'#FEF08A', label:'Medium'   },
    LOW:     { color:'#22C55E', bg:'#F0FDF4', border:'#BBF7D0', label:'Low'      },
    };

    const STATUS_CFG = {
    OPEN:        { color:'#3B82F6', bg:'#EFF6FF', label:'Open'        },
    ASSIGNED:    { color:'#F97316', bg:'#FFF7ED', label:'Assigned'    },
    IN_PROGRESS: { color:'#8B5CF6', bg:'#F5F3FF', label:'In Progress' },
    RESOLVED:    { color:'#22C55E', bg:'#F0FDF4', label:'Resolved'    },
    CLOSED:      { color:'#6B7280', bg:'#F9FAFB', label:'Closed'      },
    };

    // ── shared atoms ──────────────────────────────────────────────────────────────

    function UrgencyBadge({ urgency }) {
    const c = URGENCY_CFG[urgency];
    if (!c) return null;
    return (
        <span style={{
        display:'inline-flex', alignItems:'center', gap:5,
        padding:'3px 10px', borderRadius:9999,
        background:c.bg, border:`1px solid ${c.border}`,
        fontSize:11, fontWeight:700, color:c.color,
        letterSpacing:'0.05em', textTransform:'uppercase',
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
        padding:'3px 10px', borderRadius:9999,
        background:c.bg, fontSize:11, fontWeight:600, color:c.color,
        }}>
        {c.label}
        </span>
    );
    }

    function ScoreBar({ score }) {
    if (!score) return null;
    const color = score>=80?'#EF4444':score>=60?'#F97316':score>=40?'#EAB308':'#22C55E';
    return (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1, height:6, background:'#E5E7EB', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${score}%`, background:color, borderRadius:3, transition:'width 1s ease' }}/>
        </div>
        <span style={{ fontWeight:800, fontSize:18, color, minWidth:36 }}>{score}</span>
        </div>
    );
    }

    const INPUT = {
    width:'100%', padding:'11px 14px', background:'white',
    borderRadius:12, border:'1.5px solid #D1FAE5',
    fontFamily:'inherit', fontSize:14, color:'#0F2419', outline:'none',
    transition:'border-color .2s, box-shadow .2s',
    };

    const onFocus = e => {
    e.target.style.borderColor = '#22C55E';
    e.target.style.boxShadow  = '0 0 0 3px rgba(34,197,94,0.12)';
    };
    const onBlur = e => {
    e.target.style.borderColor = '#D1FAE5';
    e.target.style.boxShadow  = '';
    };

    function Label({ text, required, hint }) {
    return (
        <label style={{
        display:'block', fontSize:12, fontWeight:700, color:'#4B7A5E',
        textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6,
        }}>
        {text}
        {required && <span style={{ color:'#16A34A', marginLeft:3 }}>*</span>}
        {hint && (
            <span style={{ fontSize:10, color:'#86BFAA', fontWeight:400, textTransform:'none', marginLeft:6 }}>
            {hint}
            </span>
        )}
        </label>
    );
    }

    function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <div style={{ fontSize:12, color:'#EF4444', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
        <AlertCircle size={12}/>{msg}
        </div>
    );
    }

    function GpsBtn({ onClick }) {
    return (
        <button type="button" onClick={onClick} style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'0 16px', borderRadius:12, flexShrink:0,
        border:'1.5px solid #A7F3D0', background:'#F0FFF4',
        color:'#15803D', fontSize:13, fontWeight:600,
        cursor:'pointer', transition:'all .2s', height:'100%',
        }}
        onMouseEnter={e => e.currentTarget.style.background='#DCFCE7'}
        onMouseLeave={e => e.currentTarget.style.background='#F0FFF4'}>
        <Navigation size={14}/> GPS
        </button>
    );
    }

    function Chip({ icon, label, val }) {
    return (
        <div style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'5px 12px', background:'#F6FEF9',
        border:'1px solid #D1FAE5', borderRadius:9999, fontSize:12,
        }}>
        <span>{icon}</span>
        <span style={{ color:'#86BFAA', fontWeight:500 }}>{label}:</span>
        <span style={{ color:'#0F2419', fontWeight:700 }}>{val}</span>
        </div>
    );
    }

    // ── TOPBAR ────────────────────────────────────────────────────────────────────

    function Topbar() {
    const { user, logout } = useAuth();
    return (
        <div style={{
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
            <div style={{ fontWeight:800, fontSize:17, color:'#14532D' }}>ReliefNet</div>
            <div style={{ fontSize:9, color:'#86BFAA', letterSpacing:'0.08em', marginTop:1 }}>CRISIS COORDINATION</div>
            </div>
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'6px 14px', background:'#F0FFF4',
            border:'1px solid #D1FAE5', borderRadius:9999,
            }}>
            <div style={{
                width:28, height:28, borderRadius:'50%',
                background:'#DCFCE7', border:'1.5px solid #A7F3D0',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:800, fontSize:12, color:'#166634',
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
            onMouseEnter={e => { e.currentTarget.style.borderColor='#EF4444'; e.currentTarget.style.color='#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#D1FAE5'; e.currentTarget.style.color='#4B7A5E'; }}>
            <LogOut size={14}/> Sign out
            </button>
        </div>
        </div>
    );
    }

    // ── AI RESULT PANEL ───────────────────────────────────────────────────────────

    function AiResultPanel({ result }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;
        gsap.fromTo(ref.current,
        { opacity:0, scale:0.96, y:20 },
        { opacity:1, scale:1, y:0, duration:0.5, ease:'back.out(1.6)' }
        );
    }, []);

    const urgency   = result.urgency   || result.detectedUrgency;
    const category  = result.category  || result.detectedCategory;
    const score     = result.priorityScore;
    const reasoning = result.aiReasoning || result.reasoning;
    const uc        = URGENCY_CFG[urgency] || {};

    return (
        <div ref={ref} style={{
        background:'white',
        border:`2px solid ${uc.border || '#A7F3D0'}`,
        borderRadius:20, overflow:'hidden',
        boxShadow:'0 8px 32px rgba(22,163,74,0.12)',
        }}>
        {/* header */}
        <div style={{
            padding:'16px 24px',
            background:`linear-gradient(135deg,${uc.bg||'#F0FFF4'},white)`,
            borderBottom:`1px solid ${uc.border||'#D1FAE5'}`,
            display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
                width:36, height:36, borderRadius:10,
                background:uc.bg||'#F0FFF4',
                border:`1.5px solid ${uc.border||'#A7F3D0'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
            }}>
                <Zap size={18} color={uc.color||'#16A34A'}/>
            </div>
            <div>
                <div style={{ fontWeight:800, fontSize:16, color:'#0F2419' }}>AI Analysis Complete</div>
                <div style={{ fontSize:11, color:'#86BFAA', marginTop:1 }}>Powered by Gemini 1.5 Flash</div>
            </div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {urgency && <UrgencyBadge urgency={urgency}/>}
            {result.usedFallback && (
                <span style={{
                display:'inline-flex', alignItems:'center', gap:4,
                padding:'3px 10px', borderRadius:9999,
                background:'#FFFBEB', border:'1px solid #FDE68A',
                fontSize:11, color:'#C2410C', fontWeight:600,
                }}>⚡ Fallback used</span>
            )}
            </div>
        </div>

        <div style={{ padding:'20px 24px' }}>
            {/* score / category / confidence */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:20 }}>
            {[
                {
                label:'Priority Score',
                content: <ScoreBar score={score}/>,
                },
                {
                label:'Category',
                content: (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:22 }}>{CATEGORY_ICONS[category]||'📦'}</span>
                    <span style={{ fontWeight:700, fontSize:15, color:'#0F2419' }}>{category||'—'}</span>
                    </div>
                ),
                },
                {
                label:'Confidence',
                content: (
                    <div style={{ fontWeight:800, fontSize:18, color:'#16A34A' }}>
                    {result.confidenceLabel ||
                        (result.overallConfidence
                        ? `${(result.overallConfidence * 100).toFixed(0)}%`
                        : '—')}
                    </div>
                ),
                },
            ].map((item, i) => (
                <div key={i} style={{
                padding:'14px 16px', background:'#F6FEF9',
                borderRadius:12, border:'1px solid #D1FAE5',
                }}>
                <div style={{
                    fontSize:10, fontWeight:700, color:'#86BFAA',
                    textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8,
                }}>{item.label}</div>
                {item.content}
                </div>
            ))}
            </div>

            {/* reasoning */}
            {reasoning && (
            <div style={{
                padding:'14px 16px', background:'#F0FFF4',
                border:'1.5px solid #A7F3D0', borderLeft:'4px solid #22C55E',
                borderRadius:12, marginBottom:16,
            }}>
                <div style={{
                fontSize:11, fontWeight:700, color:'#15803D',
                textTransform:'uppercase', letterSpacing:'0.08em',
                marginBottom:6, display:'flex', alignItems:'center', gap:6,
                }}>
                <Zap size={12}/>AI Reasoning
                </div>
                <p style={{ fontSize:13.5, color:'#1A4731', lineHeight:1.65, margin:0 }}>
                {reasoning}
                </p>
            </div>
            )}

            {/* chips */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {result.peopleAffected > 0 && (
                <Chip icon="👥" label="People affected" val={result.peopleAffected}/>
            )}
            {result.crowdDensity && result.crowdDensity !== 'NONE' && (
                <Chip icon="🏘️" label="Crowd" val={result.crowdDensity}/>
            )}
            {result.detectedLanguage && (
                <Chip icon="🌐" label="Language" val={result.detectedLanguage.toUpperCase()}/>
            )}
            {(result.locationNormalized || result.aiDetectedLocation) && (
                <Chip icon="📍" label="Location (AI)" val={result.locationNormalized || result.aiDetectedLocation}/>
            )}
            </div>

            {/* visual cues */}
            {result.visualCues?.length > 0 && (
            <div style={{ marginTop:14 }}>
                <div style={{
                fontSize:11, fontWeight:700, color:'#86BFAA',
                textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8,
                }}>Visual cues</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {result.visualCues.map((c, i) => (
                    <span key={i} style={{
                    padding:'3px 10px', borderRadius:9999,
                    background:'#DCFCE7', border:'1px solid #A7F3D0',
                    fontSize:12, color:'#166534', fontWeight:500,
                    }}>{c}</span>
                ))}
                </div>
            </div>
            )}

            {/* suggested skills */}
            {result.suggestedSkills && (
            <div style={{ marginTop:14 }}>
                <div style={{
                fontSize:11, fontWeight:700, color:'#86BFAA',
                textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8,
                }}>Skills needed</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {result.suggestedSkills.split(',').map((s, i) => (
                    <span key={i} style={{
                    padding:'3px 10px', borderRadius:9999,
                    background:'#EFF6FF', border:'1px solid #BFDBFE',
                    fontSize:12, color:'#1D4ED8', fontWeight:500,
                    }}>{s.trim()}</span>
                ))}
                </div>
            </div>
            )}

            {/* warnings */}
            {result.warnings?.length > 0 && (
            <div style={{
                marginTop:14, padding:'10px 14px',
                background:'#FFFBEB', border:'1px solid #FDE68A',
                borderRadius:10, display:'flex', gap:8,
            }}>
                <AlertCircle size={15} color="#D97706" style={{ flexShrink:0, marginTop:1 }}/>
                <div style={{ fontSize:13, color:'#92400E' }}>
                {result.warnings.join(' · ')}
                </div>
            </div>
            )}

            {/* need ID */}
            {(result.id || result.needId) && (
            <div style={{
                marginTop:16, paddingTop:16, borderTop:'1px solid #D1FAE5',
                display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
                <div style={{ fontSize:12, color:'#86BFAA' }}>
                Need ID:{' '}
                <strong style={{ color:'#15803D', fontFamily:'monospace' }}>
                    #{result.id || result.needId}
                </strong>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#15803D', fontWeight:600 }}>
                <CheckCircle size={14}/>Submitted successfully
                </div>
            </div>
            )}
        </div>
        </div>
    );
    }

    // ── TEXT FORM ─────────────────────────────────────────────────────────────────

    function TextSubmitForm({ onSuccess }) {
    const [form, setForm] = useState({
        title:'', description:'', locationName:'',
        latitude:'', longitude:'', reporterName:'', reporterContact:'',
    });
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => {
        if (!ref.current) return;
        gsap.fromTo(
            ref.current.querySelectorAll('.fg'),
            { opacity:0, y:14 },
            { opacity:1, y:0, duration:0.45, stagger:0.07, ease:'power2.out', clearProps:'transform' }
        );
        }, 80);
        return () => clearTimeout(t);
    }, []);

    const detectLocation = () => {
        if (!navigator.geolocation) return toast.error('Geolocation not supported');
        toast.loading('Detecting...', { id:'geo' });
        navigator.geolocation.getCurrentPosition(
        p => {
            setForm(f => ({
            ...f,
            latitude:  p.coords.latitude.toFixed(6),
            longitude: p.coords.longitude.toFixed(6),
            }));
            toast.success('Location detected!', { id:'geo' });
        },
        () => toast.error('Could not detect location', { id:'geo' })
        );
    };

    const validate = () => {
        const e = {};
        if (!form.title.trim())         e.title       = 'Title is required';
        else if (form.title.length>255) e.title       = 'Max 255 characters';
        if (!form.description.trim())   e.description = 'Description is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = async e => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
        const res = await needsAPI.create({
            title:           form.title.trim(),
            description:     form.description.trim(),
            locationName:    form.locationName    || undefined,
            latitude:        form.latitude  ? parseFloat(form.latitude)  : undefined,
            longitude:       form.longitude ? parseFloat(form.longitude) : undefined,
            reporterName:    form.reporterName    || undefined,
            reporterContact: form.reporterContact || undefined,
        });
        toast.success('Need submitted! AI is analyzing…');
        onSuccess(res.data);
        } catch (err) {
        toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
        if (ref.current) {
            gsap.fromTo(ref.current,
            { x:0 },
            { keyframes:{ x:[-8,8,-5,5,0] }, duration:0.4, ease:'power2.out' }
            );
        }
        } finally { setLoading(false); }
    };

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const g2  = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 };

    return (
        <form ref={ref} onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:18 }}>

        <div className="fg">
            <Label text="What is the need?" required/>
            <input
            style={{ ...INPUT, borderColor: errors.title ? '#EF4444' : '#D1FAE5' }}
            placeholder="e.g. Elderly woman needs insulin urgently"
            value={form.title} onChange={set('title')} onFocus={onFocus} onBlur={onBlur}
            />
            <FieldError msg={errors.title}/>
        </div>

        <div className="fg">
            <Label text="Describe the situation" required/>
            <textarea
            style={{ ...INPUT, minHeight:100, resize:'vertical', borderColor: errors.description ? '#EF4444' : '#D1FAE5' }}
            placeholder="Number of people affected, severity, specific requirements…"
            value={form.description} onChange={set('description')} onFocus={onFocus} onBlur={onBlur}
            />
            <FieldError msg={errors.description}/>
        </div>

        <div className="fg">
            <Label text="Location"/>
            <div style={{ display:'flex', gap:8, height:44 }}>
            <input
                style={{ ...INPUT, flex:1 }}
                placeholder="Area, street, or landmark name"
                value={form.locationName} onChange={set('locationName')} onFocus={onFocus} onBlur={onBlur}
            />
            <GpsBtn onClick={detectLocation}/>
            </div>
        </div>

        <div className="fg" style={g2}>
            <div>
            <Label text="Latitude"/>
            <input style={INPUT} placeholder="28.6692" type="number" step="any"
                value={form.latitude} onChange={set('latitude')} onFocus={onFocus} onBlur={onBlur}/>
            </div>
            <div>
            <Label text="Longitude"/>
            <input style={INPUT} placeholder="77.4538" type="number" step="any"
                value={form.longitude} onChange={set('longitude')} onFocus={onFocus} onBlur={onBlur}/>
            </div>
        </div>

        <div style={{ height:1, background:'#D1FAE5' }}/>

        <div className="fg" style={g2}>
            <div>
            <Label text="Your Name" hint="(optional)"/>
            <input style={INPUT} placeholder="Full name"
                value={form.reporterName} onChange={set('reporterName')} onFocus={onFocus} onBlur={onBlur}/>
            </div>
            <div>
            <Label text="Contact" hint="(optional)"/>
            <input style={INPUT} placeholder="Phone or email"
                value={form.reporterContact} onChange={set('reporterContact')} onFocus={onFocus} onBlur={onBlur}/>
            </div>
        </div>

        <button type="submit" disabled={loading} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'13px 28px', borderRadius:9999, border:'none', marginTop:4,
            background: loading ? '#86BFAA' : 'linear-gradient(135deg,#16A34A,#15803D)',
            color:'white', fontSize:15, fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow:'0 6px 20px rgba(22,163,74,0.32)', transition:'all .22s',
        }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(22,163,74,0.42)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 6px 20px rgba(22,163,74,0.32)'; }}>
            {loading
            ? <><Loader size={17} style={{ animation:'spin .7s linear infinite' }}/> Submitting…</>
            : <><Send size={17}/> Submit Need</>}
        </button>
        </form>
    );
    }

    // ── IMAGE FORM ────────────────────────────────────────────────────────────────

    function ImageSubmitForm({ onSuccess }) {
    const [images,   setImages]   = useState([]);
    const [previews, setPreviews] = useState([]);
    const [form, setForm]         = useState({ reporterName:'', reporterContact:'', locationName:'', latitude:'', longitude:'' });
    const [loading,  setLoading]  = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef(null);
    const ref     = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => {
        if (!ref.current) return;
        gsap.fromTo(
            ref.current.querySelectorAll('.fg'),
            { opacity:0, y:14 },
            { opacity:1, y:0, duration:0.45, stagger:0.07, ease:'power2.out', clearProps:'transform' }
        );
        }, 80);
        return () => clearTimeout(t);
    }, []);

    const addFiles = files => {
        const valid = Array.from(files).filter(f =>
        ['image/jpeg','image/png','image/webp'].includes(f.type) && f.size <= 10*1024*1024
        );
        if (valid.length !== files.length) toast.error('Only JPEG/PNG/WEBP under 10 MB');
        const next = [...images, ...valid].slice(0, 5);
        setImages(next);
        setPreviews(next.map(f => URL.createObjectURL(f)));
        setTimeout(() => {
        gsap.fromTo('.img-thumb',
            { opacity:0, scale:0.8 },
            { opacity:1, scale:1, duration:0.3, stagger:0.05, ease:'back.out(1.5)' }
        );
        }, 30);
    };

    const remove = i => {
        const ni = images.filter((_, idx) => idx !== i);
        const np = previews.filter((_, idx) => idx !== i);
        setImages(ni); setPreviews(np);
    };

    const detectLocation = () => {
        navigator.geolocation.getCurrentPosition(
        p => {
            setForm(f => ({
            ...f,
            latitude:  p.coords.latitude.toFixed(6),
            longitude: p.coords.longitude.toFixed(6),
            }));
            toast.success('Location detected!');
        },
        () => toast.error('Could not detect location')
        );
    };

    const submit = async e => {
        e.preventDefault();
        if (images.length === 0) { toast.error('Add at least 1 image'); return; }
        setLoading(true);
        try {
        const fd = new FormData();
        images.forEach(img => fd.append('images', img));
        if (form.reporterName)    fd.append('reporterName',    form.reporterName);
        if (form.reporterContact) fd.append('reporterContact', form.reporterContact);
        if (form.locationName)    fd.append('locationName',    form.locationName);
        if (form.latitude)        fd.append('latitude',        form.latitude);
        if (form.longitude)       fd.append('longitude',       form.longitude);
        const res = await reportsAPI.submitImage(fd);
        toast.success(`${res.data.imageCount} image(s) submitted! AI analyzing…`);
        onSuccess(res.data);
        } catch (err) {
        toast.error(err.response?.data?.message || 'Image upload failed');
        } finally { setLoading(false); }
    };

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const g2  = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 };

    return (
        <form ref={ref} onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:18 }}>

        <div className="fg">
            <Label text="Upload Images" required hint="(1–5 images, max 10 MB each)"/>
            <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => images.length < 5 && fileRef.current?.click()}
            style={{
                border:`2px dashed ${dragOver ? '#22C55E' : '#A7F3D0'}`,
                borderRadius:16, padding: images.length > 0 ? 16 : 36,
                textAlign:'center', cursor: images.length < 5 ? 'pointer' : 'default',
                background: dragOver ? '#F0FFF4' : '#F6FEF9', transition:'all .2s',
            }}>
            {images.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {previews.map((src, i) => (
                    <div key={i} className="img-thumb" style={{ position:'relative', width:90, height:90 }}>
                    <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10, border:'1.5px solid #A7F3D0' }}/>
                    <button type="button" onClick={ev => { ev.stopPropagation(); remove(i); }} style={{
                        position:'absolute', top:-6, right:-6,
                        width:20, height:20, borderRadius:'50%',
                        background:'#EF4444', border:'2px solid white',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:'pointer', padding:0,
                    }}>
                        <X size={10} color="white" strokeWidth={3}/>
                    </button>
                    </div>
                ))}
                {images.length < 5 && (
                    <div style={{
                    width:90, height:90, borderRadius:10,
                    border:'2px dashed #A7F3D0', background:'white',
                    display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center',
                    gap:4, cursor:'pointer', color:'#86BFAA',
                    }}>
                    <Plus size={18}/>
                    <span style={{ fontSize:10, fontWeight:600 }}>Add more</span>
                    </div>
                )}
                </div>
            ) : (
                <>
                <div style={{
                    width:52, height:52, borderRadius:14,
                    background:'#DCFCE7', border:'1.5px solid #A7F3D0',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    margin:'0 auto 14px',
                }}>
                    <Camera size={24} color="#16A34A"/>
                </div>
                <div style={{ fontWeight:600, fontSize:15, color:'#0F2419', marginBottom:6 }}>
                    Drag & drop images here
                </div>
                <div style={{ fontSize:13, color:'#86BFAA', marginBottom:12 }}>
                    or click to browse · JPEG, PNG, WEBP
                </div>
                <div style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    padding:'6px 16px', borderRadius:9999,
                    background:'#DCFCE7', border:'1px solid #A7F3D0',
                    fontSize:12, fontWeight:600, color:'#15803D',
                }}>
                    <Upload size={13}/> Browse files
                </div>
                </>
            )}
            </div>
            <input
            ref={fileRef} type="file" multiple
            accept="image/jpeg,image/png,image/webp"
            style={{ display:'none' }}
            onChange={e => addFiles(e.target.files)}
            />
            {images.length > 0 && (
            <div style={{ fontSize:12, color:'#4B7A5E', marginTop:6, display:'flex', alignItems:'center', gap:5 }}>
                <Zap size={11} color="#16A34A"/>
                Gemini Vision will auto-fill need details from your images
            </div>
            )}
        </div>

        <div className="fg">
            <Label text="Location"/>
            <div style={{ display:'flex', gap:8, height:44 }}>
            <input style={{ ...INPUT, flex:1 }} placeholder="Area, street, or landmark"
                value={form.locationName} onChange={set('locationName')} onFocus={onFocus} onBlur={onBlur}/>
            <GpsBtn onClick={detectLocation}/>
            </div>
        </div>

        <div className="fg" style={g2}>
            <div>
            <Label text="Latitude"/>
            <input style={INPUT} placeholder="28.6692" type="number" step="any"
                value={form.latitude} onChange={set('latitude')} onFocus={onFocus} onBlur={onBlur}/>
            </div>
            <div>
            <Label text="Longitude"/>
            <input style={INPUT} placeholder="77.4538" type="number" step="any"
                value={form.longitude} onChange={set('longitude')} onFocus={onFocus} onBlur={onBlur}/>
            </div>
        </div>

        <div style={{ height:1, background:'#D1FAE5' }}/>

        <div className="fg" style={g2}>
            <div>
            <Label text="Your Name" hint="(optional)"/>
            <input style={INPUT} placeholder="Full name"
                value={form.reporterName} onChange={set('reporterName')} onFocus={onFocus} onBlur={onBlur}/>
            </div>
            <div>
            <Label text="Contact" hint="(optional)"/>
            <input style={INPUT} placeholder="Phone or email"
                value={form.reporterContact} onChange={set('reporterContact')} onFocus={onFocus} onBlur={onBlur}/>
            </div>
        </div>

        <button type="submit" disabled={loading || images.length === 0} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'13px 28px', borderRadius:9999, border:'none', marginTop:4,
            background: images.length === 0 || loading
            ? '#86BFAA'
            : 'linear-gradient(135deg,#16A34A,#15803D)',
            color:'white', fontSize:15, fontWeight:700,
            cursor: images.length === 0 || loading ? 'not-allowed' : 'pointer',
            boxShadow: images.length > 0 ? '0 6px 20px rgba(22,163,74,0.32)' : 'none',
            transition:'all .22s',
        }}>
            {loading
            ? <><Loader size={17} style={{ animation:'spin .7s linear infinite' }}/> Uploading…</>
            : <><Camera size={17}/> Submit Image Report</>}
        </button>
        </form>
    );
    }

    // ── SUBMISSIONS LIST ──────────────────────────────────────────────────────────

    function SubmissionsList({ submissions, loading }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current || loading || submissions.length === 0) return;
        gsap.fromTo(
        ref.current.querySelectorAll('.sub-item'),
        { opacity:0, y:14 },
        { opacity:1, y:0, duration:0.4, stagger:0.06, ease:'power2.out' }
        );
    }, [submissions, loading]);

    if (loading) return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {[1,2,3].map(i => (
            <div key={i} style={{
            height:90, borderRadius:16, background:'#F0FFF4',
            backgroundImage:'linear-gradient(90deg,#F0FFF4 25%,#DCFCE7 50%,#F0FFF4 75%)',
            backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite',
            }}/>
        ))}
        </div>
    );

    if (submissions.length === 0) return (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'#86BFAA' }}>
        <FileText size={40} style={{ margin:'0 auto 14px', opacity:0.35 }}/>
        <div style={{ fontSize:18, fontWeight:700, color:'#4B7A5E', marginBottom:6 }}>
            No submissions yet
        </div>
        <div style={{ fontSize:14 }}>Your submitted needs will appear here</div>
        </div>
    );

    return (
        <div ref={ref} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {submissions.map(need => (
            <div key={need.id} className="sub-item" style={{
            padding:'16px 20px', background:'white',
            border:'1.5px solid #D1FAE5', borderRadius:16, transition:'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(22,163,74,0.1)'; e.currentTarget.style.borderColor='#A7F3D0'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor='#D1FAE5'; }}>

            <div style={{
                display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                gap:12, marginBottom: (need.aiReasoning || need.priorityScore) ? 10 : 0,
            }}>
                <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:16 }}>{CATEGORY_ICONS[need.category] || '📦'}</span>
                    <span style={{ fontWeight:700, fontSize:15, color:'#0F2419', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {need.title}
                    </span>
                </div>
                <div style={{ fontSize:12, color:'#86BFAA', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    {need.locationName && (
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <MapPin size={11}/>{need.locationName}
                    </span>
                    )}
                    {need.createdAt && (
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <Clock size={11}/>{new Date(need.createdAt).toLocaleDateString()}
                    </span>
                    )}
                    <span style={{ fontFamily:'monospace', color:'#16A34A', fontWeight:600 }}>
                    #{need.id}
                    </span>
                </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                <StatusBadge status={need.status}/>
                {need.urgency && <UrgencyBadge urgency={need.urgency}/>}
                </div>
            </div>

            {need.aiReasoning && (
                <div style={{
                padding:'8px 12px', background:'#F0FFF4',
                border:'1px solid #A7F3D0', borderRadius:10,
                fontSize:12, color:'#1A4731', lineHeight:1.55,
                marginBottom: need.priorityScore ? 10 : 0,
                }}>
                <strong style={{ color:'#15803D' }}>AI: </strong>{need.aiReasoning}
                </div>
            )}
            {need.priorityScore && <ScoreBar score={need.priorityScore}/>}
            </div>
        ))}
        </div>
    );
    }

    // ── MAIN PAGE ─────────────────────────────────────────────────────────────────

    export default function ReporterDashboard() {
    const { user } = useAuth();
    const [activeTab,   setActiveTab]   = useState('text');
    const [aiResult,    setAiResult]    = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubs, setLoadingSubs] = useState(false);
    const [formKey,     setFormKey]     = useState(0);
    const resultRef = useRef(null);
    const pageRef   = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
        gsap.fromTo('.rp-hdr',  { opacity:0, y:20 }, { opacity:1, y:0, duration:0.6, ease:'power3.out', delay:0.1 });
        gsap.fromTo('.rp-tabs', { opacity:0, y:12 }, { opacity:1, y:0, duration:0.5, ease:'power2.out', delay:0.22 });
        gsap.fromTo('.rp-card', { opacity:0, x:-24 },{ opacity:1, x:0, duration:0.65, ease:'power3.out', delay:0.2 });
        gsap.fromTo('.rp-side', { opacity:0, x:24  },{ opacity:1, x:0, duration:0.65, ease:'power3.out', delay:0.3 });
        }, pageRef);
        return () => ctx.revert();
    }, []);

    const loadSubmissions = useCallback(async () => {
        // if (!user?.token) return;
        setLoadingSubs(true);
        try {
        const res = await needsAPI.getMyNeeds();
        setSubmissions((res.data || []).slice(0, 20));
        } catch {
        // reporter may have limited access
        } finally {
        setLoadingSubs(false);
        }
    }, [user]);

    useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

    const handleSuccess = data => {
        setAiResult(data);
        setFormKey(k => k + 1);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 150);
        setTimeout(loadSubmissions, 2500);
    };

    const clearResult = () => {
        gsap.to('.ai-result-wrap', {
        opacity:0, scale:0.97, duration:0.25,
        onComplete: () => setAiResult(null),
        });
    };

    const switchTab = tab => { setActiveTab(tab); setAiResult(null); };

    return (
        <div ref={pageRef} style={{ minHeight:'100vh', background:'#F8FFFE', fontFamily:'inherit' }}>
        <style>{`
            @keyframes spin    { to { transform: rotate(360deg); } }
            @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        `}</style>

        <Topbar/>

        <div style={{ maxWidth:1280, margin:'0 auto', padding:'32px' }}>

            {/* page header */}
            <div className="rp-hdr" style={{ marginBottom:28, opacity:0 }}>
            <h1 style={{ fontWeight:800, fontSize:30, color:'#0F2419', marginBottom:6 }}>
                Report a Community Need
            </h1>
            <p style={{ fontSize:15, color:'#4B7A5E', lineHeight:1.6 }}>
                Submit urgent needs via text description or photo upload. Our AI will classify and prioritize automatically.
            </p>
            </div>

            {/* two-column layout */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 400px', gap:28, alignItems:'start' }}>

            {/* LEFT */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

                {/* tabs */}
                <div className="rp-tabs" style={{
                display:'flex', gap:4, background:'#F0FFF4', padding:4,
                borderRadius:16, border:'1px solid #D1FAE5', opacity:0,
                }}>
                {[
                    { id:'text',  icon:<Type size={15}/>,   label:'Text Report'   },
                    { id:'image', icon:<Camera size={15}/>, label:'Image Report'  },
                ].map(tab => (
                    <button key={tab.id} type="button" onClick={() => switchTab(tab.id)} style={{
                    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    padding:'10px 16px', borderRadius:12, border:'none', cursor:'pointer',
                    transition:'all .2s', fontFamily:'inherit', fontSize:14, fontWeight:600,
                    background: activeTab === tab.id ? 'white' : 'transparent',
                    color:      activeTab === tab.id ? '#15803D' : '#86BFAA',
                    boxShadow:  activeTab === tab.id ? '0 1px 4px rgba(22,163,74,0.12)' : 'none',
                    }}>
                    {tab.icon}{tab.label}
                    </button>
                ))}
                </div>

                {/* form card */}
                <div className="rp-card" style={{
                background:'white', borderRadius:20,
                border:'1.5px solid #D1FAE5', padding:28,
                boxShadow:'0 1px 4px rgba(22,163,74,0.08)', opacity:0,
                }}>
                {/* info banner */}
                <div style={{
                    display:'flex', alignItems:'flex-start', gap:10,
                    padding:'12px 16px', background:'#F0FFF4',
                    border:'1px solid #A7F3D0', borderRadius:12, marginBottom:24,
                    fontSize:13, color:'#1A4731', lineHeight:1.55,
                }}>
                    <Zap size={15} color="#16A34A" style={{ flexShrink:0, marginTop:1 }}/>
                    <span>
                    {activeTab === 'text'
                        ? 'Your report will be instantly analyzed by Gemini AI to classify urgency, category, and match the best volunteers.'
                        : 'Upload up to 5 photos. Gemini Vision AI reads the image and auto-fills need details — no typing required.'}
                    </span>
                </div>

                {activeTab === 'text'
                    ? <TextSubmitForm  key={`text-${formKey}`}  onSuccess={handleSuccess}/>
                    : <ImageSubmitForm key={`image-${formKey}`} onSuccess={handleSuccess}/>}
                </div>

                {/* AI result */}
                {aiResult && (
                <div ref={resultRef} className="ai-result-wrap">
                    <div style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12,
                    }}>
                    <div style={{ fontWeight:700, fontSize:16, color:'#0F2419' }}>Analysis Result</div>
                    <button onClick={clearResult} style={{
                        display:'flex', alignItems:'center', gap:5, padding:'5px 12px',
                        borderRadius:9999, border:'1px solid #D1FAE5', background:'white',
                        fontSize:12, color:'#86BFAA', cursor:'pointer', transition:'all .2s',
                    }}>
                        <X size={12}/> Dismiss
                    </button>
                    </div>
                    <AiResultPanel result={aiResult}/>
                </div>
                )}
            </div>

            {/* RIGHT sidebar */}
            <div className="rp-side" style={{ display:'flex', flexDirection:'column', gap:20, opacity:0 }}>

                {/* how it works */}
                <div style={{
                background:'white', border:'1.5px solid #D1FAE5',
                borderRadius:20, padding:22,
                boxShadow:'0 1px 4px rgba(22,163,74,0.08)',
                }}>
                <div style={{ fontWeight:800, fontSize:16, color:'#0F2419', marginBottom:16 }}>
                    How it works
                </div>
                {[
                    { icon:'✍️', title:'Submit your report',    desc:'Text or photo — describe the situation or just upload an image.' },
                    { icon:'🤖', title:'AI analyzes instantly', desc:'Gemini classifies urgency, category, and priority score in seconds.' },
                    { icon:'🎯', title:'Volunteers matched',    desc:'Best volunteers are identified by skill and proximity automatically.' },
                    { icon:'✅', title:'Need resolved',          desc:'Track your submission status in real time below.' },
                ].map((s, i) => (
                    <div key={i} style={{ display:'flex', gap:12, marginBottom: i < 3 ? 14 : 0 }}>
                    <div style={{
                        width:36, height:36, borderRadius:10,
                        background:'#F0FFF4', border:'1px solid #D1FAE5',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:16, flexShrink:0,
                    }}>{s.icon}</div>
                    <div>
                        <div style={{ fontWeight:600, fontSize:13, color:'#0F2419', marginBottom:2 }}>{s.title}</div>
                        <div style={{ fontSize:12, color:'#86BFAA', lineHeight:1.5 }}>{s.desc}</div>
                    </div>
                    </div>
                ))}
                </div>

                {/* categories */}
                <div style={{
                background:'white', border:'1.5px solid #D1FAE5',
                borderRadius:20, padding:22,
                boxShadow:'0 1px 4px rgba(22,163,74,0.08)',
                }}>
                <div style={{ fontWeight:800, fontSize:15, color:'#0F2419', marginBottom:14 }}>
                    Need categories
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {[
                    { cat:'MEDICAL', desc:'Injuries, illness, medicine, medical equipment' },
                    { cat:'FOOD',    desc:'Hunger, food shortage, meal distribution'       },
                    { cat:'WATER',   desc:'Clean water, contamination, purification'        },
                    { cat:'SHELTER', desc:'Housing, displacement, flooding damage'          },
                    { cat:'OTHER',   desc:'Electricity, communication, logistics'           },
                    ].map(item => (
                    <div key={item.cat} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:18, width:28, textAlign:'center' }}>
                        {CATEGORY_ICONS[item.cat]}
                        </span>
                        <div>
                        <span style={{ fontWeight:700, fontSize:13, color:'#0F2419' }}>{item.cat} </span>
                        <span style={{ fontSize:12, color:'#86BFAA' }}>{item.desc}</span>
                        </div>
                    </div>
                    ))}
                </div>
                </div>

                {/* anonymous note */}
                <div style={{
                padding:'14px 18px', background:'#F0FFF4',
                border:'1px solid #A7F3D0', borderRadius:16,
                display:'flex', gap:10, alignItems:'flex-start',
                }}>
                <CheckCircle size={16} color="#16A34A" style={{ flexShrink:0, marginTop:2 }}/>
                <div style={{ fontSize:13, color:'#1A4731', lineHeight:1.6 }}>
                    <strong style={{ color:'#15803D' }}>Anonymous reporting supported.</strong>{' '}
                    Name and contact are optional. Your privacy is protected.
                </div>
                </div>
            </div>
            </div>

            {/* submissions list */}
            <div style={{ marginTop:40 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div>
                <h2 style={{ fontWeight:800, fontSize:22, color:'#0F2419', marginBottom:4 }}>
                    Recent Submissions
                </h2>
                <p style={{ fontSize:14, color:'#86BFAA' }}>Track the status of reported needs</p>
                </div>
                <button onClick={loadSubmissions} style={{
                display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
                borderRadius:9999, border:'1.5px solid #A7F3D0', background:'white',
                color:'#15803D', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='#F0FFF4'}
                onMouseLeave={e => e.currentTarget.style.background='white'}>
                <RefreshCw size={13} style={loadingSubs ? { animation:'spin .7s linear infinite' } : {}}/>
                Refresh
                </button>
            </div>
            <SubmissionsList submissions={submissions} loading={loadingSubs}/>
            </div>
        </div>
        </div>
    );
    }