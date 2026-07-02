// src/pages/ChatPage.jsx
// Taf'Yaa — Family Chat (Full Page)
// Fixes applied:
//   ✅ Collection name: 'families' → 'trees' (matches your actual Firestore schema)
//   ✅ Permission-safe: reads tree doc only if user is a member (memberUIDs array)
//   ✅ handleReact rewritten without col.firestore / col.path (those don't exist on collection refs)
//   ✅ onSnapshot error handler added so permission errors are caught gracefully
//   ✅ DM collection name: 'directMessages' (matches chatService.js)

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Send, X, Users, ArrowLeft, Search,
  Phone, Video, Plus, Camera, Film, MapPin,
  FileText, Image as ImageIcon, BookOpen,
  Lock, CheckCheck, Reply, Edit3, Globe, ChevronRight,
} from 'lucide-react';
import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, doc,
  setDoc, updateDoc, getDoc, arrayUnion, arrayRemove, deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  * { box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&display=swap');

  @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pop     { 0%{transform:scale(.6)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes appear  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }

  .cp-msg-input {
    flex:1; border:none; outline:none; background:transparent;
    font-size:14px; font-family:inherit; color:#111827;
    resize:none; max-height:120px; line-height:1.5; padding:0;
  }
  .cp-msg-input::placeholder { color:#9ca3af; }

  .cp-send-btn {
    width:44px; height:44px; border-radius:50%; border:none;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:all .2s; flex-shrink:0;
  }
  .cp-send-btn:hover:not(:disabled) { transform:scale(1.08); }
  .cp-send-btn:disabled { opacity:.5; cursor:not-allowed; }

  .cp-conv-item {
    display:flex; align-items:center; gap:12px; padding:12px 16px;
    cursor:pointer; transition:background .15s; border-bottom:1px solid #f5f5f5;
  }
  .cp-conv-item:hover  { background:#f9fafb; }
  .cp-conv-item.active { background:#f0fdf4; border-right:3px solid #1F724A; }

  .cp-msg-bubble {
    display:block; width:fit-content; min-width:60px; max-width:100%;
    padding:10px 14px; border-radius:18px;
    font-size:14px; line-height:1.55; word-break:break-word;
    animation:appear .18s ease; position:relative;
  }

  .cp-emoji-btn {
    background:none; border:none; cursor:pointer; font-size:18px;
    padding:4px 6px; border-radius:8px; transition:transform .15s; line-height:1;
  }
  .cp-emoji-btn:hover { transform:scale(1.3); background:#f3f4f6; }

  .cp-action-btn {
    display:flex; flex-direction:column; align-items:center; gap:4px;
    padding:12px 16px; border-radius:12px; border:none; cursor:pointer;
    transition:all .15s; font-family:inherit; background:none;
  }
  .cp-action-btn:hover { background:#f3f4f6; transform:scale(1.05); }

  .cp-tab {
    flex:1; padding:12px 0; font-size:13px; font-weight:600;
    border:none; cursor:pointer; transition:all .15s; font-family:inherit;
    border-bottom:2px solid transparent; background:none; color:#9ca3af;
  }
  .cp-tab.active { color:#1F724A; border-bottom-color:#1F724A; background:#f0fdf4; }

  .cp-search-input {
    width:100%; padding:9px 14px 9px 36px; border:1.5px solid #e5e7eb;
    border-radius:24px; font-size:13px; outline:none; background:#f9fafb;
    font-family:inherit; transition:border-color .15s;
  }
  .cp-search-input:focus { border-color:#1F724A; background:#fff; }

  .messages-scroll::-webkit-scrollbar { width:4px; }
  .messages-scroll::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }

  .cp-reply-bar {
    background:#f0fdf4; border-left:3px solid #1F724A;
    padding:8px 14px; margin:0 12px 6px; border-radius:8px;
    display:flex; align-items:center; justify-content:space-between;
    font-size:12px; color:#374151; animation:fadeIn .15s ease;
  }

  .cp-member-row {
    display:flex; align-items:center; gap:12px; padding:11px 16px;
    cursor:pointer; transition:background .15s; border-radius:10px;
  }
  .cp-member-row:hover { background:#f3f4f6; }

  .cp-modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.45);
    display:flex; align-items:center; justify-content:center;
    z-index:1000; padding:20px; backdrop-filter:blur(4px);
  }
  .cp-modal {
    background:#fff; border-radius:20px; width:100%; max-width:440px;
    max-height:80vh; overflow:hidden; display:flex; flex-direction:column;
    box-shadow:0 24px 64px rgba(0,0,0,.18); animation:slideUp .2s ease;
  }
  .cp-ctx-menu {
    position:fixed; background:#fff; border-radius:14px;
    box-shadow:0 8px 28px rgba(0,0,0,.18); border:1px solid #f0f0f0;
    overflow:hidden; z-index:200; min-width:160px; animation:appear .12s ease;
  }
  .cp-ctx-item {
    display:flex; align-items:center; gap:10px; padding:11px 16px;
    cursor:pointer; font-size:13px; font-weight:500; color:#111827;
    border:none; background:none; width:100%; text-align:left; font-family:inherit;
    transition:background .1s;
  }
  .cp-ctx-item:hover { background:#f9fafb; }
  .cp-ctx-item.danger { color:#dc2626; }
  .cp-ctx-item.danger:hover { background:#fef2f2; }
  .cp-search-bar {
    display:flex; align-items:center; gap:8px; padding:10px 16px;
    background:#f9fafb; border-bottom:1px solid #f0f0f0;
    animation:fadeIn .15s ease;
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return '';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
function fullTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function dateLabel(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' });
}

const EMOJI_REACTIONS = ['❤️', '😂', '🙏', '👏', '😮', '😢'];

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photo, size = 40, online = false, unread = 0 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const colors = ['#1F724A', '#2563eb', '#7c3aed', '#db2777', '#C9731E', '#0891b2', '#d97706'];
  const color  = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {photo
        ? <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .34, fontWeight: 700, color: '#fff' }}>{initials}</div>
      }
      {online  && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />}
      {unread > 0 && <div style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, background: '#1F724A', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', padding: '0 3px' }}>{unread > 99 ? '99+' : unread}</div>}
    </div>
  );
}

// ─── Date Separator ───────────────────────────────────────────────────────────
function DateSep({ date }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
      <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', background: '#f8fafc', padding: '3px 12px', borderRadius: 20, border: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>{dateLabel(date)}</span>
      <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
    </div>
  );
}

// ─── Reaction Picker ─────────────────────────────────────────────────────────
function ReactionPicker({ onPick, onClose }) {
  return (
    <div style={{ position: 'absolute', bottom: 44, left: 0, background: '#fff', borderRadius: 40, boxShadow: '0 8px 24px rgba(0,0,0,.15)', border: '1px solid #f0f0f0', padding: '6px 8px', display: 'flex', gap: 2, zIndex: 50, animation: 'pop .2s ease' }}>
      {EMOJI_REACTIONS.map(e => (
        <button key={e} className="cp-emoji-btn" onClick={() => { onPick(e); onClose(); }}>{e}</button>
      ))}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function ContextMenu({ x, y, msg, isOwn, onReply, onCopy, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const items = [
    { icon:'↩️', label:'Reply',        action: () => { onReply(msg); onClose(); } },
    { icon:'📋', label:'Copy text',    action: () => { navigator.clipboard?.writeText(msg.text||''); onClose(); } },
    ...(isOwn ? [{ icon:'🗑️', label:'Delete', danger:true, action: () => { onDelete(msg); onClose(); } }] : []),
  ];
  // Keep menu inside viewport
  const vw = window.innerWidth, vh = window.innerHeight;
  const left = x + 160 > vw ? x - 160 : x;
  const top  = y + items.length * 44 > vh ? y - items.length * 44 : y;
  return (
    <div ref={ref} className="cp-ctx-menu" style={{ top, left }}>
      {items.map(item => (
        <button key={item.label} className={`cp-ctx-item ${item.danger?'danger':''}`} onClick={item.action}>
          <span>{item.icon}</span>{item.label}
        </button>
      ))}
    </div>
  );
}

function Bubble({ msg, isOwn, showAvatar, showName, onReact, onReply, onDelete }) {
  const [showPicker, setShowPicker] = useState(false);
  const [hovered, setHovered]       = useState(false);
  const [ctx, setCtx]               = useState(null); // {x,y}
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!showPicker) return;
    const h = (e) => { if (!pickerRef.current?.contains(e.target)) setShowPicker(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showPicker]);

  const reactionCounts = msg.reactions
    ? Object.entries(msg.reactions).filter(([, uids]) => Array.isArray(uids) && uids.length > 0)
    : [];

  // System messages — centred pill style
  if (msg.type === 'system') {
    return (
      <div style={{ textAlign: 'center', padding: '4px 16px' }}>
        <span style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', padding: '3px 12px', borderRadius: 20 }}>{msg.text}</span>
      </div>
    );
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 2, padding: '0 12px', animation: 'fadeIn .2s ease' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }); }}
    >
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} msg={msg} isOwn={isOwn} onReply={onReply} onCopy={()=>{}} onDelete={onDelete} onClose={()=>setCtx(null)}/>}
      {!isOwn && <div style={{ width: 28, flexShrink: 0 }}>{showAvatar && <Avatar name={msg.senderName} photo={msg.senderPhoto} size={28} />}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '68%', position: 'relative', minWidth: 0 }}>
        {!isOwn && showName && <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 2, paddingLeft: 2 }}>{msg.senderName}</span>}

        {/* Reply-to quote */}
        {msg.replyTo && (
          <div style={{ background: isOwn ? 'rgba(255,255,255,0.15)' : '#f3f4f6', borderRadius: '8px 8px 0 0', padding: '6px 12px', marginBottom: -4, borderLeft: `3px solid ${isOwn ? 'rgba(255,255,255,0.5)' : '#1F724A'}`, maxWidth: '100%' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: isOwn ? 'rgba(255,255,255,0.7)' : '#1F724A', marginBottom: 2 }}>{msg.replyTo.senderName}</div>
            <div style={{ fontSize: 12, color: isOwn ? 'rgba(255,255,255,0.85)' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{msg.replyTo.text}</div>
          </div>
        )}

        <div className="cp-msg-bubble" style={{
          background:   isOwn ? 'linear-gradient(135deg,#14532d,#1F724A)' : '#fff',
          color:        isOwn ? '#fff' : '#111827',
          borderRadius: msg.replyTo
            ? (isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px')
            : (isOwn ? '18px 18px 4px 18px' : showAvatar ? '18px 18px 18px 4px' : '18px'),
          boxShadow:    isOwn ? '0 2px 8px rgba(31,114,74,.25)' : '0 1px 3px rgba(0,0,0,.08)',
          border:       isOwn ? 'none' : '1px solid #f0f0f0',
        }}>
          {/* Image preview */}
          {msg.type === 'image' && msg.mediaUrl && (
            <div style={{ marginBottom: msg.text ? 6 : 0 }}>
              <img
                src={msg.mediaUrl}
                alt={msg.fileName || 'image'}
                style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 10, display: 'block', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => window.open(msg.mediaUrl, '_blank')}
              />
            </div>
          )}
          {/* File card */}
          {msg.type === 'file' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: isOwn ? 'rgba(255,255,255,0.12)' : '#f3f4f6', borderRadius: 10, padding: '8px 12px', marginBottom: msg.text ? 4 : 0, cursor: 'pointer' }}
              onClick={() => msg.mediaUrl && window.open(msg.mediaUrl, '_blank')}>
              <FileText size={20} color={isOwn ? 'rgba(255,255,255,0.8)' : '#6b7280'} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.fileName || 'File'}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>Tap to open</div>
              </div>
            </div>
          )}
          {/* Story card */}
          {msg.type === 'story' && (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 10px', marginBottom: 4, borderLeft: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={14} /><span style={{ fontSize: 13, fontWeight: 600 }}>{msg.storyTitle || 'Family Story'}</span>
            </div>
          )}
          {/* Location */}
          {msg.type === 'location' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, opacity: .85 }}>
              <MapPin size={14} /><span style={{ fontSize: 13 }}>Shared their location</span>
            </div>
          )}
          {msg.text && msg.type !== 'image' && <span>{msg.text}</span>}
          {msg.type === 'image' && !msg.mediaUrl && msg.text && <span style={{ fontSize: 12, opacity: 0.7 }}>{msg.text}</span>}
        </div>

        {/* Reactions */}
        {reactionCounts.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
            {reactionCounts.map(([emoji, uids]) => (
              <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '2px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#374151', transition: 'all .15s' }}>
                <span>{emoji}</span><span style={{ fontSize: 11, fontWeight: 600 }}>{uids.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, padding: '0 2px' }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{fullTime(msg.createdAt)}</span>
          {isOwn && <CheckCheck size={12} color="#9ca3af" />}
        </div>

        {/* Hover actions */}
        {hovered && (
          <div style={{ position: 'absolute', top: -32, [isOwn ? 'left' : 'right']: 0, background: '#fff', borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,.12)', border: '1px solid #f0f0f0', display: 'flex', zIndex: 20, animation: 'appear .12s ease' }}>
            <div ref={pickerRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowPicker(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', fontSize: 16, display: 'flex', alignItems: 'center' }}>
                😊
              </button>
              {showPicker && <ReactionPicker onPick={e => onReact(msg.id, e)} onClose={() => setShowPicker(false)} />}
            </div>
            <button onClick={() => onReply(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', color: '#6b7280', borderLeft: '1px solid #f0f0f0' }}>
              <Reply size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Attachment Menu ──────────────────────────────────────────────────────────
function AttachMenu({ onSelect, onClose }) {
  const opts = [
    { icon: <ImageIcon size={22} />,  label: 'Photo',    color: '#2563eb', type: 'image'    },
    { icon: <Film size={22} />,       label: 'Video',    color: '#7c3aed', type: 'video'    },
    { icon: <FileText size={22} />,   label: 'Document', color: '#C9731E', type: 'file'     },
    { icon: <BookOpen size={22} />,   label: 'Story',    color: '#1F724A', type: 'story'    },
    { icon: <MapPin size={22} />,     label: 'Location', color: '#db2777', type: 'location' },
    { icon: <Camera size={22} />,     label: 'Camera',   color: '#d97706', type: 'camera'   },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 70, left: 12, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,.15)', border: '1px solid #f0f0f0', padding: '12px', animation: 'slideUp .2s ease', zIndex: 100 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
        {opts.map(o => (
          <button key={o.type} className="cp-action-btn" onClick={() => { onSelect(o.type); onClose(); }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: `${o.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: o.color }}>{o.icon}</div>
            <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── New DM Modal ─────────────────────────────────────────────────────────────
function NewDMModal({ members, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = members.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="cp-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp-modal">
        <div style={{ background: 'linear-gradient(135deg,#14532d,#1F724A)', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>New Message</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Choose a family member</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, cursor: 'pointer', padding: 6, color: '#fff', display: 'flex' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', position: 'relative' }}>
          <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input className="cp-search-input" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
        <div style={{ overflowY: 'auto', padding: '8px 12px', flex: 1 }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '24px 0' }}>No members found</div>
            : filtered.map(m => (
              <div key={m.userId} className="cp-member-row" onClick={() => onSelect(m)}>
                <Avatar name={m.name} photo={m.photo} size={44} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{m.role || 'Member'}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Conversation Window ──────────────────────────────────────────────────────
function ConversationWindow({ conv, currentUser, onBack }) {
  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState('');
  const [sending, setSending]       = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [replyTo, setReplyTo]       = useState(null);
  const [error, setError]           = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCallModal, setShowCallModal] = useState(null); // 'voice' | 'video'
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const fileRef    = useRef(null);
  const cameraRef  = useRef(null);

  useEffect(() => {
    if (!conv) return;
    setMessages([]);
    setError(null);

    const msgCol = conv.type === 'group'
      ? collection(db, 'chats', conv.id, 'messages')
      : collection(db, 'directMessages', [currentUser.uid, conv.userId].sort().join('_'), 'messages');

    const q = query(msgCol, orderBy('createdAt', 'asc'), limit(100));

    const unsub = onSnapshot(q,
      snap => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() })));
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
      },
      err => {
        console.error('messages error:', err);
        setError('Could not load messages. Check your Firestore rules for chats and directMessages collections.');
      }
    );
    return unsub;
  }, [conv?.id]);

  // ✅ FIXED handleReact — no longer uses col.firestore / col.path
  const handleReact = async (msgId, emoji) => {
    if (!conv) return;
    const msgPath = conv.type === 'group'
      ? doc(db, 'chats', conv.id, 'messages', msgId)
      : doc(db, 'directMessages', [currentUser.uid, conv.userId].sort().join('_'), 'messages', msgId);

    const current  = messages.find(m => m.id === msgId);
    const uids     = current?.reactions?.[emoji] || [];
    const already  = uids.includes(currentUser.uid);

    await updateDoc(msgPath, {
      [`reactions.${emoji}`]: already ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    }).catch(console.error);
  };

  const sendMsg = async (type = 'text', extra = {}) => {
    const trimmed = text.trim();
    if (type === 'text' && !trimmed) return;
    setSending(true);
    const captured = replyTo;
    setText('');
    setReplyTo(null);
    try {
      const payload = {
        text:        type === 'text' ? trimmed : (extra.text || ''),
        type,
        senderId:    currentUser.uid,
        senderName:  currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        senderPhoto: currentUser.profilePhoto || currentUser.photoURL || null,
        createdAt:   serverTimestamp(),
        readBy:      [currentUser.uid],
        reactions:   {},
        ...(captured ? { replyTo: { id: captured.id, text: captured.text, senderName: captured.senderName } } : {}),
        ...extra,
      };

      if (conv.type === 'group') {
        await addDoc(collection(db, 'chats', conv.id, 'messages'), payload);
        await setDoc(doc(db, 'chats', conv.id), {
          lastMessage:    payload.text || `[${type}]`,
          lastMessageAt:  serverTimestamp(),
          lastMessageBy:  payload.senderName,
          lastSenderId:   currentUser.uid,
        }, { merge: true });
      } else {
        const dmId = [currentUser.uid, conv.userId].sort().join('_');
        await addDoc(collection(db, 'directMessages', dmId, 'messages'), payload);
        await setDoc(doc(db, 'directMessages', dmId), {
          participants:  [currentUser.uid, conv.userId],
          lastMessage:   payload.text || `[${type}]`,
          lastMessageAt: serverTimestamp(),
          lastMessageBy: currentUser.uid,
        }, { merge: true });
      }
    } catch (err) {
      console.error('send error:', err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } };
  const handleAttach = (type) => {
    if (['image', 'video', 'file'].includes(type)) fileRef.current?.click();
    else if (type === 'camera')   cameraRef.current?.click();
    else if (type === 'story')    sendMsg('story',    { text: '📖 Shared a family story', storyTitle: 'Family Story' });
    else if (type === 'location') handleLocation();
  };

  const handleLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported by your browser'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        sendMsg('location', { text: `📍 Location shared\n${mapsUrl}`, mediaUrl: mapsUrl });
      },
      () => alert('Could not get your location. Please allow location access in your browser settings.')
    );
  };

  const handleDelete = async (msg) => {
    if (!conv) return;
    try {
      const path = conv.type === 'group'
        ? doc(db, 'chats', conv.id, 'messages', msg.id)
        : doc(db, 'directMessages', [currentUser.uid, conv.userId].sort().join('_'), 'messages', msg.id);
      await deleteDoc(path);
    } catch (err) { console.error('Delete failed:', err); }
  };

  const filteredMessages = searchTerm.trim()
    ? messages.filter(m => m.text?.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  const displayMessages = searchTerm.trim() ? filteredMessages : messages;
  const grouped = displayMessages.reduce((acc, msg, i) => {
    const prev  = displayMessages[i - 1];
    const cDate = msg.createdAt?.toDateString?.();
    const pDate = prev?.createdAt?.toDateString?.();
    acc.push({
      ...msg,
      showDate:   cDate !== pDate,
      showAvatar: !prev || prev.senderId !== msg.senderId || cDate !== pDate,
      showName:   (!prev || prev.senderId !== msg.senderId || cDate !== pDate) && msg.senderId !== currentUser.uid,
    });
    return acc;
  }, []);

  if (!conv) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MessageCircle size={32} color="#1F724A" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Family Chat</div>
        <div style={{ fontSize: 13, color: '#9ca3af', maxWidth: 240, lineHeight: 1.6 }}>Select a conversation on the left, or start a new message with a family member.</div>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', position: 'relative', minWidth: 0 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,.04)', zIndex: 10 }}>
        {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, display: 'flex', borderRadius: 8 }}><ArrowLeft size={20} /></button>}
        <Avatar name={conv.name} photo={conv.photo} size={40} online={conv.type === 'dm'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.name}</div>
          <div style={{ fontSize: 11, color: conv.type === 'group' ? '#9ca3af' : '#22c55e', fontWeight: 500 }}>
            {conv.type === 'group' ? `${conv.memberCount || 0} members` : 'Active now'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => setSearchOpen(o=>!o)}
            style={{ background: searchOpen?'#f0fdf4':'none', border:'none', cursor:'pointer', color: searchOpen?'#1F724A':'#9ca3af', padding:8, display:'flex', borderRadius:8 }}>
            <Search size={18}/>
          </button>
          <button onClick={() => setShowCallModal('voice')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:8, display:'flex', borderRadius:8 }}>
            <Phone size={18}/>
          </button>
          <button onClick={() => setShowCallModal('video')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:8, display:'flex', borderRadius:8 }}>
            <Video size={18}/>
          </button>
        </div>
      </div>

      {/* In-chat search bar */}
      {searchOpen && (
        <div className="cp-search-bar">
          <Search size={14} color="#9ca3af"/>
          <input
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            placeholder="Search messages…"
            autoFocus
            style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:13, fontFamily:'inherit', color:'#111827' }}
          />
          {searchTerm && (
            <span style={{ fontSize:11, color:'#9ca3af' }}>
              {filteredMessages.length} result{filteredMessages.length!==1?'s':''}
            </span>
          )}
          <button onClick={()=>{setSearchOpen(false);setSearchTerm('');}} style={{ background:'none',border:'none',cursor:'pointer',color:'#9ca3af',display:'flex',padding:2 }}>
            <X size={14}/>
          </button>
        </div>
      )}

      {/* Voice / Video call coming soon modal */}
      {showCallModal && (
        <div className="cp-modal-overlay" onClick={()=>setShowCallModal(null)}>
          <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:320, textAlign:'center', animation:'slideUp .2s ease', boxShadow:'0 24px 64px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>{showCallModal==='voice'?'📞':'📹'}</div>
            <div style={{ fontFamily:"'Fraunces',Georgia,serif", fontSize:20, fontWeight:600, color:'#111827', marginBottom:8 }}>
              {showCallModal==='voice'?'Voice Calls':'Video Calls'}
            </div>
            <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.7, marginBottom:20 }}>
              Voice and video calls are coming in <strong>Phase 2</strong> of Taf'Yaa. This feature will use WebRTC to connect family members in real time — no third-party app needed.
            </div>
            <button onClick={()=>setShowCallModal(null)}
              style={{ padding:'10px 28px', background:'linear-gradient(135deg,#14532d,#1F724A)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '10px 16px', fontSize: 12, color: '#dc2626', display: 'flex', gap: 8 }}>
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      {/* Messages */}
      <div className="messages-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {messages.length === 0 && !error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '60px 24px', textAlign: 'center', height: '100%' }}>
            <Avatar name={conv.name} photo={conv.photo} size={64} />
            <div>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 5 }}>{conv.name}</div>
              <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7 }}>
                {conv.type === 'group'
                  ? '🌱 Be the first to send a message to your family!'
                  : 'Start a private conversation. Only the two of you will see these messages.'}
              </div>
            </div>
          </div>
        ) : grouped.map((msg, idx) => (
          <div key={msg.id}>
            {msg.showDate && <DateSep date={msg.createdAt} />}
            <Bubble
              msg={msg}
              isOwn={msg.senderId === currentUser.uid}
              showAvatar={msg.showAvatar}
              showName={msg.showName}
              onReact={handleReact}
              onReply={setReplyTo}
              onDelete={handleDelete}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="cp-reply-bar">
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600, color: '#1F724A' }}>{replyTo.senderName}</span>
            <span style={{ marginLeft: 8, color: '#6b7280' }}>{replyTo.text}</span>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 2, display: 'flex' }}><X size={14} /></button>
        </div>
      )}

      {showAttach && <AttachMenu onSelect={handleAttach} onClose={() => setShowAttach(false)} />}
      {/* Camera capture */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }}
        onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return;
          e.target.value = '';
          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
          if (cloudName && uploadPreset) {
            try {
              const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', uploadPreset); fd.append('folder', 'tafyaa/chat');
              const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method:'POST', body:fd });
              const data = await res.json();
              if (data.secure_url) { sendMsg('image', { text:'', mediaUrl: data.secure_url, fileName: file.name }); return; }
            } catch {}
          }
          sendMsg('image', { text:'', mediaUrl: URL.createObjectURL(file), fileName: file.name });
        }}/>
      <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" style={{ display: 'none' }}
        onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return;
          e.target.value = '';
          const isImg = file.type.startsWith('image/');
          const type  = isImg ? 'image' : 'file';

          // Upload to Cloudinary unsigned preset, same as the rest of Taf'Yaa
          const cloudName   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

          if (cloudName && uploadPreset) {
            try {
              const fd = new FormData();
              fd.append('file', file);
              fd.append('upload_preset', uploadPreset);
              fd.append('folder', 'tafyaa/chat');
              const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: fd });
              const data = await res.json();
              const url  = data.secure_url || data.url;
              if (url) {
                sendMsg(type, { text: isImg ? '' : file.name, fileName: file.name, mediaUrl: url });
                return;
              }
            } catch (err) {
              console.warn('Cloudinary upload failed, sending as local preview:', err);
            }
          }

          // Fallback: use local object URL (visible only to sender until they refresh)
          const localUrl = URL.createObjectURL(file);
          sendMsg(type, { text: isImg ? '' : file.name, fileName: file.name, mediaUrl: localUrl });
        }} />

      {/* Input bar */}
      <div style={{ background: '#fff', borderTop: '1px solid #f0f0f0', padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: '#f3f4f6', borderRadius: 24, padding: '8px 8px 8px 16px', border: '1.5px solid transparent', transition: 'border-color .15s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = '#1F724A'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'transparent'}>
          <button onClick={() => setShowAttach(o => !o)}
            style={{ background: showAttach ? '#1F724A' : 'none', border: 'none', cursor: 'pointer', color: showAttach ? '#fff' : '#9ca3af', padding: 6, display: 'flex', borderRadius: '50%', transition: 'all .15s', marginBottom: 2 }}>
            <Plus size={20} />
          </button>
          <textarea ref={inputRef} className="cp-msg-input"
            placeholder="Type a message…" value={text} rows={1} maxLength={2000}
            onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            onKeyDown={handleKey}
            style={{ height: 'auto', minHeight: 28 }} />
          <button className="cp-send-btn" onClick={() => sendMsg()} disabled={!text.trim() || sending}
            style={{ background: text.trim() ? 'linear-gradient(135deg,#14532d,#1F724A)' : '#e5e7eb', marginBottom: 0 }}>
            <Send size={18} color={text.trim() ? '#fff' : '#9ca3af'} />
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#d1d5db', marginTop: 4 }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function ConvList({ conversations, selected, onSelect, search, setSearch, onNewDM }) {
  const filtered = conversations.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input className="cp-search-input" placeholder="Search conversations…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={onNewDM} title="New Message"
          style={{ width: 38, height: 38, borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #bbf7d0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F724A', flexShrink: 0 }}>
          <Edit3 size={16} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <MessageCircle size={28} color="#d1d5db" style={{ margin: '0 auto 8px', display: 'block' }} />
            <div style={{ color: '#9ca3af', fontSize: 13 }}>No conversations yet</div>
            <div style={{ color: '#d1d5db', fontSize: 12, marginTop: 4 }}>Tap the pencil icon to start one</div>
          </div>
        ) : filtered.map((conv, i) => (
          <div key={conv.id} className={`cp-conv-item ${selected?.id === conv.id ? 'active' : ''}`}
            onClick={() => onSelect(conv)} style={{ animation: `fadeIn .25s ease ${i * .04}s both` }}>
            <Avatar name={conv.name} photo={conv.photo} size={48} online={conv.type === 'dm'} unread={conv.unread || 0} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{ fontSize: 14, fontWeight: conv.unread ? 700 : 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{conv.name}</div>
                <div style={{ fontSize: 11, color: conv.unread ? '#1F724A' : '#9ca3af', flexShrink: 0 }}>{timeAgo(conv.lastMessageAt)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {conv.type === 'group' && <Users size={11} color="#9ca3af" />}
                {conv.type === 'dm'    && <Lock  size={11} color="#9ca3af" />}
                <span style={{ fontSize: 12, color: conv.unread ? '#374151' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: conv.unread ? 500 : 400 }}>
                  {conv.lastMessage || 'Start a conversation…'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { currentUser }           = useAuth();
  const { treeId }                = useParams();
  const navigate                  = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [conversations, setConvs] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [search, setSearch]       = useState('');
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [treeName, setTreeName]   = useState('Family Group Chat');
  const [showNewDM, setShowNewDM] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [showList, setShowList]   = useState(true);

  useEffect(() => {
    if (!treeId || !currentUser) return;

    const groupConvBase = { id: treeId, type: 'group', photo: null, unread: 0 };

    // FIX: ca9 ASSERTION ERROR — too many concurrent onSnapshot listeners
    // (FamilyTreePage already holds listeners for people/marriages/events/stories)
    // Use one-time getDoc for tree data and chat metadata.
    // Only the messages feed (inside ConversationWindow) stays real-time.
    let cancelled = false;

    const loadData = async () => {
      try {
        const treeSnap = await getDoc(doc(db, 'trees', treeId));
        if (cancelled || !treeSnap.exists()) { setLoading(false); return; }
        await processTree(treeSnap.data());
      } catch (err) {
        console.error('tree fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
      try {
        const metaSnap = await getDoc(doc(db, 'chats', treeId));
        if (cancelled) return;
        const d = metaSnap.exists() ? metaSnap.data() : {};
        setConvs(prev => {
          const without = prev.filter(c => c.id !== treeId);
          const group   = prev.find(c => c.type === 'group') || { ...groupConvBase };
          return [{ ...group, lastMessage: d.lastMessage || 'Be the first to say hello', lastMessageAt: d.lastMessageAt?.toDate?.() || null }, ...without];
        });
      } catch { /* chat meta not created yet */ }
    };

    async function processTree(tree) {
      if (cancelled) return;
      if (tree.familyName) setTreeName(tree.familyName + ' Family Chat');
      const rawMembers = (tree.members || []).map(m => ({
        userId: typeof m === 'string' ? m : m.userId,
        role:   typeof m === 'string' ? 'Member' : (m.role || 'Member'),
      })).filter(m => m.userId && m.userId !== currentUser.uid);

      const enriched = await Promise.all(rawMembers.map(async m => {
        try {
          const snap = await getDoc(doc(db, 'users', m.userId));
          if (snap.exists()) {
            const u = snap.data();
            return { ...m, name: u.displayName || u.name || u.email || m.userId, photo: u.profilePhoto || u.photoURL || u.photoUrl || null };
          }
        } catch { /* silent */ }
        return { ...m, name: m.userId.slice(0, 10) + '...', photo: null };
      }));

      if (cancelled) return;
      setMembers(enriched);
      const dmConvs = enriched.map(m => ({
        id: [currentUser.uid, m.userId].sort().join('_'), type: 'dm',
        userId: m.userId, name: m.name, photo: m.photo, role: m.role,
        lastMessage: 'Tap to send a message', lastMessageAt: null, unread: 0,
      }));
      setConvs(prev => {
        const group = prev.find(c => c.type === 'group') || { ...groupConvBase, name: treeName };
        return [group, ...dmConvs];
      });
    }

    loadData();
    return () => { cancelled = true; };
  }, [treeId, currentUser?.uid]);

  useEffect(() => {
    setConvs(prev => prev.map(c => c.type === 'group' ? { ...c, name: treeName, memberCount: members.length } : c));
  }, [treeName, members.length]);

  const handleSelect = (conv) => { setSelected(conv); if (isMobile) setShowList(false); };
  const handleBack   = () => { setSelected(null); setShowList(true); };
  const handleNewDM  = (member) => {
    setShowNewDM(false);
    handleSelect({
      id:            [currentUser.uid, member.userId].sort().join('_'),
      type:          'dm',
      userId:        member.userId,
      name:          member.name,
      photo:         member.photo,
      role:          member.role,
      lastMessage:   null,
      lastMessageAt: null,
    });
  };

  const filteredConvs = conversations.filter(c => {
    if (activeTab === 'groups') return c.type === 'group';
    if (activeTab === 'dms')    return c.type === 'dm';
    return true;
  });

  if (!treeId) return (
    <>
      <style>{css}</style>
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
        <MessageCircle size={40} color="#1F724A" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Family Chat</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Open a family tree first to start chatting.</div>
        </div>
        <button onClick={() => navigate('/my-trees')} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#14532d,#1F724A)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Go to My Trees
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
        {/* Sidebar */}
        {(!isMobile || showList) && (
          <div style={{ width: isMobile ? '100%' : 340, background: '#fff', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ background: 'linear-gradient(135deg,#14532d,#1F724A)', padding: '16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <button onClick={() => navigate(-1)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, cursor:'pointer', padding:6, color:'#fff', display:'flex' }}>
                  <ArrowLeft size={18}/>
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:'#fff', fontFamily:"'Fraunces',Georgia,serif" }}>{treeName}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:1 }}>{members.length+1} member{members.length!==0?'s':''}</div>
                </div>
              </div>
              {/* Cross-family Discover button */}
              <button
                onClick={() => navigate('/discover')}
                style={{ width:'100%', background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:10, padding:'8px 12px', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:600, fontFamily:'inherit', transition:'all .15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
                <Globe size={14}/>
                Explore other family trees
                <ChevronRight size={14} style={{ marginLeft:'auto' }}/>
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
              {[{ id: 'all', label: 'All' }, { id: 'groups', label: 'Groups' }, { id: 'dms', label: 'Messages' }].map(t => (
                <button key={t.id} className={`cp-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 24, height: 24, border: '3px solid #1F724A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Loading members…</div>
              </div>
            ) : (
              <ConvList
                conversations={filteredConvs}
                selected={selected}
                onSelect={handleSelect}
                search={search}
                setSearch={setSearch}
                onNewDM={() => setShowNewDM(true)}
              />
            )}
          </div>
        )}

        {/* Conversation */}
        {(!isMobile || !showList) && (
          <ConversationWindow conv={selected} currentUser={currentUser} onBack={isMobile ? handleBack : null} />
        )}
      </div>

      {showNewDM && <NewDMModal members={members} onSelect={handleNewDM} onClose={() => setShowNewDM(false)} />}
    </>
  );
}