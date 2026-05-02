// import React, { useState, useRef, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import {
//   ArrowRight, ArrowLeft, Leaf, MapPin, Eye, EyeOff,
//   Check, Users, FileText, AlertCircle, CheckCircle,
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { gsap } from '../../hooks/useGsap';
// import { authAPI } from '../../services/api';
// import { useAuth } from '../../context/AuthContext';

// // ── IMPORTANT: Only VOLUNTEER and REPORTER can self-register.
// // COORDINATOR is created by ADMIN only (SecurityConfig confirms this).
// // We show COORDINATOR as "grayed out / request access" per the security rules.

// const ROLE_ROUTES = { VOLUNTEER: '/volunteer/dashboard', REPORTER: '/reporter/dashboard' };

// const ROLES = [
//   {
//     id: 'REPORTER',
//     icon: '📋',
//     title: 'Reporter',
//     subtitle: 'Community Reporter',
//     desc: 'Submit community needs via text or photo. Track resolution status in real time.',
//     color: '#16A34A',
//     bg: '#F0FFF4',
//     border: '#86EFAC',
//     canSelfRegister: true,
//   },
//   {
//     id: 'VOLUNTEER',
//     icon: '🙋',
//     title: 'Volunteer',
//     subtitle: 'Field Volunteer',
//     desc: 'Get matched to needs by your skills and location. Help communities in the field.',
//     color: '#15803D',
//     bg: '#DCFCE7',
//     border: '#4ADE80',
//     canSelfRegister: true,
//   },
//   {
//     id: 'COORDINATOR',
//     icon: '🎯',
//     title: 'Coordinator',
//     subtitle: 'NGO Coordinator',
//     desc: 'Manage assignments, view maps, and deploy volunteers. Account created by admin only.',
//     color: '#6B7280',
//     bg: '#F9FAFB',
//     border: '#E5E7EB',
//     canSelfRegister: false, // SecurityConfig: only ADMIN can create coordinators
//   },
// ];

// const SKILLS = [
//   'medical', 'first_aid', 'nursing', 'counseling',
//   'cooking', 'food_distribution',
//   'driving', 'logistics',
//   'construction', 'shelter_management',
//   'water_supply', 'electrical',
// ];

// function PasswordStrength({ password }) {
//   const score = [
//     password.length >= 8,
//     /[A-Z]/.test(password),
//     /[0-9]/.test(password),
//     /[^A-Za-z0-9]/.test(password),
//   ].filter(Boolean).length;

//   const colors = ['#EF4444', '#F97316', '#EAB308', '#16A34A'];
//   const labels = ['Too short', 'Weak', 'Good', 'Strong'];

//   if (!password) return null;
//   return (
//     <div style={{ marginTop: 8 }}>
//       <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
//         {[1,2,3,4].map(i => (
//           <div key={i} className="pw-bar" style={{ flex: 1 }}>
//             <div className="pw-fill" style={{
//               width: i <= score ? '100%' : '0%',
//               background: colors[score - 1] || '#E5E7EB',
//             }}/>
//           </div>
//         ))}
//       </div>
//       <span style={{ fontSize: 11, color: colors[score - 1] || 'var(--text4)', fontWeight: 600 }}>
//         {labels[score - 1] || ''}
//       </span>
//     </div>
//   );
// }

// export default function RegisterPage() {
//   const { login }   = useAuth();
//   const navigate    = useNavigate();
//   const [step,    setStep]    = useState(1); // 1=role, 2=basic, 3=volunteer-extras
//   const [role,    setRole]    = useState('');
//   const [showPw,  setShowPw]  = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error,   setError]   = useState('');
//   const [form,    setForm]    = useState({
//     // Step 2 — basic (all roles)
//     name: '', email: '', password: '', phone: '',
//     // Step 3 — volunteer only
//     skills: [], locationName: '', latitude: '', longitude: '', radiusKm: 10,
//   });
//   const pageRef  = useRef(null);
//   const totalSteps = role === 'VOLUNTEER' ? 3 : role === 'REPORTER' ? 2 : 2;

//   // Page entrance
//   useEffect(() => {
//     const ctx = gsap.context(() => {
//       gsap.fromTo('.auth-left',
//         { opacity: 0, x: -48 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
//       );
//       gsap.fromTo('.auth-right',
//         { opacity: 0, x: 48 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
//       );
//     }, pageRef);
//     return () => ctx.revert();
//   }, []);

//   // Step transition
//   const animateStep = (dir = 'forward') => {
//     gsap.fromTo('.step-content',
//       { opacity: 0, x: dir === 'forward' ? 28 : -28, scale: 0.98 },
//       { opacity: 1, x: 0, scale: 1, duration: 0.38, ease: 'power3.out', clearProps: 'transform' }
//     );
//   };

//   const goNext = (nextStep) => { setStep(nextStep); setTimeout(() => animateStep('forward'), 10); };
//   const goBack = (prevStep) => { setStep(prevStep); setTimeout(() => animateStep('back'),    10); };

//   const toggleSkill = (s) => setForm(p => ({
//     ...p,
//     skills: p.skills.includes(s) ? p.skills.filter(x => x !== s) : [...p.skills, s],
//   }));

//   const detectLocation = () => {
//     navigator.geolocation.getCurrentPosition(
//       pos => {
//         setForm(p => ({
//           ...p,
//           latitude:  pos.coords.latitude.toFixed(6),
//           longitude: pos.coords.longitude.toFixed(6),
//         }));
//         toast.success('📍 Location detected!');
//       },
//       () => toast.error('Location access denied')
//     );
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true); setError('');

//     try {
//       // Build payload matching RegisterRequest exactly
//       const payload = {
//         name:     form.name,
//         email:    form.email,
//         password: form.password,
//         role,     // "VOLUNTEER" | "REPORTER"
//         ...(role === 'VOLUNTEER' && {
//           phone:        form.phone,
//           skills:       form.skills.join(','),      // comma-separated string
//           locationName: form.locationName,
//           latitude:     form.latitude  ? parseFloat(form.latitude)  : null,
//           longitude:    form.longitude ? parseFloat(form.longitude) : null,
//           radiusKm:     form.radiusKm,
//           isAvailable:  true,
//         }),
//         ...(role === 'REPORTER' && {
//           phone: form.phone,
//         }),
//       };

//       const res = await authAPI.register(payload);
//       login(res.data); // AuthResponse: { token, role, name, userId }
//       toast.success(`Account created! Welcome, ${res.data.name} 🌿`);
//       navigate(ROLE_ROUTES[role] || '/');
//     } catch (err) {
//       const msg = err.response?.data?.message
//         || (err.response?.data?.errors && Object.values(err.response.data.errors)[0])
//         || 'Registration failed. Please try again.';
//       setError(msg);
//       gsap.fromTo('.step-content',
//         { x: 0 }, { x: [-8, 8, -5, 5, 0], duration: 0.4, ease: 'power2.out' }
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const selectedRoleData = ROLES.find(r => r.id === role);

//   return (
//     <div ref={pageRef} className="auth-page">

//       {/* ── Left brand panel ── */}
//       <div className="auth-left">
//         <div className="auth-left-blob1"/>
//         <div className="auth-left-blob2"/>

//         <div style={{ position: 'relative', zIndex: 1 }}>
//           {/* Logo */}
//           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
//             <div style={{
//               width: 44, height: 44, borderRadius: 14,
//               background: 'linear-gradient(135deg,#22C55E,#16A34A)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//               boxShadow: '0 8px 24px rgba(34,197,94,0.5)',
//             }}>
//               <Leaf size={22} color="white" fill="white"/>
//             </div>
//             <div>
//               <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white' }}>ReliefNet</div>
//               <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginTop: 1 }}>CRISIS COORDINATION</div>
//             </div>
//           </div>

//           <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 16 }}>
//             Join the<br/>network that<br/>
//             <span style={{ color: '#4ADE80' }}>saves lives.</span>
//           </h1>
//           <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.75, maxWidth: 320, marginBottom: 44 }}>
//             Thousands of volunteers and reporters coordinate daily through ReliefNet to deliver help where it's needed most.
//           </p>

//           {/* Role preview — shows when role is selected */}
//           {selectedRoleData ? (
//             <div style={{
//               background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
//               borderRadius: 20, padding: '24px', transition: 'all 0.4s ease',
//             }}>
//               <div style={{ fontSize: 36, marginBottom: 12 }}>{selectedRoleData.icon}</div>
//               <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8 }}>
//                 {selectedRoleData.subtitle}
//               </div>
//               <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6 }}>
//                 {selectedRoleData.desc}
//               </p>
//             </div>
//           ) : (
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//               {[
//                 { icon: '✅', text: 'Free to join — no credit card' },
//                 { icon: '🔒', text: 'Your data is encrypted and safe' },
//                 { icon: '🤝', text: 'Join 340+ active volunteers' },
//               ].map(f => (
//                 <div key={f.text} className="auth-left-feature feature-pill">
//                   <span>{f.icon}</span><span>{f.text}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── Right form panel ── */}
//       <div className="auth-right">
//         <div style={{ width: '100%', maxWidth: 460 }}>

//           {/* Header */}
//           <div style={{ marginBottom: 28 }}>
//             <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
//               Create your account
//             </h2>
//             <p style={{ color: 'var(--text3)', fontSize: 14 }}>
//               Step {step} of {totalSteps || 2}
//             </p>
//           </div>

//           {/* Step progress bar */}
//           <div className="step-bar">
//             {Array.from({ length: totalSteps || 2 }, (_, i) => (
//               <div key={i} className={`step-bar-item ${i + 1 <= step ? 'active' : ''}`}/>
//             ))}
//           </div>

//           {error && (
//             <div className="alert alert-error" style={{ marginBottom: 20 }}>
//               <AlertCircle size={15} style={{ flexShrink: 0 }}/>
//               <span>{error}</span>
//             </div>
//           )}

//           {/* ══ STEP 1 — Choose role ══ */}
//           {step === 1 && (
//             <div className="step-content">
//               <p style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 16, fontSize: 15 }}>
//                 I want to join as a...
//               </p>
//               <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
//                 {ROLES.map(r => (
//                   <button key={r.id}
//                     onClick={() => r.canSelfRegister && setRole(r.id)}
//                     className={`role-card ${role === r.id ? 'selected' : ''} ${!r.canSelfRegister ? 'disabled' : ''}`}
//                     style={{
//                       opacity: r.canSelfRegister ? 1 : 0.55,
//                       cursor:  r.canSelfRegister ? 'pointer' : 'not-allowed',
//                       borderColor: role === r.id ? r.color : undefined,
//                       background:  role === r.id ? r.bg    : undefined,
//                     }}
//                   >
//                     <div className="role-card-icon"
//                       style={{ background: `${r.color}15`, border: `1px solid ${r.color}30` }}>
//                       <span style={{ fontSize: 24 }}>{r.icon}</span>
//                     </div>
//                     <div style={{ flex: 1 }}>
//                       <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>{r.title}</div>
//                       <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{r.desc}</div>
//                       {!r.canSelfRegister && (
//                         <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: 600 }}>
//                           🔒 Requires admin approval — contact your NGO admin
//                         </div>
//                       )}
//                     </div>
//                     {role === r.id && (
//                       <div style={{
//                         width: 24, height: 24, borderRadius: '50%',
//                         background: r.color,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
//                       }}>
//                         <Check size={14} color="white" strokeWidth={3}/>
//                       </div>
//                     )}
//                   </button>
//                 ))}
//               </div>

//               <button className="btn btn-primary" style={{ width: '100%', fontSize: 15 }}
//                 onClick={() => goNext(2)} disabled={!role}>
//                 Continue <ArrowRight size={17}/>
//               </button>

//               <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text3)' }}>
//                 Already have an account?{' '}
//                 <Link to="/login" style={{ color: 'var(--green-600)', fontWeight: 700, textDecoration: 'none' }}>
//                   Sign in
//                 </Link>
//               </p>
//             </div>
//           )}

//           {/* ══ STEP 2 — Basic info ══ */}
//           {step === 2 && (
//             <form className="step-content"
//               onSubmit={role === 'REPORTER' ? handleSubmit : (e) => { e.preventDefault(); goNext(3); }}
//               style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
//             >
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
//                 <div className="form-row">
//                   <label className="label">Full Name *</label>
//                   <input className="input" placeholder="Rahul Sharma"
//                     value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus/>
//                 </div>
//                 <div className="form-row">
//                   <label className="label">
//                     Phone {role === 'VOLUNTEER' ? '*' : '(optional)'}
//                   </label>
//                   <input className="input" placeholder="+91 98110 00000"
//                     value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
//                     required={role === 'VOLUNTEER'}/>
//                 </div>
//               </div>

//               <div className="form-row">
//                 <label className="label">Email address *</label>
//                 <input className="input" type="email" placeholder="you@example.com"
//                   value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required/>
//               </div>

//               <div className="form-row">
//                 <label className="label">Password *</label>
//                 <div style={{ position: 'relative' }}>
//                   <input className="input" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
//                     value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
//                     required minLength={6} style={{ paddingRight: 46 }}/>
//                   <button type="button" onClick={() => setShowPw(p => !p)} style={{
//                     position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
//                     background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex', padding: 0,
//                   }}>
//                     {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
//                   </button>
//                 </div>
//                 <PasswordStrength password={form.password}/>
//               </div>

//               {/* Role badge */}
//               <div style={{
//                 padding: '10px 14px', background: 'var(--green-50)',
//                 border: '1px solid var(--border2)', borderRadius: 'var(--r)',
//                 display: 'flex', alignItems: 'center', gap: 10,
//               }}>
//                 <span style={{ fontSize: 18 }}>{selectedRoleData?.icon}</span>
//                 <div>
//                   <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-800)' }}>
//                     Registering as {selectedRoleData?.title}
//                   </div>
//                   <button type="button" onClick={() => goBack(1)}
//                     style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 1 }}>
//                     Change role →
//                   </button>
//                 </div>
//               </div>

//               <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
//                 <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => goBack(1)}>
//                   <ArrowLeft size={16}/> Back
//                 </button>
//                 <button type="submit" disabled={loading} className="btn btn-primary"
//                   style={{ flex: 2, fontSize: 14 }}>
//                   {loading
//                     ? <><div className="spinner"/> Creating...</>
//                     : role === 'REPORTER'
//                       ? <><CheckCircle size={16}/> Create Account</>
//                       : <>Continue <ArrowRight size={16}/></>
//                   }
//                 </button>
//               </div>
//             </form>
//           )}

//           {/* ══ STEP 3 — Volunteer specifics ══ */}
//           {step === 3 && role === 'VOLUNTEER' && (
//             <form className="step-content" onSubmit={handleSubmit}
//               style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

//               {/* Skills */}
//               <div className="form-row">
//                 <label className="label">Your Skills * (select all that apply)</label>
//                 <div style={{
//                   display: 'flex', flexWrap: 'wrap', gap: 8,
//                   padding: 14, background: 'var(--surface2)',
//                   border: '1.5px solid var(--border)', borderRadius: 'var(--r)',
//                 }}>
//                   {SKILLS.map(s => (
//                     <button type="button" key={s} onClick={() => toggleSkill(s)}
//                       className={`skill-chip ${form.skills.includes(s) ? 'active' : ''}`}>
//                       {s.replace(/_/g, ' ')}
//                     </button>
//                   ))}
//                 </div>
//                 {form.skills.length > 0 && (
//                   <div style={{ fontSize: 12, color: 'var(--green-700)', marginTop: 6, fontWeight: 600 }}>
//                     ✓ {form.skills.length} skill{form.skills.length > 1 ? 's' : ''} selected
//                   </div>
//                 )}
//               </div>

//               {/* Location */}
//               <div className="form-row">
//                 <label className="label">Your Location</label>
//                 <div style={{ display: 'flex', gap: 8 }}>
//                   <input className="input" placeholder="Area / City name" style={{ flex: 1 }}
//                     value={form.locationName} onChange={e => setForm(p => ({ ...p, locationName: e.target.value }))}/>
//                   <button type="button" onClick={detectLocation}
//                     className="btn btn-ghost" style={{ borderRadius: 'var(--r)', padding: '0 16px', flexShrink: 0, gap: 4 }}>
//                     <MapPin size={15}/> Detect
//                   </button>
//                 </div>
//               </div>

//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
//                 <div className="form-row">
//                   <label className="label">Latitude</label>
//                   <input className="input" placeholder="28.6692"
//                     value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}/>
//                 </div>
//                 <div className="form-row">
//                   <label className="label">Longitude</label>
//                   <input className="input" placeholder="77.4538"
//                     value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}/>
//                 </div>
//               </div>

//               {/* Travel radius */}
//               <div className="form-row">
//                 <label className="label">
//                   Willing to travel: <strong style={{ color: 'var(--green-600)' }}>{form.radiusKm} km</strong>
//                 </label>
//                 <input type="range" min={1} max={50} value={form.radiusKm}
//                   onChange={e => setForm(p => ({ ...p, radiusKm: Number(e.target.value) }))}
//                   style={{ width: '100%', accentColor: 'var(--green-600)', marginTop: 6 }}/>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>
//                   <span>1 km</span><span>50 km</span>
//                 </div>
//               </div>

//               <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
//                 <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => goBack(2)}>
//                   <ArrowLeft size={16}/> Back
//                 </button>
//                 <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, fontSize: 14 }}>
//                   {loading
//                     ? <><div className="spinner"/> Creating account...</>
//                     : <><CheckCircle size={16}/> Create Account</>
//                   }
//                 </button>
//               </div>
//             </form>
//           )}

//           {/* Already have account */}
//           {step > 1 && (
//             <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text4)' }}>
//               Already have an account?{' '}
//               <Link to="/login" style={{ color: 'var(--green-600)', fontWeight: 700, textDecoration: 'none' }}>
//                 Sign in
//               </Link>
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }




import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Leaf, MapPin, Eye, EyeOff,
  Check, Users, FileText, AlertCircle, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { gsap } from '../../hooks/useGsap';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_ROUTES = {
  VOLUNTEER:   '/volunteer/dashboard',
  REPORTER:    '/reporter/dashboard',
  COORDINATOR: '/coordinator/dashboard', 
};

const ROLES = [
  {
    id: 'REPORTER',
    icon: '📋',
    title: 'Reporter',
    subtitle: 'Community Reporter',
    desc: 'Submit community needs via text or photo. Track resolution status in real time.',
    color: '#16A34A',
    bg: '#F0FFF4',
    border: '#86EFAC',
    canSelfRegister: true,
  },
  {
    id: 'VOLUNTEER',
    icon: '🙋',
    title: 'Volunteer',
    subtitle: 'Field Volunteer',
    desc: 'Get matched to needs by your skills and location. Help communities in the field.',
    color: '#15803D',
    bg: '#DCFCE7',
    border: '#4ADE80',
    canSelfRegister: true,
  },
  {
    id: 'COORDINATOR',
    icon: '🎯',
    title: 'Coordinator',
    subtitle: 'NGO Coordinator',
    desc: 'Manage assignments, view maps, and deploy volunteers. Requires an invite code from your NGO.',
    color: '#166534',
    bg: '#F0FFF4',
    border: '#86EFAC',
    canSelfRegister: true, // ← enabled: uses invite code instead of admin approval
  },
];

const SKILLS = [
  'medical', 'first_aid', 'nursing', 'counseling',
  'cooking', 'food_distribution',
  'driving', 'logistics',
  'construction', 'shelter_management',
  'water_supply', 'electrical',
];

function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const colors = ['#EF4444', '#F97316', '#EAB308', '#16A34A'];
  const labels = ['Too short', 'Weak', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="pw-bar" style={{ flex: 1 }}>
            <div className="pw-fill" style={{
              width: i <= score ? '100%' : '0%',
              background: colors[score - 1] || '#E5E7EB',
            }}/>
          </div>
        ))}
      </div>
      <span style={{ fontSize: 11, color: colors[score - 1] || 'var(--text4)', fontWeight: 600 }}>
        {labels[score - 1] || ''}
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [step,    setStep]    = useState(1);
  const [role,    setRole]    = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [showInvite, setShowInvite] = useState(false); // ← for invite code eye toggle
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form,    setForm]    = useState({
    name: '', email: '', password: '', phone: '',
    inviteCode: '',                              // ← added for coordinator
    skills: [], locationName: '', latitude: '', longitude: '', radiusKm: 10,
  });
  const pageRef  = useRef(null);
  const totalSteps = role === 'VOLUNTEER' ? 3 : 2;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.auth-left',
        { opacity: 0, x: -48 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo('.auth-right',
        { opacity: 0, x: 48 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const animateStep = (dir = 'forward') => {
    gsap.fromTo('.step-content',
      { opacity: 0, x: dir === 'forward' ? 28 : -28, scale: 0.98 },
      { opacity: 1, x: 0, scale: 1, duration: 0.38, ease: 'power3.out', clearProps: 'transform' }
    );
  };

  const goNext = (nextStep) => { setStep(nextStep); setTimeout(() => animateStep('forward'), 10); };
  const goBack = (prevStep) => { setStep(prevStep); setTimeout(() => animateStep('back'),    10); };

  const toggleSkill = (s) => setForm(p => ({
    ...p,
    skills: p.skills.includes(s) ? p.skills.filter(x => x !== s) : [...p.skills, s],
  }));

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(p => ({
          ...p,
          latitude:  pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success('📍 Location detected!');
      },
      () => toast.error('Location access denied')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    try {
      let res;

      if (role === 'COORDINATOR') {
        // ── Coordinator: use invite-code endpoint ──────────────
        res = await authAPI.registerCoordinator({
          name:       form.name,
          email:      form.email,
          password:   form.password,
          inviteCode: form.inviteCode,
        });

      } else if (role === 'VOLUNTEER') {
        // ── Volunteer: include skills + location ───────────────
        res = await authAPI.register({
          name:         form.name,
          email:        form.email,
          password:     form.password,
          role,
          phone:        form.phone,
          skills:       form.skills.join(','),
          locationName: form.locationName,
          latitude:     form.latitude  ? parseFloat(form.latitude)  : null,
          longitude:    form.longitude ? parseFloat(form.longitude) : null,
          radiusKm:     form.radiusKm,
          isAvailable:  true,
        });

      } else {
        // ── Reporter ───────────────────────────────────────────
        res = await authAPI.register({
          name:     form.name,
          email:    form.email,
          password: form.password,
          role,
          phone:    form.phone,
        });
      }

      login(res.data);
      toast.success(`Account created! Welcome, ${res.data.name} 🌿`);
      navigate(ROLE_ROUTES[role] || '/');

    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.data?.errors && Object.values(err.response.data.errors)[0])
        || 'Registration failed. Please try again.';
      setError(msg);
      gsap.fromTo('.step-content',
        { x: 0 }, { x: [-8, 8, -5, 5, 0], duration: 0.4, ease: 'power2.out' }
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleData = ROLES.find(r => r.id === role);

  // Step 2 submits form for REPORTER and COORDINATOR; goes to step 3 for VOLUNTEER
  const handleStep2Submit = (e) => {
    e.preventDefault();
    if (role === 'VOLUNTEER') {
      goNext(3);
    } else {
      handleSubmit(e);
    }
  };

  return (
    <div ref={pageRef} className="auth-page">

      {/* ── Left brand panel ── */}
      <div className="auth-left">
        <div className="auth-left-blob1"/>
        <div className="auth-left-blob2"/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg,#22C55E,#16A34A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(34,197,94,0.5)',
            }}>
              <Leaf size={22} color="white" fill="white"/>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white' }}>ReliefNet</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginTop: 1 }}>CRISIS COORDINATION</div>
            </div>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 16 }}>
            Join the<br/>network that<br/>
            <span style={{ color: '#4ADE80' }}>saves lives.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.75, maxWidth: 320, marginBottom: 44 }}>
            Thousands of volunteers and reporters coordinate daily through ReliefNet to deliver help where it's needed most.
          </p>

          {selectedRoleData ? (
            <div style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20, padding: '24px', transition: 'all 0.4s ease',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{selectedRoleData.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                {selectedRoleData.subtitle}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6 }}>
                {selectedRoleData.desc}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '✅', text: 'Free to join — no credit card' },
                { icon: '🔒', text: 'Your data is encrypted and safe' },
                { icon: '🤝', text: 'Join 340+ active volunteers' },
              ].map(f => (
                <div key={f.text} className="auth-left-feature feature-pill">
                  <span>{f.icon}</span><span>{f.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div style={{ width: '100%', maxWidth: 460 }}>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
              Create your account
            </h2>
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>
              Step {step} of {totalSteps}
            </p>
          </div>

          <div className="step-bar">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={`step-bar-item ${i + 1 <= step ? 'active' : ''}`}/>
            ))}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }}/>
              <span>{error}</span>
            </div>
          )}

          {/* ══ STEP 1 — Choose role ══ */}
          {step === 1 && (
            <div className="step-content">
              <p style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 16, fontSize: 15 }}>
                I want to join as a...
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {ROLES.map(r => (
                  <button key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`role-card ${role === r.id ? 'selected' : ''}`}
                    style={{
                      cursor: 'pointer',
                      borderColor: role === r.id ? r.color : undefined,
                      background:  role === r.id ? r.bg    : undefined,
                    }}
                  >
                    <div className="role-card-icon"
                      style={{ background: `${r.color}15`, border: `1px solid ${r.color}30` }}>
                      <span style={{ fontSize: 24 }}>{r.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{r.desc}</div>
                      {/* Show invite code hint only for coordinator */}
                      {r.id === 'COORDINATOR' && (
                        <div style={{ fontSize: 11, color: '#16A34A', marginTop: 4, fontWeight: 600 }}>
                          🔑 Requires coordinator invite code
                        </div>
                      )}
                    </div>
                    {role === r.id && (
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: r.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Check size={14} color="white" strokeWidth={3}/>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button className="btn btn-primary" style={{ width: '100%', fontSize: 15 }}
                onClick={() => goNext(2)} disabled={!role}>
                Continue <ArrowRight size={17}/>
              </button>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text3)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--green-600)', fontWeight: 700, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* ══ STEP 2 — Basic info ══ */}
          {step === 2 && (
            <form className="step-content"
              onSubmit={handleStep2Submit}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-row">
                  <label className="label">Full Name *</label>
                  <input className="input" placeholder="Rahul Sharma"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus/>
                </div>
                <div className="form-row">
                  <label className="label">Phone {role === 'VOLUNTEER' ? '*' : '(optional)'}</label>
                  <input className="input" placeholder="+91 98110 00000"
                    value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    required={role === 'VOLUNTEER'}/>
                </div>
              </div>

              <div className="form-row">
                <label className="label">Email address *</label>
                <input className="input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required/>
              </div>

              <div className="form-row">
                <label className="label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required minLength={6} style={{ paddingRight: 46 }}/>
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex', padding: 0,
                  }}>
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                <PasswordStrength password={form.password}/>
              </div>

              {/* ── Invite code field — only shown for COORDINATOR ── */}
              {role === 'COORDINATOR' && (
                <div className="form-row">
                  <label className="label">Coordinator Invite Code *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type={showInvite ? 'text' : 'password'}
                      placeholder="Enter invite code from your NGO"
                      value={form.inviteCode}
                      onChange={e => setForm(p => ({ ...p, inviteCode: e.target.value }))}
                      required
                      style={{ paddingRight: 46 }}
                    />
                    <button type="button" onClick={() => setShowInvite(p => !p)} style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex', padding: 0,
                    }}>
                      {showInvite ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>
                    🔑 Get this code from your NGO manager
                  </div>
                </div>
              )}

              {/* Role badge */}
              <div style={{
                padding: '10px 14px', background: 'var(--green-50)',
                border: '1px solid var(--border2)', borderRadius: 'var(--r)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>{selectedRoleData?.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-800)' }}>
                    Registering as {selectedRoleData?.title}
                  </div>
                  <button type="button" onClick={() => goBack(1)}
                    style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 1 }}>
                    Change role →
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => goBack(1)}>
                  <ArrowLeft size={16}/> Back
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, fontSize: 14 }}>
                  {loading
                    ? <><div className="spinner"/> Creating...</>
                    : role === 'VOLUNTEER'
                      ? <>Continue <ArrowRight size={16}/></>
                      : <><CheckCircle size={16}/> Create Account</>
                  }
                </button>
              </div>
            </form>
          )}

          {/* ══ STEP 3 — Volunteer specifics ══ */}
          {step === 3 && role === 'VOLUNTEER' && (
            <form className="step-content" onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div className="form-row">
                <label className="label">Your Skills * (select all that apply)</label>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8,
                  padding: 14, background: 'var(--surface2)',
                  border: '1.5px solid var(--border)', borderRadius: 'var(--r)',
                }}>
                  {SKILLS.map(s => (
                    <button type="button" key={s} onClick={() => toggleSkill(s)}
                      className={`skill-chip ${form.skills.includes(s) ? 'active' : ''}`}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                {form.skills.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--green-700)', marginTop: 6, fontWeight: 600 }}>
                    ✓ {form.skills.length} skill{form.skills.length > 1 ? 's' : ''} selected
                  </div>
                )}
              </div>

              <div className="form-row">
                <label className="label">Your Location</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" placeholder="Area / City name" style={{ flex: 1 }}
                    value={form.locationName} onChange={e => setForm(p => ({ ...p, locationName: e.target.value }))}/>
                  <button type="button" onClick={detectLocation}
                    className="btn btn-ghost" style={{ borderRadius: 'var(--r)', padding: '0 16px', flexShrink: 0, gap: 4 }}>
                    <MapPin size={15}/> Detect
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-row">
                  <label className="label">Latitude</label>
                  <input className="input" placeholder="28.6692"
                    value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}/>
                </div>
                <div className="form-row">
                  <label className="label">Longitude</label>
                  <input className="input" placeholder="77.4538"
                    value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}/>
                </div>
              </div>

              <div className="form-row">
                <label className="label">
                  Willing to travel: <strong style={{ color: 'var(--green-600)' }}>{form.radiusKm} km</strong>
                </label>
                <input type="range" min={1} max={50} value={form.radiusKm}
                  onChange={e => setForm(p => ({ ...p, radiusKm: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--green-600)', marginTop: 6 }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>
                  <span>1 km</span><span>50 km</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => goBack(2)}>
                  <ArrowLeft size={16}/> Back
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, fontSize: 14 }}>
                  {loading
                    ? <><div className="spinner"/> Creating account...</>
                    : <><CheckCircle size={16}/> Create Account</>
                  }
                </button>
              </div>
            </form>
          )}

          {step > 1 && (
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text4)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--green-600)', fontWeight: 700, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
