// src/pages/BackupPage.jsx
// Taf'Yaa — Data Backup & Recovery (Timeline Edition)
// Inspired by: Notion Version History + GitHub Commits + Google Drive Versions

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Clock, UploadCloud, DownloadCloud, Trash2,
  RefreshCw, AlertTriangle, CheckCircle, HardDrive,
  History, Zap, Search, Filter, ChevronDown, X,
  Calendar, Database, TreePine, Users, BookOpen,
  GitCommit, GitBranch, Star, Archive, AlertCircle,
  Eye, RotateCcw, Plus, Info
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
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(2)} MB`;
}
function formatDate(date) {
  return new Date(date).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function formatDateShort(date) {
  return new Date(date).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
}
function getYear(date) { return new Date(date).getFullYear(); }
function getMonthDay(date) {
  return new Date(date).toLocaleDateString('en-GB', { day:'2-digit', month:'long' });
}
function getBackupName(backup) {
  return backup.customName || formatDate(backup.lastModified);
}
function getBackupType(backup) {
  return backup.backupType || 'manual';
}

// Group backups by year
function groupByYear(backups) {
  const groups = {};
  backups.forEach(b => {
    const year = getYear(b.lastModified);
    if (!groups[year]) groups[year] = [];
    groups[year].push(b);
  });
  return Object.entries(groups).sort((a,b) => b[0]-a[0]);
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes progressBar { from{width:0%} to{width:100%} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

  .bp-timeline-row { transition: background .15s; cursor: pointer; }
  .bp-timeline-row:hover { background: #f9fafb !important; }

  .bp-btn { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;border:none;cursor:pointer;transition:all .15s;font-family:inherit; }
  .bp-btn:hover:not(:disabled){filter:brightness(.92);transform:scale(.98);}
  .bp-btn:disabled{opacity:.5;cursor:not-allowed;}

  .bp-input{width:100%;padding:10px 14px;font-size:14px;border:1.5px solid #e5e7eb;border-radius:10px;outline:none;background:#fff;color:#111827;transition:border-color .15s;box-sizing:border-box;font-family:inherit;}
  .bp-input:focus{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.12);}

  .bp-textarea{width:100%;padding:10px 14px;font-size:13px;border:1.5px solid #e5e7eb;border-radius:10px;outline:none;background:#fff;color:#111827;transition:border-color .15s;box-sizing:border-box;font-family:inherit;resize:vertical;min-height:72px;}
  .bp-textarea:focus{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.12);}

  .bp-search{width:100%;padding:10px 14px 10px 38px;font-size:13px;border:1.5px solid #e5e7eb;border-radius:10px;outline:none;background:#fff;transition:border-color .15s;box-sizing:border-box;font-family:inherit;}
  .bp-search:focus{border-color:#16a34a;}

  .bp-select{padding:9px 32px 9px 12px;font-size:13px;border:1.5px solid #e5e7eb;border-radius:10px;outline:none;background:#fff;color:#374151;cursor:pointer;appearance:none;font-family:inherit;}
  .bp-select:focus{border-color:#16a34a;}

  .bp-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;backdrop-filter:blur(4px);}
  .bp-modal{background:#fff;border-radius:20px;width:100%;max-width:520px;box-shadow:0 30px 80px rgba(0,0,0,.2);animation:slideUp .25s ease;overflow:hidden;}

  .bp-skeleton{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:6px;}
`;

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ type, isLatest }) {
  const badges = {
    latest:    { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0', label:'🟢 Latest',     dot:'#16a34a' },
    automatic: { bg:'#eff6ff', color:'#2563eb', border:'#bfdbfe', label:'🔵 Automatic',  dot:'#2563eb' },
    manual:    { bg:'#f5f3ff', color:'#7c3aed', border:'#ddd6fe', label:'🟣 Manual',     dot:'#7c3aed' },
    archived:  { bg:'#fffbeb', color:'#d97706', border:'#fde68a', label:'🟡 Archived',   dot:'#d97706' },
    failed:    { bg:'#fef2f2', color:'#dc2626', border:'#fca5a5', label:'⚠ Failed',      dot:'#dc2626' },
  };
  const b = isLatest ? badges.latest : (badges[type] || badges.manual);
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:b.bg, color:b.color, border:`1px solid ${b.border}`, whiteSpace:'nowrap' }}>
      {b.label}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ label }) {
  return (
    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:15, height:15, border:'2px solid #16a34a', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
        <span style={{ fontSize:13, fontWeight:600, color:'#15803d' }}>{label}</span>
      </div>
      <div style={{ background:'#dcfce7', borderRadius:20, height:5, overflow:'hidden' }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius:20, animation:'progressBar 4s ease forwards' }}/>
      </div>
    </div>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner({ type, message, onClose }) {
  const map = {
    success:{ bg:'#f0fdf4', border:'#86efac', icon:'#16a34a', text:'#15803d', Icon:CheckCircle },
    error:  { bg:'#fef2f2', border:'#fca5a5', icon:'#dc2626', text:'#b91c1c', Icon:AlertTriangle },
  }[type] || {};
  const { Icon } = map;
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:12, background:map.bg, border:`1px solid ${map.border}`, borderRadius:12, padding:'14px 18px', marginBottom:20, animation:'fadeIn .3s ease' }}>
      <Icon size={18} color={map.icon} style={{ marginTop:1, flexShrink:0 }}/>
      <span style={{ fontSize:13, color:map.text, flex:1, lineHeight:1.6 }}>{message}</span>
      {onClose && <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:map.icon, padding:0, fontSize:18, lineHeight:1 }}>×</button>}
    </div>
  );
}

// ─── Create Backup Modal ──────────────────────────────────────────────────────
function CreateBackupModal({ onConfirm, onCancel, loading }) {
  const [name, setName]         = useState('');
  const [description, setDesc]  = useState('');
  const [type, setType]         = useState('manual');
  const defaultName = `Snapshot · ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`;

  return (
    <div className="bp-modal-overlay">
      <div className="bp-modal">
        <div style={{ background:'linear-gradient(135deg,#14532d,#166534)', padding:'22px 26px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <GitCommit size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'#fff' }}>Create Snapshot</h3>
            <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:2 }}>Save the current state of your family tree</p>
          </div>
          <button onClick={onCancel} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, cursor:'pointer', padding:'6px 8px', color:'#fff' }}>
            <X size={16}/>
          </button>
        </div>

        <div style={{ padding:'22px 26px' }}>
          {/* Name */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>
              Snapshot Name
            </label>
            <input className="bp-input" placeholder={defaultName} value={name} onChange={e=>setName(e.target.value)} maxLength={80}/>
            <p style={{ margin:'5px 0 0', fontSize:11, color:'#9ca3af' }}>Leave empty to use the date automatically</p>
          </div>

          {/* Description */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>
              Description <span style={{ color:'#9ca3af', fontWeight:400 }}>(optional)</span>
            </label>
            <textarea className="bp-textarea" placeholder="e.g. Before adding the Ngaoundéré branch..." value={description} onChange={e=>setDesc(e.target.value)} maxLength={200}/>
          </div>

          {/* Type */}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:8 }}>Backup Type</label>
            <div style={{ display:'flex', gap:10 }}>
              {[
                { id:'manual', label:'Manual', desc:'Created by you', icon:'🟣' },
                { id:'automatic', label:'Automatic', desc:'Scheduled', icon:'🔵' },
              ].map(t => (
                <div key={t.id} onClick={()=>setType(t.id)} style={{
                  flex:1, padding:'10px 14px', borderRadius:10, cursor:'pointer',
                  border:`1.5px solid ${type===t.id?'#16a34a':'#e5e7eb'}`,
                  background: type===t.id ? '#f0fdf4' : '#fff',
                  transition:'all .15s',
                }}>
                  <div style={{ fontSize:16, marginBottom:3 }}>{t.icon}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:type===t.id?'#16a34a':'#374151' }}>{t.label}</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* What's included */}
          <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 14px', marginBottom:20 }}>
            <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:600, color:'#374151' }}>This snapshot includes:</p>
            {['Family trees & structure', 'All member profiles', 'Stories & oral histories', 'Timeline events'].map(item => (
              <div key={item} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                <CheckCircle size={12} color="#16a34a"/>
                <span style={{ fontSize:12, color:'#6b7280' }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="bp-btn" onClick={onCancel} style={{ flex:1, justifyContent:'center', background:'#f3f4f6', color:'#374151' }}>Cancel</button>
            <button className="bp-btn" onClick={()=>onConfirm({ name: name||defaultName, description, type })} disabled={loading}
              style={{ flex:2, justifyContent:'center', background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', fontWeight:600 }}>
              {loading
                ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/> Creating…</>
                : <><GitCommit size={15}/> Create Snapshot</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Restore Preview Modal ────────────────────────────────────────────────────
function RestoreModal({ backup, onConfirm, onCancel, loading }) {
  return (
    <div className="bp-modal-overlay">
      <div className="bp-modal">
        <div style={{ background:'linear-gradient(135deg,#1d4ed8,#2563eb)', padding:'22px 26px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RotateCcw size={22} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'#fff' }}>Restore Snapshot</h3>
            <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:2 }}>{getBackupName(backup)}</p>
          </div>
          <button onClick={onCancel} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, cursor:'pointer', padding:'6px 8px', color:'#fff' }}><X size={16}/></button>
        </div>

        <div style={{ padding:'22px 26px' }}>
          {/* Preview */}
          <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:'16px', marginBottom:18 }}>
            <p style={{ margin:'0 0 12px', fontSize:12, fontWeight:600, color:'#374151', textTransform:'uppercase', letterSpacing:'0.05em' }}>Snapshot Preview</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { icon:<Calendar size={14}/>, label:'Date', value:formatDate(backup.lastModified) },
                { icon:<HardDrive size={14}/>, label:'Size', value:formatSize(backup.size) },
                { icon:<Clock size={14}/>, label:'Created', value:timeAgo(backup.lastModified) },
                { icon:<Database size={14}/>, label:'Type', value:getBackupType(backup) === 'automatic' ? '🔵 Automatic' : '🟣 Manual' },
              ].map((item,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:'#9ca3af' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:10, color:'#9ca3af' }}>{item.label}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
            {backup.description && (
              <div style={{ marginTop:12, padding:'8px 10px', background:'#fff', borderRadius:8, fontSize:12, color:'#6b7280', fontStyle:'italic', border:'1px solid #e5e7eb' }}>
                "{backup.description}"
              </div>
            )}
          </div>

          {/* Warning */}
          <div style={{ display:'flex', gap:8, padding:'11px 14px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, marginBottom:18 }}>
            <AlertTriangle size={15} color="#d97706" style={{ flexShrink:0, marginTop:1 }}/>
            <p style={{ margin:0, fontSize:12, color:'#92400e', lineHeight:1.6 }}>
              Your family tree will be restored to this snapshot. This merges the backup with current data — nothing is permanently deleted.
            </p>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="bp-btn" onClick={onCancel} style={{ flex:1, justifyContent:'center', background:'#f3f4f6', color:'#374151' }}>Cancel</button>
            <button className="bp-btn" onClick={onConfirm} disabled={loading}
              style={{ flex:1, justifyContent:'center', background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', color:'#fff', fontWeight:600 }}>
              {loading
                ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/> Restoring…</>
                : <><RotateCcw size={14}/> Restore</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, loading }) {
  return (
    <div className="bp-modal-overlay">
      <div className="bp-modal">
        <div style={{ padding:'26px 26px 0' }}>
          <div style={{ display:'flex', gap:14, marginBottom:18 }}>
            <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Trash2 size={20} color="#dc2626"/>
            </div>
            <div>
              <h3 style={{ margin:'0 0 5px', fontSize:16, fontWeight:700, color:'#111827' }}>Delete Snapshot?</h3>
              <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.6 }}>This snapshot will be permanently removed and cannot be recovered.</p>
            </div>
          </div>
        </div>
        <div style={{ padding:'0 26px 26px', display:'flex', gap:10 }}>
          <button className="bp-btn" onClick={onCancel} style={{ flex:1, justifyContent:'center', background:'#f3f4f6', color:'#374151' }}>Cancel</button>
          <button className="bp-btn" onClick={onConfirm} disabled={loading}
            style={{ flex:1, justifyContent:'center', background:'#dc2626', color:'#fff', fontWeight:600 }}>
            {loading ? 'Deleting…' : <><Trash2 size={14}/> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Entry ───────────────────────────────────────────────────────────
function TimelineEntry({ backup, index, total, isLatest, onDownload, onRestore, onDelete, onExpand, expanded }) {
  const [action, setAction] = useState(null);
  const handle = async (name, fn) => { setAction(name); try { await fn(); } finally { setAction(null); } };
  const name = getBackupName(backup);
  const type = getBackupType(backup);
  const isFirst = index === 0;

  return (
    <div style={{ display:'flex', gap:0, animation:`fadeIn .35s ease ${index*0.05}s both` }}>
      {/* Timeline line + dot */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:32, flexShrink:0 }}>
        {/* dot */}
        <div style={{
          width: isLatest ? 14 : 10, height: isLatest ? 14 : 10,
          borderRadius:'50%', flexShrink:0, marginTop:18,
          background: isLatest ? '#16a34a' : type==='automatic' ? '#2563eb' : '#7c3aed',
          border: `2px solid ${isLatest ? '#16a34a' : type==='automatic' ? '#2563eb' : '#7c3aed'}`,
          boxShadow: isLatest ? '0 0 0 4px rgba(22,163,74,0.2)' : 'none',
          zIndex:1, position:'relative',
        }}/>
        {/* line */}
        {index < total - 1 && (
          <div style={{ flex:1, width:2, background:'linear-gradient(#e5e7eb,#f3f4f6)', minHeight:40 }}/>
        )}
      </div>

      {/* Card */}
      <div className="bp-timeline-row" onClick={()=>onExpand(backup.key)}
        style={{
          flex:1, marginLeft:12, marginBottom:12,
          background: expanded ? '#fafffe' : '#fff',
          border:`1.5px solid ${expanded ? '#bbf7d0' : '#f0f0f0'}`,
          borderRadius:14, overflow:'hidden',
          boxShadow: expanded ? '0 4px 20px rgba(22,163,74,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
          transition:'all .2s',
        }}>

        {/* Header row */}
        <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {/* Icon */}
          <div style={{
            width:38, height:38, borderRadius:10, flexShrink:0,
            background: isLatest ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : '#f9fafb',
            border:`1px solid ${isLatest ? '#bbf7d0' : '#e5e7eb'}`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <GitCommit size={18} color={isLatest ? '#16a34a' : '#9ca3af'}/>
          </div>

          {/* Name + meta */}
          <div style={{ flex:1, minWidth:140 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{name}</span>
              <StatusBadge type={type} isLatest={isLatest}/>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'#9ca3af', display:'flex', alignItems:'center', gap:3 }}>
                <Clock size={11}/>{timeAgo(backup.lastModified)}
              </span>
              <span style={{ fontSize:12, color:'#9ca3af', display:'flex', alignItems:'center', gap:3 }}>
                <HardDrive size={11}/>{formatSize(backup.size)}
              </span>
              <span style={{ fontSize:12, color:'#9ca3af', display:'flex', alignItems:'center', gap:3 }}>
                <Calendar size={11}/>{formatDate(backup.lastModified)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:7, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
            <button className="bp-btn" disabled={action==='download'}
              onClick={()=>handle('download',()=>onDownload(backup.key))}
              style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', padding:'6px 12px' }}>
              <DownloadCloud size={13}/>{action==='download'?'…':'Download'}
            </button>
            <button className="bp-btn" disabled={action==='restore'}
              onClick={()=>handle('restore',()=>onRestore(backup))}
              style={{ background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', padding:'6px 12px' }}>
              <RotateCcw size={13}/>{action==='restore'?'…':'Restore'}
            </button>
            <button className="bp-btn" disabled={action==='delete'}
              onClick={()=>handle('delete',()=>onDelete(backup.key))}
              style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5', padding:'6px 10px' }}>
              <Trash2 size={13}/>
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{ padding:'0 18px 16px', borderTop:'1px solid #f0fdf4', animation:'fadeIn .2s ease' }}>
            {backup.description && (
              <div style={{ background:'#f0fdf4', borderRadius:8, padding:'10px 12px', marginTop:12, fontSize:13, color:'#166534', fontStyle:'italic' }}>
                📝 "{backup.description}"
              </div>
            )}
            <div style={{ display:'flex', gap:16, marginTop:12, flexWrap:'wrap' }}>
              {[
                { label:'Full Date', value:formatDate(backup.lastModified) },
                { label:'Size', value:formatSize(backup.size) },
                { label:'Type', value:type === 'automatic' ? '🔵 Automatic' : '🟣 Manual' },
              ].map((item,i) => (
                <div key={i}>
                  <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{item.label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
  const [typeFilter, setTypeFilter]       = useState('all');
  const [expandedKey, setExpandedKey]     = useState(null);

  const loadBackups = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const list = await backupService.listBackups(userId);
      setBackups(list || []);
    } catch (err) {
      setAlert({ type:'error', message:`Could not load snapshots: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadBackups(); }, [loadBackups]);

  const handleCreate = async ({ name, description, type }) => {
    try {
      setCreating(true);
      setShowCreateModal(false);
      setProgressLabel('Creating snapshot of your family data…');
      setShowProgress(true);
      setAlert(null);
      const result = await backupService.createBackup(userId, name, description, type);
      setAlert({
        type:'success',
        message:`✅ Snapshot "${name}" created successfully!`,
      });
      await loadBackups();
    } catch (err) {
      setAlert({ type:'error', message:`Snapshot failed: ${err.message}` });
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
      setProgressLabel('Restoring your family data…');
      setShowProgress(true);
      await backupService.restoreBackup(restoreTarget.key, userId);
      setAlert({ type:'success', message:'✅ Family tree restored successfully!' });
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
      setAlert({ type:'success', message:'Snapshot deleted.' });
    } catch (err) {
      setAlert({ type:'error', message:`Delete failed: ${err.message}` });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleExpand = (key) => setExpandedKey(prev => prev === key ? null : key);

  // Filter
  const filtered = backups.filter(b => {
    const name = getBackupName(b).toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || getBackupType(b) === typeFilter;
    return matchSearch && matchType;
  });

  const grouped = groupByYear(filtered);
  const totalSize = backups.reduce((s,b) => s+(b.size||0), 0);
  const lastBackup = backups[0];

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight:'100%', width:'100%', background:'#f8fafc' }}>

        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg,#0a3d1f 0%,#14532d 45%,#166534 100%)', padding:'36px 40px 44px', position:'relative', overflow:'hidden' }}>
          {[{t:-60,r:-60,s:220},{t:20,r:180,s:100},{b:-80,r:60,s:180}].map((d,i)=>(
            <div key={i} style={{ position:'absolute', top:d.t, bottom:d.b, right:d.r, width:d.s, height:d.s, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
          ))}
          <div style={{ position:'relative', maxWidth:1000, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:52, height:52, borderRadius:16, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <GitBranch size={26} color="#fff"/>
                </div>
                <div>
                  <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>
                    Snapshot History
                  </h1>
                  <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.65)' }}>
                    Every version of your family tree, preserved forever
                  </p>
                </div>
              </div>
              <button className="bp-btn" onClick={()=>setShowCreateModal(true)} disabled={creating}
                style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)', fontSize:14, fontWeight:600, padding:'10px 20px' }}>
                <Plus size={16}/> New Snapshot
              </button>
            </div>

            {/* Stats */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {[
                { icon:'📸', label:'Total Snapshots', value: loading?'…':backups.length },
                { icon:'💾', label:'Storage Used',    value: loading?'…':formatSize(totalSize) },
                { icon:'🕐', label:'Last Snapshot',   value: lastBackup?timeAgo(lastBackup.lastModified):'Never' },
                { icon:'🛡️', label:'Status',          value: backups.length>0?'Protected':'No snapshots' },
              ].map((s,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'12px 20px', minWidth:120, animation:`fadeIn .4s ease ${i*.08}s both` }}>
                  <div style={{ fontSize:20, fontWeight:800, color:'#fff', lineHeight:1.1 }}>{s.icon} {s.value}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 40px 48px' }}>

          {alert && <AlertBanner type={alert.type} message={alert.message} onClose={()=>setAlert(null)}/>}
          {showProgress && <ProgressBar label={progressLabel}/>}

          {/* Toolbar */}
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'14px 18px', marginBottom:24, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search size={14} color="#9ca3af" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input className="bp-search" placeholder="Search snapshots…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:2 }}><X size={14}/></button>}
            </div>
            <div style={{ position:'relative' }}>
              <Filter size={13} color="#9ca3af" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <select className="bp-select" style={{ paddingLeft:28 }} value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="manual">🟣 Manual</option>
                <option value="automatic">🔵 Automatic</option>
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            </div>
            <button className="bp-btn" onClick={loadBackups} disabled={loading} style={{ background:'#f3f4f6', color:'#374151', border:'1px solid #e5e7eb' }}>
              <RefreshCw size={14} style={{ animation:loading?'spin .7s linear infinite':'none' }}/> Refresh
            </button>
            <button className="bp-btn" onClick={()=>setShowCreateModal(true)} disabled={creating}
              style={{ background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', fontWeight:600 }}>
              <Plus size={14}/> New Snapshot
            </button>
          </div>

          {/* Timeline */}
          {loading ? (
            <div style={{ padding:'32px 0', display:'flex', justifyContent:'center' }}>
              <div style={{ width:32, height:32, border:'3px solid #16a34a', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background:'#fff', border:'2px dashed #e5e7eb', borderRadius:16, padding:'64px 24px', textAlign:'center', animation:'fadeIn .4s ease' }}>
              <div style={{ width:72, height:72, borderRadius:20, background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <GitBranch size={32} color="#16a34a"/>
              </div>
              <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700, color:'#111827' }}>
                {backups.length===0 ? 'No snapshots yet' : 'No results found'}
              </h3>
              <p style={{ margin:'0 0 24px', fontSize:14, color:'#9ca3af', maxWidth:360, marginLeft:'auto', marginRight:'auto', lineHeight:1.7 }}>
                {backups.length===0
                  ? 'Create your first snapshot to start preserving your family tree history.'
                  : 'Try adjusting your search or filter.'}
              </p>
              {backups.length===0 && (
                <button className="bp-btn" onClick={()=>setShowCreateModal(true)}
                  style={{ background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff', fontWeight:600, fontSize:14, padding:'12px 24px' }}>
                  <Plus size={16}/> Create First Snapshot
                </button>
              )}
            </div>
          ) : (
            // Timeline grouped by year
            grouped.map(([year, yearBackups]) => (
              <div key={year} style={{ marginBottom:32, animation:'fadeIn .4s ease' }}>
                {/* Year header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ fontSize:24, fontWeight:800, color:'#111827' }}>{year}</div>
                  <div style={{ flex:1, height:1, background:'#e5e7eb' }}/>
                  <div style={{ fontSize:12, color:'#9ca3af' }}>{yearBackups.length} snapshot{yearBackups.length!==1?'s':''}</div>
                </div>

                {/* Timeline entries */}
                <div style={{ paddingLeft:8 }}>
                  {yearBackups.map((backup, i) => (
                    <div key={backup.key}>
                      {/* Date label */}
                      {(i===0 || getMonthDay(backup.lastModified) !== getMonthDay(yearBackups[i-1].lastModified)) && (
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, marginLeft:32 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:'#6b7280', background:'#f3f4f6', padding:'3px 10px', borderRadius:20 }}>
                            {getMonthDay(backup.lastModified)}
                          </span>
                        </div>
                      )}
                      <TimelineEntry
                        backup={backup}
                        index={i}
                        total={yearBackups.length}
                        isLatest={i===0 && year===grouped[0][0]}
                        expanded={expandedKey===backup.key}
                        onExpand={handleExpand}
                        onDownload={handleDownload}
                        onRestore={b=>setRestoreTarget(b)}
                        onDelete={key=>setDeleteTarget(key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Footer */}
          <div style={{ marginTop:20, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'14px 18px', display:'flex', gap:10, alignItems:'flex-start' }}>
            <Info size={15} color="#9ca3af" style={{ marginTop:1, flexShrink:0 }}/>
            <p style={{ margin:0, fontSize:12, color:'#9ca3af', lineHeight:1.8 }}>
              Snapshots include all family trees, member profiles, and stories. Media files are stored separately and remain accessible via their original links. Create a snapshot before making major changes to your family tree.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && <CreateBackupModal onConfirm={handleCreate} onCancel={()=>setShowCreateModal(false)} loading={creating}/>}
      {restoreTarget && <RestoreModal backup={restoreTarget} onConfirm={handleRestore} onCancel={()=>setRestoreTarget(null)} loading={restoring}/>}
      {deleteTarget && <DeleteModal onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)} loading={deleting}/>}
    </>
  );
};

export default BackupPage;
