// src/pages/NotificationCenter.jsx
// Taf'Yaa — Fully Functional Notification Center
// Sections: Overview, AI Suggestions, Merge Requests, Pending Requests, Family Activity

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Brain, GitMerge, UserCheck, Activity,
  Check, X, ChevronRight, RefreshCw, Trash2,
  CheckCheck, Eye, Star, AlertTriangle, Info,
  TreePine, BookOpen, Users, Heart, Mic, Globe,
  Clock, ArrowLeft, Filter, Search, MoreVertical
} from 'lucide-react';
import {
  collection, query, orderBy, limit, onSnapshot,
  where, doc, updateDoc, addDoc, getDocs,
  serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';

const css = `
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

  .nc-tab { flex:1;padding:12px 8px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .15s;font-family:inherit;border-bottom:2px solid transparent;background:none; }
  .nc-tab.active { color:#16a34a;border-bottom-color:#16a34a; }
  .nc-tab:not(.active) { color:#9ca3af; }
  .nc-tab:hover:not(.active) { color:#374151; }

  .nc-item { border-radius:14px;padding:16px;transition:box-shadow .2s,transform .15s;animation:fadeIn .3s ease;cursor:pointer; }
  .nc-item:hover { box-shadow:0 4px 16px rgba(0,0,0,.08) !important; transform:translateY(-1px); }

  .nc-btn { display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .15s;font-family:inherit; }
  .nc-btn:hover { filter:brightness(.92); }

  .nc-skeleton { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:6px; }
  .nc-badge { display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:9px;font-size:10px;font-weight:700;color:#fff;background:#16a34a;padding:0 4px; }
`;

function timeAgo(date) {
  if (!date) return '—';
  const diff = Math.floor((Date.now()-new Date(date))/1000);
  if (diff<60) return 'Just now';
  if (diff<3600) return `${Math.floor(diff/60)}m ago`;
  if (diff<86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
}

function Avatar({ name, size=36 }) {
  const initials = name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
  const colors = ['#16a34a','#2563eb','#7c3aed','#db2777','#ea580c'];
  const color = colors[(name?.charCodeAt(0)||0)%colors.length];
  return <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.34,fontWeight:700,color:'#fff',flexShrink:0}}>{initials}</div>;
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ counts, t, onTabChange }) {
  const sections = [
    { id:'ai',       label:'AI Suggestions',   icon:'🤖', color:'#7c3aed', count:counts.ai,       desc:'Smart recommendations for your tree' },
    { id:'merge',    label:'Merge Requests',    icon:'🔀', color:'#2563eb', count:counts.merge,    desc:'Family tree connection requests' },
    { id:'requests', label:'Pending Requests',  icon:'👤', color:'#ea580c', count:counts.requests,  desc:'Role upgrade requests from members' },
    { id:'activity', label:'Family Activity',   icon:'⚡', color:'#16a34a', count:counts.activity,  desc:'Recent actions in your family tree' },
  ];
  const total = Object.values(counts).reduce((a,b)=>a+b,0);

  return (
    <div>
      {/* Summary banner */}
      <div style={{background:'linear-gradient(135deg,#14532d,#166534)',borderRadius:16,padding:'20px 22px',marginBottom:20,display:'flex',alignItems:'center',gap:16}}>
        <div style={{width:52,height:52,borderRadius:14,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Bell size={26} color="#fff"/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:800,color:'#fff'}}>{total} {total===1?'notification':'notifications'}</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginTop:2}}>Across all categories for your family tree</div>
        </div>
        {total>0&&(
          <div style={{background:'rgba(255,255,255,0.15)',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600,color:'#fff',animation:'pulse 2s infinite'}}>
            {total} unread
          </div>
        )}
      </div>

      {/* Category cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
        {sections.map((s,i)=>(
          <div key={s.id} className="nc-item" onClick={()=>onTabChange(s.id)}
            style={{background:t.card,border:`1px solid ${t.border}`,boxShadow:'0 2px 8px rgba(0,0,0,.04)',animation:`fadeIn .3s ease ${i*.07}s both`}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:12,background:`${s.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{s.icon}</div>
              {s.count>0&&<span className="nc-badge">{s.count}</span>}
            </div>
            <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:12,color:t.textMuted,marginBottom:12}}>{s.desc}</div>
            <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:s.color,fontWeight:600}}>
              View all <ChevronRight size={13}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Suggestions Tab ───────────────────────────────────────────────────────
function AISuggestionsTab({ persons, marriages, t }) {
  const suggestions = useMemo(()=>{
    const s = [];
    // Missing spouse
    persons.forEach(p=>{
      const hasChildren = marriages.some(m=>(m.childrenIds||[]).length>0||(m.wives||[]).some(w=>(w.childrenIds||[]).length>0));
      const hasSpouse = marriages.some(m=>m.husbandId===p.id||(m.wives||[]).some(w=>w.wifeId===p.id));
      if(hasChildren&&!hasSpouse) s.push({id:`sp-${p.id}`,icon:'💍',title:`${p.name} may have a spouse`,desc:'This person has children but no spouse is recorded.',confidence:85,color:'#db2777'});
    });
    // Missing bios
    persons.filter(p=>!p.bio).slice(0,3).forEach(p=>{
      s.push({id:`bio-${p.id}`,icon:'📝',title:`Add biography for ${p.name}`,desc:'A biography helps preserve this person\'s life story.',confidence:95,color:'#2563eb'});
    });
    // Missing photos
    persons.filter(p=>!p.photoUrl).slice(0,2).forEach(p=>{
      s.push({id:`photo-${p.id}`,icon:'📷',title:`Add photo for ${p.name}`,desc:'A photo makes the family tree more personal and engaging.',confidence:90,color:'#7c3aed'});
    });
    // Tree completeness
    if(persons.length>0){
      const pct = Math.round((persons.filter(p=>p.bio&&p.photoUrl).length/persons.length)*100);
      s.push({id:'complete',icon:'📊',title:`Tree is ${pct}% complete`,desc:`${persons.length-Math.round(persons.length*pct/100)} profiles are missing key information.`,confidence:100,color:'#16a34a',isInfo:true});
    }
    return s.slice(0,8);
  },[persons,marriages]);

  const [dismissed,setDismissed] = useState(new Set());
  const visible = suggestions.filter(s=>!dismissed.has(s.id));

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <h3 style={{margin:'0 0 4px',fontSize:16,fontWeight:700,color:t.text}}>AI Suggestions</h3>
          <p style={{margin:0,fontSize:13,color:t.textMuted}}>{visible.length} suggestion{visible.length!==1?'s':''} for your tree</p>
        </div>
        <button className="nc-btn" onClick={()=>setDismissed(new Set())} style={{background:t.card,color:t.textMuted,border:`1px solid ${t.border}`}}>
          <RefreshCw size={13}/> Reset
        </button>
      </div>

      {visible.length===0?(
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:'40px 24px',textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:12}}>✅</div>
          <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:4}}>All suggestions reviewed!</div>
          <div style={{fontSize:13,color:t.textMuted}}>Your tree is looking great. Keep adding family members!</div>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {visible.map((s,i)=>(
            <div key={s.id} className="nc-item" style={{background:t.card,border:`1.5px solid ${t.border}`,borderLeft:`3px solid ${s.color}`,boxShadow:'0 2px 8px rgba(0,0,0,.04)',animation:`fadeIn .3s ease ${i*.06}s both`,cursor:'default'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                <div style={{width:42,height:42,borderRadius:11,background:`${s.color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>{s.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                    <div style={{fontSize:14,fontWeight:700,color:t.text}}>{s.title}</div>
                    <button onClick={()=>setDismissed(p=>new Set([...p,s.id]))} style={{background:'none',border:'none',cursor:'pointer',color:t.textFaint,padding:2,display:'flex',borderRadius:4}}>
                      <X size={14}/>
                    </button>
                  </div>
                  <div style={{fontSize:12,color:t.textMuted,marginBottom:8,lineHeight:1.6}}>{s.desc}</div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,height:4,background:t.bg,borderRadius:20,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${s.confidence}%`,background:s.color,borderRadius:20}}/>
                    </div>
                    <span style={{fontSize:10,fontWeight:600,color:s.color,whiteSpace:'nowrap'}}>{s.confidence}% confidence</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pending Requests Tab ─────────────────────────────────────────────────────
function PendingRequestsTab({ currentUser, t }) {
  const [requests,setRequests] = useState([]);
  const [loading,setLoading]   = useState(true);

  useEffect(()=>{
    const q = query(collection(db,'roleRequests'),where('status','==','pending'),orderBy('createdAt','desc'));
    const unsub = onSnapshot(q,snap=>{
      setRequests(snap.docs.map(d=>({id:d.id,...d.data(),createdAt:d.data().createdAt?.toDate?.()})));
      setLoading(false);
    });
    return unsub;
  },[]);

  const respond = async(id,status)=>{
    await updateDoc(doc(db,'roleRequests',id),{status,respondedBy:currentUser.uid,respondedAt:new Date()});
  };

  return (
    <div>
      <div style={{marginBottom:16}}>
        <h3 style={{margin:'0 0 4px',fontSize:16,fontWeight:700,color:t.text}}>Pending Requests</h3>
        <p style={{margin:0,fontSize:13,color:t.textMuted}}>{requests.length} pending role request{requests.length!==1?'s':''}</p>
      </div>

      {loading?(
        <div style={{textAlign:'center',padding:24,color:t.textMuted,fontSize:13}}>Loading…</div>
      ):requests.length===0?(
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:'40px 24px',textAlign:'center'}}>
          <UserCheck size={40} color={t.textFaint} style={{marginBottom:12}}/>
          <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:4}}>No pending requests</div>
          <div style={{fontSize:13,color:t.textMuted}}>All role requests have been reviewed</div>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {requests.map((req,i)=>(
            <div key={req.id} className="nc-item" style={{background:t.card,border:`1px solid ${t.border}`,boxShadow:'0 2px 8px rgba(0,0,0,.04)',cursor:'default',animation:`fadeIn .3s ease ${i*.06}s both`}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <Avatar name={req.userName} size={44}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:t.text}}>{req.userName}</div>
                  <div style={{fontSize:12,color:t.textMuted}}>Requesting: <strong style={{color:'#16a34a'}}>{req.requestedRole}</strong></div>
                </div>
                <span style={{fontSize:11,color:t.textFaint}}>{timeAgo(req.createdAt)}</span>
              </div>
              {req.message&&<div style={{background:t.bg,borderRadius:8,padding:'8px 12px',fontSize:12,color:t.textSub,marginBottom:12,fontStyle:'italic',border:`1px solid ${t.border}`}}>"{req.message}"</div>}
              <div style={{display:'flex',gap:10}}>
                <button className="nc-btn" onClick={()=>respond(req.id,'rejected')} style={{flex:1,justifyContent:'center',background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5'}}>✕ Reject</button>
                <button className="nc-btn" onClick={()=>respond(req.id,'approved')} style={{flex:1,justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff'}}>✓ Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Family Activity Tab ──────────────────────────────────────────────────────
function FamilyActivityTab({ t }) {
  const [activities,setActivities] = useState([]);
  const [loading,setLoading]       = useState(true);
  const [stories,setStories]       = useState([]);

  useEffect(()=>{
    // Listen to activities
    const qAct = query(collection(db,'activities'),orderBy('timestamp','desc'),limit(20));
    const unsubAct = onSnapshot(qAct,snap=>{
      setActivities(snap.docs.map(d=>({id:d.id,...d.data(),timestamp:d.data().timestamp?.toDate?.()})));
      setLoading(false);
    },()=>setLoading(false));

    // Also get recent stories
    const qStories = query(collection(db,'stories'),orderBy('createdAt','desc'),limit(10));
    const unsubStories = onSnapshot(qStories,snap=>{
      setStories(snap.docs.map(d=>({id:d.id,...d.data(),createdAt:d.data().createdAt?.toDate?.()})));
    },()=>{});

    return ()=>{ unsubAct(); unsubStories(); };
  },[]);

  const combined = useMemo(()=>{
    const items = [
      ...activities.map(a=>({...a,date:a.timestamp,type:'activity',emoji:a.activityType?.includes('story')?'📖':a.activityType?.includes('person')?'👤':'⚡',title:a.activityType||'Activity',subtitle:`${a.userName||'Someone'} · ${timeAgo(a.timestamp)}`})),
      ...stories.map(s=>({...s,date:s.createdAt,type:'story',emoji:s.source==='aws-transcribe'||s.source==='openai-whisper'?'🎙️':'📖',title:s.title||'New story created',subtitle:`${s.language||'en'} · ${timeAgo(s.createdAt)}`})),
    ];
    return items.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20);
  },[activities,stories]);

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <h3 style={{margin:'0 0 4px',fontSize:16,fontWeight:700,color:t.text}}>Family Activity</h3>
          <p style={{margin:0,fontSize:13,color:t.textMuted}}>{combined.length} recent events</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#16a34a',fontWeight:600}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:'#22c55e',animation:'pulse 1.5s infinite'}}/>Live
        </div>
      </div>

      {loading?(
        [0,1,2,3].map(i=>(
          <div key={i} style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
            <div className="nc-skeleton" style={{width:42,height:42,borderRadius:11,flexShrink:0}}/>
            <div style={{flex:1}}><div className="nc-skeleton" style={{height:14,width:'60%',marginBottom:6}}/><div className="nc-skeleton" style={{height:11,width:'40%'}}/></div>
          </div>
        ))
      ):combined.length===0?(
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:'40px 24px',textAlign:'center'}}>
          <Activity size={40} color={t.textFaint} style={{marginBottom:12}}/>
          <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:4}}>No activity yet</div>
          <div style={{fontSize:13,color:t.textMuted}}>Start adding family members and stories!</div>
        </div>
      ):(
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,overflow:'hidden'}}>
          {combined.map((item,i)=>(
            <div key={item.id||i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<combined.length-1?`1px solid ${t.border}`:'none',transition:'background .15s',animation:`fadeIn .3s ease ${i*.04}s both`}}
              onMouseEnter={e=>e.currentTarget.style.background=t.cardHover}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{width:42,height:42,borderRadius:11,background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>{item.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:t.text}}>{item.title}</div>
                <div style={{fontSize:11,color:t.textMuted,marginTop:1}}>{item.subtitle}</div>
              </div>
              {item.type==='story'&&<span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:t.primaryBg,color:t.primary}}>Story</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Merge Requests Tab ───────────────────────────────────────────────────────
function MergeRequestsTab({ t }) {
  const [requests,setRequests] = useState([]);
  const [loading,setLoading]   = useState(true);

  useEffect(()=>{
    const q = query(collection(db,'mergeRequests'),orderBy('createdAt','desc'),limit(20));
    const unsub = onSnapshot(q,snap=>{
      setRequests(snap.docs.map(d=>({id:d.id,...d.data(),createdAt:d.data().createdAt?.toDate?.()})));
      setLoading(false);
    },()=>setLoading(false));
    return unsub;
  },[]);

  const respond = async(id,status)=>{
    await updateDoc(doc(db,'mergeRequests',id),{status,respondedAt:new Date()});
  };

  return (
    <div>
      <div style={{marginBottom:16}}>
        <h3 style={{margin:'0 0 4px',fontSize:16,fontWeight:700,color:t.text}}>Merge Requests</h3>
        <p style={{margin:0,fontSize:13,color:t.textMuted}}>Family tree connection requests from other users</p>
      </div>
      {loading?(
        <div style={{textAlign:'center',padding:24,color:t.textMuted,fontSize:13}}>Loading…</div>
      ):requests.length===0?(
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:'40px 24px',textAlign:'center'}}>
          <GitMerge size={40} color={t.textFaint} style={{marginBottom:12}}/>
          <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:4}}>No merge requests</div>
          <div style={{fontSize:13,color:t.textMuted}}>When someone requests to connect their family tree with yours, it will appear here.</div>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {requests.map((req,i)=>(
            <div key={req.id} className="nc-item" style={{background:t.card,border:`1px solid ${t.border}`,boxShadow:'0 2px 8px rgba(0,0,0,.04)',cursor:'default'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div style={{width:44,height:44,borderRadius:12,background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <GitMerge size={22} color="#2563eb"/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:t.text}}>{req.fromName||'Unknown user'}</div>
                  <div style={{fontSize:12,color:t.textMuted}}>Wants to connect their tree: <strong>{req.fromTree||'Unknown tree'}</strong></div>
                </div>
                <span style={{fontSize:11,color:t.textFaint}}>{timeAgo(req.createdAt)}</span>
              </div>
              {req.message&&<div style={{background:t.bg,borderRadius:8,padding:'8px 12px',fontSize:12,color:t.textSub,marginBottom:12,fontStyle:'italic'}}>"{req.message}"</div>}
              <div style={{display:'flex',gap:10}}>
                <button className="nc-btn" onClick={()=>respond(req.id,'rejected')} style={{flex:1,justifyContent:'center',background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5'}}>✕ Decline</button>
                <button className="nc-btn" onClick={()=>respond(req.id,'approved')} style={{flex:1,justifyContent:'center',background:'linear-gradient(135deg,#1d4ed8,#2563eb)',color:'#fff'}}>🔀 Accept Merge</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Notification Center ─────────────────────────────────────────────────
export default function NotificationCenter() {
  const { currentUser }           = useAuth();
  const t                         = useTheme();
  const navigate                  = useNavigate();
  const { treeId }                = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [persons,   setPersons]   = useState([]);
  const [marriages, setMarriages] = useState([]);
  const [counts,    setCounts]    = useState({ai:0,merge:0,requests:0,activity:0});
  const [search,    setSearch]    = useState('');

  // Load persons + marriages for AI suggestions
  useEffect(()=>{
    if (!treeId) return;
    const unsubP = onSnapshot(collection(db,'trees',treeId,'persons'),
      snap=>setPersons(snap.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubM = onSnapshot(query(collection(db,'marriages'),where('treeId','==',treeId)),
      snap=>setMarriages(snap.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>{ unsubP(); unsubM(); };
  },[treeId]);

  // Count pending requests
  useEffect(()=>{
    const q = query(collection(db,'roleRequests'),where('status','==','pending'));
    const unsub = onSnapshot(q,snap=>setCounts(p=>({...p,requests:snap.size})));
    return unsub;
  },[]);

  // Count recent activity
  useEffect(()=>{
    const q = query(collection(db,'stories'),orderBy('createdAt','desc'),limit(5));
    const unsub = onSnapshot(q,snap=>setCounts(p=>({...p,activity:snap.size})));
    return unsub;
  },[]);

  const tabs = [
    {id:'overview',  label:'Overview',        icon:<Bell size={13}/>,      badge:Object.values(counts).reduce((a,b)=>a+b,0)},
    {id:'ai',        label:'AI',              icon:<Brain size={13}/>,     badge:counts.ai},
    {id:'merge',     label:'Merge',           icon:<GitMerge size={13}/>,  badge:counts.merge},
    {id:'requests',  label:'Requests',        icon:<UserCheck size={13}/>, badge:counts.requests},
    {id:'activity',  label:'Activity',        icon:<Activity size={13}/>,  badge:counts.activity},
  ];

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:'100vh',background:t.bg,transition:'background .3s'}}>
        {/* Header */}
        <div style={{background:t.sidebar,borderBottom:`1px solid ${t.border}`,padding:'0 0 0',position:'sticky',top:0,zIndex:20}}>
          <div style={{maxWidth:800,margin:'0 auto'}}>
            <div style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:12}}>
              <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',cursor:'pointer',color:t.textMuted,padding:6,display:'flex',borderRadius:8,transition:'background .15s'}}
                onMouseEnter={e=>e.currentTarget.style.background=t.bg}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <ArrowLeft size={20}/>
              </button>
              <div style={{width:40,height:40,borderRadius:11,background:'linear-gradient(135deg,#14532d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Bell size={20} color="#fff"/>
              </div>
              <div style={{flex:1}}>
                <h1 style={{margin:0,fontSize:18,fontWeight:700,color:t.text}}>Notifications</h1>
                <p style={{margin:0,fontSize:12,color:t.textMuted}}>Stay updated on your family tree</p>
              </div>
              <button style={{background:'none',border:'none',cursor:'pointer',color:t.textMuted,padding:6,display:'flex',borderRadius:8}}>
                <MoreVertical size={18}/>
              </button>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',borderTop:`1px solid ${t.border}`}}>
              {tabs.map(tab=>(
                <button key={tab.id} className={`nc-tab ${activeTab===tab.id?'active':''}`}
                  onClick={()=>setActiveTab(tab.id)}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,color:activeTab===tab.id?'#16a34a':t.textMuted}}>
                  {tab.icon}{tab.label}
                  {tab.badge>0&&<span className="nc-badge" style={{fontSize:9,minWidth:16,height:16}}>{tab.badge}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{maxWidth:800,margin:'0 auto',padding:'24px 20px'}}>
          {activeTab==='overview'  && <OverviewTab counts={counts} t={t} onTabChange={setActiveTab}/>}
          {activeTab==='ai'        && <AISuggestionsTab persons={persons} marriages={marriages} t={t}/>}
          {activeTab==='merge'     && <MergeRequestsTab t={t}/>}
          {activeTab==='requests'  && <PendingRequestsTab currentUser={currentUser} t={t}/>}
          {activeTab==='activity'  && <FamilyActivityTab t={t}/>}
        </div>
      </div>
    </>
  );
}