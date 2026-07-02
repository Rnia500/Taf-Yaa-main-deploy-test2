import React, { useState, useEffect } from 'react';
import {
  Settings, User, Bell, Shield, Globe, Moon, Sun,
  ChevronRight, ArrowLeft, Check, Camera, Mail,
  Lock, Trash2, LogOut, Eye, EyeOff, Save,
  TreePine, Users, Volume2, Smartphone, Key
} from 'lucide-react';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { updateProfile, updateEmail, updatePassword, signOut } from 'firebase/auth';

const css = `
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

  .sp-input { width:100%;padding:10px 14px;font-size:14px;border-radius:10px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit; }
  .sp-input:focus { border-color:#16a34a !important;box-shadow:0 0 0 3px rgba(22,163,74,.12) !important; }
  .sp-btn { display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .15s;font-family:inherit; }
  .sp-btn:hover:not(:disabled){filter:brightness(.92);transform:scale(.98);}
  .sp-btn:disabled{opacity:.5;cursor:not-allowed;}
  .sp-toggle { width:44px;height:24px;borderRadius:12px;border:none;cursor:pointer;transition:background .3s;position:relative;flex-shrink:0; }
  .sp-toggle::after { content:'';position:absolute;width:18px;height:18px;borderRadius:50%;background:#fff;top:3px;transition:left .3s;box-shadow:0 1px 4px rgba(0,0,0,.2); }
  .sp-nav-item { display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:11px;cursor:pointer;transition:all .15s;font-size:14px;font-weight:500;border:none;background:none;width:100%;text-align:left;font-family:inherit; }
  .sp-section-row { display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s; }
  .sp-section-row:last-child { border-bottom:none; }
`;

function Toggle({ checked, onChange, t }) {
  return (
    <button onClick={()=>onChange(!checked)} style={{
      width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',
      background:checked?'#16a34a':'#d1d5db',
      position:'relative',transition:'background .3s',flexShrink:0,
    }}>
      <div style={{
        position:'absolute',width:18,height:18,borderRadius:'50%',
        background:'#fff',top:3,left:checked?23:3,
        transition:'left .3s',boxShadow:'0 1px 4px rgba(0,0,0,.2)',
      }}/>
    </button>
  );
}

function SectionCard({ title, icon, children, t }) {
  return (
    <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,overflow:'hidden',marginBottom:16,animation:'fadeIn .4s ease'}}>
      <div style={{padding:'14px 18px',borderBottom:`1px solid ${t.border}`,display:'flex',alignItems:'center',gap:10,background:t.bg}}>
        <div style={{width:32,height:32,borderRadius:9,background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {React.cloneElement(icon,{size:16,color:'#16a34a'})}
        </div>
        <h3 style={{margin:0,fontSize:14,fontWeight:700,color:t.text}}>{title}</h3>
      </div>
      <div style={{padding:'0 18px'}}>{children}</div>
    </div>
  );
}

function SettingRow({ label, sub, right, onClick, danger, t }) {
  return (
    <div className="sp-section-row" onClick={onClick}
      style={{'--border':t.border}}
      onMouseEnter={e=>{if(onClick)e.currentTarget.style.background=t.cardHover;}}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:500,color:danger?'#dc2626':t.text}}>{label}</div>
        {sub&&<div style={{fontSize:12,color:t.textMuted,marginTop:2}}>{sub}</div>}
      </div>
      {right||(onClick&&<ChevronRight size={16} color={t.textFaint}/>)}
    </div>
  );
}

export default function SettingsPage() {
  const { currentUser }       = useAuth();
  const t                     = useTheme();
  const navigate              = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  // Profile state
  const [displayName, setDisplayName] = useState(currentUser?.displayName||'');
  const [email, setEmail]             = useState(currentUser?.email||'');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Notification prefs
  const [notifSettings, setNotifSettings] = useState({
    newMessages:true, roleRequests:true, familyActivity:true,
    weeklyDigest:false, emailNotifs:true, pushNotifs:false,
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible:true, treeSearchable:true, allowMergeRequests:true,
  });

  // Trees
  const [myTrees, setMyTrees] = useState([]);

  useEffect(()=>{
    async function loadTrees() {
      if (!currentUser) return;
      try {
        const snap = await getDocs(collection(db,'trees'));
        const trees = snap.docs.map(d=>({id:d.id,...d.data()}))
          .filter(tree=>(tree.members||[]).some(m=>{const uid=typeof m==='string'?m:m.userId;return uid===currentUser.uid;}));
        setMyTrees(trees);
      } catch(e){}
    }
    loadTrees();
  },[currentUser]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    try {
      if (displayName!==currentUser.displayName) {
        await updateProfile(auth.currentUser,{displayName});
      }
      if (newPassword) {
        await updatePassword(auth.currentUser,newPassword);
        setNewPassword('');
      }
      setSaved(true);
      setTimeout(()=>setSaved(false),2500);
    } catch(err) {
      setError(err.message||'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const handleSignOut = async () => {
    if (!window.confirm('Are you sure you want to sign out?')) return;
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    {id:'profile',       label:'Profile',        icon:<User size={16}/>},
    {id:'notifications', label:'Notifications',  icon:<Bell size={16}/>},
    {id:'privacy',       label:'Privacy',        icon:<Shield size={16}/>},
    {id:'trees',         label:'My Trees',       icon:<TreePine size={16}/>},
    {id:'appearance',    label:'Appearance',     icon:<Moon size={16}/>},
  ];

  return (
    <>
      <style>{css}</style>
      <div style={{display:'flex',minHeight:'100vh',background:t.bg,transition:'background .3s'}}>

        {/* Sidebar */}
        <div style={{width:220,background:t.sidebar,borderRight:`1px solid ${t.border}`,display:'flex',flexDirection:'column',flexShrink:0}}>
          <div style={{padding:'20px 16px',borderBottom:`1px solid ${t.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#14532d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Settings size={18} color="#fff"/>
              </div>
              <div><div style={{fontSize:15,fontWeight:800,color:t.text}}>Settings</div><div style={{fontSize:11,color:t.textMuted}}>Taf'Yaa</div></div>
            </div>
          </div>
          <nav style={{flex:1,padding:'10px 8px'}}>
            {navItems.map(item=>(
              <button key={item.id} className="sp-nav-item" onClick={()=>setActiveSection(item.id)}
                style={{color:activeSection===item.id?'#16a34a':t.textMuted,background:activeSection===item.id?t.primaryBg:'none',marginBottom:2,border:activeSection===item.id?`1px solid ${t.primaryBorder}`:'1px solid transparent'}}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
          <div style={{padding:'8px'}}>
            <button className="sp-nav-item" onClick={handleSignOut} style={{color:'#dc2626'}}>
              <LogOut size={16}/> Sign Out
            </button>
            <button className="sp-nav-item" onClick={()=>navigate(-1)} style={{color:t.textMuted}}>
              <ArrowLeft size={16}/> Go Back
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{flex:1,overflow:'auto'}}>
          <div style={{background:t.sidebar,borderBottom:`1px solid ${t.border}`,padding:'16px 28px',position:'sticky',top:0,zIndex:10}}>
            <h1 style={{margin:0,fontSize:18,fontWeight:700,color:t.text}}>{navItems.find(n=>n.id===activeSection)?.label}</h1>
          </div>

          <div style={{maxWidth:680,margin:'0 auto',padding:'24px 28px'}}>

            {/* PROFILE */}
            {activeSection==='profile'&&(
              <div style={{animation:'fadeIn .4s ease'}}>
                {/* Avatar */}
                <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24,padding:'20px',background:t.card,border:`1px solid ${t.border}`,borderRadius:16}}>
                  <div style={{position:'relative'}}>
                    <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#14532d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700,color:'#fff',overflow:'hidden'}}>
                      {currentUser?.photoURL?<img src={currentUser.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(currentUser?.displayName||'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{position:'absolute',bottom:0,right:0,width:24,height:24,borderRadius:'50%',background:'#16a34a',border:`2px solid ${t.card}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                      <Camera size={12} color="#fff"/>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:t.text}}>{currentUser?.displayName||'No name set'}</div>
                    <div style={{fontSize:13,color:t.textMuted}}>{currentUser?.email}</div>
                    <div style={{fontSize:11,color:'#16a34a',marginTop:2,fontWeight:600}}>✓ Email verified</div>
                  </div>
                </div>

                {error&&<div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#b91c1c'}}>{error}</div>}
                {saved&&<div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#15803d',display:'flex',alignItems:'center',gap:8}}><Check size={15}/>Changes saved successfully!</div>}

                <SectionCard title="Personal Information" icon={<User/>} t={t}>
                  <div style={{padding:'12px 0'}}>
                    <div style={{marginBottom:14}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:t.textMuted,marginBottom:5}}>Display Name</label>
                      <input className="sp-input" value={displayName} onChange={e=>setDisplayName(e.target.value)}
                        placeholder="Your name" style={{border:`1.5px solid ${t.border}`,background:t.input,color:t.text}}/>
                    </div>
                    <div style={{marginBottom:4}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:t.textMuted,marginBottom:5}}>Email Address</label>
                      <input className="sp-input" value={email} disabled
                        style={{border:`1.5px solid ${t.border}`,background:t.bg,color:t.textMuted,cursor:'not-allowed'}}/>
                      <p style={{margin:'4px 0 0',fontSize:11,color:t.textFaint}}>Contact support to change your email</p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Change Password" icon={<Key/>} t={t}>
                  <div style={{padding:'12px 0'}}>
                    <div style={{position:'relative',marginBottom:4}}>
                      <input className="sp-input" type={showPassword?'text':'password'} value={newPassword}
                        onChange={e=>setNewPassword(e.target.value)} placeholder="New password (leave empty to keep current)"
                        style={{border:`1.5px solid ${t.border}`,background:t.input,color:t.text,paddingRight:42}}/>
                      <button onClick={()=>setShowPassword(s=>!s)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:t.textMuted,display:'flex'}}>
                        {showPassword?<EyeOff size={16}/>:<Eye size={16}/>}
                      </button>
                    </div>
                    {newPassword&&newPassword.length<6&&<p style={{margin:'4px 0 0',fontSize:11,color:'#dc2626'}}>Password must be at least 6 characters</p>}
                  </div>
                </SectionCard>

                <button className="sp-btn" onClick={handleSaveProfile} disabled={saving||(!displayName.trim())}
                  style={{width:'100%',justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',fontSize:14,padding:'12px'}}>
                  {saving?<><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Saving…</>:<><Save size={15}/> Save Changes</>}
                </button>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection==='notifications'&&(
              <div style={{animation:'fadeIn .4s ease'}}>
                <SectionCard title="In-App Notifications" icon={<Bell/>} t={t}>
                  {[
                    {key:'newMessages',     label:'New Messages',       sub:'When someone sends you a chat message'},
                    {key:'roleRequests',    label:'Role Requests',      sub:'When a member requests a role upgrade'},
                    {key:'familyActivity',  label:'Family Activity',    sub:'When someone adds or edits a family member'},
                  ].map(item=>(
                    <SettingRow key={item.key} label={item.label} sub={item.sub} t={t}
                      right={<Toggle checked={notifSettings[item.key]} onChange={v=>setNotifSettings(p=>({...p,[item.key]:v}))} t={t}/>}/>
                  ))}
                </SectionCard>
                <SectionCard title="Email Notifications" icon={<Mail/>} t={t}>
                  {[
                    {key:'emailNotifs',   label:'Email Notifications',  sub:'Receive important updates by email'},
                    {key:'weeklyDigest',  label:'Weekly Digest',        sub:'A weekly summary of family tree activity'},
                  ].map(item=>(
                    <SettingRow key={item.key} label={item.label} sub={item.sub} t={t}
                      right={<Toggle checked={notifSettings[item.key]} onChange={v=>setNotifSettings(p=>({...p,[item.key]:v}))} t={t}/>}/>
                  ))}
                </SectionCard>
              </div>
            )}

            {/* PRIVACY */}
            {activeSection==='privacy'&&(
              <div style={{animation:'fadeIn .4s ease'}}>
                <SectionCard title="Visibility" icon={<Eye/>} t={t}>
                  {[
                    {key:'profileVisible',      label:'Public Profile',         sub:'Allow others to see your profile information'},
                    {key:'treeSearchable',       label:'Searchable Family Tree', sub:'Allow your tree to appear in Find My Family searches'},
                    {key:'allowMergeRequests',   label:'Allow Connection Requests',sub:'Allow diaspora users to request to join your tree'},
                  ].map(item=>(
                    <SettingRow key={item.key} label={item.label} sub={item.sub} t={t}
                      right={<Toggle checked={privacySettings[item.key]} onChange={v=>setPrivacySettings(p=>({...p,[item.key]:v}))} t={t}/>}/>
                  ))}
                </SectionCard>
                <SectionCard title="Data & Security" icon={<Shield/>} t={t}>
                  <SettingRow label="Download My Data" sub="Export all your family tree data as a backup" t={t} onClick={()=>navigate('/family-tree/:treeId/backup')}/>
                  <SettingRow label="Delete Account" sub="Permanently delete your account and all data" danger t={t}
                    onClick={()=>window.confirm('This will permanently delete your account. Are you sure?')&&handleSignOut()}/>
                </SectionCard>
              </div>
            )}

            {/* MY TREES */}
            {activeSection==='trees'&&(
              <div style={{animation:'fadeIn .4s ease'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                  <div>
                    <h2 style={{margin:'0 0 4px',fontSize:18,fontWeight:700,color:t.text}}>My Trees</h2>
                    <p style={{margin:0,fontSize:13,color:t.textMuted}}>{myTrees.length} family tree{myTrees.length!==1?'s':''}</p>
                  </div>
                  <button className="sp-btn" onClick={()=>navigate('/create-tree')}
                    style={{background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff'}}>
                    <TreePine size={14}/> New Tree
                  </button>
                </div>
                {myTrees.length===0?(
                  <div style={{background:t.card,border:`2px dashed ${t.border}`,borderRadius:16,padding:'40px 24px',textAlign:'center'}}>
                    <TreePine size={36} color={t.textFaint} style={{marginBottom:12}}/>
                    <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:4}}>No trees yet</div>
                    <div style={{fontSize:13,color:t.textMuted}}>Create your first family tree to get started!</div>
                  </div>
                ):(
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {myTrees.map((tree,i)=>(
                      <div key={tree.id} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:'16px 18px',display:'flex',alignItems:'center',gap:14,cursor:'pointer',transition:'box-shadow .2s',animation:`fadeIn .3s ease ${i*.06}s both`}}
                        onClick={()=>navigate(`/family-tree/${tree.id}`)}
                        onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'}
                        onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
                        <div style={{width:44,height:44,borderRadius:12,background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <TreePine size={22} color="#16a34a"/>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:700,color:t.text}}>{tree.familyName||tree.name||'Unnamed Tree'}</div>
                          <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>{(tree.members||[]).length} members · {tree.country||'No location set'}</div>
                        </div>
                        <ChevronRight size={16} color={t.textFaint}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* APPEARANCE */}
            {activeSection==='appearance'&&(
              <div style={{animation:'fadeIn .4s ease'}}>
                <SectionCard title="Theme" icon={<Moon/>} t={t}>
                  <SettingRow label="Dark Mode" sub="Switch between light and dark interface" t={t}
                    right={<Toggle checked={t.dark} onChange={t.toggle} t={t}/>}/>
                </SectionCard>
                <SectionCard title="Language" icon={<Globe/>} t={t}>
                  <SettingRow label="App Language" sub="Change the interface language" t={t} onClick={()=>{}}
                    right={<span style={{fontSize:12,color:t.textMuted,fontWeight:600}}>English</span>}/>
                </SectionCard>
                <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:'20px',marginTop:16}}>
                  <h4 style={{margin:'0 0 12px',fontSize:14,fontWeight:700,color:t.text}}>Preview</h4>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    {[
                      {label:'Primary',bg:'#16a34a',text:'#fff'},
                      {label:'Background',bg:t.bg,text:t.text,border:t.border},
                      {label:'Card',bg:t.card,text:t.text,border:t.border},
                      {label:'Text',bg:'transparent',text:t.text},
                    ].map((s,i)=>(
                      <div key={i} style={{background:s.bg,border:`1px solid ${s.border||'transparent'}`,borderRadius:8,padding:'10px 12px'}}>
                        <div style={{fontSize:12,fontWeight:600,color:s.text}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}