// src/pages/AdminDashboard.jsx
// Taf'Yaa — Full Admin Dashboard
// Features: Overview, Members, Trees, Storage, Notifications, Quick Actions

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, TreePine, Shield, Bell,
  Settings, BarChart2, HardDrive, MessageCircle,
  UserPlus, Trash2, CheckCircle, AlertTriangle,
  RefreshCw, Search, ChevronRight, Activity,
  BookOpen, Mic, Globe, Archive, TrendingUp,
  UserCheck, Clock, Star, Zap, Database,
  Download, Upload, Eye, MoreVertical, X,
  Crown, Edit2, LogOut, Mail, Calendar
} from 'lucide-react';
import {
  collection, getDocs, query, orderBy,
  limit, where, doc, updateDoc, deleteDoc,
  onSnapshot, getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

  .ad-nav-item { display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;cursor:pointer;transition:all .15s;font-size:14px;font-weight:500;border:none;background:none;width:100%;text-align:left;font-family:inherit; }
  .ad-nav-item:hover { background:#f0fdf4; color:#16a34a; }
  .ad-nav-item.active { background:linear-gradient(135deg,#f0fdf4,#dcfce7);color:#16a34a;font-weight:600; }

  .ad-card { background:#fff;border:1px solid #f0f0f0;border-radius:16px;padding:20px 22px;box-shadow:0 2px 8px rgba(0,0,0,.04);animation:fadeIn .3s ease; }
  .ad-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.08); }

  .ad-btn { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;border:none;cursor:pointer;transition:all .15s;font-family:inherit; }
  .ad-btn:hover:not(:disabled){filter:brightness(.92);transform:scale(.98);}
  .ad-btn:disabled{opacity:.5;cursor:not-allowed;}

  .ad-member-row { display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f9fafb;transition:background .15s; }
  .ad-member-row:last-child { border-bottom:none; }
  .ad-member-row:hover { background:#fafffe;border-radius:10px;padding-left:8px;padding-right:8px; }

  .ad-skeleton { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:6px; }

  .ad-input { width:100%;padding:9px 14px 9px 36px;font-size:13px;border:1.5px solid #e5e7eb;border-radius:10px;outline:none;background:#fff;transition:border-color .15s;box-sizing:border-box;font-family:inherit; }
  .ad-input:focus { border-color:#16a34a; }

  .ad-badge { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return '—';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(date).toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
}

function Avatar({ name, photo, size=36 }) {
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
  const colors = ['#16a34a','#2563eb','#7c3aed','#db2777','#ea580c'];
  const color = colors[(name?.charCodeAt(0)||0) % colors.length];
  if (photo) return <img src={photo} alt={name} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>;
  return <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:size*.35,fontWeight:700,color:'#fff'}}>{initials}</div>;
}

function RoleBadge({ role }) {
  const map = {
    'Admin':  { bg:'#fef3c7', color:'#d97706', icon:'👑' },
    'Owner':  { bg:'#fef3c7', color:'#d97706', icon:'👑' },
    'Editor': { bg:'#eff6ff', color:'#2563eb', icon:'✏️' },
    'Member': { bg:'#f0fdf4', color:'#16a34a', icon:'👤' },
  };
  const s = map[role] || map.Member;
  return <span className="ad-badge" style={{background:s.bg,color:s.color}}>{s.icon} {role||'Member'}</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, trend, color='#16a34a', delay=0, loading }) {
  return (
    <div className="ad-card" style={{animation:`fadeIn .4s ease ${delay}s both`,transition:'box-shadow .2s,transform .2s'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {React.cloneElement(icon,{size:22,color})}
        </div>
        {trend && <span style={{fontSize:12,fontWeight:600,color:trend>0?'#16a34a':'#dc2626',background:trend>0?'#f0fdf4':'#fef2f2',padding:'2px 8px',borderRadius:20}}>
          {trend>0?'↑':'↓'} {Math.abs(trend)}%
        </span>}
      </div>
      {loading
        ? <><div className="ad-skeleton" style={{height:28,width:60,marginBottom:6}}/><div className="ad-skeleton" style={{height:13,width:80}}/></>
        : <><div style={{fontSize:28,fontWeight:800,color:'#111827',lineHeight:1.1}}>{value}</div>
           <div style={{fontSize:13,color:'#6b7280',marginTop:3}}>{label}</div></>
      }
    </div>
  );
}

// ─── Overview Panel ───────────────────────────────────────────────────────────
function OverviewPanel({ stats, loading, trees, recentActivity }) {
  return (
    <div>
      <div style={{marginBottom:24}}>
        <h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:'#111827'}}>Overview</h2>
        <p style={{margin:0,fontSize:13,color:'#9ca3af'}}>Real-time snapshot of your platform</p>
      </div>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:28}}>
        <StatCard icon={<TreePine/>} label="Family Trees" value={stats.trees} color="#16a34a" delay={0} loading={loading}/>
        <StatCard icon={<Users/>} label="Total Members" value={stats.members} color="#2563eb" delay={0.05} loading={loading}/>
        <StatCard icon={<BookOpen/>} label="Stories" value={stats.stories} color="#7c3aed" delay={0.1} loading={loading}/>
        <StatCard icon={<Mic/>} label="Voice Stories" value={stats.voiceStories} color="#0891b2" delay={0.15} loading={loading}/>
        <StatCard icon={<Globe/>} label="Languages" value={stats.languages} color="#d97706" delay={0.2} loading={loading}/>
        <StatCard icon={<Users/>} label="Persons" value={stats.persons} color="#ea580c" delay={0.25} loading={loading}/>
      </div>

      {/* Recent activity + Trees list */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        {/* Recent activity */}
        <div className="ad-card">
          <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:700,color:'#111827',display:'flex',alignItems:'center',gap:8}}>
            <Activity size={16} color="#16a34a"/> Recent Activity
          </h3>
          {recentActivity.length===0
            ? <p style={{color:'#9ca3af',fontSize:13,textAlign:'center',padding:'16px 0'}}>No recent activity</p>
            : recentActivity.map((item,i) => (
              <div key={i} style={{display:'flex',gap:10,marginBottom:14,alignItems:'flex-start',animation:`fadeIn .3s ease ${i*.06}s both`}}>
                <div style={{width:34,height:34,borderRadius:9,background:'#f0fdf4',border:'1px solid #bbf7d0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:15}}>
                  {item.emoji}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{item.action}</div>
                  <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{item.detail} · {item.time}</div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Trees list */}
        <div className="ad-card">
          <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:700,color:'#111827',display:'flex',alignItems:'center',gap:8}}>
            <TreePine size={16} color="#16a34a"/> Family Trees
          </h3>
          {loading
            ? [0,1,2].map(i=><div key={i} style={{marginBottom:14}}><div className="ad-skeleton" style={{height:14,width:'70%',marginBottom:6}}/><div className="ad-skeleton" style={{height:11,width:'40%'}}/></div>)
            : trees.slice(0,5).map((tree,i) => (
              <div key={tree.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,animation:`fadeIn .3s ease ${i*.06}s both`}}>
                <div style={{width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #bbf7d0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <TreePine size={16} color="#16a34a"/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{tree.name||'Unnamed Tree'}</div>
                  <div style={{fontSize:11,color:'#9ca3af'}}>{(tree.members||[]).length} members</div>
                </div>
                <ChevronRight size={15} color="#d1d5db"/>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Members Panel ────────────────────────────────────────────────────────────
function MembersPanel({ trees }) {
  const [search, setSearch] = useState('');
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const memberMap = {};
      for (const tree of trees) {
        for (const m of (tree.members||[])) {
          const uid = typeof m === 'string' ? m : m.userId;
          const role = typeof m === 'string' ? 'Member' : (m.role || 'Member');
          if (uid && !memberMap[uid]) {
            memberMap[uid] = { uid, role, treeId: tree.id, treeName: tree.name };
          }
        }
      }
      setAllMembers(Object.values(memberMap));
      setLoading(false);
    }
    if (trees.length > 0) load();
    else setLoading(false);
  }, [trees]);

  const filtered = allMembers.filter(m =>
    !search || m.uid.toLowerCase().includes(search.toLowerCase()) ||
    m.treeName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:'#111827'}}>Members</h2>
          <p style={{margin:0,fontSize:13,color:'#9ca3af'}}>{allMembers.length} members across all trees</p>
        </div>
      </div>

      {/* Search */}
      <div style={{position:'relative',marginBottom:20}}>
        <Search size={14} color="#9ca3af" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
        <input className="ad-input" placeholder="Search members…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <div className="ad-card">
        {loading
          ? [0,1,2,3].map(i=>(
            <div key={i} className="ad-member-row">
              <div className="ad-skeleton" style={{width:40,height:40,borderRadius:'50%',flexShrink:0}}/>
              <div style={{flex:1}}><div className="ad-skeleton" style={{height:14,width:'50%',marginBottom:6}}/><div className="ad-skeleton" style={{height:11,width:'30%'}}/></div>
            </div>
          ))
          : filtered.length===0
          ? <p style={{textAlign:'center',color:'#9ca3af',fontSize:13,padding:'24px 0'}}>No members found</p>
          : filtered.map((member,i) => (
            <div key={member.uid} className="ad-member-row" style={{animation:`fadeIn .3s ease ${i*.04}s both`}}>
              <Avatar name={member.uid} size={40}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{member.uid.slice(0,12)}…</div>
                <div style={{fontSize:12,color:'#9ca3af'}}>{member.treeName||'Unknown tree'}</div>
              </div>
              <RoleBadge role={member.role}/>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── Role Requests Panel ──────────────────────────────────────────────────────
function RoleRequestsPanel({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'roleRequests'),
      where('status','==','pending'),
      orderBy('createdAt','desc')
    );
    const unsub = onSnapshot(q, snap => {
      setRequests(snap.docs.map(d => ({ id:d.id, ...d.data(), createdAt:d.data().createdAt?.toDate?.() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const respond = async (id, status) => {
    await updateDoc(doc(db,'roleRequests',id), { status, respondedBy: currentUser.uid, respondedAt: new Date() });
  };

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:'#111827'}}>Role Requests</h2>
        <p style={{margin:0,fontSize:13,color:'#9ca3af'}}>
          {requests.length} pending request{requests.length!==1?'s':''}
        </p>
      </div>

      {loading ? (
        <div className="ad-card"><p style={{textAlign:'center',color:'#9ca3af',fontSize:13}}>Loading…</p></div>
      ) : requests.length===0 ? (
        <div className="ad-card" style={{textAlign:'center',padding:'40px 24px'}}>
          <UserCheck size={36} color="#d1d5db" style={{marginBottom:12}}/>
          <p style={{margin:0,fontSize:14,fontWeight:600,color:'#374151'}}>No pending requests</p>
          <p style={{margin:'4px 0 0',fontSize:13,color:'#9ca3af'}}>All role requests have been reviewed</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {requests.map((req,i) => (
            <div key={req.id} className="ad-card" style={{animation:`fadeIn .3s ease ${i*.06}s both`}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <Avatar name={req.userName} size={40}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>{req.userName}</div>
                  <div style={{fontSize:12,color:'#9ca3af'}}>
                    <RoleBadge role={req.currentRole}/> → <RoleBadge role={req.requestedRole}/>
                  </div>
                </div>
                <div style={{fontSize:11,color:'#9ca3af'}}>{timeAgo(req.createdAt)}</div>
              </div>
              {req.message && (
                <div style={{background:'#f9fafb',borderRadius:8,padding:'8px 12px',fontSize:13,color:'#6b7280',marginBottom:12,fontStyle:'italic'}}>
                  "{req.message}"
                </div>
              )}
              <div style={{display:'flex',gap:10}}>
                <button className="ad-btn" onClick={()=>respond(req.id,'rejected')}
                  style={{flex:1,justifyContent:'center',background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5'}}>
                  ✕ Reject
                </button>
                <button className="ad-btn" onClick={()=>respond(req.id,'approved')}
                  style={{flex:1,justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',fontWeight:600}}>
                  ✓ Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quick Actions Panel ──────────────────────────────────────────────────────
function QuickActionsPanel() {
  const actions = [
    { icon:'📦', label:'Create Backup', desc:'Save a snapshot of all family data', color:'#16a34a', link:'backup' },
    { icon:'🎙️', label:'Record Story', desc:'Voice-to-text for a family member', color:'#2563eb', link:null },
    { icon:'🌍', label:'Translate Content', desc:'Translate profiles to another language', color:'#7c3aed', link:null },
    { icon:'💬', label:'Open Family Chat', desc:'Talk with all tree members', color:'#ea580c', link:null },
    { icon:'📊', label:'View Analytics', desc:'See usage stats and insights', color:'#0891b2', link:'/family-tree/:treeId/analytics' },
    { icon:'👥', label:'Invite Members', desc:'Add new people to the family tree', color:'#d97706', link:'invites/:inviteId' },
  ];

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:'#111827'}}>Quick Actions</h2>
        <p style={{margin:0,fontSize:13,color:'#9ca3af'}}>Common tasks at your fingertips</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14}}>
        {actions.map((action,i) => (
          <div key={i} className="ad-card" onClick={()=>action.link && window.location.assign(action.link)}
            style={{cursor:'pointer',display:'flex',alignItems:'center',gap:14,animation:`fadeIn .3s ease ${i*.06}s both`,transition:'box-shadow .2s,transform .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.1)';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.transform='';}}>
            <div style={{width:48,height:48,borderRadius:14,background:`${action.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
              {action.icon}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>{action.label}</div>
              <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{action.desc}</div>
            </div>
            <ChevronRight size={16} color="#d1d5db"/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab]     = useState('overview');
  const [loading, setLoading]         = useState(true);
  const [trees, setTrees]             = useState([]);
  const [recentActivity, setRecent]   = useState([]);
  const [stats, setStats]             = useState({ trees:0, members:0, stories:0, voiceStories:0, languages:0, persons:0 });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Trees
      const treesSnap = await getDocs(collection(db,'trees'));
      const treesData = treesSnap.docs.map(d => ({ id:d.id, ...d.data() }));
      setTrees(treesData);

      // Persons
      let totalPersons = 0;
      for (const tree of treesData) {
        const pSnap = await getDocs(collection(db,'trees',tree.id,'persons'));
        totalPersons += pSnap.size;
      }

      // Stories
      const storiesSnap = await getDocs(collection(db,'stories'));
      const stories = storiesSnap.docs.map(d => d.data());
      const voiceStories = stories.filter(s => s.source==='aws-transcribe'||s.source==='openai-whisper').length;
      const langSet = new Set(stories.map(s=>s.language?.split('-')[0]).filter(Boolean));

      // Members
      const memberSet = new Set();
      treesData.forEach(t => (t.members||[]).forEach(m => {
        const uid = typeof m==='string'?m:m.userId;
        if (uid) memberSet.add(uid);
      }));

      // Recent activity
      const recentSnap = await getDocs(query(collection(db,'stories'),orderBy('createdAt','desc'),limit(6)));
      const recent = recentSnap.docs.map(d => {
        const data = d.data();
        return {
          emoji: data.source==='aws-transcribe'||data.source==='openai-whisper' ? '🎙️' : '📖',
          action: data.source==='aws-transcribe'||data.source==='openai-whisper' ? 'Voice story recorded' : 'Story created',
          detail: data.title||'Story',
          time: data.createdAt?.toDate?.()?.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) || 'Recently',
        };
      });

      setStats({ trees:treesData.length, members:memberSet.size, stories:stories.length, voiceStories, languages:langSet.size, persons:totalPersons });
      setRecent(recent);
    } catch(err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Log page view
  useEffect(() => { analyticsService.pageView('Admin Dashboard'); }, []);

  const navItems = [
    { id:'overview',  label:'Overview',       icon:<LayoutDashboard size={18}/> },
    { id:'members',   label:'Members',        icon:<Users size={18}/> },
    { id:'requests',  label:'Role Requests',  icon:<UserCheck size={18}/> },
    { id:'actions',   label:'Quick Actions',  icon:<Zap size={18}/> },
  ];

  return (
    <>
      <style>{css}</style>
      <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>

        {/* Sidebar */}
        <div style={{ width:240, background:'#fff', borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', flexShrink:0, padding:'0 0 24px' }}>
          {/* Logo area */}
          <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid #f0f0f0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#14532d,#16a34a)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <LayoutDashboard size={20} color="#fff"/>
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:'#111827' }}>Taf'Yaa</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>Admin Dashboard</div>
              </div>
            </div>
          </div>

          {/* Current user */}
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Avatar name={currentUser?.displayName||currentUser?.email} photo={currentUser?.photoURL} size={34}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {currentUser?.displayName || 'Admin'}
                </div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>Administrator</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:'12px 12px' }}>
            {navItems.map(item => (
              <button key={item.id} className={`ad-nav-item ${activeTab===item.id?'active':''}`}
                onClick={()=>setActiveTab(item.id)}
                style={{ color: activeTab===item.id ? '#16a34a' : '#6b7280', marginBottom:2 }}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Bottom links */}
          <div style={{ padding:'0 12px' }}>
            <button className="ad-nav-item" onClick={()=>window.location.assign('/family-tree/:treeId/analytics')} style={{ color:'#6b7280', marginBottom:2 }}>
              <BarChart2 size={18}/> Analytics
            </button>
            <button className="ad-nav-item" onClick={()=>window.location.assign('backup')} style={{ color:'#6b7280' }}>
              <Archive size={18}/> Backups
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex:1, overflow:'auto' }}>
          {/* Top bar */}
          <div style={{ background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
            <div>
              <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:'#111827' }}>
                {navItems.find(n=>n.id===activeTab)?.label}
              </h1>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button className="ad-btn" onClick={loadData} disabled={loading} style={{ background:'#f3f4f6', color:'#374151' }}>
                <RefreshCw size={14} style={{ animation:loading?'spin .7s linear infinite':'none' }}/>
                Refresh
              </button>
              <div style={{ width:1, height:24, background:'#e5e7eb' }}/>
              <span style={{ fontSize:13, color:'#9ca3af' }}>
                {new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
              </span>
            </div>
          </div>

          {/* Panel content */}
          <div style={{ padding:'28px 32px' }}>
            {activeTab==='overview'  && <OverviewPanel stats={stats} loading={loading} trees={trees} recentActivity={recentActivity}/>}
            {activeTab==='members'   && <MembersPanel trees={trees}/>}
            {activeTab==='requests'  && <RoleRequestsPanel currentUser={currentUser}/>}
            {activeTab==='actions'   && <QuickActionsPanel/>}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;