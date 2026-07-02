// src/pages/FindMyFamily.jsx
// FIXED: full width, scrollable, keeps existing useModalStore + dataService logic

import React, { useState, useCallback } from 'react';
import {
  Search, MapPin, Globe, Users, TreePine, Send,
  CheckCircle, ArrowLeft, Filter, X, ChevronRight,
  Star, AlertCircle, Compass, Eye, UserPlus, Heart,
  BookOpen, Clock, ChevronDown
} from 'lucide-react';
import {
  collection, getDocs, addDoc, serverTimestamp, doc, getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import useModalStore from '../store/useModalStore';
import dataService from '../services/dataService';

const ALL_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","DR Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador",
  "Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico",
  "Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru",
  "Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent","Samoa","San Marino","Sao Tome",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey",
  "Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu",
  "Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const AFRICAN_TRIBES = [
  'Fulani/Peul','Bamileke','Beti','Hausa','Yoruba','Igbo','Mandinka','Wolof','Bambara',
  'Fang','Bassa','Ewondo','Douala','Bafia','Bulu','Gbaya','Tupuri','Masa','Arab-Choa',
  'Zulu','Xhosa','Shona','Akan','Ewe','Ga','Kamba','Kikuyu','Luo','Maasai','Amhara','Oromo'
];

const css = `
  *{box-sizing:border-box;}
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  .fmf-card { border-radius:16px;transition:box-shadow .2s,transform .2s; }
  .fmf-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.1)!important;transform:translateY(-2px); }
  .fmf-btn { display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .15s;font-family:inherit; }
  .fmf-btn:hover:not(:disabled){filter:brightness(.92);transform:scale(.98);}
  .fmf-btn:disabled{opacity:.5;cursor:not-allowed;}
  .fmf-skeleton { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px; }
  .fmf-input { width:100%;padding:12px 16px;font-size:14px;border-radius:12px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit; }
  .fmf-input:focus { border-color:#16a34a!important;box-shadow:0 0 0 3px rgba(22,163,74,.12)!important; }
  .fmf-select { width:100%;padding:9px 12px;border-radius:10px;outline:none;font-family:inherit;font-size:13px;cursor:pointer;appearance:none;transition:border-color .15s; }
  .fmf-select:focus { border-color:#16a34a!important; }
`;

function Avatar({ name, size=44 }) {
  const initials=name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
  const colors=['#16a34a','#2563eb','#7c3aed','#db2777','#ea580c','#0891b2'];
  const color=colors[(name?.charCodeAt(0)||0)%colors.length];
  return <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.34,fontWeight:700,color:'#fff',flexShrink:0}}>{initials}</div>;
}

function TreeDetailModal({ tree, onClose, onRequest, currentUser, t }) {
  const [requested,setRequested]=useState(false);
  const [sending,setSending]=useState(false);
  const [members,setMembers]=useState([]);

  React.useEffect(()=>{
    async function loadMembers() {
      const mems=tree.members||[];
      const loaded=await Promise.all(mems.slice(0,8).map(async m=>{
        const uid=typeof m==='string'?m:m.userId;
        try{const snap=await getDoc(doc(db,'users',uid));return snap.exists()?{uid,...snap.data()}:{uid,displayName:uid.slice(0,10)+'…'};}
        catch{return{uid,displayName:uid.slice(0,10)+'…'};}
      }));
      setMembers(loaded);
    }
    if((tree.members||[]).length>0)loadMembers();
  },[tree]);

  const handleRequest=async()=>{setSending(true);try{await onRequest(tree);setRequested(true);}finally{setSending(false);}};

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:20,backdropFilter:'blur(4px)'}}>
      <div style={{background:t.card,borderRadius:20,width:'100%',maxWidth:540,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 30px 80px rgba(0,0,0,.25)',animation:'fadeIn .25s ease'}}>
        <div style={{background:'linear-gradient(135deg,#14532d,#166534)',padding:'20px 24px',display:'flex',alignItems:'center',gap:14,borderRadius:'20px 20px 0 0',position:'sticky',top:0,zIndex:1}}>
          <div style={{width:52,height:52,borderRadius:14,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><TreePine size={26} color="#fff"/></div>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:700,color:'#fff'}}>{tree.familyName||tree.name||'Family Tree'}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.7)',marginTop:2}}>{[tree.country,tree.tribe,tree.village].filter(Boolean).join(' · ')||'Family Tree'}</div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.15)',border:'none',borderRadius:8,cursor:'pointer',padding:'6px 8px',color:'#fff',display:'flex'}}><X size={16}/></button>
        </div>
        <div style={{padding:'20px 24px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {[{icon:'👥',label:'Members',value:(tree.members||[]).length},{icon:'🌍',label:'Country',value:tree.country||'—'},{icon:'⭐',label:'Match',value:`${tree.matchScore||'—'}%`}].map((s,i)=>(
              <div key={i} style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:12,padding:'12px',textAlign:'center'}}>
                <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                <div style={{fontSize:16,fontWeight:700,color:t.text}}>{s.value}</div>
                <div style={{fontSize:11,color:t.textMuted}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
            {[tree.tribe,tree.language,tree.religion,tree.region].filter(Boolean).map((tag,i)=>(
              <span key={i} style={{fontSize:12,padding:'4px 10px',borderRadius:20,background:t.primaryBg,color:'#16a34a',border:`1px solid ${t.primaryBorder}`,fontWeight:500}}>{tag}</span>
            ))}
          </div>
          {tree.description&&<div style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:10,padding:'12px 14px',marginBottom:16,fontSize:13,color:t.textSub,lineHeight:1.6}}>{tree.description}</div>}
          {members.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:10}}>Members</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {members.map((m,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:6,background:t.bg,border:`1px solid ${t.border}`,borderRadius:20,padding:'4px 10px 4px 4px'}}>
                    <Avatar name={m.displayName||m.uid} size={22}/>
                    <span style={{fontSize:11,color:t.text,fontWeight:500}}>{m.displayName||m.uid.slice(0,8)+'…'}</span>
                  </div>
                ))}
                {(tree.members||[]).length>8&&<div style={{fontSize:12,color:t.textMuted,alignSelf:'center'}}>+{(tree.members||[]).length-8} more</div>}
              </div>
            </div>
          )}
          {requested?(
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 16px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12}}>
              <CheckCircle size={18} color="#16a34a"/>
              <span style={{fontSize:14,fontWeight:600,color:'#15803d'}}>Connection request sent! The admin will review it.</span>
            </div>
          ):(
            <div style={{display:'flex',gap:10}}>
              <button className="fmf-btn" onClick={onClose} style={{flex:1,justifyContent:'center',background:t.bg,color:t.textMuted,border:`1px solid ${t.border}`}}>Close</button>
              <button className="fmf-btn" onClick={handleRequest} disabled={sending} style={{flex:2,justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff'}}>
                {sending?<><div style={{width:13,height:13,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Sending…</>:<><Send size={14}/> Request to Join</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ tree, t, index, onViewDetails }) {
  return(
    <div className="fmf-card" onClick={()=>onViewDetails(tree)}
      style={{background:t.card,border:`1px solid ${t.border}`,boxShadow:'0 2px 8px rgba(0,0,0,.05)',padding:'20px',cursor:'pointer',animation:`fadeIn .35s ease ${index*.07}s both`}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:14}}>
        <div style={{width:52,height:52,borderRadius:14,background:t.primaryBg,border:`1.5px solid ${t.primaryBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><TreePine size={24} color="#16a34a"/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:16,fontWeight:700,color:t.text,marginBottom:4}}>{tree.familyName||tree.name||'Family Tree'}</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {tree.country&&<span style={{fontSize:12,color:t.textMuted,display:'flex',alignItems:'center',gap:3}}><Globe size={11}/>{tree.country}</span>}
            {tree.tribe&&<span style={{fontSize:12,color:t.textMuted,display:'flex',alignItems:'center',gap:3}}><Star size={11}/>{tree.tribe}</span>}
            {tree.village&&<span style={{fontSize:12,color:t.textMuted,display:'flex',alignItems:'center',gap:3}}><MapPin size={11}/>{tree.village}</span>}
          </div>
        </div>
        {tree.matchScore&&(
          <div style={{textAlign:'center',background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,borderRadius:10,padding:'6px 10px',flexShrink:0}}>
            <div style={{fontSize:18,fontWeight:800,color:'#16a34a'}}>{tree.matchScore}%</div>
            <div style={{fontSize:9,color:'#16a34a',fontWeight:600}}>MATCH</div>
          </div>
        )}
      </div>
      <div style={{display:'flex',gap:14,padding:'10px 0',borderTop:`1px solid ${t.border}`,borderBottom:`1px solid ${t.border}`,marginBottom:12}}>
        <span style={{fontSize:12,color:t.textMuted,display:'flex',alignItems:'center',gap:4}}><Users size={12}/>{(tree.members||[]).length} members</span>
        {tree.language&&<span style={{fontSize:12,color:t.textMuted,display:'flex',alignItems:'center',gap:4}}><BookOpen size={12}/>{tree.language}</span>}
        <span style={{fontSize:12,color:t.textMuted,display:'flex',alignItems:'center',gap:4}}><Clock size={12}/>Recently active</span>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button className="fmf-btn" onClick={e=>{e.stopPropagation();onViewDetails(tree);}} style={{flex:1,justifyContent:'center',background:t.bg,color:t.text,border:`1px solid ${t.border}`}}><Eye size={14}/> View Details</button>
        <button className="fmf-btn" onClick={e=>{e.stopPropagation();onViewDetails(tree);}} style={{flex:1,justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff'}}><UserPlus size={14}/> Connect</button>
      </div>
    </div>
  );
}

export default function FindMyFamily() {
  const{currentUser}=useAuth();
  const t=useTheme();
  const navigate=useNavigate();
  const{openModal}=useModalStore();

  const[query_,setQuery]=useState('');
  const[country,setCountry]=useState('');
  const[tribe,setTribe]=useState('');
  const[results,setResults]=useState([]);
  const[loading,setLoading]=useState(false);
  const[searched,setSearched]=useState(false);
  const[showFilters,setShowFilters]=useState(false);
  const[selectedTree,setSelectedTree]=useState(null);
  const[trees,setTrees]=useState([]);
  const[rootNames,setRootNames]=useState({});
  const[peopleCounts,setPeopleCounts]=useState({});

  const popularSearches=['Bamileke','Fulani','Hausa','Yoruba','Beti','Ewondo','Douala','Ngaoundéré'];

  const handleCreateTree=()=>{
    openModal('treeModal',{
      createdBy:currentUser?.uid,
      navigate,
      onSuccess:async(result)=>{
        setTrees(prev=>{
          const idx=prev.findIndex(t=>t.id===result.tree.id);
          if(idx>=0){const u=[...prev];u[idx]=result.tree;return u;}
          return [...prev,result.tree];
        });
        if(result.tree.currentRootId){
          try{const person=await dataService.getPerson(result.tree.currentRootId);setRootNames(prev=>({...prev,[result.tree.id]:person?person.name:'Unknown'}));}
          catch{setRootNames(prev=>({...prev,[result.tree.id]:'Unknown'}));}
        }else{setRootNames(prev=>({...prev,[result.tree.id]:'No Root'}));}
        try{const people=await dataService.getPeopleByTreeId(result.tree.id);setPeopleCounts(prev=>({...prev,[result.tree.id]:people.length}));}
        catch{setPeopleCounts(prev=>({...prev,[result.tree.id]:0}));}
        if(result.tree&&result.rootPerson){
          const treeId=result.tree.id||result.tree._id||null;
          const rootPersonId=result.rootPerson.id||result.rootPerson._id||null;
          if(treeId&&rootPersonId)navigate(`/family-tree/${treeId}?root=${rootPersonId}`);
        }
      }
    });
  };

  const handleSearch=useCallback(async()=>{
    setLoading(true);setSearched(true);
    try{
      const snap=await getDocs(collection(db,'trees'));
      const allTrees=snap.docs.map(d=>({id:d.id,...d.data()}));
      const q=query_.toLowerCase().trim();
      const filtered=allTrees.filter(tree=>{
        if((tree.members||[]).some(m=>{const uid=typeof m==='string'?m:m.userId;return uid===currentUser?.uid;}))return false;
        const name=(tree.familyName||tree.name||'').toLowerCase();
        const tribeVal=(tree.tribe||'').toLowerCase();
        const countryVal=(tree.country||tree.origin||'').toLowerCase();
        const village=(tree.village||'').toLowerCase();
        const lang=(tree.language||'').toLowerCase();
        const desc=(tree.description||'').toLowerCase();
        const matchQ=!q||name.includes(q)||tribeVal.includes(q)||village.includes(q)||lang.includes(q)||desc.includes(q);
        const matchC=!country||countryVal.includes(country.toLowerCase());
        const matchT=!tribe||tribeVal.includes(tribe.toLowerCase());
        return matchQ&&matchC&&matchT;
      });
      const scored=filtered.map(tree=>{
        let score=30;
        const q_=query_.toLowerCase();
        const name=(tree.familyName||tree.name||'').toLowerCase();
        const tribeVal=(tree.tribe||'').toLowerCase();
        if(name.includes(q_))score+=35;
        if(tribeVal.includes(q_))score+=25;
        if((tree.country||'').toLowerCase().includes(q_))score+=15;
        if(country&&(tree.country||'').toLowerCase().includes(country.toLowerCase()))score+=20;
        if(tribe&&tribeVal.includes(tribe.toLowerCase()))score+=20;
        return{...tree,matchScore:Math.min(score+Math.floor(Math.random()*10),99)};
      }).sort((a,b)=>b.matchScore-a.matchScore);
      setResults(scored);
    }catch(err){console.error('Search error:',err);setResults([]);}
    finally{setLoading(false);}
  },[query_,country,tribe,currentUser]);

  const handleRequest=async(tree)=>{
    await addDoc(collection(db,'mergeRequests'),{
      fromUserId:currentUser.uid,
      fromName:currentUser.displayName||currentUser.email?.split('@')[0]||'User',
      fromEmail:currentUser.email||'',
      toTreeId:tree.id,
      toTreeName:tree.familyName||tree.name||'Family Tree',
      toAdminId:tree.createdBy||null,
      status:'pending',
      message:`${currentUser.displayName||'A user'} found your tree via Find My Family and would like to connect.`,
      createdAt:serverTimestamp(),
    });
  };

  return(
    <>
      <style>{css}</style>
      {/* KEY FIX: 100vw full width, flex column, overflow-y auto for scrolling */}
      <div style={{width:'100%',minHeight:'100vh',background:t.bg,display:'flex',flexDirection:'column',overflowY:'auto',transition:'background .3s'}}>

        {/* Hero — 100% width */}
        <div style={{width:'100%',background:'linear-gradient(135deg,#0a3d1f 0%,#14532d 50%,#166534 100%)',padding:'40px 40px 56px',position:'relative',overflow:'hidden',flexShrink:0}}>
          {[{top:-60,right:-60,size:240},{top:20,right:200,size:120},{bottom:-80,right:80,size:200}].map((d,i)=>(
            <div key={i} style={{position:'absolute',top:d.top,bottom:d.bottom,right:d.right,width:d.size,height:d.size,borderRadius:'50%',background:'rgba(255,255,255,.04)',pointerEvents:'none'}}/>
          ))}
          <div style={{position:'relative'}}>
            <button onClick={()=>navigate(-1)} style={{background:'rgba(255,255,255,.15)',border:'none',borderRadius:10,cursor:'pointer',padding:'8px 12px',color:'#fff',display:'flex',alignItems:'center',gap:6,fontSize:13,fontFamily:'inherit',marginBottom:24}}>
              <ArrowLeft size={16}/> Back
            </button>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
              <div style={{width:56,height:56,borderRadius:16,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Compass size={28} color="#fff"/></div>
              <div>
                <h1 style={{margin:0,fontSize:28,fontWeight:800,color:'#fff',letterSpacing:'-.02em'}}>Find My Family</h1>
                <p style={{margin:'4px 0 0',fontSize:13,color:'rgba(255,255,255,.65)'}}>Search for your family tree by name, tribe, village or country</p>
              </div>
            </div>
            {/* Search bar */}
            <div style={{background:'rgba(255,255,255,.12)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.2)',borderRadius:16,padding:16}}>
              <div style={{display:'flex',gap:10,marginBottom:showFilters?12:0}}>
                <div style={{position:'relative',flex:1}}>
                  <Search size={16} color="rgba(255,255,255,.6)" style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                  <input className="fmf-input" placeholder="Family name, tribe, village, language…" value={query_}
                    onChange={e=>setQuery(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter')handleSearch();}}
                    style={{paddingLeft:42,background:'rgba(255,255,255,.15)',border:'1.5px solid rgba(255,255,255,.2)',color:'#fff'}}/>
                </div>
                <button className="fmf-btn" onClick={()=>setShowFilters(f=>!f)}
                  style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.2)'}}>
                  <Filter size={15}/>{showFilters?'Hide':'Filters'}{(country||tribe)?' ✓':''}
                </button>
                <button className="fmf-btn" onClick={handleSearch} disabled={loading}
                  style={{background:'#fff',color:'#14532d',fontWeight:700,padding:'9px 22px'}}>
                  {loading?<div style={{width:14,height:14,border:'2px solid #14532d',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>:<><Search size={15}/> Search</>}
                </button>
              </div>
              {showFilters&&(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,animation:'slideDown .2s ease'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.6)',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.05em'}}>Country</div>
                    <div style={{position:'relative'}}>
                      <Globe size={13} color="rgba(255,255,255,.5)" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                      <select className="fmf-select" value={country} onChange={e=>setCountry(e.target.value)}
                        style={{paddingLeft:30,background:'rgba(255,255,255,.15)',border:'1.5px solid rgba(255,255,255,.2)',color:'#fff'}}>
                        <option value="" style={{color:'#111'}}>All countries ({ALL_COUNTRIES.length})</option>
                        {ALL_COUNTRIES.map(c=><option key={c} value={c} style={{color:'#111'}}>{c}</option>)}
                      </select>
                      <ChevronDown size={13} color="rgba(255,255,255,.5)" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.6)',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.05em'}}>Tribe / Ethnic Group</div>
                    <div style={{position:'relative'}}>
                      <Star size={13} color="rgba(255,255,255,.5)" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                      <select className="fmf-select" value={tribe} onChange={e=>setTribe(e.target.value)}
                        style={{paddingLeft:30,background:'rgba(255,255,255,.15)',border:'1.5px solid rgba(255,255,255,.2)',color:'#fff'}}>
                        <option value="" style={{color:'#111'}}>All tribes</option>
                        {AFRICAN_TRIBES.map(tr=><option key={tr} value={tr} style={{color:'#111'}}>{tr}</option>)}
                      </select>
                      <ChevronDown size={13} color="rgba(255,255,255,.5)" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Popular tags */}
            <div style={{marginTop:14,display:'flex',gap:8,flexWrap:'wrap'}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,.6)',alignSelf:'center'}}>Popular:</span>
              {popularSearches.map(s=>(
                <button key={s} onClick={()=>setQuery(s)}
                  style={{background:'rgba(255,255,255,.12)',color:'rgba(255,255,255,.85)',border:'1px solid rgba(255,255,255,.15)',borderRadius:20,padding:'4px 12px',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results — full width, no max-width cap */}
        <div style={{flex:1,width:'100%',padding:'24px 40px 48px'}}>
          {/* Active filters */}
          {(country||tribe)&&(
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {country&&<span style={{display:'flex',alignItems:'center',gap:6,fontSize:12,background:t.primaryBg,color:'#16a34a',border:`1px solid ${t.primaryBorder}`,borderRadius:20,padding:'4px 10px',fontWeight:600}}>
                <Globe size={11}/>{country}<button onClick={()=>setCountry('')} style={{background:'none',border:'none',cursor:'pointer',color:'#16a34a',padding:0,display:'flex'}}><X size={12}/></button>
              </span>}
              {tribe&&<span style={{display:'flex',alignItems:'center',gap:6,fontSize:12,background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe',borderRadius:20,padding:'4px 10px',fontWeight:600}}>
                <Star size={11}/>{tribe}<button onClick={()=>setTribe('')} style={{background:'none',border:'none',cursor:'pointer',color:'#2563eb',padding:0,display:'flex'}}><X size={12}/></button>
              </span>}
            </div>
          )}

          {/* Results header */}
          {searched&&!loading&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,padding:'12px 16px',background:t.card,border:`1px solid ${t.border}`,borderRadius:12,animation:'fadeIn .3s ease'}}>
              <span style={{fontSize:14,fontWeight:700,color:t.text}}>
                {results.length===0?'No results found':`${results.length} family tree${results.length!==1?'s':''} found`}
              </span>
              <button className="fmf-btn" onClick={()=>{setSearched(false);setResults([]);setQuery('');setCountry('');setTribe('');}}
                style={{background:t.bg,color:t.textMuted,border:`1px solid ${t.border}`,padding:'6px 12px'}}>
                <X size={13}/> Clear
              </button>
            </div>
          )}

          {/* Loading */}
          {loading&&(
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:20}}>
                  <div style={{display:'flex',gap:14,marginBottom:16}}>
                    <div className="fmf-skeleton" style={{width:52,height:52,borderRadius:14,flexShrink:0}}/>
                    <div style={{flex:1}}><div className="fmf-skeleton" style={{height:16,width:'50%',marginBottom:8}}/><div className="fmf-skeleton" style={{height:11,width:'70%'}}/></div>
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <div className="fmf-skeleton" style={{flex:1,height:38,borderRadius:10}}/>
                    <div className="fmf-skeleton" style={{flex:1,height:38,borderRadius:10}}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results grid — 2 columns on wide screens */}
          {!loading&&results.length>0&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))',gap:16}}>
              {results.map((tree,i)=>(
                <ResultCard key={tree.id} tree={tree} t={t} index={i} onViewDetails={setSelectedTree}/>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading&&searched&&results.length===0&&(
            <div style={{background:t.card,border:`2px dashed ${t.border}`,borderRadius:20,padding:'56px 24px',textAlign:'center',animation:'fadeIn .4s ease'}}>
              <div style={{width:72,height:72,borderRadius:20,background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}><Search size={32} color="#16a34a"/></div>
              <h3 style={{margin:'0 0 8px',fontSize:18,fontWeight:700,color:t.text}}>No family trees found</h3>
              <p style={{margin:'0 0 20px',fontSize:13,color:t.textMuted,lineHeight:1.7,maxWidth:360,marginLeft:'auto',marginRight:'auto'}}>Try different keywords, or create your own tree!</p>
              <button className="fmf-btn" onClick={handleCreateTree} style={{background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',padding:'11px 24px',fontSize:14}}>
                <TreePine size={16}/> Create My Family Tree
              </button>
            </div>
          )}

          {/* How it works */}
          {!searched&&!loading&&(
            <div>
              <h3 style={{margin:'0 0 14px',fontSize:15,fontWeight:700,color:t.text}}>How it works</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:20}}>
                {[
                  {icon:'🔍',title:'Search',desc:'Enter your family name, tribe, village or country'},
                  {icon:'🌳',title:'Discover',desc:'Browse matching family trees from the community'},
                  {icon:'📩',title:'Connect',desc:'Send a connection request to the tree admin'},
                  {icon:'👨‍👩‍👧‍👦',title:'Reunite',desc:'Join your family tree once approved'},
                ].map((step,i)=>(
                  <div key={i} className="fmf-card" style={{background:t.card,border:`1px solid ${t.border}`,padding:18,animation:`fadeIn .4s ease ${i*.1}s both`}}>
                    <div style={{fontSize:28,marginBottom:10}}>{step.icon}</div>
                    <div style={{fontSize:14,fontWeight:700,color:t.text,marginBottom:4}}>{step.title}</div>
                    <div style={{fontSize:12,color:t.textMuted,lineHeight:1.6}}>{step.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:'14px 18px',display:'flex',gap:10,alignItems:'flex-start'}}>
                <AlertCircle size={15} color="#d97706" style={{flexShrink:0,marginTop:1}}/>
                <p style={{margin:0,fontSize:12,color:t.textMuted,lineHeight:1.7}}>Only public family trees are searchable. Tree administrators control who can join. Your personal data is never shared without consent.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTree&&<TreeDetailModal tree={selectedTree} onClose={()=>setSelectedTree(null)} onRequest={handleRequest} currentUser={currentUser} t={t}/>}
    </>
  );
}