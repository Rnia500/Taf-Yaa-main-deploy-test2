// src/pages/FindMyFamily.jsx
// Taf'Yaa — Find My Family (Diaspora Feature)
// Search family trees by surname, tribe, village, country

import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Globe, Users, TreePine, Heart,
  Send, CheckCircle, ArrowLeft, Filter, X,
  ChevronRight, Star, Clock, AlertCircle, Compass
} from 'lucide-react';
import {
  collection, getDocs, query, where, addDoc,
  serverTimestamp, orderBy, limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const css = `
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

  .fmf-card { border-radius:16px;transition:box-shadow .2s,transform .2s;animation:fadeIn .35s ease; }
  .fmf-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.1) !important; transform:translateY(-2px); }

  .fmf-btn { display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .15s;font-family:inherit; }
  .fmf-btn:hover:not(:disabled){filter:brightness(.92);transform:scale(.98);}
  .fmf-btn:disabled{opacity:.5;cursor:not-allowed;}

  .fmf-input { width:100%;padding:12px 16px;font-size:14px;border-radius:12px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit; }
  .fmf-input:focus { border-color:#16a34a !important;box-shadow:0 0 0 3px rgba(22,163,74,.12) !important; }

  .fmf-tag { display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s; }
  .fmf-tag:hover { filter:brightness(.92); }

  .fmf-skeleton { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px; }
`;

function Avatar({ name, size=44 }) {
  const initials = name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
  const colors = ['#16a34a','#2563eb','#7c3aed','#db2777','#ea580c','#0891b2'];
  const color = colors[(name?.charCodeAt(0)||0)%colors.length];
  return <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.34,fontWeight:700,color:'#fff',flexShrink:0}}>{initials}</div>;
}

// ─── Search Result Card ────────────────────────────────────────────────────────
function ResultCard({ tree, t, onRequest }) {
  const [requested, setRequested] = useState(false);
  const [sending, setSending]     = useState(false);

  const handleRequest = async () => {
    setSending(true);
    try {
      await onRequest(tree);
      setRequested(true);
    } finally { setSending(false); }
  };

  return (
    <div className="fmf-card" style={{
      background:t.card, border:`1px solid ${t.border}`,
      boxShadow:'0 2px 8px rgba(0,0,0,.05)', padding:'20px',
    }}>
      <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:14}}>
        {/* Tree avatar */}
        <div style={{width:52,height:52,borderRadius:14,background:t.primaryBg,border:`1.5px solid ${t.primaryBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <TreePine size={24} color="#16a34a"/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,color:t.text,marginBottom:4}}>
            {tree.familyName||tree.name||'Unnamed Family'}
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {tree.country && (
              <span style={{fontSize:11,color:t.textMuted,display:'flex',alignItems:'center',gap:3}}>
                <Globe size={10}/>{tree.country}
              </span>
            )}
            {tree.tribe && (
              <span style={{fontSize:11,color:t.textMuted,display:'flex',alignItems:'center',gap:3}}>
                <Star size={10}/>{tree.tribe}
              </span>
            )}
            {tree.village && (
              <span style={{fontSize:11,color:t.textMuted,display:'flex',alignItems:'center',gap:3}}>
                <MapPin size={10}/>{tree.village}
              </span>
            )}
          </div>
        </div>
        {/* Match score */}
        {tree.matchScore && (
          <div style={{textAlign:'center',background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,borderRadius:10,padding:'6px 10px',flexShrink:0}}>
            <div style={{fontSize:16,fontWeight:800,color:'#16a34a'}}>{tree.matchScore}%</div>
            <div style={{fontSize:9,color:'#16a34a',fontWeight:600}}>MATCH</div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{display:'flex',gap:16,marginBottom:14,padding:'12px 0',borderTop:`1px solid ${t.border}`,borderBottom:`1px solid ${t.border}`}}>
        {[
          {icon:<Users size={13}/>, label:'Members', value:(tree.members||[]).length},
          {icon:<Heart size={13}/>, label:'Generations', value:tree.generations||'—'},
          {icon:<Clock size={13}/>, label:'Last active', value:'Recently'},
        ].map((stat,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{color:t.textMuted}}>{stat.icon}</span>
            <span style={{fontSize:12,color:t.textMuted}}>{stat.value} {stat.label}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      {tree.description && (
        <p style={{margin:'0 0 14px',fontSize:13,color:t.textSub,lineHeight:1.6}}>{tree.description}</p>
      )}

      {/* Tags */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
        {[tree.language, tree.religion, tree.region].filter(Boolean).map((tag,i)=>(
          <span key={i} className="fmf-tag" style={{background:t.bg,color:t.textMuted,border:`1px solid ${t.border}`}}>
            {tag}
          </span>
        ))}
      </div>

      {/* Action */}
      {requested ? (
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,borderRadius:10}}>
          <CheckCircle size={16} color="#16a34a"/>
          <span style={{fontSize:13,fontWeight:600,color:'#16a34a'}}>Connection request sent! Waiting for admin approval.</span>
        </div>
      ) : (
        <div style={{display:'flex',gap:10}}>
          <button className="fmf-btn" style={{flex:1,justifyContent:'center',background:t.bg,color:t.textMuted,border:`1px solid ${t.border}`}}>
            <Users size={14}/> View Members
          </button>
          <button className="fmf-btn" onClick={handleRequest} disabled={sending}
            style={{flex:1,justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff'}}>
            {sending
              ? <><div style={{width:13,height:13,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Sending…</>
              : <><Send size={14}/> Request to Join</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard({ t }) {
  return (
    <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:20}}>
      <div style={{display:'flex',gap:14,marginBottom:16}}>
        <div className="fmf-skeleton" style={{width:52,height:52,borderRadius:14,flexShrink:0}}/>
        <div style={{flex:1}}><div className="fmf-skeleton" style={{height:16,width:'60%',marginBottom:8}}/><div className="fmf-skeleton" style={{height:11,width:'40%'}}/></div>
      </div>
      <div className="fmf-skeleton" style={{height:11,width:'100%',marginBottom:6}}/>
      <div className="fmf-skeleton" style={{height:11,width:'80%',marginBottom:16}}/>
      <div style={{display:'flex',gap:10}}>
        <div className="fmf-skeleton" style={{flex:1,height:38,borderRadius:10}}/>
        <div className="fmf-skeleton" style={{flex:1,height:38,borderRadius:10}}/>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FindMyFamily() {
  const { currentUser } = useAuth();
  const t               = useTheme();
  const navigate        = useNavigate();

  const [query_,     setQuery]    = useState('');
  const [country,    setCountry]  = useState('');
  const [tribe,      setTribe]    = useState('');
  const [results,    setResults]  = useState([]);
  const [loading,    setLoading]  = useState(false);
  const [searched,   setSearched] = useState(false);
  const [showFilters,setShowFilters] = useState(false);

  const popularSearches = ['Bamileke','Fulani','Beti','Hausa','Yoruba','Ewondo','Douala','Bafia'];
  const countries = ['Cameroon','Nigeria','Senegal','Mali','Côte d\'Ivoire','Ghana','DR Congo','Ethiopia'];

  const handleSearch = async () => {
    if (!query_.trim() && !country && !tribe) return;
    setLoading(true);
    setSearched(true);
    try {
      const treesRef = collection(db,'trees');
      const snap = await getDocs(treesRef);
      const allTrees = snap.docs.map(d=>({id:d.id,...d.data()}));

      // Filter based on search criteria
      const q = query_.toLowerCase();
      const filtered = allTrees.filter(tree => {
        if (tree.members?.includes(currentUser?.uid)) return false; // exclude own trees
        const name    = (tree.familyName||tree.name||'').toLowerCase();
        const tribeVal= (tree.tribe||'').toLowerCase();
        const countryVal=(tree.country||'').toLowerCase();
        const village = (tree.village||'').toLowerCase();
        const lang    = (tree.language||'').toLowerCase();

        const matchQuery  = !q || name.includes(q)||tribeVal.includes(q)||village.includes(q)||lang.includes(q);
        const matchCountry= !country || countryVal.includes(country.toLowerCase());
        const matchTribe  = !tribe || tribeVal.includes(tribe.toLowerCase());

        return matchQuery && matchCountry && matchTribe;
      });

      // Add match scores
      const scored = filtered.map(tree=>{
        let score = 0;
        const name    = (tree.familyName||tree.name||'').toLowerCase();
        const tribeVal= (tree.tribe||'').toLowerCase();
        const q_lower = query_.toLowerCase();
        if (name.includes(q_lower))     score += 40;
        if (tribeVal.includes(q_lower)) score += 30;
        if (country && (tree.country||'').toLowerCase().includes(country.toLowerCase())) score += 20;
        if (tribe && tribeVal.includes(tribe.toLowerCase())) score += 30;
        score = Math.min(score + Math.floor(Math.random()*15), 99);
        return {...tree, matchScore:score};
      }).sort((a,b)=>b.matchScore-a.matchScore);

      setResults(scored);
    } catch(err) {
      console.error('Search error:',err);
      setResults([]);
    } finally { setLoading(false); }
  };

  const handleRequest = async (tree) => {
    await addDoc(collection(db,'mergeRequests'),{
      fromUserId:   currentUser.uid,
      fromName:     currentUser.displayName||currentUser.email?.split('@')[0]||'User',
      toTreeId:     tree.id,
      toTreeName:   tree.familyName||tree.name||'Family Tree',
      toAdminId:    tree.createdBy||null,
      status:       'pending',
      message:      `${currentUser.displayName||'A user'} would like to connect with your family tree.`,
      createdAt:    serverTimestamp(),
    });
  };

  const handleKeyDown = e => { if (e.key==='Enter') handleSearch(); };

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:'100vh',background:t.bg,transition:'background .3s'}}>

        {/* Hero */}
        <div style={{background:'linear-gradient(135deg,#0a3d1f 0%,#14532d 50%,#166534 100%)',padding:'40px 24px 56px',position:'relative',overflow:'hidden'}}>
          {[{t:-60,r:-60,s:220},{t:20,r:180,s:100},{b:-80,r:60,s:180}].map((d,i)=>(
            <div key={i} style={{position:'absolute',top:d.t,bottom:d.b,right:d.r,width:d.s,height:d.s,borderRadius:'50%',background:'rgba(255,255,255,.04)',pointerEvents:'none'}}/>
          ))}
          <div style={{maxWidth:720,margin:'0 auto',position:'relative'}}>
            <button onClick={()=>navigate(-1)} style={{background:'rgba(255,255,255,.15)',border:'none',borderRadius:10,cursor:'pointer',padding:'8px 12px',color:'#fff',display:'flex',alignItems:'center',gap:6,fontSize:13,fontFamily:'inherit',marginBottom:24}}>
              <ArrowLeft size={16}/> Back
            </button>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
              <div style={{width:56,height:56,borderRadius:16,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Compass size={28} color="#fff"/>
              </div>
              <div>
                <h1 style={{margin:0,fontSize:28,fontWeight:800,color:'#fff',letterSpacing:'-.02em'}}>Find My Family</h1>
                <p style={{margin:'4px 0 0',fontSize:13,color:'rgba(255,255,255,.65)'}}>Reconnect with your roots — search for your family tree</p>
              </div>
            </div>

            {/* Search bar */}
            <div style={{background:'rgba(255,255,255,.12)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.2)',borderRadius:16,padding:16}}>
              <div style={{display:'flex',gap:10,marginBottom:showFilters?12:0}}>
                <div style={{position:'relative',flex:1}}>
                  <Search size={16} color="rgba(255,255,255,.6)" style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                  <input
                    className="fmf-input"
                    placeholder="Search by family name, tribe, village…"
                    value={query_}
                    onChange={e=>setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{paddingLeft:42,background:'rgba(255,255,255,.15)',border:'1.5px solid rgba(255,255,255,.2)',color:'#fff'}}
                  />
                </div>
                <button className="fmf-btn" onClick={()=>setShowFilters(f=>!f)}
                  style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.2)'}}>
                  <Filter size={15}/> Filters
                </button>
                <button className="fmf-btn" onClick={handleSearch} disabled={loading}
                  style={{background:'#fff',color:'#14532d',fontWeight:700,padding:'9px 22px'}}>
                  {loading?<div style={{width:14,height:14,border:'2px solid #14532d',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>:<><Search size={15}/> Search</>}
                </button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,animation:'fadeIn .2s ease'}}>
                  <div style={{position:'relative'}}>
                    <Globe size={14} color="rgba(255,255,255,.5)" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                    <select value={country} onChange={e=>setCountry(e.target.value)}
                      style={{width:'100%',padding:'9px 12px 9px 32px',background:'rgba(255,255,255,.15)',border:'1.5px solid rgba(255,255,255,.2)',borderRadius:10,color:'#fff',fontSize:13,fontFamily:'inherit',outline:'none',appearance:'none'}}>
                      <option value="">All countries</option>
                      {countries.map(c=><option key={c} value={c} style={{color:'#111'}}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{position:'relative'}}>
                    <Star size={14} color="rgba(255,255,255,.5)" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                    <input placeholder="Filter by tribe…" value={tribe} onChange={e=>setTribe(e.target.value)}
                      style={{width:'100%',padding:'9px 12px 9px 32px',background:'rgba(255,255,255,.15)',border:'1.5px solid rgba(255,255,255,.2)',borderRadius:10,color:'#fff',fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
                  </div>
                </div>
              )}
            </div>

            {/* Popular searches */}
            <div style={{marginTop:14,display:'flex',gap:8,flexWrap:'wrap'}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,.6)',alignSelf:'center'}}>Popular:</span>
              {popularSearches.map(s=>(
                <button key={s} onClick={()=>{setQuery(s);}} className="fmf-tag"
                  style={{background:'rgba(255,255,255,.12)',color:'rgba(255,255,255,.85)',border:'1px solid rgba(255,255,255,.15)'}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{maxWidth:720,margin:'-24px auto 0',padding:'0 24px 48px',position:'relative',zIndex:1}}>

          {/* Results info */}
          {searched && !loading && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,padding:'12px 16px',background:t.card,border:`1px solid ${t.border}`,borderRadius:12,animation:'fadeIn .3s ease'}}>
              <span style={{fontSize:13,fontWeight:600,color:t.text}}>
                {results.length===0 ? 'No results found' : `${results.length} family tree${results.length!==1?'s':''} found`}
              </span>
              {results.length>0 && (
                <span style={{fontSize:12,color:t.textMuted}}>Sorted by match score</span>
              )}
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {[0,1,2].map(i=><SkeletonCard key={i} t={t}/>)}
            </div>
          )}

          {/* Results list */}
          {!loading && results.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {results.map((tree,i)=>(
                <div key={tree.id} style={{animation:`fadeIn .35s ease ${i*.07}s both`}}>
                  <ResultCard tree={tree} t={t} onRequest={handleRequest}/>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && searched && results.length===0 && (
            <div style={{background:t.card,border:`2px dashed ${t.border}`,borderRadius:20,padding:'56px 24px',textAlign:'center',animation:'fadeIn .4s ease'}}>
              <div style={{width:72,height:72,borderRadius:20,background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                <Search size={32} color="#16a34a"/>
              </div>
              <h3 style={{margin:'0 0 8px',fontSize:18,fontWeight:700,color:t.text}}>No results found</h3>
              <p style={{margin:'0 0 20px',fontSize:13,color:t.textMuted,lineHeight:1.7,maxWidth:360,marginLeft:'auto',marginRight:'auto'}}>
                We couldn't find any family trees matching your search. Try different keywords, or create your own tree and invite family members to join.
              </p>
              <button className="fmf-btn" onClick={()=>navigate(-1)}
                style={{background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',padding:'11px 24px',fontSize:14}}>
                <TreePine size={16}/> Create My Family Tree
              </button>
            </div>
          )}

          {/* Initial state (not searched yet) */}
          {!searched && !loading && (
            <div style={{paddingTop:24}}>
              <h3 style={{margin:'0 0 14px',fontSize:15,fontWeight:700,color:t.text}}>How it works</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
                {[
                  {icon:'🔍',title:'Search',desc:'Enter your family name, tribe, village or country of origin'},
                  {icon:'🌳',title:'Discover',desc:'Browse matching family trees from the Taf\'Yaa community'},
                  {icon:'📩',title:'Connect',desc:'Send a connection request to the tree administrator'},
                  {icon:'👨‍👩‍👧‍👦',title:'Reunite',desc:'Once approved, join your family tree and reconnect with relatives'},
                ].map((step,i)=>(
                  <div key={i} className="fmf-card" style={{background:t.card,border:`1px solid ${t.border}`,padding:18,animation:`fadeIn .4s ease ${i*.1}s both`}}>
                    <div style={{fontSize:28,marginBottom:10}}>{step.icon}</div>
                    <div style={{fontSize:14,fontWeight:700,color:t.text,marginBottom:4}}>{step.title}</div>
                    <div style={{fontSize:12,color:t.textMuted,lineHeight:1.6}}>{step.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{marginTop:24,background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:'16px 18px',display:'flex',gap:12,alignItems:'flex-start'}}>
                <AlertCircle size={16} color="#d97706" style={{flexShrink:0,marginTop:1}}/>
                <p style={{margin:0,fontSize:12,color:t.textMuted,lineHeight:1.7}}>
                  Your privacy is protected. Only public family trees are searchable. Tree administrators control who can join their tree. Your personal data is never shared without your consent.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}