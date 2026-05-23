// src/pages/BackupPage.jsx
// Taf'Yaa — Professional Backup & Recovery Dashboard (v3)
// Features: custom naming, beautiful UI, inspired by iCloud/Google Drive

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Clock, UploadCloud, DownloadCloud, Trash2,
  RefreshCw, AlertTriangle, CheckCircle, HardDrive,
  FolderArchive, History, Zap, Search, Filter,
  ChevronDown, X, Edit3, Calendar, Database,
  ArrowUpCircle, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { backupService } from '../services/backupService';
import Button from '../components/Button';
import Loading from '../components/Loading';

// ─── Utilities ────────────────────────────────────────────────────────────────
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-GB', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit',
  });
}

// Generate a smart backup name from key + index
function getBackupName(backup, index, total) {
  // If user saved a custom name in metadata, use it
  if (backup.customName) return backup.customName;
  // Otherwise use date
  const date = new Date(backup.lastModified);
  const dateStr = date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  return `Backup · ${dateStr} at ${timeStr}`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes progressBar { from{width:0%} to{width:100%} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  .bp-card { transition:box-shadow .2s,transform .2s; }
  .bp-card:hover { box-shadow:0 8px 28px rgba(0,0,0,0.1) !important; transform:translateY(-2px); }

  .bp-btn { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;border:none;cursor:pointer;transition:all .15s;font-family:inherit; }
  .bp-btn:hover:not(:disabled){filter:brightness(0.92);transform:scale(0.98);}
  .bp-btn:disabled{opacity:0.5;cursor:not-allowed;}

  .bp-input{width:100%;padding:10px 14px 10px 38px;font-size:13px;border:1.5px solid #e5e7eb;border-radius:10px;outline:none;background:#fff;color:#111827;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit;}
  .bp-input:focus{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,0.12);}

  .bp-name-input{width:100%;padding:10px 14px;font-size:14px;border:1.5px solid #e5e7eb;border-radius:10px;outline:none;background:#fff;color:#111827;transition:border-color .15s;box-sizing:border-box;font-family:inherit;}
  .bp-name-input:focus{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,0.12);}

  .bp-select{padding:9px 32px 9px 12px;font-size:13px;border:1.5px solid #e5e7eb;border-radius:10px;outline:none;background:#fff;color:#374151;cursor:pointer;appearance:none;transition:border-color .15s;font-family:inherit;}
  .bp-select:focus{border-color:#16a34a;}

  .bp-skeleton{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px;}

  .bp-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;backdrop-filter:blur(4px);}
  .bp-modal{background:#fff;border-radius:20px;width:100%;max-width:460px;box-shadow:0 30px 80px rgba(0,0,0,0.2);animation:slideUp .25s ease;overflow:hidden;}
`;

// ─── Sub-components ───────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{background:'#fff',border:'1px solid #f3f4f6',borderRadius:14,padding:'18px 20px',display:'flex',alignItems:'center',gap:16}}>
      <div className="bp-skeleton" style={{width:44,height:44,borderRadius:12,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div className="bp-skeleton" style={{height:14,width:'40%',marginBottom:8}}/>
        <div className="bp-skeleton" style={{height:11,width:'25%'}}/>
      </div>
      <div className="bp-skeleton" style={{height:32,width:200,borderRadius:8}}/>
    </div>
  );
}

function StatCard({ icon, label, value, sub, delay=0 }) {
  return (
    <div style={{background:'rgba(255,255,255,0.12)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:14,padding:'14px 20px',display:'flex',alignItems:'center',gap:12,minWidth:130,animation:`fadeSlideIn .4s ease ${delay}s both`}}>
      <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        {React.cloneElement(icon,{size:19,color:'rgba(255,255,255,0.9)'})}
      </div>
      <div>
        <div style={{fontSize:20,fontWeight:800,color:'#fff',lineHeight:1.1}}>{value}</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.65)',marginTop:2}}>{label}</div>
        {sub && <div style={{fontSize:10,color:'rgba(255,255,255,0.45)',marginTop:1}}>{sub}</div>}
      </div>
    </div>
  );
}

function AlertBanner({ type, message, onClose }) {
  const map = {
    success:{bg:'#f0fdf4',border:'#86efac',icon:'#16a34a',text:'#15803d',Icon:CheckCircle},
    error:  {bg:'#fef2f2',border:'#fca5a5',icon:'#dc2626',text:'#b91c1c',Icon:AlertTriangle},
  }[type] || {bg:'#eff6ff',border:'#93c5fd',icon:'#2563eb',text:'#1d4ed8',Icon:CheckCircle};
  const {Icon}=map;
  return (
    <div style={{display:'flex',alignItems:'flex-start',gap:12,background:map.bg,border:`1px solid ${map.border}`,borderRadius:12,padding:'14px 18px',marginBottom:20,animation:'fadeSlideIn .3s ease'}}>
      <Icon size={18} color={map.icon} style={{marginTop:1,flexShrink:0}}/>
      <span style={{fontSize:13,color:map.text,flex:1,lineHeight:1.6}}>{message}</span>
      {onClose && <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:map.icon,padding:0,fontSize:18,lineHeight:1}}>×</button>}
    </div>
  );
}

function ProgressBar({ label }) {
  return (
    <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'14px 18px',marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <div style={{width:15,height:15,border:'2px solid #16a34a',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
        <span style={{fontSize:13,fontWeight:600,color:'#15803d'}}>{label}</span>
      </div>
      <div style={{background:'#dcfce7',borderRadius:20,height:5,overflow:'hidden'}}>
        <div style={{height:'100%',background:'linear-gradient(90deg,#16a34a,#22c55e)',borderRadius:20,animation:'progressBar 4s ease forwards'}}/>
      </div>
    </div>
  );
}

// Create Backup Modal with custom name
function CreateBackupModal({ onConfirm, onCancel, loading }) {
  const [name, setName] = useState('');
  const defaultName = `Backup · ${new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})} at ${new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'})}`;

  return (
    <div className="bp-modal-overlay">
      <div className="bp-modal">
        <div style={{background:'linear-gradient(135deg,#14532d,#166534)',padding:'22px 26px',display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <UploadCloud size={22} color="#fff"/>
          </div>
          <div>
            <h3 style={{margin:0,fontSize:17,fontWeight:700,color:'#fff'}}>Create New Backup</h3>
            <p style={{margin:0,fontSize:12,color:'rgba(255,255,255,0.7)',marginTop:2}}>Your family tree data will be securely saved</p>
          </div>
          <button onClick={onCancel} style={{marginLeft:'auto',background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,cursor:'pointer',padding:'6px 8px',color:'#fff'}}>
            <X size={16}/>
          </button>
        </div>
        <div style={{padding:'22px 26px'}}>
          {/* Name input */}
          <div style={{marginBottom:18}}>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:6}}>
              Backup Name (optional)
            </label>
            <input
              className="bp-name-input"
              placeholder={defaultName}
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={80}
            />
            <p style={{margin:'6px 0 0',fontSize:11,color:'#9ca3af'}}>
              Leave empty to use the date automatically
            </p>
          </div>

          {/* What's included */}
          <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:10,padding:'14px',marginBottom:20}}>
            <p style={{margin:'0 0 10px',fontSize:12,fontWeight:600,color:'#374151'}}>What's included:</p>
            {['All family trees','Member profiles','Stories & oral histories','Timeline events'].map(item => (
              <div key={item} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <CheckCircle size={13} color="#16a34a"/>
                <span style={{fontSize:13,color:'#374151'}}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:10}}>
            <button className="bp-btn" onClick={onCancel} style={{flex:1,justifyContent:'center',background:'#f3f4f6',color:'#374151'}}>
              Cancel
            </button>
            <button className="bp-btn" onClick={() => onConfirm(name || defaultName)} disabled={loading}
              style={{flex:2,justifyContent:'center',background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',fontWeight:600}}>
              {loading
                ? <><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Creating…</>
                : <><UploadCloud size={15}/> Create Backup</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Restore Modal
function RestoreModal({ backup, index, total, onConfirm, onCancel, loading }) {
  return (
    <div className="bp-modal-overlay">
      <div className="bp-modal">
        <div style={{background:'linear-gradient(135deg,#1d4ed8,#2563eb)',padding:'22px 26px',display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <RefreshCw size={22} color="#fff"/>
          </div>
          <div>
            <h3 style={{margin:0,fontSize:17,fontWeight:700,color:'#fff'}}>Restore Backup</h3>
            <p style={{margin:0,fontSize:12,color:'rgba(255,255,255,0.7)',marginTop:2}}>{getBackupName(backup, index, total)}</p>
          </div>
          <button onClick={onCancel} style={{marginLeft:'auto',background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,cursor:'pointer',padding:'6px 8px',color:'#fff'}}>
            <X size={16}/>
          </button>
        </div>
        <div style={{padding:'22px 26px'}}>
          <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:12,padding:'16px',marginBottom:18}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                {icon:<HardDrive size={14}/>,label:'Size',value:formatSize(backup.size)},
                {icon:<Clock size={14}/>,label:'Created',value:timeAgo(backup.lastModified)},
                {icon:<Calendar size={14}/>,label:'Date',value:new Date(backup.lastModified).toLocaleDateString('en-GB')},
                {icon:<Database size={14}/>,label:'Format',value:'JSON'},
              ].map((item,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{color:'#9ca3af'}}>{item.icon}</span>
                  <div>
                    <div style={{fontSize:10,color:'#9ca3af'}}>{item.label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:8,padding:'11px 14px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,marginBottom:18}}>
            <AlertTriangle size={15} color="#d97706" style={{flexShrink:0,marginTop:1}}/>
            <p style={{margin:0,fontSize:12,color:'#92400e',lineHeight:1.6}}>
              This will merge the backup with your current data. Nothing will be permanently deleted.
            </p>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="bp-btn" onClick={onCancel} style={{flex:1,justifyContent:'center',background:'#f3f4f6',color:'#374151'}}>Cancel</button>
            <button className="bp-btn" onClick={onConfirm} disabled={loading}
              style={{flex:1,justifyContent:'center',background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'#fff',fontWeight:600}}>
              {loading
                ? <><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Restoring…</>
                : <><RefreshCw size={14}/> Restore</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete Modal
function DeleteModal({ onConfirm, onCancel, loading }) {
  return (
    <div className="bp-modal-overlay">
      <div className="bp-modal">
        <div style={{padding:'26px 26px 0'}}>
          <div style={{display:'flex',gap:14,marginBottom:20}}>
            <div style={{width:44,height:44,borderRadius:12,flexShrink:0,background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Trash2 size={20} color="#dc2626"/>
            </div>
            <div>
              <h3 style={{margin:'0 0 6px',fontSize:16,fontWeight:700,color:'#111827'}}>Delete Backup?</h3>
              <p style={{margin:0,fontSize:13,color:'#6b7280',lineHeight:1.6}}>
                This backup will be permanently removed and cannot be recovered.
              </p>
            </div>
          </div>
        </div>
        <div style={{padding:'0 26px 26px',display:'flex',gap:10}}>
          <button className="bp-btn" onClick={onCancel} style={{flex:1,justifyContent:'center',background:'#f3f4f6',color:'#374151'}}>Cancel</button>
          <button className="bp-btn" onClick={onConfirm} disabled={loading}
            style={{flex:1,justifyContent:'center',background:'#dc2626',color:'#fff',fontWeight:600}}>
            {loading ? 'Deleting…' : <><Trash2 size={14}/> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// Backup Row Card
function BackupRow({ backup, index, total, onDownload, onRestore, onDelete }) {
  const [action, setAction] = useState(null);
  const handle = async (name, fn) => { setAction(name); try { await fn(); } finally { setAction(null); } };
  const name = getBackupName(backup, index, total);

  return (
    <div className="bp-card" style={{background:'#fff',border:'1px solid #f0f0f0',borderRadius:14,padding:'16px 20px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',animation:`fadeSlideIn .35s ease ${index*0.06}s both`,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
      {/* Icon */}
      <div style={{width:46,height:46,borderRadius:13,flexShrink:0,background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #bbf7d0',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <FolderArchive size={21} color="#16a34a"/>
      </div>

      {/* Info */}
      <div style={{flex:1,minWidth:160}}>
        <div style={{fontSize:14,fontWeight:600,color:'#111827',marginBottom:4}}>{name}</div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <span style={{fontSize:12,color:'#9ca3af',display:'flex',alignItems:'center',gap:4}}>
            <Clock size={11}/>{timeAgo(backup.lastModified)}
          </span>
          <span style={{fontSize:12,color:'#9ca3af',display:'flex',alignItems:'center',gap:4}}>
            <HardDrive size={11}/>{formatSize(backup.size)}
          </span>
          <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0'}}>
            Secured
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{display:'flex',gap:8,flexShrink:0,flexWrap:'wrap'}}>
        <button className="bp-btn" disabled={action==='download'}
          onClick={() => handle('download', () => onDownload(backup.key))}
          style={{background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0'}}>
          <DownloadCloud size={14}/>{action==='download'?'…':'Download'}
        </button>
        <button className="bp-btn" disabled={action==='restore'}
          onClick={() => handle('restore', () => onRestore(backup))}
          style={{background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe'}}>
          <RefreshCw size={14}/>{action==='restore'?'…':'Restore'}
        </button>
        <button className="bp-btn" disabled={action==='delete'}
          onClick={() => handle('delete', () => onDelete(backup.key))}
          style={{background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5'}}>
          <Trash2 size={14}/>{action==='delete'?'…':'Delete'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const BackupPage = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [backups, setBackups]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [creating, setCreating]           = useState(false);
  const [restoring, setRestoring]         = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [alert, setAlert]                 = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [showProgress, setShowProgress]   = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [search, setSearch]               = useState('');
  const [dateFilter, setDateFilter]       = useState('all');

  const loadBackups = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const list = await backupService.listBackups(userId);
      setBackups(list || []);
    } catch (err) {
      setAlert({ type:'error', message:`Could not load backups: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadBackups(); }, [loadBackups]);

  const handleCreate = async (customName) => {
    try {
      setCreating(true);
      setShowCreateModal(false);
      setProgressLabel('Collecting your family data…');
      setShowProgress(true);
      setAlert(null);
      const result = await backupService.createBackup(userId, customName);
      setAlert({
        type:'success',
        message:`✅ "${customName}" created — ${result.backup.stats.trees} tree(s), ${result.backup.stats.persons} person(s) secured.`,
      });
      await loadBackups();
    } catch (err) {
      setAlert({ type:'error', message:`Backup failed: ${err.message}` });
    } finally {
      setCreating(false);
      setShowProgress(false);
    }
  };

  const handleDownload = async (key) => {
    try {
      const url = await backupService.getDownloadUrl(key);
      const a = document.createElement('a');
      a.href = url; a.download = key.split('/').pop(); a.click();
    } catch (err) {
      setAlert({ type:'error', message:`Download failed: ${err.message}` });
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      setProgressLabel('Restoring your data…');
      setShowProgress(true);
      const result = await backupService.restoreBackup(restoreTarget.key, userId);
      setAlert({ type:'success', message:`✅ Restore complete — ${result.restored.trees} tree(s) recovered.` });
    } catch (err) {
      setAlert({ type:'error', message:`Restore failed: ${err.message}` });
    } finally {
      setRestoring(false);
      setRestoreTarget(null);
      setShowProgress(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await backupService.deleteBackup(deleteTarget);
      setBackups(prev => prev.filter(b => b.key !== deleteTarget));
      setAlert({ type:'success', message:'Backup deleted.' });
    } catch (err) {
      setAlert({ type:'error', message:`Delete failed: ${err.message}` });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Filter backups
  const filtered = backups.filter(b => {
    const name = getBackupName(b, 0, backups.length).toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const now = Date.now();
    const matchDate =
      dateFilter==='all'   ? true :
      dateFilter==='today' ? (now-new Date(b.lastModified))<86400000 :
      dateFilter==='week'  ? (now-new Date(b.lastModified))<604800000 :
      dateFilter==='month' ? (now-new Date(b.lastModified))<2592000000 : true;
    return matchSearch && matchDate;
  });

  const totalSize = backups.reduce((s,b) => s+(b.size||0), 0);
  const lastBackup = backups[0];

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:'100%',width:'100%',background:'#f8fafc'}}>

        {/* Hero */}
        <div style={{background:'linear-gradient(135deg,#0a3d1f 0%,#14532d 45%,#166534 100%)',padding:'36px 40px 44px',position:'relative',overflow:'hidden'}}>
          {[{t:-60,r:-60,s:220},{t:20,r:180,s:100},{b:-80,r:60,s:180}].map((d,i)=>(
            <div key={i} style={{position:'absolute',top:d.t,bottom:d.b,right:d.r,width:d.s,height:d.s,borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none'}}/>
          ))}

          <div style={{position:'relative',maxWidth:1000,margin:'0 auto'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:28}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:52,height:52,borderRadius:16,background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(10px)'}}>
                  <Shield size={26} color="#fff"/>
                </div>
                <div>
                  <h1 style={{margin:0,fontSize:26,fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>
                    Data Backup & Recovery
                  </h1>
                  <p style={{margin:'4px 0 0',fontSize:13,color:'rgba(255,255,255,0.65)'}}>
                    Your family heritage is automatically secured and recoverable
                  </p>
                </div>
              </div>
              <button className="bp-btn" onClick={() => setShowCreateModal(true)} disabled={creating}
                style={{background:'rgba(255,255,255,0.15)',color:'#fff',border:'1px solid rgba(255,255,255,0.25)',backdropFilter:'blur(10px)',padding:'10px 20px',fontSize:14,fontWeight:600}}>
                <UploadCloud size={16}/> New Backup
              </button>
            </div>

            {/* Stats */}
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <StatCard icon={<FolderArchive/>} label="Total Backups" value={loading?'…':backups.length} delay={0}/>
              <StatCard icon={<HardDrive/>} label="Storage Used" value={loading?'…':formatSize(totalSize)} delay={0.05}/>
              <StatCard icon={<Clock/>} label="Last Backup" value={lastBackup?timeAgo(lastBackup.lastModified):'Never'} sub={lastBackup?formatDate(lastBackup.lastModified):''} delay={0.1}/>
              <StatCard icon={<Lock/>} label="Status" value={backups.length>0?'Protected':'No backups'} delay={0.15}/>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{maxWidth:1000,margin:'0 auto',padding:'28px 40px 48px'}}>

          {alert && <AlertBanner type={alert.type} message={alert.message} onClose={()=>setAlert(null)}/>}
          {showProgress && <ProgressBar label={progressLabel}/>}

          {/* Toolbar */}
          <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:14,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:1,minWidth:200}}>
              <Search size={14} color="#9ca3af" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <input className="bp-input" placeholder="Search backups…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <button onClick={()=>setSearch('')} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:2}}><X size={14}/></button>}
            </div>
            <div style={{position:'relative'}}>
              <Filter size={13} color="#9ca3af" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <select className="bp-select" style={{paddingLeft:28}} value={dateFilter} onChange={e=>setDateFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
            </div>
            <button className="bp-btn" onClick={loadBackups} disabled={loading} style={{background:'#f3f4f6',color:'#374151',border:'1px solid #e5e7eb'}}>
              <RefreshCw size={14} style={{animation:loading?'spin .7s linear infinite':'none'}}/> Refresh
            </button>
            <button className="bp-btn" onClick={()=>setShowCreateModal(true)} disabled={creating}
              style={{background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',fontWeight:600}}>
              <UploadCloud size={14}/> New Backup
            </button>
          </div>

          {/* Results info */}
          {!loading && backups.length > 0 && (
            <div style={{fontSize:13,color:'#9ca3af',marginBottom:14}}>
              {filtered.length===0 ? 'No backups match your search' : `${filtered.length} of ${backups.length} backup${backups.length!==1?'s':''}`}
            </div>
          )}

          {/* List */}
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[0,1,2].map(i=><SkeletonRow key={i}/>)}
            </div>
          ) : filtered.length===0 ? (
            <div style={{background:'#fff',border:'2px dashed #e5e7eb',borderRadius:16,padding:'64px 24px',textAlign:'center',animation:'fadeSlideIn .4s ease'}}>
              <div style={{width:72,height:72,borderRadius:20,background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #bbf7d0',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <Shield size={32} color="#16a34a"/>
              </div>
              <h3 style={{margin:'0 0 8px',fontSize:18,fontWeight:700,color:'#111827'}}>
                {backups.length===0 ? 'No backups yet' : 'No results found'}
              </h3>
              <p style={{margin:'0 0 24px',fontSize:14,color:'#9ca3af',maxWidth:360,marginLeft:'auto',marginRight:'auto',lineHeight:1.7}}>
                {backups.length===0
                  ? 'Create your first backup to protect your family trees, member profiles, and stories.'
                  : 'Try adjusting your search or filter.'}
              </p>
              {backups.length===0 && (
                <button className="bp-btn" onClick={()=>setShowCreateModal(true)}
                  style={{background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff',fontWeight:600,fontSize:14,padding:'12px 24px'}}>
                  <UploadCloud size={16}/> Create First Backup
                </button>
              )}
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {filtered.map((backup,i) => (
                <BackupRow
                  key={backup.key}
                  backup={backup}
                  index={i}
                  total={backups.length}
                  onDownload={handleDownload}
                  onRestore={b => setRestoreTarget(b)}
                  onDelete={key => setDeleteTarget(key)}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{marginTop:28,background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'16px 20px',display:'flex',gap:12,alignItems:'flex-start'}}>
            <History size={15} color="#9ca3af" style={{marginTop:1,flexShrink:0}}/>
            <p style={{margin:0,fontSize:12,color:'#9ca3af',lineHeight:1.8}}>
              Backups include all family trees, member profiles, and stories.
              Media files are stored separately and remain accessible via their original links.
              We recommend creating a backup before making major changes.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateBackupModal
          onConfirm={handleCreate}
          onCancel={()=>setShowCreateModal(false)}
          loading={creating}
        />
      )}
      {restoreTarget && (
        <RestoreModal
          backup={restoreTarget}
          index={0}
          total={backups.length}
          onConfirm={handleRestore}
          onCancel={()=>setRestoreTarget(null)}
          loading={restoring}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={()=>setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
};

export default BackupPage;