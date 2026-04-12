// src/pages/BackupPage.jsx
// Taf'Yaa — Professional Data Backup & Recovery Dashboard

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, Clock, UploadCloud, DownloadCloud, Trash2,
  RefreshCw, AlertTriangle, CheckCircle, HardDrive,
  FolderArchive, History, Zap, Search, Filter,
  ChevronDown, X, ToggleLeft, ToggleRight, Info,
  Database, TreePine, Users, BookOpen, Calendar,
  ArrowUpCircle
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
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatBackupName(key, index, total) {
  const date = new Date(key.split('/').pop().replace('.json', '').replace(/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2}).*/, '$1T$2:$3:$4'));
  return isNaN(date) ? `Backup #${total - index}` : `Backup — ${formatDate(date)}`;
}

// ─── CSS-in-JS styles ─────────────────────────────────────────────────────────
const css = `
  @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp     { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer     { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
  @keyframes spin        { to { transform:rotate(360deg); } }
  @keyframes progressBar { from { width:0%; } to { width:100%; } }

  .bp-card { transition: box-shadow .2s, transform .2s; }
  .bp-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.09) !important; transform: translateY(-2px); }

  .bp-action-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:7px 14px; border-radius:8px; font-size:13px; font-weight:500;
    border:none; cursor:pointer; transition: all .15s;
  }
  .bp-action-btn:hover { filter: brightness(0.93); transform: scale(0.98); }
  .bp-action-btn:disabled { opacity:0.5; cursor:not-allowed; }

  .bp-input {
    width:100%; padding:10px 14px 10px 38px; font-size:13px;
    border:1px solid #e5e7eb; border-radius:10px; outline:none;
    background:#fff; color:#111827; transition: border-color .15s, box-shadow .15s;
    box-sizing:border-box;
  }
  .bp-input:focus { border-color:#16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.12); }

  .bp-select {
    padding:9px 32px 9px 12px; font-size:13px;
    border:1px solid #e5e7eb; border-radius:10px; outline:none;
    background:#fff; color:#374151; cursor:pointer; appearance:none;
    transition: border-color .15s;
  }
  .bp-select:focus { border-color:#16a34a; }

  .bp-skeleton {
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s infinite;
    border-radius:8px;
  }

  .bp-toggle { position:relative; display:inline-block; width:44px; height:24px; }
  .bp-toggle input { opacity:0; width:0; height:0; }
  .bp-toggle-slider {
    position:absolute; cursor:pointer; inset:0; border-radius:24px;
    background:#d1d5db; transition:.3s;
  }
  .bp-toggle-slider:before {
    content:''; position:absolute; width:18px; height:18px;
    left:3px; bottom:3px; border-radius:50%; background:#fff; transition:.3s;
  }
  .bp-toggle input:checked + .bp-toggle-slider { background:#16a34a; }
  .bp-toggle input:checked + .bp-toggle-slider:before { transform:translateX(20px); }

  .bp-modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center;
    z-index:9999; padding:20px; backdrop-filter:blur(3px);
  }
  .bp-modal {
    background:#fff; border-radius:20px; width:100%; max-width:480px;
    box-shadow:0 30px 80px rgba(0,0,0,0.2);
    animation: slideUp .25s ease;
    overflow:hidden;
  }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

// Status Badge
function Badge({ status }) {
  const map = {
    success:    { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0', label:'Success' },
    failed:     { bg:'#fef2f2', color:'#dc2626', border:'#fca5a5', label:'Failed'  },
    inprogress: { bg:'#fffbeb', color:'#d97706', border:'#fde68a', label:'In Progress' },
  };
  const s = map[status] || map.success;
  return (
    <span style={{
      fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      letterSpacing:'0.02em', whiteSpace:'nowrap',
    }}>{s.label}</span>
  );
}

// Skeleton row
function SkeletonRow() {
  return (
    <div style={{ background:'#fff', border:'1px solid #f3f4f6', borderRadius:14, padding:'18px 20px', display:'flex', alignItems:'center', gap:16 }}>
      <div className="bp-skeleton" style={{ width:44, height:44, borderRadius:12, flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div className="bp-skeleton" style={{ height:14, width:'45%', marginBottom:8 }} />
        <div className="bp-skeleton" style={{ height:11, width:'30%' }} />
      </div>
      <div className="bp-skeleton" style={{ height:32, width:220, borderRadius:8 }} />
    </div>
  );
}

// Stat card
function StatCard({ icon, label, value, sub, color = '#16a34a', delay = 0 }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)',
      border:'1px solid rgba(255,255,255,0.18)', borderRadius:14,
      padding:'14px 20px', display:'flex', alignItems:'center', gap:12,
      minWidth:140, animation:`fadeSlideIn .4s ease ${delay}s both`,
    }}>
      <div style={{
        width:40, height:40, borderRadius:10, flexShrink:0,
        background:'rgba(255,255,255,0.15)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {React.cloneElement(icon, { size:19, color:'rgba(255,255,255,0.9)' })}
      </div>
      <div>
        <div style={{ fontSize:20, fontWeight:800, color:'#fff', lineHeight:1.1 }}>{value}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:2 }}>{label}</div>
        {sub && <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// Alert banner
function AlertBanner({ type, message, onClose }) {
  const map = {
    success: { bg:'#f0fdf4', border:'#86efac', icon:'#16a34a', text:'#15803d', Icon: CheckCircle },
    error:   { bg:'#fef2f2', border:'#fca5a5', icon:'#dc2626', text:'#b91c1c', Icon: AlertTriangle },
    info:    { bg:'#eff6ff', border:'#93c5fd', icon:'#2563eb', text:'#1d4ed8', Icon: Info },
  }[type] || { bg:'#eff6ff', border:'#93c5fd', icon:'#2563eb', text:'#1d4ed8', Icon: Info };
  const { Icon } = map;
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:12,
      background:map.bg, border:`1px solid ${map.border}`,
      borderRadius:12, padding:'14px 18px', marginBottom:20,
      animation:'fadeSlideIn .3s ease',
    }}>
      <Icon size={18} color={map.icon} style={{ marginTop:1, flexShrink:0 }} />
      <span style={{ fontSize:13, color:map.text, flex:1, lineHeight:1.6 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:map.icon, padding:0, lineHeight:1, fontSize:18 }}>×</button>
      )}
    </div>
  );
}

// Progress bar
function ProgressBar({ label }) {
  return (
    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:16, height:16, border:'2px solid #16a34a', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
        <span style={{ fontSize:13, fontWeight:600, color:'#15803d' }}>{label}</span>
      </div>
      <div style={{ background:'#dcfce7', borderRadius:20, height:6, overflow:'hidden' }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius:20, animation:'progressBar 3s ease forwards' }} />
      </div>
    </div>
  );
}

// Restore modal
function RestoreModal({ backup, onConfirm, onCancel, loading }) {
  return (
    <div className="bp-modal-overlay">
      <div className="bp-modal">
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#14532d,#166534)', padding:'24px 28px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RefreshCw size={22} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'#fff' }}>Restore Backup</h3>
            <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:2 }}>{formatDate(backup.lastModified)}</p>
          </div>
          <button onClick={onCancel} style={{ marginLeft:'auto', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, cursor:'pointer', padding:'6px 8px', color:'#fff' }}>
            <X size={16} />
          </button>
        </div>

        {/* Details */}
        <div style={{ padding:'24px 28px' }}>
          <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:'16px', marginBottom:20 }}>
            <p style={{ margin:'0 0 12px', fontSize:12, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em' }}>Backup Details</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { icon:<HardDrive size={14}/>, label:'Size', value: formatSize(backup.size) },
                { icon:<Clock size={14}/>,    label:'Created', value: timeAgo(backup.lastModified) },
                { icon:<Calendar size={14}/>, label:'Date', value: new Date(backup.lastModified).toLocaleDateString('en-GB') },
                { icon:<Database size={14}/>, label:'Format', value: 'JSON' },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:'#9ca3af' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:10, color:'#9ca3af' }}>{item.label}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', gap:10, padding:'12px 14px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, marginBottom:20 }}>
            <AlertTriangle size={16} color='#d97706' style={{ flexShrink:0, marginTop:1 }} />
            <p style={{ margin:0, fontSize:12, color:'#92400e', lineHeight:1.6 }}>
              This will merge the backup with your current data. Existing records are preserved — nothing will be permanently deleted.
            </p>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="bp-action-btn" onClick={onCancel}
              style={{ flex:1, justifyContent:'center', background:'#f3f4f6', color:'#374151' }}>
              Cancel
            </button>
            <button className="bp-action-btn" onClick={onConfirm} disabled={loading}
              style={{ flex:1, justifyContent:'center', background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff' }}>
              {loading ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/> Restoring…</> : <><RefreshCw size={14}/> Restore Now</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete modal
function DeleteModal({ onConfirm, onCancel, loading }) {
  return (
    <div className="bp-modal-overlay">
      <div className="bp-modal">
        <div style={{ padding:'28px 28px 0' }}>
          <div style={{ display:'flex', gap:14, marginBottom:20 }}>
            <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Trash2 size={20} color="#dc2626" />
            </div>
            <div>
              <h3 style={{ margin:'0 0 6px', fontSize:16, fontWeight:700, color:'#111827' }}>Delete Backup?</h3>
              <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.6 }}>
                This backup will be permanently removed and cannot be recovered.
              </p>
            </div>
          </div>
        </div>
        <div style={{ padding:'0 28px 28px', display:'flex', gap:10 }}>
          <button className="bp-action-btn" onClick={onCancel}
            style={{ flex:1, justifyContent:'center', background:'#f3f4f6', color:'#374151' }}>
            Cancel
          </button>
          <button className="bp-action-btn" onClick={onConfirm} disabled={loading}
            style={{ flex:1, justifyContent:'center', background:'#dc2626', color:'#fff' }}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Backup row card
function BackupRow({ backup, index, total, onDownload, onRestore, onDelete }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const handle = async (name, fn) => { setLoadingAction(name); try { await fn(); } finally { setLoadingAction(null); } };
  const name = formatBackupName(backup.key, index, total);

  return (
    <div className="bp-card" style={{
      background:'#fff', border:'1px solid #f0f0f0', borderRadius:14,
      padding:'16px 20px', display:'flex', alignItems:'center',
      gap:16, flexWrap:'wrap',
      animation:`fadeSlideIn .35s ease ${index * 0.06}s both`,
    }}>
      {/* Icon */}
      <div style={{
        width:44, height:44, borderRadius:12, flexShrink:0,
        background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',
        border:'1px solid #bbf7d0',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <FolderArchive size={20} color="#16a34a" />
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:160 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
          <span style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{name}</span>
          <Badge status="success" />
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'#9ca3af', display:'flex', alignItems:'center', gap:4 }}>
            <Clock size={11}/>{timeAgo(backup.lastModified)}
          </span>
          <span style={{ fontSize:12, color:'#9ca3af', display:'flex', alignItems:'center', gap:4 }}>
            <HardDrive size={11}/>{formatSize(backup.size)}
          </span>
          <span style={{ fontSize:12, color:'#9ca3af', display:'flex', alignItems:'center', gap:4 }}>
            <Calendar size={11}/>{new Date(backup.lastModified).toLocaleDateString('en-GB')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
        <button className="bp-action-btn" disabled={loadingAction==='download'}
          onClick={() => handle('download', () => onDownload(backup.key))}
          style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>
          <DownloadCloud size={14}/>{loadingAction==='download' ? 'Downloading…' : 'Download'}
        </button>
        <button className="bp-action-btn" disabled={loadingAction==='restore'}
          onClick={() => handle('restore', () => onRestore(backup))}
          style={{ background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe' }}>
          <RefreshCw size={14}/>{loadingAction==='restore' ? 'Restoring…' : 'Restore'}
        </button>
        <button className="bp-action-btn" disabled={loadingAction==='delete'}
          onClick={() => handle('delete', () => onDelete(backup.key))}
          style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5' }}>
          <Trash2 size={14}/>{loadingAction==='delete' ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const BackupPage = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [backups, setBackups]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [creating, setCreating]             = useState(false);
  const [restoring, setRestoring]           = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [alert, setAlert]                   = useState(null);
  const [restoreTarget, setRestoreTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [search, setSearch]                 = useState('');
  const [dateFilter, setDateFilter]         = useState('all');
  const [autoBackup, setAutoBackup]         = useState(false);
  const [showProgress, setShowProgress]     = useState(false);
  const [progressLabel, setProgressLabel]   = useState('');

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

  // Auto backup every 24h (UI only toggle for now)
  useEffect(() => {
    if (!autoBackup) return;
    const id = setInterval(() => {
      handleCreate(true);
    }, 86400000);
    return () => clearInterval(id);
  }, [autoBackup]);

  const handleCreate = async (silent = false) => {
    try {
      setCreating(true);
      setProgressLabel('Creating backup — collecting your family data…');
      setShowProgress(true);
      if (!silent) setAlert(null);
      const result = await backupService.createBackup(userId);
      setAlert({
        type:'success',
        message:`✅ Backup created — ${result.backup.stats.trees} tree(s), ${result.backup.stats.persons} person(s), ${result.backup.stats.stories} story(ies) secured.`,
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
      setProgressLabel('Restoring backup — writing data to database…');
      setShowProgress(true);
      const result = await backupService.restoreBackup(restoreTarget.key, userId);
      setAlert({
        type:'success',
        message:`✅ Restore complete — ${result.restored.trees} tree(s) and ${result.restored.persons} person(s) recovered.`,
      });
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
      setAlert({ type:'success', message:'Backup deleted successfully.' });
    } catch (err) {
      setAlert({ type:'error', message:`Delete failed: ${err.message}` });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Filtering
  const filtered = backups.filter(b => {
    const name = formatBackupName(b.key, 0, backups.length).toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || formatDate(b.lastModified).toLowerCase().includes(search.toLowerCase());
    const now = Date.now();
    const matchDate =
      dateFilter === 'all'   ? true :
      dateFilter === 'today' ? (now - new Date(b.lastModified)) < 86400000 :
      dateFilter === 'week'  ? (now - new Date(b.lastModified)) < 604800000 :
      dateFilter === 'month' ? (now - new Date(b.lastModified)) < 2592000000 : true;
    return matchSearch && matchDate;
  });

  const totalSize = backups.reduce((s, b) => s + (b.size || 0), 0);
  const lastBackup = backups[0];

  return (
    <>
      <style>{css}</style>

      <div style={{ minHeight:'100%', width:'100%', background:'#f8fafc' }}>

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <div style={{
          background:'linear-gradient(135deg, #0a3d1f 0%, #14532d 45%, #166534 100%)',
          padding:'36px 40px 44px', position:'relative', overflow:'hidden',
        }}>
          {/* bg decor */}
          {[{t:-60,r:-60,s:220},{t:20,r:180,s:100},{b:-80,r:60,s:180}].map((d,i)=>(
            <div key={i} style={{ position:'absolute', top:d.t, bottom:d.b, right:d.r, width:d.s, height:d.s, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
          ))}

          <div style={{ position:'relative', maxWidth:1000, margin:'0 auto' }}>
            {/* Title row */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:52, height:52, borderRadius:16, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(10px)' }}>
                  <Shield size={26} color="#fff"/>
                </div>
                <div>
                  <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
                    Data Backup & Recovery
                  </h1>
                  <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.65)' }}>
                    Your family heritage is automatically secured and recoverable at any time
                  </p>
                </div>
              </div>

              {/* Auto-backup toggle */}
              <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 16px', border:'1px solid rgba(255,255,255,0.15)' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#fff' }}>Auto Backup</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>Every 24 hours</div>
                </div>
                <label className="bp-toggle">
                  <input type="checkbox" checked={autoBackup} onChange={e => setAutoBackup(e.target.checked)} />
                  <span className="bp-toggle-slider"/>
                </label>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <StatCard icon={<FolderArchive/>} label="Total Backups"  value={loading ? '…' : backups.length} delay={0} />
              <StatCard icon={<HardDrive/>}    label="Storage Used"   value={loading ? '…' : formatSize(totalSize)} delay={0.05} />
              <StatCard icon={<Clock/>}        label="Last Backup"    value={lastBackup ? timeAgo(lastBackup.lastModified) : 'Never'} sub={lastBackup ? formatDate(lastBackup.lastModified) : ''} delay={0.1} />
              <StatCard icon={<Zap/>}          label="Status"         value={backups.length > 0 ? 'Protected' : 'No backups'} delay={0.15} />
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────── */}
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 40px 48px' }}>

          {/* Alerts */}
          {alert && <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

          {/* Progress */}
          {showProgress && <ProgressBar label={progressLabel} />}

          {/* Toolbar */}
          <div style={{
            background:'#fff', border:'1px solid #e5e7eb', borderRadius:16,
            padding:'16px 20px', marginBottom:20,
            display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
          }}>
            {/* Search */}
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search size={15} color="#9ca3af" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input
                className="bp-input"
                placeholder="Search backups by name or date…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:2 }}>
                  <X size={14}/>
                </button>
              )}
            </div>

            {/* Date filter */}
            <div style={{ position:'relative' }}>
              <Filter size={14} color="#9ca3af" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <select className="bp-select" style={{ paddingLeft:30 }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <ChevronDown size={14} color="#9ca3af" style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            </div>

            {/* Refresh */}
            <button className="bp-action-btn" onClick={loadBackups} disabled={loading}
              style={{ background:'#f3f4f6', color:'#374151', border:'1px solid #e5e7eb' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin .7s linear infinite' : 'none' }}/> Refresh
            </button>

            {/* Create */}
            <button className="bp-action-btn" onClick={() => handleCreate()} disabled={creating}
              style={{ background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', fontWeight:600 }}>
              <UploadCloud size={14}/>{creating ? 'Creating…' : 'Create Backup'}
            </button>
          </div>

          {/* Results info */}
          {!loading && (
            <div style={{ fontSize:13, color:'#9ca3af', marginBottom:14 }}>
              {filtered.length === 0 && backups.length > 0
                ? `No backups match your search`
                : filtered.length > 0
                ? `Showing ${filtered.length} of ${backups.length} backup${backups.length !== 1 ? 's' : ''}`
                : ''}
            </div>
          )}

          {/* Backup list */}
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[0,1,2].map(i => <SkeletonRow key={i}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              background:'#fff', border:'2px dashed #e5e7eb', borderRadius:16,
              padding:'64px 24px', textAlign:'center',
              animation:'fadeSlideIn .4s ease',
            }}>
              <div style={{ width:72, height:72, borderRadius:20, background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <Shield size={32} color="#16a34a"/>
              </div>
              <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700, color:'#111827' }}>
                {backups.length === 0 ? 'No backups yet' : 'No results found'}
              </h3>
              <p style={{ margin:'0 0 24px', fontSize:14, color:'#9ca3af', maxWidth:360, marginLeft:'auto', marginRight:'auto', lineHeight:1.7 }}>
                {backups.length === 0
                  ? 'Create your first backup to protect your family trees, member profiles, and stories.'
                  : 'Try adjusting your search or filter to find what you\'re looking for.'}
              </p>
              {backups.length === 0 && (
                <button className="bp-action-btn" onClick={() => handleCreate()} disabled={creating}
                  style={{ background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', fontWeight:600, fontSize:14, padding:'12px 24px' }}>
                  <UploadCloud size={16}/>{creating ? 'Creating…' : 'Create First Backup'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map((backup, i) => (
                <BackupRow
                  key={backup.key}
                  backup={backup}
                  index={i}
                  total={backups.length}
                  onDownload={handleDownload}
                  onRestore={(b) => setRestoreTarget(b)}
                  onDelete={(key) => setDeleteTarget(key)}
                />
              ))}
            </div>
          )}

          {/* Info footer */}
          <div style={{ marginTop:28, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'16px 20px', display:'flex', gap:12, alignItems:'flex-start' }}>
            <History size={15} color="#9ca3af" style={{ marginTop:1, flexShrink:0 }}/>
            <p style={{ margin:0, fontSize:12, color:'#9ca3af', lineHeight:1.8 }}>
              Backups include all family trees, member profiles, and stories.
              Media files (photos and audio) are stored separately and remain accessible via their original links.
              We recommend creating a backup before making major changes to your family tree.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {restoreTarget && (
        <RestoreModal
          backup={restoreTarget}
          onConfirm={handleRestore}
          onCancel={() => setRestoreTarget(null)}
          loading={restoring}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
};

export default BackupPage;