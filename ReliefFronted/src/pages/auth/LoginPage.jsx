import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowRight, Leaf, ShieldCheck,
  Users, FileText, BarChart3, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { gsap } from '../../hooks/useGsap';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_ROUTES = {
  ADMIN:       '/coordinator/dashboard',
  COORDINATOR: '/coordinator/dashboard',
  VOLUNTEER:   '/volunteer/dashboard',
  REPORTER:    '/reporter/dashboard',
};

const DEMO_CREDS = [
  { role: 'Admin',       email: 'admin@ngo.com',  pass: 'admin123',  color: '#14532D', icon: ShieldCheck },
  { role: 'Coordinator', email: 'coord@ngo.com',  pass: 'coord123',  color: '#166534', icon: BarChart3 },
  { role: 'Volunteer',   email: 'vol@ngo.com',    pass: 'vol123',    color: '#15803D', icon: Users },
  { role: 'Reporter',    email: 'rep@ngo.com',    pass: 'rep123',    color: '#16A34A', icon: FileText },
];

const FEATURES = [
  { text: 'AI-powered urgency classification',       icon: '⚡' },
  { text: 'Smart volunteer matching by skill & location', icon: '🎯' },
  { text: 'Real-time map with crisis visualization', icon: '🗺️' },
  { text: 'Image reporting via Gemini Vision',       icon: '📸' },
];

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const pageRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo('.auth-left',
          { opacity: 0, x: -56 },
          { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }
        )
        .fromTo('.auth-right',
          { opacity: 0, x: 56 },
          { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }, '-=0.7'
        )
        .fromTo('.auth-left-feature',
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, '-=0.4'
        )
        .fromTo('.login-form-row',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, '-=0.3'
        );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    gsap.to('.login-submit-btn', { scale: 0.97, duration: 0.1, yoyo: true, repeat: 1 });

    try {
      const res = await authAPI.login(form);
      login(res.data);
      toast.success(`Welcome back, ${res.data.name}! 🌿`);
      navigate(ROLE_ROUTES[res.data.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
      gsap.fromTo('.auth-right',
        { x: 0 },
        { x: [-10, 10, -7, 7, -4, 4, 0], duration: 0.55, ease: 'power2.out' }
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
    gsap.fromTo('.demo-fill', { scale: 0.97 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
  };

  return (
    <div ref={pageRef} className="auth-page">

      {/* ── Left brand panel ── */}
      <div className="auth-left">
        <div className="auth-left-blob1"/>
        <div className="auth-left-blob2"/>
        <div className="auth-left-ring"/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg,#22C55E,#16A34A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(34,197,94,0.5)',
            }}>
              <Leaf size={22} color="white" fill="white"/>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white' }}>
                ReliefNet
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginTop: 1 }}>
                CRISIS COORDINATION
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 800,
            color: 'white', lineHeight: 1.1, marginBottom: 18,
          }}>
            Coordinate<br/>relief with<br/>
            <span style={{
              color: 'transparent',
              backgroundImage: 'linear-gradient(135deg,#4ADE80,#22C55E)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
            }}>intelligence.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.75, maxWidth: 340, marginBottom: 44 }}>
            AI-powered volunteer coordination that gets the right help to the right people — fast.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f.text} className="auth-left-feature feature-pill">
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Floating stat cards */}
          <div style={{ marginTop: 48, display: 'flex', gap: 12 }}>
            <div className="float-card" style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16, padding: '16px 20px', flex: 1,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#4ADE80' }}>2.4k</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Needs resolved</div>
            </div>
            <div className="float-card-2" style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16, padding: '16px 20px', flex: 1,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#4ADE80' }}>340</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Volunteers active</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Header */}
          <div className="login-form-row" style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--text3)', fontSize: 15 }}>
              Sign in to your ReliefNet account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error login-form-row">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }}/>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="login-form-row">
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoFocus/>
            </div>

            <div className="login-form-row">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required style={{ paddingRight: 46 }}/>
                <button type="button" onClick={() => setShowPw(p => !p)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text4)', display: 'flex', padding: 0,
                }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div className="login-form-row">
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg login-submit-btn"
                style={{ width: '100%', fontSize: 15, fontWeight: 700 }}>
                {loading
                  ? <><div className="spinner"/> Signing in...</>
                  : <>Sign in <ArrowRight size={17}/></>
                }
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="login-form-row divider">Demo credentials</div>

          {/* Demo cards */}
          <div className="demo-fill login-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_CREDS.map(d => (
              <button key={d.role} onClick={() => fillDemo(d.email, d.pass)} style={{
                padding: '10px 14px', borderRadius: 'var(--r)',
                border: '1.5px solid var(--border)', background: 'var(--surface)',
                cursor: 'pointer', textAlign: 'left', transition: 'all var(--t)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-400)'; e.currentTarget.style.background = 'var(--green-50)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';    e.currentTarget.style.background = 'var(--surface)'; }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `${d.color}18`, border: `1px solid ${d.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <d.icon size={14} color={d.color}/>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{d.role}</div>
                  <div style={{ fontSize: 11, color: 'var(--text4)' }}>{d.email}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Register link */}
          <div className="login-form-row" style={{ marginTop: 28, textAlign: 'center' }}>
            <span style={{ color: 'var(--text3)', fontSize: 14 }}>Don't have an account? </span>
            <Link to="/register" style={{ color: 'var(--green-600)', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
              Register free
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <Link to="/submit-need" style={{ color: 'var(--text4)', fontSize: 13, textDecoration: 'none' }}>
              Report a need without signing in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
