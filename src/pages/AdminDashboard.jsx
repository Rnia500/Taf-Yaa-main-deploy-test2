// src/pages/AdminDashboard.jsx
// FIXED: imports from ../config/firebase

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, TreePine, Shield, Bell,
  Settings, BarChart2, MessageCircle, UserPlus,
  Trash2, CheckCircle, AlertTriangle, RefreshCw,
  Search, ChevronRight, Activity, BookOpen, Mic,
  Globe, Archive, TrendingUp, UserCheck, Clock,
  Zap, Database, Crown, Edit2, LogOut, Mail,
  Calendar, Star, Plus, ArrowUpRight, Eye,
  Heart, Image, HardDrive, Lock, Sun, Moon,
  ChevronDown, MoreVertical, X
} from 'lucide-react';
import {
  collection, getDocs, query, orderBy, limit,
  where, doc, updateDoc, onSnapshot, getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import useModalStore from '../store/useModalStore';
import dataService from '../services/dataService';

const css = `
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes countUp { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }

  .ad-nav-item {
    display:flex;align-items:center;gap:10px;padding:11px 14px;
    border-radius:11px;cursor:pointer;transition:all .15s;
    font-size:13.5px;font-weight:500;border:none;background:none;
    width:100%;text-align:left;font-family:inherit;
  }
  .ad-card { border-radius:16px;padding:20px 22px;transition:box-shadow .2s,transform .2s;animation:fadeIn .4s ease; }
  .ad-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.1) !important; transform:translateY(-1px); }
  .ad-stat-card { border-radius:16px;padding:20px;transition:box-shadow .2s,transform .2s;animation:fadeIn .4s ease; }
  .ad-stat-card:hover { box-shadow:0 6px 20px rgba(0,0,0,.1) !important; transform:translateY(-2px); }
  .ad-btn { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;border:none;cursor:pointer;transition:all .15s;font-family:inherit; }
  .ad-btn:hover:not(:disabled){filter:brightness(.92);transform:scale(.98);}
  .ad-btn:disabled{opacity:.5;cursor:not-allowed;}
  .ad-input { width:100%;padding:9px 14px 9px 36px;font-size:13px;border-radius:10px;outline:none;transition:border-color .15s;box-sizing:border-box;font-family:inherit; }
  .ad-input:focus { border-color:#16a34a !important; }
  .ad-skeleton { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:6px; }
  .ad-member-row { display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;transition:background .15s;cursor:pointer; }
  .ad-member-row:hover { background:rgba(0,0,0,.03); }
`;

function timeAgo(date) {
  if (!date) return '—';
  const diff = Math.floor((Date.now()-new Date(date))/1000);
  if (diff<60) return 'Just now';
  if (diff<3600) return `${Math.floor(diff/60)}m ago`;
  if (diff<86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
}

function Avatar({ name, photo, size=36 }) {
  const initials = name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
  const colors = ['#16a34a','#2563eb','#7c3aed','#db2777','#ea580c','#0891b2'];
  const color = colors[(name?.charCodeAt(0)||0)%colors.length];
  if (photo) return <img src={photo} alt={name} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>;
  return <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:size*.34,fontWeight:700,color:'#fff'}}>{initials}</div>;
}

function RoleBadge({ role }) {
  const map = {'Admin':{bg:'#fef3c7',color:'#d97706',icon:'👑'},'Owner':{bg:'#fef3c7',color:'#d97706',icon:'👑'},'Editor':{bg:'#eff6ff',color:'#2563eb',icon:'✏️'},'Member':{bg:'#f0fdf4',color:'#16a34a',icon:'👤'}};
  const s = map[role]||map.Member;
  return <span style={{fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:20,background:s.bg,color:s.color}}>{s.icon} {role||'Member'}</span>;
}

function StatCard({ icon, label, value, color, trend, t, delay=0, loading }) {
  return (
    <div className="ad-stat-card" style={{background:t.card,border:`1px solid ${t.border}`,boxShadow:'0 2px 8px rgba(0,0,0,.04)',animation:`fadeIn .4s ease ${delay}s both`}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
        <div style={{width:44,height:44,borderRadius:12,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {React.cloneElement(icon,{size:22,color})}
        </div>
        {trend!==undefined&&<span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:20,background:trend>=0?'#f0fdf4':'#fef2f2',color:trend>=0?'#16a34a':'#dc2626',display:'flex',alignItems:'center',gap:2}}><TrendingUp size={10}/>{Math.abs(trend)}%</span>}
      </div>
      {loading
        ? <><div className="ad-skeleton" style={{height:30,width:60,marginBottom:6}}/><div className="ad-skeleton" style={{height:12,width:90}}/></>
        : <><div style={{fontSize:30,fontWeight:800,color:t.text,lineHeight:1.1,animation:'countUp .5s ease'}}>{value}</div><div style={{fontSize:13,color:t.textMuted,marginTop:4}}>{label}</div></>
      }
    </div>
  );
}

function QuickAction({ icon, label, desc, color, onClick, t, delay=0 }) {
  return (
    <div onClick={onClick} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:16,cursor:'pointer',display:'flex',alignItems:'center',gap:14,animation:`fadeIn .3s ease ${delay}s both`,transition:'box-shadow .2s,transform .2s'}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.1)';e.currentTarget.style.transform='translateY(-1px)';}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.transform='';}}>
      <div style={{width:50,height:50,borderRadius:14,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:22}}>{icon}</div>
      <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:t.text}}>{label}</div><div style={{fontSize:12,color:t.textMuted,marginTop:2}}>{desc}</div></div>
      <ArrowUpRight size={16} color={t.textFaint}/>
    </div>
  );
}

function OverviewPanel({ stats, trees, recentActivity, loading, t, navigate }) {
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:16,marginBottom:24}}>
        <StatCard icon={<TreePine/>} label="Family Trees" value={stats.trees}   color="#16a34a" t={t} delay={0}    loading={loading}/>
        <StatCard icon={<Users/>}   label="Members"      value={stats.members}  color="#2563eb" t={t} delay={0.05}  loading={loading}/>
        <StatCard icon={<Users/>}   label="Persons"      value={stats.persons}  color="#ea580c" t={t} delay={0.1}   loading={loading}/>
        <StatCard icon={<BookOpen/>}label="Stories"      value={stats.stories}  color="#7c3aed" t={t} delay={0.15}  loading={loading}/>
        <StatCard icon={<Mic/>}     label="Voice Stories"value={stats.voice}    color="#0891b2" t={t} delay={0.2}   loading={loading}/>
        <StatCard icon={<Image/>}   label="Media Files"  value={stats.media}    color="#d97706" t={t} delay={0.25}  loading={loading}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <div className="ad-card" style={{background:t.card,border:`1px solid ${t.border}`,boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <h3 style={{margin:0,fontSize:15,fontWeight:700,color:t.text,display:'flex',alignItems:'center',gap:8}}><Activity size={16} color="#16a34a"/> Recent Activity</h3>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#16a34a'}}><div style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',animation:'pulse 1.5s infinite'}}/>Live</div>
          </div>
          {recentActivity.length===0
            ? <p style={{color:t.textMuted,fontSize:13,textAlign:'center',padding:'16px 0'}}>No activity yet</p>
            : recentActivity.map((item,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${t.border}`,animation:`fadeIn .3s ease ${i*.05}s both`}}>
                <div style={{width:36,height:36,borderRadius:10,background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:16}}>{item.emoji}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:t.text}}>{item.action}</div><div style={{fontSize:11,color:t.textMuted,marginTop:1}}>{item.detail} · {item.time}</div></div>
              </div>
            ))
          }
        </div>
        <div className="ad-card" style={{background:t.card,border:`1px solid ${t.border}`,boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
          <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:700,color:t.text,display:'flex',alignItems:'center',gap:8}}><TreePine size={16} color="#16a34a"/> Family Trees</h3>
          {loading
            ? [0,1,2].map(i=><div key={i} style={{marginBottom:14}}><div className="ad-skeleton" style={{height:14,width:'70%',marginBottom:5}}/><div className="ad-skeleton" style={{height:11,width:'40%'}}/></div>)
            : trees.slice(0,5).map((tree,i)=>(
              <div key={tree.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,cursor:'pointer',animation:`fadeIn .3s ease ${i*.05}s both`}}
                onClick={()=>navigate(`/family-tree/${tree.id}`)}>
                <div style={{width:36,height:36,borderRadius:10,background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><TreePine size={17} color="#16a34a"/></div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:t.text}}>{tree.name||tree.familyName||'Unnamed Tree'}</div><div style={{fontSize:11,color:t.textMuted}}>{(tree.members||[]).length} members</div></div>
                <ChevronRight size={15} color={t.textFaint}/>
              </div>
            ))
          }
        </div>
      </div>
      <div className="ad-card" style={{background:t.card,border:`1px solid ${t.border}`,boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
        <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:700,color:t.text,display:'flex',alignItems:'center',gap:8}}><Zap size={16} color="#16a34a"/> Quick Actions</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
          {[
            {icon:'📦',label:'Backups',desc:'Create and manage data snapshots',color:'#16a34a',path:'/family-tree/:treeId/backup'},
            {icon:'📊',label:'Analytics',desc:'View usage statistics',color:'#2563eb',path:'/family-tree/:treeId/analytics'},
            {icon:'💬',label:'Family Chat',desc:'Open the chat center',color:'#7c3aed',path:'/family-tree/:treeId/chat'},
            {icon:'🔔',label:'Notifications',desc:'View all notifications',color:'#ea580c',path:'/notifications'},
            {icon:'🔍',label:'Find My Family',desc:'Search diaspora connections',color:'#0891b2',path:'/find-my-family'},
            {icon:'⚙️',label:'Tree Settings',desc:'Manage tree settings',color:'#d97706',path:'/settings'},
          ].map((action,i)=>(
            <QuickAction key={i} {...action} onClick={()=>action.path&&navigate(action.path)} t={t} delay={i*.05}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function MembersPanel({ trees, t, navigate }) {
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(()=>{
    async function load() {
      const map = {};
      for (const tree of trees) {
        for (const m of (tree.members||[])) {
          const uid  = typeof m==='string'?m:m.userId;
          const role = typeof m==='string'?'Member':(m.role||'Member');
          if (uid&&!map[uid]) {
            // Try to get user display name from users collection
            try {
              const userDoc = await getDoc(doc(db,'users',uid));
              const userData = userDoc.exists()?userDoc.data():{};
              map[uid]={uid,role,treeName:tree.name||tree.familyName||'Tree',treeId:tree.id,displayName:userData.displayName||userData.name||uid.slice(0,12)+'…',email:userData.email||'',photoURL:userData.photoURL||null};
            } catch {
              map[uid]={uid,role,treeName:tree.name||tree.familyName||'Tree',treeId:tree.id,displayName:uid.slice(0,12)+'…',email:'',photoURL:null};
            }
          }
        }
      }
      setMembers(Object.values(map));
      setLoading(false);
    }
    if (trees.length>0) load();
    else setLoading(false);
  },[trees]);

  const filtered = members.filter(m=>{
    const matchSearch = !search||m.displayName.toLowerCase().includes(search.toLowerCase())||m.treeName.toLowerCase().includes(search.toLowerCase())||m.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter==='all'||m.role.toLowerCase()===filter.toLowerCase();
    return matchSearch&&matchFilter;
  });

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div><h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:t.text}}>Members</h2><p style={{margin:0,fontSize:13,color:t.textMuted}}>{members.length} members across all trees</p></div>
      </div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,minWidth:200}}>
          <Search size={14} color={t.textFaint} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input className="ad-input" placeholder="Search by name, email, tree…" value={search} onChange={e=>setSearch(e.target.value)} style={{border:`1.5px solid ${t.border}`,background:t.input,color:t.text}}/>
        </div>
        {['all','Member','Editor','Admin'].map(r=>(
          <button key={r} onClick={()=>setFilter(r)} className="ad-btn" style={{background:filter===r?'#16a34a':t.card,color:filter===r?'#fff':t.textMuted,border:`1px solid ${filter===r?'#16a34a':t.border}`}}>
            {r==='all'?'All':r}
          </button>
        ))}
      </div>
      <div className="ad-card" style={{background:t.card,border:`1px solid ${t.border}`,padding:0,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 120px 160px 100px',gap:12,padding:'12px 18px',background:t.bg,borderBottom:`1px solid ${t.border}`,fontSize:11,fontWeight:600,color:t.textMuted,textTransform:'uppercase',letterSpacing:'0.05em'}}>
          <div>Member</div><div>Role</div><div>Tree</div><div>Actions</div>
        </div>
        {loading
          ? [0,1,2,3].map(i=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 120px 160px 100px',gap:12,padding:'12px 18px',borderBottom:`1px solid ${t.border}`,alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}><div className="ad-skeleton" style={{width:36,height:36,borderRadius:'50%',flexShrink:0}}/><div className="ad-skeleton" style={{height:13,width:'60%'}}/></div>
              <div className="ad-skeleton" style={{height:22,width:70,borderRadius:20}}/><div className="ad-skeleton" style={{height:13,width:'80%'}}/><div className="ad-skeleton" style={{height:28,width:60,borderRadius:8}}/>
            </div>
          ))
          : filtered.length===0
          ? <div style={{padding:'32px 18px',textAlign:'center',color:t.textMuted,fontSize:13}}>No members found</div>
          : filtered.map((member,i)=>(
            <div key={member.uid} style={{display:'grid',gridTemplateColumns:'1fr 120px 160px 100px',gap:12,padding:'12px 18px',borderBottom:`1px solid ${t.border}`,alignItems:'center',cursor:'pointer',transition:'background .15s',animation:`fadeIn .25s ease ${i*.04}s both`}}
              onMouseEnter={e=>e.currentTarget.style.background=t.cardHover}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              onClick={()=>navigate(`/family-tree/${member.treeId}`)}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <Avatar name={member.displayName} photo={member.photoURL} size={36}/>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:t.text}}>{member.displayName}</div>
                  <div style={{fontSize:11,color:t.textMuted}}>{member.email}</div>
                </div>
              </div>
              <div><RoleBadge role={member.role}/></div>
              <div style={{fontSize:12,color:t.textMuted}}>{member.treeName}</div>
              <div style={{display:'flex',gap:6}}>
                <button className="ad-btn" onClick={e=>{e.stopPropagation();navigate(`/family-tree/${member.treeId}`);}} style={{background:t.primaryBg,color:'#16a34a',border:`1px solid ${t.primaryBorder}`,padding:'5px 10px',fontSize:11}}>
                  <Eye size={12}/>View
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function RoleRequestsPanel({ currentUser, t }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(()=>{
    const q = query(collection(db,'roleRequests'),where('status','==','pending'),orderBy('createdAt','desc'));
    const unsub = onSnapshot(q,snap=>{
      setRequests(snap.docs.map(d=>({id:d.id,...d.data(),createdAt:d.data().createdAt?.toDate?.()})));
      setLoading(false);
    },err=>{console.error('roleRequests error:',err);setLoading(false);});
    return unsub;
  },[]);

  const respond = async(id,status)=>{
    await updateDoc(doc(db,'roleRequests',id),{status,respondedBy:currentUser.uid,respondedAt:new Date()});
  };

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:700,color:t.text}}>Role Requests</h2>
        <p style={{margin:0,fontSize:13,color:t.textMuted}}>{loading?'Loading…':`${requests.length} pending request${requests.length!==1?'s':''}`}</p>
      </div>
      {loading?(
        <div className="ad-card" style={{background:t.card,border:`1px solid ${t.border}`,textAlign:'center',padding:'32px'}}><div style={{width:24,height:24,border:'3px solid #16a34a',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 12px'}}/><p style={{color:t.textMuted,fontSize:13,margin:0}}>Loading role requests…</p></div>
      ):requests.length===0?(
        <div className="ad-card" style={{background:t.card,border:`1px solid ${t.border}`,textAlign:'center',padding:'48px 24px'}}>
          <UserCheck size={40} color={t.textFaint} style={{marginBottom:12}}/>
          <p style={{margin:'0 0 4px',fontSize:15,fontWeight:700,color:t.text}}>No pending requests</p>
          <p style={{margin:0,fontSize:13,color:t.textMuted}}>All role requests have been reviewed</p>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {requests.map((req,i)=>(
            <div key={req.id} className="ad-card" style={{background:t.card,border:`1px solid ${t.border}`,animation:`fadeIn .3s ease ${i*.06}s both`}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <Avatar name={req.userName} size={44}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:t.text}}>{req.userName||'Unknown'}</div>
                  <div style={{fontSize:12,color:t.textMuted,display:'flex',alignItems:'center',gap:6}}>
                    <RoleBadge role={req.currentRole}/><span style={{color:t.textFaint}}>→</span><RoleBadge role={req.requestedRole}/>
                  </div>
                </div>
                <div style={{fontSize:11,color:t.textMuted}}>{timeAgo(req.createdAt)}</div>
              </div>
              {req.message&&<div style={{background:t.bg,borderRadius:8,padding:'9px 12px',fontSize:13,color:t.textSub,marginBottom:12,fontStyle:'italic',border:`1px solid ${t.border}`}}>"{req.message}"</div>}
              <div style={{display:'flex',gap:10}}>
                <button className="ad-btn" onClick={()=>respond(req.id,'rejected')} style={{flex:1,justifyContent:'center',background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5'}}>✕ Reject</button>
                <button className="ad-btn" onClick={()=>respond(req.id,'approved')} style={{flex:1,justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',fontWeight:600}}>✓ Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { currentUser }           = useAuth();
  const t                         = useTheme();
  const navigate                  = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading]     = useState(true);
  const [trees, setTrees]         = useState([]);
  const [stats, setStats]         = useState({trees:0,members:0,persons:0,stories:0,voice:0,media:0});
  const [recentActivity, setRecent] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rootNames, setRootNames] = useState({});
  const { openModal } = useModalStore();
  const [peopleCounts, setPeopleCounts] = useState({});

    const handleCreateTree = () => {
    openModal('treeModal', {
      createdBy: currentUser?.uid,
      navigate: navigate,
      onSuccess: async (result) => {
        console.log('Tree operation successful:', result);
        setTrees(prevTrees => {
          const existingIndex = prevTrees.findIndex(t => t.id === result.tree.id);
          if (existingIndex >= 0) {
            // Update existing tree
            const updatedTrees = [...prevTrees];
            updatedTrees[existingIndex] = result.tree;
            return updatedTrees;
          } else {
            // Add new tree
            return [...prevTrees, result.tree];
          }
        });

        // Fetch root name and people count for the tree (new or updated)
        if (result.tree.currentRootId) {
          try {
            const person = await dataService.getPerson(result.tree.currentRootId);
            setRootNames(prev => ({
              ...prev,
              [result.tree.id]: person ? person.name : 'Unknown'
            }));
          } catch (error) {
            console.error('Failed to fetch root person for tree:', error);
            setRootNames(prev => ({
              ...prev,
              [result.tree.id]: 'Unknown'
            }));
          }
        } else {
          setRootNames(prev => ({
            ...prev,
            [result.tree.id]: 'No Root'
          }));
        }

        // Fetch people count for the new/updated tree
        try {
           console.log('Fetching people for tree query2:', result.tree.id, 'User:', currentUser?.uid, result.tree);
          const people = await dataService.getPeopleByTreeId(result.tree.id);
          setPeopleCounts(prev => ({
            ...prev,
            [result.tree.id]: people.length
          }));
        } catch (error) {
          console.error('Failed to fetch people count for new tree:', error);
          setPeopleCounts(prev => ({
            ...prev,
            [result.tree.id]: 0
          }));
        }

        // Navigate to TreeCanvas with rootPerson preloaded
        if (result.tree && result.rootPerson) {
          const treeId = result.tree.id || result.tree._id || null;
          const rootPersonId = result.rootPerson.id || result.rootPerson._id || null;
          if (treeId && rootPersonId) {
            navigate(`/family-tree/${treeId}?root=${rootPersonId}`);
          }
        }
      }
    });
  };

  const handleJoinTree = () => {
    openModal('joinModal');
  }

  const handleTreeClick = (treeId) => {
    navigate(`/family-tree/${treeId}`);
  };

  const loadData = useCallback(async()=>{
    try {
      setLoading(true);
      // Load trees
      const treesSnap = await getDocs(collection(db,'trees'));
      const treesData = treesSnap.docs.map(d=>({id:d.id,...d.data()}));
      setTrees(treesData);

      // Load persons from subcollections
      let totalPersons = 0;
      for (const tree of treesData) {
        try {
          const pSnap = await getDocs(collection(db,'trees',tree.id,'persons'));
          totalPersons += pSnap.size;
        } catch(e) {}
      }

      // Load stories
      let storiesData = [];
      try {
        const storiesSnap = await getDocs(collection(db,'stories'));
        storiesData = storiesSnap.docs.map(d=>d.data());
      } catch(e) {}

      // Load media
      let mediaCount = 0;
      try {
        const mediaSnap = await getDocs(collection(db,'media'));
        mediaCount = mediaSnap.size;
      } catch(e) {}

      // Unique members across all trees
      const memberSet = new Set();
      treesData.forEach(tree=>(tree.members||[]).forEach(m=>{
        const uid = typeof m==='string'?m:m.userId;
        if(uid) memberSet.add(uid);
      }));

      // Recent activity
      let recent = [];
      try {
        const recentSnap = await getDocs(query(collection(db,'stories'),orderBy('createdAt','desc'),limit(6)));
        recent = recentSnap.docs.map(d=>{
          const data = d.data();
          const isVoice = data.source==='aws-transcribe'||data.source==='openai-whisper';
          return {emoji:isVoice?'🎙️':'📖',action:isVoice?'Voice story recorded':'Story created',detail:data.title||'Story',time:data.createdAt?.toDate?.()?.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})||'Recently'};
        });
      } catch(e) {}

      setStats({trees:treesData.length,members:memberSet.size,persons:totalPersons,stories:storiesData.length,voice:storiesData.filter(s=>s.source==='aws-transcribe'||s.source==='openai-whisper').length,media:mediaCount});
      setRecent(recent);
    } catch(err){ console.error('Dashboard load error:',err); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ loadData(); },[loadData]);

  const navItems = [
    {id:'overview', label:'Overview',      icon:<LayoutDashboard size={17}/>},
    {id:'members',  label:'Members',       icon:<Users size={17}/>},
    {id:'requests', label:'Role Requests', icon:<UserCheck size={17}/>},
  ];


   const externalLinks = [
    {label:'Analytics',     icon:<BarChart2 size={17}/>,  path:'/family-tree/:treeId/analytics'},
    {label:'Backups',       icon:<Archive size={17}/>,    path:'/family-tree/:treeId/backup'},
    {label:'Notifications', icon:<Bell size={17}/>,       path:'/notifications'},
    {label:'Find Family',   icon:<Search size={17}/>,     path:'/find-my-family'},
    {label:'Family Chat',   icon:<MessageCircle size={17}/>, path:'/family-tree/:treeId/chat'},
    {label:'Tree Settings', icon:<Settings size={17}/>,      path:'/settings'},
  ];


  return (
    <>
      <style>{css}</style>
      <div style={{display:'flex',minHeight:'100vh',background:t.bg,transition:'background .3s'}}>
        {/* Sidebar */}
        <div style={{width:sidebarOpen?240:64,background:t.sidebar,borderRight:`1px solid ${t.border}`,display:'flex',flexDirection:'column',flexShrink:0,transition:'width .25s',overflow:'hidden'}}>
          <div style={{padding:'20px 16px',borderBottom:`1px solid ${t.border}`,display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:38,height:38,borderRadius:11,background:'linear-gradient(135deg,#14532d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <LayoutDashboard size={19} color="#fff"/>
            </div>
            {sidebarOpen&&<div style={{overflow:'hidden'}}><div style={{fontSize:15,fontWeight:800,color:t.text,whiteSpace:'nowrap'}}>Admin Panel</div><div style={{fontSize:11,color:t.textMuted,whiteSpace:'nowrap'}}>Taf'Yaa</div></div>}
            <button onClick={()=>setSidebarOpen(o=>!o)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:t.textMuted,padding:4,display:'flex',borderRadius:6,flexShrink:0}}>
              <ChevronDown size={15} style={{transform:sidebarOpen?'rotate(-90deg)':'rotate(90deg)',transition:'transform .25s'}}/>
            </button>
          </div>
          {sidebarOpen&&(
            <div style={{padding:'14px 16px',borderBottom:`1px solid ${t.border}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <Avatar name={currentUser?.displayName||currentUser?.email} photo={currentUser?.photoURL} size={34}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:t.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{currentUser?.displayName||'Admin'}</div>
                  <div style={{fontSize:11,color:t.textMuted}}>Administrator</div>
                </div>
              </div>
            </div>
          )}
          <nav style={{flex:1,padding:'10px 8px'}}>
            {sidebarOpen&&<div style={{fontSize:10,fontWeight:600,color:t.textFaint,textTransform:'uppercase',letterSpacing:'0.08em',padding:'6px 8px',marginBottom:4}}>Main</div>}
            {navItems.map(item=>(
              <button key={item.id} className="ad-nav-item" onClick={()=>setActiveTab(item.id)}
                style={{color:activeTab===item.id?'#16a34a':t.textMuted,background:activeTab===item.id?t.primaryBg:'none',marginBottom:2,justifyContent:sidebarOpen?'flex-start':'center',padding:sidebarOpen?'11px 14px':'11px'}}>
                {item.icon}{sidebarOpen&&item.label}
              </button>
            ))}
            {sidebarOpen&&<div style={{fontSize:10,fontWeight:600,color:t.textFaint,textTransform:'uppercase',letterSpacing:'0.08em',padding:'14px 8px 6px',marginTop:8}}>Navigate To</div>}
            {externalLinks.map((link,i)=>(
              <button key={i} className="ad-nav-item" onClick={()=>navigate(link.path)}
                style={{color:t.textMuted,background:'none',marginBottom:2,justifyContent:sidebarOpen?'flex-start':'center',padding:sidebarOpen?'11px 14px':'11px'}}>
                {link.icon}{sidebarOpen&&link.label}
              </button>
            ))}
          </nav>
          <div style={{padding:'8px'}}>
            <button onClick={t.toggle} className="ad-nav-item" style={{color:t.textMuted,justifyContent:sidebarOpen?'flex-start':'center',padding:sidebarOpen?'11px 14px':'11px',marginBottom:4}}>
              {t.dark?<Sun size={17}/>:<Moon size={17}/>}{sidebarOpen&&(t.dark?'Light Mode':'Dark Mode')}
            </button>
            <button onClick={()=>navigate(-1)} className="ad-nav-item" style={{color:t.textMuted,justifyContent:sidebarOpen?'flex-start':'center',padding:sidebarOpen?'11px 14px':'11px'}}>
              <LogOut size={17}/>{sidebarOpen&&'Go Back'}
            </button>
          </div>
        </div>
        {/* Main */}
        <div style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column'}}>
          <div style={{background:t.sidebar,borderBottom:`1px solid ${t.border}`,padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
            <div>
              <h1 style={{margin:0,fontSize:18,fontWeight:700,color:t.text}}>{navItems.find(n=>n.id===activeTab)?.label||'Admin Dashboard'}</h1>
              <p style={{margin:0,fontSize:12,color:t.textMuted,marginTop:2}}>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {loading&&<div style={{width:16,height:16,border:'2px solid #16a34a',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>}
              <button className="ad-btn" onClick={loadData} disabled={loading} style={{background:t.card,color:t.textMuted,border:`1px solid ${t.border}`}}>
                <RefreshCw size={14} style={{animation:loading?'spin .7s linear infinite':'none'}}/>{loading?'Loading…':'Refresh'}
              </button>
              <button className="ad-btn" onClick={handleCreateTree} style={{background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',fontWeight:600}}>
                <Plus size={14}/> New Tree
              </button>
               <button className="ad-btn" onClick={handleJoinTree} style={{background:t.card,color:t.textMuted,border:`1px solid ${t.border}`}}>
                <UserPlus size={14}/> Join Tree
              </button>
            </div>
          </div>
          <div style={{padding:'24px 28px',flex:1}}>
            {activeTab==='overview' && <OverviewPanel stats={stats} trees={trees} recentActivity={recentActivity} loading={loading} t={t} navigate={navigate}/>}
            {activeTab==='members'  && <MembersPanel trees={trees} t={t} navigate={navigate}/>}
            {activeTab==='requests' && <RoleRequestsPanel currentUser={currentUser} t={t}/>}
          </div>
        </div>
      </div>
    </>
  );
}