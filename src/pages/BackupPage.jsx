import React, { useState, useEffect, useCallback } from 'react';
import {
  GitCommit, GitBranch, Plus, Download, RotateCcw,
  Trash2, Search, Filter, RefreshCw, HardDrive,
  Clock, Calendar, Shield, Info, X, Check,
  AlertTriangle, ChevronDown, ArrowLeft, Database,
  CheckCircle, Archive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { backupService } from '../services/backupService';

const css = `
  *{box-sizing:border-box;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes bar{from{width:0}to{width:100%}}

  .bp-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .15s;font-family:inherit;}
  .bp-btn:hover:not(:disabled){filter:brightness(.92);transform:scale(.98);}
  .bp-btn:disabled{opacity:.5;cursor:not-allowed;}
  .bp-input{width:100%;padding:10px 14px;font-size:13px;border-radius:10px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit;}
  .bp-input:focus{border-color:#16a34a!important;box-shadow:0 0 0 3px rgba(22,163,74,.12)!important;}
  .bp-textarea{width:100%;padding:10px 14px;font-size:13px;border-radius:10px;outline:none;resize:vertical;min-height:68px;box-sizing:border-box;font-family:inherit;transition:border-color .15s;}
  .bp-textarea:focus{border-color:#16a34a!important;}
  .bp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;backdrop-filter:blur(4px);}
  .bp-modal{background:#fff;border-radius:20px;width:100%;max-width:500px;box-shadow:0 30px 80px rgba(0,0,0,.25);animation:slideUp .25s ease;overflow:hidden;}
  .bp-entry{border-radius:14px;transition:box-shadow .2s,border-color .2s;cursor:pointer;}
  .bp-entry:hover{box-shadow:0 4px 20px rgba(0,0,0,.08)!important;}
  .bp-skel{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:6px;}
`;

const fmt={
  size:b=>!b?'—':b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(1)}KB`:`${(b/1048576).toFixed(2)}MB`,
  date:d=>new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),
  dateShort:d=>new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'long'}),
  year:d=>new Date(d).getFullYear(),
  ago:d=>{const s=Math.floor((Date.now()-new Date(d))/1000);if(s<60)return'Just now';if(s<3600)return`${Math.floor(s/60)}m ago`;if(s<86400)return`${Math.floor(s/3600)}h ago`;if(s<604800)return`${Math.floor(s/86400)}d ago`;return fmt.date(d);},
};

const getName=b=>b.customName||fmt.date(b.lastModified);
const getType=b=>b.backupType||'manual';
const getYear=b=>fmt.year(b.lastModified);

function groupByYear(backups){
  const g={};
  backups.forEach(b=>{const y=getYear(b);(g[y]=g[y]||[]).push(b);});
  return Object.entries(g).sort((a,b)=>b[0]-a[0]);
}

function Badge({type,isLatest}){
  const map={
    latest:['#f0fdf4','#16a34a','#bbf7d0','🟢 Latest'],
    automatic:['#eff6ff','#2563eb','#bfdbfe','🔵 Automatic'],
    manual:['#f5f3ff','#7c3aed','#ddd6fe','🟣 Manual'],
    archived:['#fffbeb','#d97706','#fde68a','🟡 Archived'],
  };
  const[bg,color,border,label]=isLatest?map.latest:(map[type]||map.manual);
  return <span style={{fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:20,background:bg,color,border:`1px solid ${border}`,whiteSpace:'nowrap'}}>{label}</span>;
}

function ProgressBar({label,t}){
  return(
    <div style={{background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,borderRadius:12,padding:'13px 16px',marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
        <div style={{width:15,height:15,border:'2px solid #16a34a',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>
        <span style={{fontSize:13,fontWeight:600,color:'#15803d'}}>{label}</span>
      </div>
      <div style={{background:'#dcfce7',borderRadius:20,height:5,overflow:'hidden'}}>
        <div style={{height:'100%',background:'linear-gradient(90deg,#16a34a,#22c55e)',borderRadius:20,animation:'bar 4s ease forwards'}}/>
      </div>
    </div>
  );
}

function Alert({type,message,onClose}){
  const map={success:{bg:'#f0fdf4',border:'#86efac',icon:'#16a34a',text:'#15803d',Icon:CheckCircle},error:{bg:'#fef2f2',border:'#fca5a5',icon:'#dc2626',text:'#b91c1c',Icon:AlertTriangle}}[type]||{};
  const{Icon}=map;
  return(
    <div style={{display:'flex',alignItems:'flex-start',gap:12,background:map.bg,border:`1px solid ${map.border}`,borderRadius:12,padding:'12px 16px',marginBottom:20,animation:'fadeIn .3s ease'}}>
      {Icon&&<Icon size={17} color={map.icon} style={{marginTop:1,flexShrink:0}}/>}
      <span style={{fontSize:13,color:map.text,flex:1,lineHeight:1.6}}>{message}</span>
      {onClose&&<button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:map.icon,padding:0,fontSize:18,lineHeight:1}}>×</button>}
    </div>
  );
}

function CreateModal({onConfirm,onCancel,loading,t}){
  const[name,setName]=useState('');
  const[desc,setDesc]=useState('');
  const[type,setType]=useState('manual');
  const def=`Backup · ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}`;
  return(
    <div className="bp-overlay">
      <div className="bp-modal">
        <div style={{background:'linear-gradient(135deg,#14532d,#166534)',padding:'20px 22px',display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:40,height:40,borderRadius:12,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center'}}><Archive size={20} color="#fff"/></div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,color:'#fff'}}>Create Backup</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.65)'}}>Save current state of your family data</div>
          </div>
          <button onClick={onCancel} style={{background:'rgba(255,255,255,.15)',border:'none',borderRadius:8,cursor:'pointer',padding:'6px 8px',color:'#fff',display:'flex'}}><X size={15}/></button>
        </div>
        <div style={{padding:'20px 22px'}}>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:5}}>Backup Name</label>
            <input className="bp-input" placeholder={def} value={name} onChange={e=>setName(e.target.value)} maxLength={80}
              style={{border:'1.5px solid #e5e7eb',background:'#fff',color:'#111827'}}/>
            <p style={{margin:'4px 0 0',fontSize:11,color:'#9ca3af'}}>Leave empty to use date automatically</p>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:5}}>Description <span style={{color:'#9ca3af',fontWeight:400}}>(optional)</span></label>
            <textarea className="bp-textarea" placeholder="e.g. Before adding the Maroua branch…" value={desc} onChange={e=>setDesc(e.target.value)} maxLength={200}
              style={{border:'1.5px solid #e5e7eb',background:'#fff',color:'#111827'}}/>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:8}}>Backup Type</label>
            <div style={{display:'flex',gap:10}}>
              {[{id:'manual',label:'Manual',desc:'Created by you',icon:'🟣'},{id:'automatic',label:'Automatic',desc:'Scheduled',icon:'🔵'}].map(tp=>(
                <div key={tp.id} onClick={()=>setType(tp.id)}
                  style={{flex:1,padding:'10px 12px',borderRadius:10,cursor:'pointer',border:`1.5px solid ${type===tp.id?'#16a34a':'#e5e7eb'}`,background:type===tp.id?'#f0fdf4':'#fff',transition:'all .15s'}}>
                  <div style={{fontSize:15,marginBottom:2}}>{tp.icon}</div>
                  <div style={{fontSize:13,fontWeight:600,color:type===tp.id?'#16a34a':'#374151'}}>{tp.label}</div>
                  <div style={{fontSize:11,color:'#9ca3af'}}>{tp.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:10,padding:'11px 14px',marginBottom:18}}>
            <p style={{margin:'0 0 7px',fontSize:12,fontWeight:600,color:'#374151'}}>This backup includes:</p>
            {['All family trees','Member profiles','Stories & oral histories','Timeline events'].map(item=>(
              <div key={item} style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                <Check size={12} color="#16a34a"/><span style={{fontSize:12,color:'#6b7280'}}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="bp-btn" onClick={onCancel} style={{flex:1,justifyContent:'center',background:'#f3f4f6',color:'#374151'}}>Cancel</button>
            <button className="bp-btn" onClick={()=>onConfirm({name:name||def,description:desc,type})} disabled={loading}
              style={{flex:2,justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff'}}>
              {loading?<><div style={{width:13,height:13,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Creating…</>:<><Archive size={14}/> Create Backup</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RestoreModal({backup,onConfirm,onCancel,loading}){
  return(
    <div className="bp-overlay">
      <div className="bp-modal">
        <div style={{background:'linear-gradient(135deg,#1d4ed8,#2563eb)',padding:'20px 22px',display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:40,height:40,borderRadius:12,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center'}}><RotateCcw size={20} color="#fff"/></div>
          <div style={{flex:1}}><div style={{fontSize:16,fontWeight:700,color:'#fff'}}>Restore Backup</div><div style={{fontSize:11,color:'rgba(255,255,255,.65)'}}>{getName(backup)}</div></div>
          <button onClick={onCancel} style={{background:'rgba(255,255,255,.15)',border:'none',borderRadius:8,cursor:'pointer',padding:'6px 8px',color:'#fff',display:'flex'}}><X size={15}/></button>
        </div>
        <div style={{padding:'20px 22px'}}>
          <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:12,padding:'16px',marginBottom:16}}>
            <p style={{margin:'0 0 10px',fontSize:11,fontWeight:600,color:'#374151',textTransform:'uppercase',letterSpacing:'0.05em'}}>Backup Details</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[{icon:<Calendar size={13}/>,label:'Date',value:fmt.date(backup.lastModified)},{icon:<HardDrive size={13}/>,label:'Size',value:fmt.size(backup.size)},{icon:<Clock size={13}/>,label:'Created',value:fmt.ago(backup.lastModified)},{icon:<Database size={13}/>,label:'Type',value:getType(backup)==='automatic'?'🔵 Automatic':'🟣 Manual'}].map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{color:'#9ca3af'}}>{item.icon}</span>
                  <div><div style={{fontSize:10,color:'#9ca3af'}}>{item.label}</div><div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{item.value}</div></div>
                </div>
              ))}
            </div>
            {backup.description&&<div style={{marginTop:10,padding:'7px 10px',background:'#fff',borderRadius:8,fontSize:12,color:'#6b7280',fontStyle:'italic',border:'1px solid #e5e7eb'}}>"{backup.description}"</div>}
          </div>
          <div style={{display:'flex',gap:8,padding:'10px 14px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,marginBottom:16}}>
            <AlertTriangle size={14} color="#d97706" style={{flexShrink:0,marginTop:1}}/>
            <p style={{margin:0,fontSize:12,color:'#92400e',lineHeight:1.6}}>Your family tree will be restored to this backup. Current data will be merged.</p>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="bp-btn" onClick={onCancel} style={{flex:1,justifyContent:'center',background:'#f3f4f6',color:'#374151'}}>Cancel</button>
            <button className="bp-btn" onClick={onConfirm} disabled={loading}
              style={{flex:1,justifyContent:'center',background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'#fff',fontWeight:600}}>
              {loading?<><div style={{width:13,height:13,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Restoring…</>:<><RotateCcw size={14}/> Restore</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({onConfirm,onCancel,loading}){
  return(
    <div className="bp-overlay">
      <div className="bp-modal">
        <div style={{padding:'22px 22px 0'}}>
          <div style={{display:'flex',gap:14,marginBottom:16}}>
            <div style={{width:44,height:44,borderRadius:12,background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Trash2 size={20} color="#dc2626"/></div>
            <div><h3 style={{margin:'0 0 4px',fontSize:15,fontWeight:700,color:'#111827'}}>Delete Backup?</h3><p style={{margin:0,fontSize:13,color:'#6b7280',lineHeight:1.6}}>This backup will be permanently removed.</p></div>
          </div>
        </div>
        <div style={{padding:'0 22px 22px',display:'flex',gap:10}}>
          <button className="bp-btn" onClick={onCancel} style={{flex:1,justifyContent:'center',background:'#f3f4f6',color:'#374151'}}>Cancel</button>
          <button className="bp-btn" onClick={onConfirm} disabled={loading}
            style={{flex:1,justifyContent:'center',background:'#dc2626',color:'#fff',fontWeight:600}}>
            {loading?'Deleting…':<><Trash2 size={14}/> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function TimelineEntry({backup,isLatest,total,index,expanded,onExpand,onDownload,onRestore,onDelete,t}){
  const name=getName(backup);
  const type=getType(backup);
  return(
    <div style={{display:'flex',gap:0,animation:`fadeIn .35s ease ${index*.05}s both`}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:28,flexShrink:0}}>
        <div style={{width:isLatest?14:10,height:isLatest?14:10,borderRadius:'50%',background:isLatest?'#16a34a':type==='automatic'?'#2563eb':'#7c3aed',marginTop:18,flexShrink:0,zIndex:1,boxShadow:isLatest?'0 0 0 4px rgba(22,163,74,.18)':'none'}}/>
        {index<total-1&&<div style={{flex:1,width:2,background:`linear-gradient(${t.primary||'#16a34a'},${t.border||'#f0f0f0'})`,minHeight:40}}/>}
      </div>
      <div className="bp-entry" onClick={()=>onExpand(backup.key)}
        style={{flex:1,marginLeft:12,marginBottom:12,background:expanded?t.primaryBg||'#f0fdf4':t.card||'#fff',border:`1.5px solid ${expanded?t.primaryBorder||'#bbf7d0':t.border||'#f0f0f0'}`,boxShadow:'0 1px 4px rgba(0,0,0,.04)',transition:'all .2s'}}>
        <div style={{padding:'13px 16px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <div style={{width:36,height:36,borderRadius:10,background:isLatest?(t.primaryBg||'#f0fdf4'):(t.bg||'#f9fafb'),border:`1px solid ${isLatest?(t.primaryBorder||'#bbf7d0'):(t.border||'#e5e7eb')}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <Archive size={17} color={isLatest?'#16a34a':'#9ca3af'}/>
          </div>
          <div style={{flex:1,minWidth:120}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:3}}>
              <span style={{fontSize:14,fontWeight:700,color:t.text||'#111827'}}>{name}</span>
              <Badge type={type} isLatest={isLatest}/>
            </div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:t.textMuted||'#9ca3af',display:'flex',alignItems:'center',gap:3}}><Clock size={11}/>{fmt.ago(backup.lastModified)}</span>
              <span style={{fontSize:11,color:t.textMuted||'#9ca3af',display:'flex',alignItems:'center',gap:3}}><HardDrive size={11}/>{fmt.size(backup.size)}</span>
              <span style={{fontSize:11,color:t.textMuted||'#9ca3af',display:'flex',alignItems:'center',gap:3}}><Calendar size={11}/>{fmt.date(backup.lastModified)}</span>
            </div>
          </div>
          <div style={{display:'flex',gap:6,flexShrink:0}} onClick={e=>e.stopPropagation()}>
            <button className="bp-btn" onClick={()=>onDownload(backup.key)} style={{background:t.primaryBg||'#f0fdf4',color:'#16a34a',border:`1px solid ${t.primaryBorder||'#bbf7d0'}`,padding:'6px 12px'}}><Download size={13}/> Download</button>
            <button className="bp-btn" onClick={()=>onRestore(backup)} style={{background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe',padding:'6px 12px'}}><RotateCcw size={13}/> Restore</button>
            <button className="bp-btn" onClick={()=>onDelete(backup.key)} style={{background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5',padding:'6px 10px'}}><Trash2 size={13}/></button>
          </div>
        </div>
        {expanded&&(
          <div style={{padding:'0 16px 14px',borderTop:`1px solid ${t.border||'#f0f0f0'}`,animation:'fadeIn .2s ease'}}>
            {backup.description&&<div style={{background:t.card||'#fff',borderRadius:8,padding:'8px 12px',marginTop:12,fontSize:13,color:'#166534',fontStyle:'italic',border:`1px solid ${t.primaryBorder||'#bbf7d0'}`}}>📝 "{backup.description}"</div>}
            <div style={{display:'flex',gap:20,marginTop:12,flexWrap:'wrap'}}>
              {[{label:'Full Date',value:fmt.date(backup.lastModified)},{label:'Size',value:fmt.size(backup.size)},{label:'Type',value:type==='automatic'?'🔵 Automatic':'🟣 Manual'}].map((item,i)=>(
                <div key={i}><div style={{fontSize:10,color:t.textFaint||'#9ca3af',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:2}}>{item.label}</div><div style={{fontSize:13,fontWeight:600,color:t.textSub||'#374151'}}>{item.value}</div></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BackupPage(){
  const{currentUser}=useAuth();
  const t=useTheme();
  const navigate=useNavigate();
  const userId=currentUser?.uid;
  const[backups,setBackups]=useState([]);
  const[loading,setLoading]=useState(true);
  const[creating,setCreating]=useState(false);
  const[restoring,setRestoring]=useState(false);
  const[deleting,setDeleting]=useState(false);
  const[alert,setAlert]=useState(null);
  const[showCreate,setShowCreate]=useState(false);
  const[restoreTarget,setRestoreTarget]=useState(null);
  const[deleteTarget,setDeleteTarget]=useState(null);
  const[progress,setProgress]=useState(null);
  const[search,setSearch]=useState('');
  const[typeFilter,setTypeFilter]=useState('all');
  const[expandedKey,setExpandedKey]=useState(null);

  const load=useCallback(async()=>{
    if(!userId)return;
    try{setLoading(true);setBackups(await backupService.listBackups(userId)||[]);}
    catch(err){setAlert({type:'error',message:`Could not load backups: ${err.message}`});}
    finally{setLoading(false);}
  },[userId]);

  useEffect(()=>{load();},[load]);

  const handleCreate=async({name,description,type})=>{
    try{setCreating(true);setShowCreate(false);setProgress('Creating backup of your family data…');setAlert(null);
      await backupService.createBackup(userId,name,description,type);
      setAlert({type:'success',message:`✅ Backup "${name}" created successfully!`});
      await load();
    }catch(err){setAlert({type:'error',message:`Backup failed: ${err.message}`});}
    finally{setCreating(false);setProgress(null);}
  };

  const handleDownload=async(key)=>{
    try{const url=await backupService.getDownloadUrl(key);const a=document.createElement('a');a.href=url;a.download=key.split('/').pop();a.click();}
    catch(err){setAlert({type:'error',message:`Download failed: ${err.message}`});}
  };

  const handleRestore=async()=>{
    try{setRestoring(true);setProgress('Restoring your family data…');
      await backupService.restoreBackup(restoreTarget.key,userId);
      setAlert({type:'success',message:'✅ Family tree restored successfully!'});
    }catch(err){setAlert({type:'error',message:`Restore failed: ${err.message}`});}
    finally{setRestoring(false);setRestoreTarget(null);setProgress(null);}
  };

  const handleDelete=async()=>{
    try{setDeleting(true);await backupService.deleteBackup(deleteTarget);
      setBackups(prev=>prev.filter(b=>b.key!==deleteTarget));
      setAlert({type:'success',message:'Backup deleted.'});
    }catch(err){setAlert({type:'error',message:`Delete failed: ${err.message}`});}
    finally{setDeleting(false);setDeleteTarget(null);}
  };

  const filtered=backups.filter(b=>{
    const name=getName(b).toLowerCase();
    return(!search||name.includes(search.toLowerCase()))&&(typeFilter==='all'||getType(b)===typeFilter);
  });
  const grouped=groupByYear(filtered);
  const totalSize=backups.reduce((s,b)=>s+(b.size||0),0);

  return(
    <>
      <style>{css}</style>
      <div style={{minHeight:'100vh',width:'100%',background:t.bg||'#f8fafc',transition:'background .3s',display:'flex',flexDirection:'column'}}>
        {/* Hero — full width */}
        <div style={{background:'linear-gradient(135deg,#0a3d1f 0%,#14532d 45%,#166534 100%)',padding:'32px 0 44px',position:'relative',overflow:'hidden',flexShrink:0}}>
          {[{top:-60,right:-60,size:220},{top:20,right:180,size:100},{bottom:-80,right:60,size:180}].map((d,i)=>(
            <div key={i} style={{position:'absolute',top:d.top,bottom:d.bottom,right:d.right,width:d.size,height:d.size,borderRadius:'50%',background:'rgba(255,255,255,.04)',pointerEvents:'none'}}/>
          ))}
          <div style={{maxWidth:'100%',padding:'0 32px',position:'relative'}}>
            <button onClick={()=>navigate(-1)} style={{background:'rgba(255,255,255,.15)',border:'none',borderRadius:10,cursor:'pointer',padding:'7px 12px',color:'#fff',display:'flex',alignItems:'center',gap:6,fontSize:12,fontFamily:'inherit',marginBottom:20}}>
              <ArrowLeft size={15}/> Back
            </button>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:24}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:50,height:50,borderRadius:16,background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Archive size={24} color="#fff"/>
                </div>
                <div>
                  <h1 style={{margin:0,fontSize:24,fontWeight:800,color:'#fff',letterSpacing:'-.02em'}}>Backup & Recovery</h1>
                  <p style={{margin:'4px 0 0',fontSize:13,color:'rgba(255,255,255,.65)'}}>Every version of your family tree, preserved forever</p>
                </div>
              </div>
              <button className="bp-btn" onClick={()=>setShowCreate(true)} disabled={creating}
                style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.25)',fontSize:14,fontWeight:600,padding:'10px 20px'}}>
                <Plus size={16}/> New Backup
              </button>
            </div>
            {/* Stats */}
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              {[{icon:'📦',label:'Total Backups',value:loading?'…':backups.length},{icon:'💾',label:'Storage Used',value:loading?'…':fmt.size(totalSize)},{icon:'🕐',label:'Last Backup',value:backups[0]?fmt.ago(backups[0].lastModified):'Never'},{icon:'🛡️',label:'Status',value:backups.length>0?'Protected':'No backups'}].map((s,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,.1)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,.15)',borderRadius:12,padding:'11px 18px',minWidth:120,animation:`fadeIn .4s ease ${i*.08}s both`}}>
                  <div style={{fontSize:18,fontWeight:800,color:'#fff',lineHeight:1.1}}>{s.icon} {s.value}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.65)',marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content — full width */}
        <div style={{flex:1,padding:'24px 32px 48px',width:'100%',maxWidth:'100%'}}>
          {alert&&<Alert type={alert.type} message={alert.message} onClose={()=>setAlert(null)}/>}
          {progress&&<ProgressBar label={progress} t={t}/>}

          {/* Toolbar */}
          <div style={{background:t.card||'#fff',border:`1px solid ${t.border||'#e5e7eb'}`,borderRadius:14,padding:'12px 16px',marginBottom:24,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:1,minWidth:200}}>
              <Search size={14} color={t.textFaint||'#9ca3af'} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <input className="bp-input" placeholder="Search backups…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{paddingLeft:34,border:`1.5px solid ${t.border||'#e5e7eb'}`,background:t.input||'#f9fafb',color:t.text||'#111827'}}/>
              {search&&<button onClick={()=>setSearch('')} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:t.textFaint||'#9ca3af',padding:2,display:'flex'}}><X size={14}/></button>}
            </div>
            <div style={{position:'relative'}}>
              <Filter size={13} color={t.textFaint||'#9ca3af'} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
                style={{padding:'9px 28px 9px 28px',border:`1.5px solid ${t.border||'#e5e7eb'}`,borderRadius:10,outline:'none',background:t.card||'#fff',color:t.text||'#111827',cursor:'pointer',appearance:'none',fontSize:13,fontFamily:'inherit'}}>
                <option value="all">All Types</option>
                <option value="manual">🟣 Manual</option>
                <option value="automatic">🔵 Automatic</option>
              </select>
              <ChevronDown size={13} color={t.textFaint||'#9ca3af'} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
            </div>
            <button className="bp-btn" onClick={load} disabled={loading} style={{background:t.bg||'#f9fafb',color:t.textMuted||'#6b7280',border:`1px solid ${t.border||'#e5e7eb'}`}}>
              <RefreshCw size={14} style={{animation:loading?'spin .7s linear infinite':'none'}}/> Refresh
            </button>
            <button className="bp-btn" onClick={()=>setShowCreate(true)} disabled={creating}
              style={{background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',fontWeight:600}}>
              <Plus size={14}/> New Backup
            </button>
          </div>

          {/* Timeline */}
          {loading?(
            <div style={{padding:'48px 0',display:'flex',justifyContent:'center'}}>
              <div style={{width:32,height:32,border:'3px solid #16a34a',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
            </div>
          ):filtered.length===0?(
            <div style={{background:t.card||'#fff',border:`2px dashed ${t.border||'#e5e7eb'}`,borderRadius:18,padding:'64px 24px',textAlign:'center',animation:'fadeIn .4s ease'}}>
              <div style={{width:72,height:72,borderRadius:20,background:t.primaryBg||'#f0fdf4',border:`1px solid ${t.primaryBorder||'#bbf7d0'}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <Archive size={32} color="#16a34a"/>
              </div>
              <h3 style={{margin:'0 0 8px',fontSize:18,fontWeight:700,color:t.text||'#111827'}}>{backups.length===0?'No backups yet':'No results found'}</h3>
              <p style={{margin:'0 0 24px',fontSize:14,color:t.textMuted||'#9ca3af',maxWidth:360,marginLeft:'auto',marginRight:'auto',lineHeight:1.7}}>
                {backups.length===0?'Create your first backup to start preserving your family tree.':'Try adjusting your search or filter.'}
              </p>
              {backups.length===0&&(
                <button className="bp-btn" onClick={()=>setShowCreate(true)}
                  style={{background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',fontWeight:600,fontSize:14,padding:'12px 24px'}}>
                  <Plus size={16}/> Create First Backup
                </button>
              )}
            </div>
          ):(
            grouped.map(([year,yearBackups])=>(
              <div key={year} style={{marginBottom:36,animation:'fadeIn .4s ease'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                  <div style={{fontSize:24,fontWeight:800,color:t.text||'#111827'}}>{year}</div>
                  <div style={{flex:1,height:1,background:t.border||'#e5e7eb'}}/>
                  <div style={{fontSize:12,color:t.textMuted||'#9ca3af'}}>{yearBackups.length} backup{yearBackups.length!==1?'s':''}</div>
                </div>
                <div style={{paddingLeft:8}}>
                  {yearBackups.map((backup,i)=>(
                    <div key={backup.key}>
                      {(i===0||fmt.dateShort(backup.lastModified)!==fmt.dateShort(yearBackups[i-1].lastModified))&&(
                        <div style={{marginBottom:8,marginLeft:32}}>
                          <span style={{fontSize:12,fontWeight:600,color:t.textMuted||'#9ca3af',background:t.bg||'#f8fafc',padding:'3px 10px',borderRadius:20,border:`1px solid ${t.border||'#e5e7eb'}`}}>
                            {fmt.dateShort(backup.lastModified)}
                          </span>
                        </div>
                      )}
                      <TimelineEntry backup={backup} isLatest={i===0&&year===grouped[0][0]} total={yearBackups.length} index={i} expanded={expandedKey===backup.key} onExpand={k=>setExpandedKey(p=>p===k?null:k)} onDownload={handleDownload} onRestore={b=>setRestoreTarget(b)} onDelete={k=>setDeleteTarget(k)} t={t}/>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          <div style={{marginTop:20,background:t.card||'#fff',border:`1px solid ${t.border||'#e5e7eb'}`,borderRadius:12,padding:'12px 16px',display:'flex',gap:10,alignItems:'flex-start'}}>
            <Info size={14} color={t.textFaint||'#9ca3af'} style={{flexShrink:0,marginTop:1}}/>
            <p style={{margin:0,fontSize:12,color:t.textMuted||'#9ca3af',lineHeight:1.8}}>
              Backups include all family trees, member profiles, and stories. Media files remain accessible via their original links. Create a backup before making major changes to your family tree.
            </p>
          </div>
        </div>
      </div>

      {showCreate&&<CreateModal onConfirm={handleCreate} onCancel={()=>setShowCreate(false)} loading={creating} t={t}/>}
      {restoreTarget&&<RestoreModal backup={restoreTarget} onConfirm={handleRestore} onCancel={()=>setRestoreTarget(null)} loading={restoring}/>}
      {deleteTarget&&<DeleteModal onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)} loading={deleting}/>}
    </>
  );
}