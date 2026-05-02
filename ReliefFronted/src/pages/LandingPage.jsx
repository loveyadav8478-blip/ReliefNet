import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Zap, MapPin, Image, RefreshCw, Leaf, ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { id:'s1', target:2400, suffix:'+', label:'Needs Resolved'    },
  { id:'s2', target:340,  suffix:'',  label:'Active Volunteers' },
  { id:'s3', target:94,   suffix:'',  label:'AI Score Avg'      },
  { id:'s4', target:2,    suffix:'h', label:'Mean Response'     },
];

const STEPS = [
  { num:'01', icon:'📋', title:'Report a Need',      desc:'Anyone submits a need via text or photo. No technical knowledge required — just describe the situation or upload an image from the field.' },
  { num:'02', icon:'🤖', title:'AI Classifies It',   desc:'Gemini AI instantly assigns a category (Medical, Food, Water, Shelter), urgency level, and a priority score 1–100 with clear reasoning.' },
  { num:'03', icon:'🎯', title:'Volunteers Matched', desc:'The matching engine ranks volunteers by skill overlap and distance. Coordinators see ranked results with transparent scoring instantly.' },
  { num:'04', icon:'✅', title:'Mission Resolved',   desc:'Tasks flow Assigned → In Progress → Resolved. Every need tracked to completion. Dashboard stats update live in real time.' },
];

const AI_FEATURES = [
  { icon:'⚡', title:'Instant text classification',      desc:'Gemini reads any submission and assigns category, urgency, and priority score 1–100 with reasoning — in under 3 seconds.' },
  { icon:'📸', title:'Image analysis via Gemini Vision', desc:'Reporters upload a photo. Gemini sees damage, injury, or flooding and creates a fully classified need automatically — no typing needed.' },
  { icon:'🎯', title:'Haversine volunteer matching',      desc:'Volunteers ranked by weighted score: 60% skill match + 40% distance proximity. Best candidate surfaces first with full reasoning.' },
  { icon:'🔄', title:'Keyword fallback engine',           desc:'If Gemini is unavailable, a keyword classifier ensures no need goes unclassified. Your coordination never stops.' },
];

const ROLES = [
  { id:'coord', emoji:'🎯', title:'Coordinator', chip:'NGO / Admin', desc:'The command center. Manage every need, run AI matching, assign volunteers, and monitor all missions from the live dashboard and map.', perms:['Full dashboard + live map access','Assign volunteers to any need','Trigger AI re-analysis','Manage full task lifecycle'], btnLabel:'Sign in as Coordinator', btnTo:'/login', accent:'#16A34A', chipBg:'#DCFCE7', chipColor:'#166534', borderHover:'#4ADE80' },
  { id:'vol',   emoji:'🙋', title:'Volunteer',   chip:'Field Agent', desc:'The backbone of relief. Register your skills and location, get matched to nearby needs automatically, and update task status from the field.', perms:['View your assigned tasks','Update task progress in real time','Toggle your own availability','Manage your profile and skills'], btnLabel:'Register as Volunteer', btnTo:'/register', accent:'#2563EB', chipBg:'#EFF6FF', chipColor:'#1D4ED8', borderHover:'#93C5FD' },
  { id:'rep',   emoji:'📋', title:'Reporter',    chip:'Community Voice', desc:'The first signal from the field. Submit needs by text or photo — no login needed. Anyone with a phone can trigger the full relief pipeline.', perms:['Submit needs without logging in','Upload photos for AI analysis','Track your submission status','Anonymous or registered'], btnLabel:'Register as Reporter', btnTo:'/register', accent:'#D97706', chipBg:'#FFFBEB', chipColor:'#92400E', borderHover:'#FCD34D' },
];

const IMPACTS = [
  { num:'2.4k+', label:'Community needs resolved'    },
  { num:'340',   label:'Active volunteers deployed'   },
  { num:'2.4h',  label:'Mean response time'           },
  { num:'94%',   label:'AI classification accuracy'   },
];

const TECH = [
  {i:'⚛️',l:'React 18 + Vite'},{i:'☕',l:'Spring Boot 3'},{i:'🤖',l:'Gemini 1.5 Flash'},
  {i:'🗺️',l:'Leaflet.js Maps'},{i:'🎨',l:'Tailwind CSS'},{i:'🔐',l:'JWT Auth'},
  {i:'🐘',l:'PostgreSQL'},{i:'🏃',l:'GSAP Animations'},{i:'📐',l:'Haversine Algorithm'},{i:'👁️',l:'Gemini Vision API'},
];

const MARQUEE = ['AI Urgency Classification','Smart Volunteer Matching','Live Crisis Map','Gemini Vision Analysis','JWT Authentication','Real-Time Dashboard','Community Reporting','Haversine Matching Engine'];

const INJECTED_CSS = `
  @keyframes rn-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
  @keyframes rn-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  .rn-pulse { animation: rn-pulse 2s infinite; }
  .rn-marquee-track { animation: rn-marquee 26s linear infinite; }
  .rn-nav-link:hover { color: var(--green-700) !important; background: var(--green-50) !important; }
  .rn-step-card:hover { box-shadow: var(--shadow) !important; transform: translateY(-4px) !important; border-color: var(--border2) !important; }
  .rn-ai-feat:hover { border-color: var(--border3) !important; transform: translateX(4px) !important; box-shadow: var(--shadow-sm) !important; }
  .rn-tech-pill:hover { border-color: var(--border3) !important; color: var(--green-700) !important; background: var(--green-50) !important; }
  .rn-imp-card:hover { box-shadow: var(--shadow) !important; transform: translateY(-4px) !important; border-color: var(--border3) !important; }
`;

// Shared primitives
const Eyebrow = ({children, center}) => (
  <div style={{ display: center ? 'block':'inline-flex', width: center ? 'fit-content':undefined, margin: center ? '0 auto 16px':undefined, padding:'4px 12px', borderRadius:'var(--r-full)', background:'var(--green-100)', color:'var(--green-700)', fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom: center ? undefined : 16 }}>{children}</div>
);
const STitle = ({children,center}) => (
  <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(36px,3.8vw,54px)', lineHeight:1.05, letterSpacing:'-0.02em', color:'var(--text)', marginBottom:14, textAlign: center ? 'center':'left' }}>{children}</h2>
);
const SSub = ({children}) => (
  <p style={{ fontSize:16, color:'var(--text3)', lineHeight:1.75, maxWidth:520 }}>{children}</p>
);

// ── NAVBAR ────────────────────────────────────────────────────────────────────
function Navbar() {
  const ref = useRef(null);
  useEffect(() => {
    gsap.fromTo(ref.current, { opacity:0, y:-20 }, { opacity:1, y:0, duration:0.6, ease:'power2.out', delay:0.1 });
    const fn = () => {
      if (!ref.current) return;
      ref.current.style.borderBottomColor = window.scrollY > 40 ? 'var(--border)' : 'transparent';
      ref.current.style.boxShadow = window.scrollY > 40 ? 'var(--shadow-sm)' : 'none';
    };
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav ref={ref} style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:68, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 52px', background:'rgba(255,255,255,0.92)', backdropFilter:'blur(14px)', borderBottom:'1px solid transparent', transition:'border-color .3s, box-shadow .3s' }}>
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
        <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,var(--green-500),var(--green-700))', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(34,197,94,0.3)' }}>
          <Leaf size={20} color="white" fill="white"/>
        </div>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:19, color:'var(--green-900)' }}>ReliefNet</div>
          <div style={{ fontSize:10, color:'var(--text4)', fontWeight:500, letterSpacing:'0.06em', marginTop:1 }}>CRISIS COORDINATION</div>
        </div>
      </Link>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {[['How It Works','#how'],['AI Features','#ai'],["Who It's For",'#roles'],['Impact','#impact']].map(([l,h]) => (
          <a key={l} href={h} className="rn-nav-link" style={{ padding:'8px 14px', borderRadius:'var(--r-full)', fontSize:14, fontWeight:500, color:'var(--text3)', textDecoration:'none', transition:'all .2s' }}>{l}</a>
        ))}
        <div style={{ width:1, height:20, background:'var(--border2)', margin:'0 8px' }}/>
        <Link to="/login" style={{ padding:'9px 20px', borderRadius:'var(--r-full)', border:'1.5px solid var(--border2)', color:'var(--green-700)', fontSize:14, fontWeight:600, textDecoration:'none', transition:'all .2s' }}>Sign In</Link>
        <Link to="/register" style={{ padding:'9px 22px', borderRadius:'var(--r-full)', background:'linear-gradient(135deg,var(--green-600),var(--green-700))', color:'white', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 14px rgba(22,163,74,0.30)', marginLeft:4, transition:'all .2s' }}>Get Started →</Link>
      </div>
    </nav>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero() {
  const ref = useRef(null);
  const numRefs = useRef({});

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay:0.3 });
      tl.fromTo('.rn-hero-tag',   {opacity:0,y:14},{opacity:1,y:0,duration:0.55,ease:'power3.out'})
        .fromTo('.rn-hero-title', {opacity:0,y:40},{opacity:1,y:0,duration:0.8, ease:'power3.out'},'-=0.35')
        .fromTo('.rn-hero-desc',  {opacity:0,y:20},{opacity:1,y:0,duration:0.55,ease:'power2.out'},'-=0.45')
        .fromTo('.rn-hero-ctas',  {opacity:0,y:16},{opacity:1,y:0,duration:0.45,ease:'power2.out'},'-=0.35')
        .fromTo('.rn-hero-stats', {opacity:0,y:16},{opacity:1,y:0,duration:0.45,ease:'power2.out'},'-=0.3')
        .fromTo('.rn-hero-card',  {opacity:0,x:44,scale:0.96},{opacity:1,x:0,scale:1,duration:0.9,ease:'power3.out'},'-=0.7');
      gsap.fromTo('.rn-dc-stat', {opacity:0,y:10},{opacity:1,y:0,duration:0.3,stagger:0.07,ease:'power2.out',delay:1.1});
      gsap.fromTo('.rn-dc-need', {opacity:0,y:8}, {opacity:1,y:0,duration:0.3,stagger:0.1, ease:'power2.out',delay:1.35});
      STATS.forEach(s => {
        const el = numRefs.current[s.id];
        if (!el) return;
        const obj = { v:0 };
        gsap.to(obj,{ v:s.target, duration:2.4, ease:'power2.out', delay:1.0, onUpdate(){ el.textContent = Math.round(obj.v).toLocaleString()+s.suffix; } });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} style={{ minHeight:'100vh', display:'flex', alignItems:'center', padding:'100px 52px 72px', background:'linear-gradient(160deg,#FFFFFF 0%,var(--bg-alt) 55%,var(--green-50) 100%)', borderBottom:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
        {/* Left */}
        <div>
          <div className="rn-hero-tag" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:'var(--r-full)', background:'var(--green-100)', border:'1px solid var(--border2)', fontSize:12, fontWeight:600, color:'var(--green-700)', marginBottom:28, opacity:0 }}>
            <span className="rn-pulse" style={{ width:7, height:7, borderRadius:'50%', background:'var(--green-500)', display:'inline-block' }}/>
            Live Crisis Coordination System
          </div>

          <h1 className="rn-hero-title" style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(48px,5.5vw,76px)', lineHeight:1.0, letterSpacing:'-0.02em', color:'var(--text)', marginBottom:22, opacity:0 }}>
            Coordinate<br/>relief with<br/><span style={{ color:'var(--green-600)' }}>intelligence.</span>
          </h1>

          <p className="rn-hero-desc" style={{ fontSize:17, color:'var(--text3)', lineHeight:1.75, maxWidth:480, marginBottom:40, opacity:0 }}>
            ReliefNet connects NGOs, volunteers, and communities through AI that automatically classifies urgent needs, matches the right people, and tracks every mission to resolution — in real time.
          </p>

          <div className="rn-hero-ctas" style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:48, opacity:0 }}>
            <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:'var(--r-full)', background:'linear-gradient(135deg,var(--green-600),var(--green-700))', color:'white', fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:'0 6px 20px rgba(22,163,74,0.32)', transition:'all .22s' }}>
              <Zap size={16} fill="white" stroke="none"/>Start Coordinating
            </Link>
            <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 24px', borderRadius:'var(--r-full)', border:'1.5px solid var(--border2)', color:'var(--green-700)', fontSize:15, fontWeight:600, textDecoration:'none', transition:'all .22s' }}>
              Sign In to Dashboard <ArrowRight size={16}/>
            </Link>
          </div>

          <div className="rn-hero-stats" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'1.5px solid var(--border2)', borderRadius:'var(--r-lg)', overflow:'hidden', background:'white', boxShadow:'var(--shadow-sm)', opacity:0 }}>
            {STATS.map((s,i) => (
              <div key={s.id} style={{ padding:'16px 12px', textAlign:'center', borderRight: i<3 ? '1px solid var(--border2)' : 'none' }}>
                <span ref={el => numRefs.current[s.id]=el} style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:26, color:'var(--green-600)', display:'block', lineHeight:1 }}>0</span>
                <span style={{ fontSize:11, color:'var(--text4)', marginTop:4, display:'block', fontWeight:500 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Dashboard card */}
        <div className="rn-hero-card" style={{ opacity:0 }}>
          <div style={{ background:'white', borderRadius:'var(--r-xl)', border:'1.5px solid var(--border)', boxShadow:'var(--shadow-lg)', overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', background:'var(--green-50)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, color:'var(--text)' }}>Coordinator Dashboard</span>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--green-700)', fontWeight:600 }}>
                <span className="rn-pulse" style={{ width:7, height:7, borderRadius:'50%', background:'var(--green-500)', display:'inline-block' }}/>System Active
              </div>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                {[{tag:'TOTAL',num:'24',sub:'Requests',c:'var(--text)'},{tag:'OPEN',num:'8',sub:'Unassigned',c:'var(--text)'},{tag:'CRITICAL',num:'3',sub:'Immediate',c:'#EF4444',dot:true},{tag:'READY',num:'7',sub:'Volunteers',c:'var(--green-600)'}].map((s,i)=>(
                  <div key={i} className="rn-dc-stat" style={{ background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'12px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'var(--text4)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      {s.dot && <span className="rn-pulse" style={{ width:5, height:5, borderRadius:'50%', background:'#EF4444', display:'inline-block' }}/>}{s.tag}
                    </div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:28, color:s.c, lineHeight:1 }}>{s.num}</div>
                    <div style={{ fontSize:10, color:'var(--text4)', marginTop:3, fontWeight:500 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              {[{badge:'LEVEL 5: IMMEDIATE',bbg:'#FEF2F2',bc:'#EF4444',title:'Emergency Medical Supply Shortage',loc:'Sector 7G — Northern Refugee Transit Hub',score:'94',sc:'#EF4444',ai:'Insulin at 2% capacity. Depletion in 4.2 hours. Immediate dispatch required.',bl:'#EF4444'},
                {badge:'LEVEL 4: URGENT',bbg:'#FFFBEB',bc:'#92400E',title:'Water Purification Failure',loc:'Central Distribution Point B',score:'88',sc:'#F59E0B',bl:'#F59E0B'}
              ].map((n,i)=>(
                <div key={i} className="rn-dc-need" style={{ border:'1.5px solid var(--border)', borderLeft:`4px solid ${n.bl}`, borderRadius:'var(--r-lg)', padding:14, marginBottom: i===0 ? 10:0, background:'white' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                    <div style={{ flex:1 }}>
                      <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:6, background:n.bbg, color:n.bc, fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:5 }}>{n.badge}</span>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'var(--text)' }}>{n.title}</div>
                      <div style={{ fontSize:11, color:'var(--text4)', marginTop:2 }}>{n.loc}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:24, color:n.sc, lineHeight:1 }}>{n.score}</span>
                      <span style={{ fontSize:11, color:'var(--text4)' }}>/100</span>
                    </div>
                  </div>
                  {n.ai && <div style={{ background:'var(--green-50)', border:'1px solid var(--border2)', borderRadius:10, padding:'8px 12px', fontSize:12, color:'var(--text3)', lineHeight:1.6, marginTop:8 }}><strong style={{ color:'var(--green-700)' }}>AI Reasoning: </strong>{n.ai}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── MARQUEE ───────────────────────────────────────────────────────────────────
function Marquee() {
  const all = [...MARQUEE, ...MARQUEE];
  return (
    <div style={{ overflow:'hidden', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'var(--green-50)', padding:'14px 0' }}>
      <div className="rn-marquee-track" style={{ display:'flex', whiteSpace:'nowrap' }}>
        {all.map((item,i) => (
          <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'0 32px', flexShrink:0 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green-500)', display:'inline-block' }}/>
            <span style={{ fontSize:14, fontWeight:600, color:'var(--text4)' }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HOW IT WORKS ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.rn-step', {opacity:0,y:32,scale:0.96},{opacity:1,y:0,scale:1,duration:0.6,stagger:0.1,ease:'back.out(1.4)',scrollTrigger:{trigger:ref.current,start:'top 80%'}});
      gsap.fromTo('.rn-how-hdr', {opacity:0,y:24},{opacity:1,y:0,duration:0.6,ease:'power2.out',scrollTrigger:{trigger:ref.current,start:'top 84%'}});
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how" ref={ref} style={{ padding:'120px 0', background:'white', borderTop:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 52px' }}>
        <div className="rn-how-hdr">
          <Eyebrow>How It Works</Eyebrow>
          <STitle>Four steps.<br/>One mission.</STitle>
          <SSub>From the moment a need is reported to the moment it's resolved — the AI pipeline handles everything automatically.</SSub>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginTop:64 }}>
          {STEPS.map((step,i) => (
            <div key={i} className="rn-step rn-step-card" style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:'var(--r-xl)', padding:'32px 26px', position:'relative', overflow:'hidden', cursor:'default', transition:'all .3s', opacity:0 }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:80, color:'rgba(22,163,74,0.06)', position:'absolute', top:8, right:14, lineHeight:1 }}>{step.num}</div>
              <div style={{ width:48, height:48, borderRadius:'var(--r)', background:'var(--green-100)', border:'1.5px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:18 }}>{step.icon}</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--text)', marginBottom:10 }}>{step.title}</div>
              <div style={{ fontSize:13.5, color:'var(--text3)', lineHeight:1.7 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── AI FEATURES ───────────────────────────────────────────────────────────────
function AiFeatures() {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.rn-terminal', {opacity:0,x:-36},{opacity:1,x:0,duration:0.85,ease:'power3.out',scrollTrigger:{trigger:ref.current,start:'top 76%'}});
      gsap.fromTo('.rn-ai-hdr',   {opacity:0,x:24}, {opacity:1,x:0,duration:0.6, ease:'power2.out',scrollTrigger:{trigger:ref.current,start:'top 74%'}});
      gsap.fromTo('.rn-ai-feat',  {opacity:0,x:28}, {opacity:1,x:0,duration:0.5,stagger:0.1,ease:'power2.out',scrollTrigger:{trigger:ref.current,start:'top 72%'}});
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="ai" ref={ref} style={{ padding:'120px 0', background:'var(--bg-alt)', borderTop:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 52px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'start' }}>
          {/* Terminal */}
          <div className="rn-terminal" style={{ opacity:0, borderRadius:'var(--r-xl)', overflow:'hidden', border:'1.5px solid var(--border)', boxShadow:'var(--shadow)' }}>
            <div style={{ height:40, background:'var(--green-900)', display:'flex', alignItems:'center', padding:'0 16px', gap:7 }}>
              {['#EF4444','#F59E0B','#22C55E'].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:'50%',background:c}}/>)}
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginLeft:8, fontFamily:'monospace', letterSpacing:'0.05em' }}>gemini_analysis.json</span>
            </div>
            <div style={{ padding:'22px 20px', background:'var(--green-900)' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:6, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', fontSize:10, color:'#F87171', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>
                <span className="rn-pulse" style={{ width:5, height:5, borderRadius:'50%', background:'#EF4444', display:'inline-block' }}/>LIVE AI ANALYSIS
              </div>
              {[
                {c:'rgba(120,200,150,0.4)', t:'// Reporter submitted:'},
                {c:'rgba(200,220,200,0.5)', t:'input: "Elderly woman needs insulin,'},
                {c:'rgba(255,255,255,0.85)',t:'       running out in 2 hours"'},
                {c:'',t:''},
                {c:'rgba(120,200,150,0.4)', t:'// Gemini 1.5 Flash processing...'},
                {c:'',t:''},
                {c:'rgba(255,255,255,0.85)',t:'{'},
                {c:'rgba(255,255,255,0.85)',t:'  "category": "MEDICAL",'},
                {c:'rgba(255,255,255,0.85)',t:'  "urgency": "CRITICAL",'},
                {c:'rgba(255,255,255,0.85)',t:'  "priority_score": 94,'},
                {c:'#4ADE80',              t:'  "reasoning": "Time-sensitive. Life at risk."'},
                {c:'rgba(255,255,255,0.85)',t:'}'},
                {c:'',t:''},
                {c:'rgba(120,200,150,0.4)', t:'// Match result:'},
                {c:'#4ADE80',              t:'→ Rahul S. — score: 87%'},
                {c:'rgba(200,220,200,0.5)', t:'→ 3.2km · 2/2 skills matched'},
              ].map((l,i)=>(
                <div key={i} style={{ fontFamily:'monospace', fontSize:12, lineHeight:1.9, color:l.c||'rgba(255,255,255,0.85)', display:'block' }}>{l.t||'\u00A0'}</div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <div className="rn-ai-hdr" style={{ opacity:0 }}>
              <Eyebrow>AI Intelligence</Eyebrow>
              <STitle>Not just software.<br/><span style={{color:'var(--green-600)'}}>AI that acts.</span></STitle>
              <SSub>Every need is analyzed the moment it arrives — no manual classification needed.</SSub>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:24 }}>
              {AI_FEATURES.map((f,i)=>(
                <div key={i} className="rn-ai-feat" style={{ padding:'18px 20px', border:'1.5px solid var(--border)', borderRadius:'var(--r-lg)', background:'white', display:'flex', gap:14, alignItems:'flex-start', transition:'all .22s', cursor:'default', opacity:0 }}>
                  <div style={{ width:42, height:42, borderRadius:'var(--r)', background:'var(--green-100)', border:'1.5px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14.5, color:'var(--text)', marginBottom:4 }}>{f.title}</div>
                    <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.65 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── ROLES ─────────────────────────────────────────────────────────────────────
function Roles() {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.rn-role-hdr',  {opacity:0,y:24},{opacity:1,y:0,duration:0.6,ease:'power2.out',scrollTrigger:{trigger:ref.current,start:'top 82%'}});
      gsap.fromTo('.rn-role-card', {opacity:0,y:36,scale:0.96},{opacity:1,y:0,scale:1,duration:0.65,stagger:0.13,ease:'back.out(1.4)',scrollTrigger:{trigger:ref.current,start:'top 78%'}});
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="roles" ref={ref} style={{ padding:'120px 0', background:'white', borderTop:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 52px' }}>
        <div className="rn-role-hdr" style={{ opacity:0 }}>
          <Eyebrow>Who It's For</Eyebrow>
          <STitle>Everyone has<br/>a role to play.</STitle>
          <SSub>ReliefNet is built for the full chain of disaster response.</SSub>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:22, marginTop:64 }}>
          {ROLES.map(role=>(
            <div key={role.id} className="rn-role-card" style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:'var(--r-xl)', padding:'32px 28px', transition:'all .3s', cursor:'default', opacity:0 }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow='var(--shadow-lg)'; e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.borderColor=role.borderHover; }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='var(--border)'; }}>
              <div style={{ width:60, height:60, borderRadius:'var(--r-lg)', background:role.chipBg, border:`1.5px solid ${role.borderHover}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, marginBottom:18 }}>{role.emoji}</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, color:'var(--text)', marginBottom:5 }}>{role.title}</div>
              <div style={{ display:'inline-block', padding:'3px 10px', borderRadius:'var(--r-full)', background:role.chipBg, color:role.chipColor, fontSize:11, fontWeight:700, letterSpacing:'0.04em', marginBottom:14 }}>{role.chip}</div>
              <div style={{ fontSize:13.5, color:'var(--text3)', lineHeight:1.7, marginBottom:20 }}>{role.desc}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
                {role.perms.map((p,j)=>(
                  <div key={j} style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, color:'var(--text3)' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:role.chipBg, color:role.chipColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>✓</div>
                    {p}
                  </div>
                ))}
              </div>
              <Link to={role.btnTo} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:'var(--r-full)', background:role.chipBg, color:role.chipColor, border:`1.5px solid ${role.borderHover}50`, fontSize:13.5, fontWeight:700, textDecoration:'none', transition:'all .2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=role.accent; e.currentTarget.style.color='white'; e.currentTarget.style.boxShadow=`0 4px 14px ${role.accent}50`; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=role.chipBg; e.currentTarget.style.color=role.chipColor; e.currentTarget.style.boxShadow=''; }}>
                {role.btnLabel} <ChevronRight size={14}/>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── IMPACT ────────────────────────────────────────────────────────────────────
function Impact() {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.rn-impact-hdr',  {opacity:0,y:24},{opacity:1,y:0,duration:0.6,ease:'power2.out',scrollTrigger:{trigger:ref.current,start:'top 84%'}});
      gsap.fromTo('.rn-imp-card',    {opacity:0,y:24},{opacity:1,y:0,duration:0.5,stagger:0.09,ease:'power2.out',scrollTrigger:{trigger:ref.current,start:'top 82%'}});
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="impact" ref={ref} style={{ padding:'100px 0', background:'var(--bg-alt)', borderTop:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 52px' }}>
        <div className="rn-impact-hdr" style={{ textAlign:'center', marginBottom:64, opacity:0 }}>
          <Eyebrow center>Impact Metrics</Eyebrow>
          <STitle center>Real coordination.<br/>Real results.</STitle>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          {IMPACTS.map((item,i)=>(
            <div key={i} className="rn-imp-card rn-imp-card" style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:'var(--r-xl)', padding:'36px 24px', textAlign:'center', transition:'all .25s', cursor:'default', opacity:0 }}>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:48, color:'var(--green-600)', display:'block', lineHeight:1, marginBottom:8 }}>{item.num}</span>
              <span style={{ fontSize:13, color:'var(--text3)', fontWeight:500 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── TECH ──────────────────────────────────────────────────────────────────────
function TechStack() {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.rn-tech-hdr',  {opacity:0,y:20},{opacity:1,y:0,duration:0.6,ease:'power2.out',scrollTrigger:{trigger:ref.current,start:'top 88%'}});
      gsap.fromTo('.rn-tech-pill', {opacity:0,scale:0.88,y:10},{opacity:1,scale:1,y:0,duration:0.35,stagger:0.04,ease:'back.out(1.5)',scrollTrigger:{trigger:ref.current,start:'top 86%'}});
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} style={{ padding:'80px 0', background:'white', borderTop:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 52px' }}>
        <div className="rn-tech-hdr" style={{ opacity:0 }}>
          <Eyebrow>Built With</Eyebrow>
          <STitle>Production-grade stack.</STitle>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:44 }}>
          {TECH.map((t,i)=>(
            <div key={i} className="rn-tech-pill" style={{ padding:'10px 18px', borderRadius:'var(--r-full)', border:'1.5px solid var(--border)', background:'white', fontSize:13, color:'var(--text3)', fontWeight:500, display:'flex', alignItems:'center', gap:7, transition:'all .2s', cursor:'default', opacity:0 }}>
              <span style={{ fontSize:16 }}>{t.i}</span>{t.l}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FINAL CTA ─────────────────────────────────────────────────────────────────
function FinalCta() {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.rn-cta-title', {opacity:0,y:40},{opacity:1,y:0,duration:0.8,ease:'power3.out',scrollTrigger:{trigger:ref.current,start:'top 80%'}});
      gsap.fromTo('.rn-cta-sub',   {opacity:0,y:22},{opacity:1,y:0,duration:0.6,ease:'power2.out',scrollTrigger:{trigger:ref.current,start:'top 76%'},delay:0.2});
      gsap.fromTo('.rn-cta-btns',  {opacity:0,y:16},{opacity:1,y:0,duration:0.5,ease:'power2.out',scrollTrigger:{trigger:ref.current,start:'top 74%'},delay:0.35});
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} style={{ padding:'140px 52px', background:'linear-gradient(160deg,var(--green-900) 0%,var(--green-800) 55%,#0A2A18 100%)', textAlign:'center', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-120, right:-100, width:400, height:400, borderRadius:'50%', background:'rgba(34,197,94,0.12)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-80, left:-60, width:300, height:300, borderRadius:'50%', background:'rgba(74,222,128,0.08)', pointerEvents:'none' }}/>
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:'var(--r-full)', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', fontSize:12, fontWeight:600, color:'var(--green-400)', marginBottom:28, letterSpacing:'0.04em' }}>
          <span className="rn-pulse" style={{ width:7, height:7, borderRadius:'50%', background:'var(--green-500)', display:'inline-block' }}/>Ready to deploy
        </div>
        <h2 className="rn-cta-title" style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'clamp(48px,6vw,80px)', lineHeight:1.0, letterSpacing:'-0.02em', color:'white', marginBottom:20, opacity:0 }}>
          Ready to<br/><span style={{ color:'var(--green-400)' }}>save lives?</span>
        </h2>
        <p className="rn-cta-sub" style={{ fontSize:18, color:'rgba(255,255,255,0.5)', maxWidth:460, margin:'0 auto 44px', lineHeight:1.7, opacity:0 }}>
          Join coordinators and volunteers already using ReliefNet to deliver help where it's needed most.
        </p>
        <div className="rn-cta-btns" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', opacity:0 }}>
          <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'15px 34px', borderRadius:'var(--r-full)', background:'white', color:'var(--green-800)', fontSize:16, fontWeight:700, textDecoration:'none', boxShadow:'0 8px 24px rgba(0,0,0,0.2)', transition:'all .22s' }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 14px 32px rgba(0,0,0,0.28)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)'; }}>
            <Zap size={17} fill="var(--green-700)" stroke="none"/>Get Started Free
          </Link>
          <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'15px 30px', borderRadius:'var(--r-full)', border:'1.5px solid rgba(255,255,255,0.25)', color:'rgba(255,255,255,0.8)', fontSize:16, fontWeight:600, textDecoration:'none', transition:'all .22s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'; e.currentTarget.style.color='white'; e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; e.currentTarget.style.color='rgba(255,255,255,0.8)'; e.currentTarget.style.background=''; }}>
            Sign In to Dashboard <ArrowRight size={17}/>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background:'var(--green-900)', padding:'32px 52px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:17, color:'rgba(255,255,255,0.3)', letterSpacing:'0.04em' }}>
        Relief<span style={{ color:'var(--green-500)' }}>Net</span>
      </div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)', letterSpacing:'0.04em' }}>
        © 2026 · ReliefNet Core v2.4.0 · Unified Response System
      </div>
      <div style={{ display:'flex', gap:22 }}>
        {[['Login','/login'],['Register','/register'],['Privacy','#'],['Support','#']].map(([l,t])=>(
          <Link key={l} to={t} style={{ fontSize:13, color:'rgba(255,255,255,0.35)', textDecoration:'none', fontWeight:500, transition:'color .2s' }}
            onMouseEnter={e=>e.target.style.color='var(--green-400)'}
            onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.35)'}>
            {l}
          </Link>
        ))}
      </div>
    </footer>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style>{INJECTED_CSS}</style>
      <Navbar/>
      <Hero/>
      <Marquee/>
      <HowItWorks/>
      <AiFeatures/>
      <Roles/>
      <Impact/>
      <TechStack/>
      <FinalCta/>
      <Footer/>
    </>
  );
}
