// src/components/chat/FamilyChat.jsx
// Taf'Yaa — Professional Family Chat
// Inspired by: WhatsApp Web + Slack + iMessage

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Send, X, Users, ArrowLeft,
  UserCheck, Check, CheckCheck, Smile, Paperclip,
  MoreVertical, Search, Phone, Video, Info,
  ChevronDown, Bell, Settings, Plus, Crown,
  Shield, Edit3, Trash2, Reply, Heart
} from 'lucide-react';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @keyframes fadeIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes bounce   { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
  @keyframes pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  @keyframes appear   { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }

  .fc-input {
    flex:1; padding:10px 16px; border:none; outline:none;
    font-size:14px; font-family:inherit; background:transparent;
    color:#111827; resize:none; max-height:120px; line-height:1.5;
  }
  .fc-input::placeholder { color:#9ca3af; }

  .fc-send-btn {
    width:40px; height:40px; border-radius:50%; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:all .2s; flex-shrink:0;
  }
  .fc-send-btn:hover:not(:disabled) { transform:scale(1.08); filter:brightness(.92); }
  .fc-send-btn:disabled { opacity:.5; cursor:not-allowed; }

  .fc-msg-bubble {
    max-width:72%; padding:10px 14px;
    border-radius:18px; font-size:14px;
    line-height:1.5; word-break:break-word;
    position:relative; transition:all .15s;
    animation: appear .2s ease;
  }
  .fc-msg-bubble:hover .fc-msg-actions { opacity:1; }

  .fc-msg-actions {
    position:absolute; top:-32px; opacity:0;
    display:flex; gap:4px; background:#fff;
    border:1px solid #e5e7eb; border-radius:20px;
    padding:4px 8px; box-shadow:0 2px 12px rgba(0,0,0,.1);
    transition:opacity .15s; white-space:nowrap; z-index:10;
  }

  .fc-member-row {
    display:flex; align-items:center; gap:12px;
    padding:10px 16px; cursor:pointer; transition:background .15s;
  }
  .fc-member-row:hover { background:#f0fdf4; }
  .fc-member-row.active { background:#f0fdf4; border-right:3px solid #16a34a; }

  .fc-tab {
    flex:1; padding:10px 0; font-size:13px; font-weight:600;
    border:none; cursor:pointer; transition:all .15s; font-family:inherit;
    border-bottom:2px solid transparent; background:none;
  }
  .fc-tab.active { color:#16a34a; border-bottom-color:#16a34a; }
  .fc-tab:not(.active) { color:#9ca3af; }
  .fc-tab:hover:not(.active) { color:#374151; }

  .fc-role-btn {
    padding:8px 16px; border-radius:9px; font-size:13px; font-weight:600;
    border:none; cursor:pointer; transition:all .15s; font-family:inherit;
  }
  .fc-role-btn:hover { filter:brightness(.92); }

  .fc-online-dot {
    width:10px; height:10px; border-radius:50%;
    background:#22c55e; border:2px solid #fff;
    position:absolute; bottom:0; right:0;
    animation:pulse 2s infinite;
  }

  /* Scrollbar */
  .fc-messages::-webkit-scrollbar { width:4px; }
  .fc-messages::-webkit-scrollbar-track { background:transparent; }
  .fc-messages::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }
`;

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', animation:'fadeIn .3s ease' }}>
      <div style={{ display:'flex', gap:4, background:'#f3f4f6', padding:'10px 14px', borderRadius:'18px 18px 18px 4px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#9ca3af', animation:`bounce 1.2s ease ${i*.2}s infinite` }}/>
        ))}
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photo, size=36, online=false }) {
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
  const colors = ['#16a34a','#2563eb','#7c3aed','#db2777','#ea580c','#0891b2'];
  const color = colors[(name?.charCodeAt(0)||0) % colors.length];
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      {photo
        ? <img src={photo} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover' }}/>
        : <div style={{ width:size, height:size, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.35, fontWeight:700, color:'#fff' }}>{initials}</div>
      }
      {online && <div className="fc-online-dot"/>}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, showAvatar, showName }) {
  const [liked, setLiked] = useState(false);
  const timeStr = chatService.formatTime(msg.createdAt);

  return (
    <div style={{ display:'flex', flexDirection:isOwn?'row-reverse':'row', alignItems:'flex-end', gap:8, marginBottom:2, padding:'0 16px', animation:'fadeIn .2s ease' }}>
      {/* Avatar — only show for others, and only when needed */}
      {!isOwn && (
        <div style={{ width:28, flexShrink:0 }}>
          {showAvatar && <Avatar name={msg.senderName} photo={msg.senderPhoto} size={28}/>}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', alignItems:isOwn?'flex-end':'flex-start', maxWidth:'72%' }}>
        {/* Sender name */}
        {!isOwn && showName && (
          <span style={{ fontSize:11, fontWeight:600, color:'#6b7280', marginBottom:3, paddingLeft:4 }}>
            {msg.senderName}
          </span>
        )}

        <div style={{ position:'relative' }}>
          {/* Reaction actions on hover */}
          <div className="fc-msg-actions" style={{ [isOwn?'right':'left']:-8 }}>
            <button onClick={()=>setLiked(!liked)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:'2px' }}>
              {liked ? '❤️' : '🤍'}
            </button>
            <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:'2px' }}>
              <Reply size={13} color="#6b7280"/>
            </button>
          </div>

          {/* Bubble */}
          <div className="fc-msg-bubble" style={{
            background: isOwn ? 'linear-gradient(135deg,#14532d,#16a34a)' : '#f3f4f6',
            color: isOwn ? '#fff' : '#111827',
            borderRadius: isOwn ? '18px 18px 4px 18px' : showAvatar ? '18px 18px 18px 4px' : '18px',
            boxShadow: isOwn ? '0 2px 8px rgba(22,163,74,.25)' : '0 1px 2px rgba(0,0,0,.06)',
          }}>
            {msg.text}
          </div>
        </div>

        {/* Time + status */}
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3, paddingLeft:4, paddingRight:4 }}>
          <span style={{ fontSize:10, color:'#9ca3af' }}>{timeStr}</span>
          {isOwn && <CheckCheck size={12} color="#9ca3af"/>}
        </div>
      </div>
    </div>
  );
}

// ─── Date separator ───────────────────────────────────────────────────────────
function DateSeparator({ date }) {
  const label = (() => {
    const d = new Date(date);
    const today = new Date();
    const diff = Math.floor((today - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long' });
  })();
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', animation:'fadeIn .3s ease' }}>
      <div style={{ flex:1, height:1, background:'#f0f0f0' }}/>
      <span style={{ fontSize:11, fontWeight:600, color:'#9ca3af', background:'#f8fafc', padding:'3px 12px', borderRadius:20, border:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>
        {label}
      </span>
      <div style={{ flex:1, height:1, background:'#f0f0f0' }}/>
    </div>
  );
}

// ─── Group Chat ───────────────────────────────────────────────────────────────
function GroupChat({ treeId, treeName, currentUser }) {
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [membersCount, setMembersCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    const unsub = chatService.subscribeToGroupChat(treeId, msgs => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 50);
    });
    return unsub;
  }, [treeId]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      await chatService.sendGroupMessage({
        treeId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        userPhoto: currentUser.photoURL,
        text: trimmed,
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Group messages by date and consecutive sender
  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i-1];
    const currDate = msg.createdAt ? new Date(msg.createdAt).toDateString() : '';
    const prevDate = prev?.createdAt ? new Date(prev.createdAt).toDateString() : '';
    const showDate = currDate !== prevDate;
    const showAvatar = !prev || prev.senderId !== msg.senderId || showDate;
    const showName = showAvatar && msg.senderId !== currentUser.uid;
    acc.push({ ...msg, showDate, showAvatar, showName });
    return acc;
  }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#fff' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:12, background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#14532d,#16a34a)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Users size={20} color="#fff"/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>{treeName || 'Family Tree'}</div>
          <div style={{ fontSize:11, color:'#9ca3af', display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }}/>
            Group · All members
          </div>
        </div>
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:6, borderRadius:8, display:'flex' }}>
          <Search size={18}/>
        </button>
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:6, borderRadius:8, display:'flex' }}>
          <MoreVertical size={18}/>
        </button>
      </div>

      {/* Messages */}
      <div className="fc-messages" style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', paddingTop:8, paddingBottom:8, background:'#fafffe' }}>
        {messages.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:24, textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MessageCircle size={28} color="#16a34a"/>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:'#111827', marginBottom:4 }}>Start the conversation!</div>
              <div style={{ fontSize:13, color:'#9ca3af', lineHeight:1.6 }}>Be the first to send a message to your family. 👋</div>
            </div>
          </div>
        ) : (
          groupedMessages.map((msg, i) => (
            <div key={msg.id}>
              {msg.showDate && <DateSeparator date={msg.createdAt}/>}
              <MessageBubble
                msg={msg}
                isOwn={msg.senderId === currentUser.uid}
                showAvatar={msg.showAvatar}
                showName={msg.showName}
              />
            </div>
          ))
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input area */}
      <div style={{ padding:'10px 12px', borderTop:'1px solid #f0f0f0', background:'#fff' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:8, background:'#f3f4f6', borderRadius:24, padding:'4px 4px 4px 16px', border:'1.5px solid transparent', transition:'border-color .15s' }}
          onFocus={e=>e.currentTarget.style.borderColor='#16a34a'}
          onBlur={e=>e.currentTarget.style.borderColor='transparent'}>
          <textarea
            ref={inputRef}
            className="fc-input"
            placeholder="Type a message…"
            value={text}
            onChange={e=>{ setText(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'; }}
            onKeyDown={handleKey}
            rows={1}
            maxLength={2000}
            style={{ height:'auto', minHeight:36 }}
          />
          <button className="fc-send-btn" onClick={send} disabled={!text.trim()||sending}
            style={{ background:text.trim()?'linear-gradient(135deg,#14532d,#16a34a)':'#e5e7eb', marginBottom:2 }}>
            <Send size={17} color={text.trim()?'#fff':'#9ca3af'}/>
          </button>
        </div>
        <div style={{ textAlign:'center', fontSize:10, color:'#d1d5db', marginTop:4 }}>
          Press Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

// ─── DM Conversation ──────────────────────────────────────────────────────────
function DMConversation({ currentUser, member, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    const unsub = chatService.subscribeToDM(currentUser.uid, member.userId, msgs => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 50);
    });
    return unsub;
  }, [member.userId]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      await chatService.sendDirectMessage({
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || 'User',
        fromUserPhoto: currentUser.photoURL,
        toUserId: member.userId,
        toUserName: member.name,
        text: trimmed,
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i-1];
    const currDate = msg.createdAt ? new Date(msg.createdAt).toDateString() : '';
    const prevDate = prev?.createdAt ? new Date(prev.createdAt).toDateString() : '';
    const showDate = currDate !== prevDate;
    const showAvatar = !prev || prev.senderId !== msg.senderId || showDate;
    acc.push({ ...msg, showDate, showAvatar, showName: false });
    return acc;
  }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:10, background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', padding:4, display:'flex', borderRadius:8 }}>
          <ArrowLeft size={18}/>
        </button>
        <Avatar name={member.name} size={36} online/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>{member.name}</div>
          <div style={{ fontSize:11, color:'#22c55e', fontWeight:500 }}>Online</div>
        </div>
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:6, display:'flex', borderRadius:8 }}>
          <MoreVertical size={18}/>
        </button>
      </div>

      {/* Messages */}
      <div className="fc-messages" style={{ flex:1, overflowY:'auto', paddingTop:8, paddingBottom:8, background:'#fafffe' }}>
        {messages.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:24, textAlign:'center', height:'100%' }}>
            <Avatar name={member.name} size={56}/>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:'#111827', marginBottom:4 }}>{member.name}</div>
              <div style={{ fontSize:13, color:'#9ca3af', lineHeight:1.6 }}>This is the beginning of your private conversation.</div>
            </div>
          </div>
        ) : (
          groupedMessages.map((msg,i) => (
            <div key={msg.id}>
              {msg.showDate && <DateSeparator date={msg.createdAt}/>}
              <MessageBubble msg={msg} isOwn={msg.senderId===currentUser.uid} showAvatar={msg.showAvatar} showName={false}/>
            </div>
          ))
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:'10px 12px', borderTop:'1px solid #f0f0f0', background:'#fff' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:8, background:'#f3f4f6', borderRadius:24, padding:'4px 4px 4px 16px' }}>
          <textarea ref={inputRef} className="fc-input" placeholder={`Message ${member.name}…`} value={text}
            onChange={e=>{ setText(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'; }}
            onKeyDown={handleKey} rows={1} maxLength={2000} style={{ height:'auto', minHeight:36 }}/>
          <button className="fc-send-btn" onClick={send} disabled={!text.trim()||sending}
            style={{ background:text.trim()?'linear-gradient(135deg,#14532d,#16a34a)':'#e5e7eb', marginBottom:2 }}>
            <Send size={17} color={text.trim()?'#fff':'#9ca3af'}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DM List ──────────────────────────────────────────────────────────────────
function DMList({ currentUser, members, onSelect }) {
  const [search, setSearch] = useState('');
  const others = (members||[]).filter(m => m.userId !== currentUser.uid);
  const filtered = others.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f0f0', background:'#fff' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom:10 }}>Direct Messages</div>
        <div style={{ position:'relative' }}>
          <Search size={14} color="#9ca3af" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members…"
            style={{ width:'100%', padding:'8px 12px 8px 32px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#f9fafb' }}/>
        </div>
      </div>

      {/* Members list */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding:24, textAlign:'center', color:'#9ca3af', fontSize:13 }}>
            {others.length === 0 ? 'No other members yet' : 'No results found'}
          </div>
        ) : (
          filtered.map((member,i) => (
            <div key={member.userId} className="fc-member-row"
              onClick={()=>onSelect(member)}
              style={{ animation:`fadeIn .2s ease ${i*.04}s both` }}>
              <Avatar name={member.name} size={44} online={i<2}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{member.name}</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:1 }}>{member.role||'Member'}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <Send size={15} color="#d1d5db"/>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Role Requests ────────────────────────────────────────────────────────────
function RoleRequestsPanel({ treeId, currentUser, userRole }) {
  const [requests, setRequests]   = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [reqRole, setReqRole]     = useState('Editor');
  const [message, setMessage]     = useState('');
  const [sending, setSending]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const isAdmin = userRole==='Admin'||userRole==='Owner';

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = chatService.subscribeToRoleRequests(treeId, setRequests);
    return unsub;
  }, [treeId, isAdmin]);

  const submit = async () => {
    setSending(true);
    try {
      await chatService.sendRoleRequest({ treeId, userId:currentUser.uid, userName:currentUser.displayName||'User', currentRole:userRole||'Member', requestedRole:reqRole, message });
      setSuccess(true); setShowForm(false); setMessage('');
    } finally { setSending(false); }
  };

  const respond = async (id, status) => {
    await chatService.respondToRoleRequest(id, status, currentUser.uid);
    setRequests(prev => prev.filter(r=>r.id!==id));
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f0f0', background:'#fff' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>Role Requests</div>
        <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>
          {isAdmin ? 'Manage member role upgrade requests' : 'Request a role upgrade from the admin'}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        {/* Success */}
        {success && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:8, animation:'fadeIn .3s ease' }}>
            <Check size={16} color="#16a34a"/>
            <span style={{ fontSize:13, color:'#15803d' }}>Request sent! The admin will review it soon.</span>
          </div>
        )}

        {/* Member view */}
        {!isAdmin && (
          <div>
            <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>Your current role</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600, color:'#16a34a' }}>
                <UserCheck size={13}/>{userRole||'Member'}
              </div>
            </div>

            {!showForm ? (
              <button onClick={()=>setShowForm(true)} style={{ width:'100%', padding:14, borderRadius:12, border:'2px dashed #e5e7eb', background:'none', cursor:'pointer', fontSize:13, color:'#6b7280', fontFamily:'inherit', transition:'all .15s' }}
                onMouseEnter={e=>{e.target.style.borderColor='#16a34a';e.target.style.color='#16a34a';}}
                onMouseLeave={e=>{e.target.style.borderColor='#e5e7eb';e.target.style.color='#6b7280';}}>
                + Request role upgrade
              </button>
            ) : (
              <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16, animation:'fadeIn .3s ease' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:10 }}>Request Role Upgrade</div>
                <select value={reqRole} onChange={e=>setReqRole(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, marginBottom:10, fontFamily:'inherit', outline:'none' }}>
                  <option value="Editor">Editor — Can add and edit members</option>
                  <option value="Moderator">Moderator — Can manage stories</option>
                  <option value="Admin">Admin — Full access</option>
                </select>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Why do you need this role? (optional)"
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:13, fontFamily:'inherit', resize:'vertical', minHeight:72, outline:'none', boxSizing:'border-box', marginBottom:10 }}/>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="fc-role-btn" onClick={()=>setShowForm(false)} style={{ background:'#f3f4f6', color:'#374151' }}>Cancel</button>
                  <button className="fc-role-btn" onClick={submit} disabled={sending} style={{ flex:1, background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff' }}>
                    {sending ? 'Sending…' : 'Send Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin view */}
        {isAdmin && (
          requests.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 16px', color:'#9ca3af' }}>
              <UserCheck size={36} color="#d1d5db" style={{ marginBottom:10 }}/>
              <div style={{ fontSize:13 }}>No pending requests</div>
            </div>
          ) : (
            requests.map((req,i) => (
              <div key={req.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:14, marginBottom:12, animation:`fadeIn .3s ease ${i*.06}s both` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <Avatar name={req.userName} size={38}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{req.userName}</div>
                    <div style={{ fontSize:12, color:'#9ca3af' }}>
                      {req.currentRole} → <strong style={{ color:'#16a34a' }}>{req.requestedRole}</strong>
                    </div>
                  </div>
                  <div style={{ fontSize:10, color:'#9ca3af' }}>{chatService.formatTime(req.createdAt)}</div>
                </div>
                {req.message && (
                  <div style={{ background:'#f9fafb', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#6b7280', marginBottom:10, fontStyle:'italic' }}>
                    "{req.message}"
                  </div>
                )}
                <div style={{ display:'flex', gap:8 }}>
                  <button className="fc-role-btn" onClick={()=>respond(req.id,'rejected')} style={{ flex:1, background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5' }}>✕ Reject</button>
                  <button className="fc-role-btn" onClick={()=>respond(req.id,'approved')} style={{ flex:1, background:'linear-gradient(135deg,#14532d,#16a34a)', color:'#fff' }}>✓ Approve</button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

// ─── Main Chat Panel ──────────────────────────────────────────────────────────
const FamilyChat = ({ treeId, treeName, members=[], userRole, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab]         = useState('group');
  const [selectedMember, setSelectedMember] = useState(null);
  const [unreadCount, setUnreadCount]     = useState(0);

  if (!isOpen || !currentUser) return null;

  return (
    <>
      <style>{css}</style>
      <div style={{
        position:'fixed', bottom:84, right:20,
        width:400, height:600,
        background:'#fff', borderRadius:20,
        boxShadow:'0 20px 60px rgba(0,0,0,.18)',
        display:'flex', flexDirection:'column',
        zIndex:1000, overflow:'hidden',
        animation:'slideIn .25s ease',
        border:'1px solid #e5e7eb',
      }}>
        {/* Top bar */}
        <div style={{ background:'linear-gradient(135deg,#14532d,#166534)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <MessageCircle size={18} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Family Chat</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>{treeName||'Your Family'}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, cursor:'pointer', padding:'6px 8px', color:'#fff', display:'flex' }}>
            <X size={16}/>
          </button>
        </div>

        {/* Tabs */}
        {!selectedMember && (
          <div style={{ display:'flex', borderBottom:'1px solid #f0f0f0', background:'#fff', flexShrink:0 }}>
            {[
              { id:'group',   label:'Group',   icon:<Users size={13}/> },
              { id:'dm',      label:'Direct',  icon:<MessageCircle size={13}/> },
              { id:'roles',   label:'Roles',   icon:<UserCheck size={13}/> },
            ].map(tab => (
              <button key={tab.id} className={`fc-tab ${activeTab===tab.id?'active':''}`}
                onClick={()=>setActiveTab(tab.id)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          {activeTab==='group' && <GroupChat treeId={treeId} treeName={treeName} currentUser={currentUser}/>}
          {activeTab==='dm' && !selectedMember && <DMList currentUser={currentUser} members={members} onSelect={setSelectedMember}/>}
          {activeTab==='dm' && selectedMember && <DMConversation currentUser={currentUser} member={selectedMember} onBack={()=>setSelectedMember(null)}/>}
          {activeTab==='roles' && <RoleRequestsPanel treeId={treeId} currentUser={currentUser} userRole={userRole}/>}
        </div>
      </div>
    </>
  );
};

// ─── Floating Chat Button ─────────────────────────────────────────────────────
export const ChatButton = ({ treeId, treeName, members=[], userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  return (
    <>
      <style>{css}</style>
      <FamilyChat treeId={treeId} treeName={treeName} members={members} userRole={userRole} isOpen={isOpen} onClose={()=>setIsOpen(false)}/>

      {/* Floating button */}
      <button onClick={()=>setIsOpen(o=>!o)} style={{
        position:'fixed', bottom:20, right:20,
        width:56, height:56, borderRadius:'50%',
        background: isOpen ? '#dc2626' : 'linear-gradient(135deg,#14532d,#16a34a)',
        border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 4px 20px rgba(${isOpen?'220,38,38':'22,163,74'},.4)`,
        zIndex:1001, transition:'all .25s',
        animation:'fadeIn .3s ease',
      }}
        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'}
        onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
        {isOpen ? <X size={24} color="#fff"/> : <MessageCircle size={24} color="#fff"/>}
        {/* Unread badge */}
        {!isOpen && unread > 0 && (
          <div style={{ position:'absolute', top:0, right:0, width:20, height:20, borderRadius:'50%', background:'#dc2626', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff' }}>
            {unread}
          </div>
        )}
      </button>
    </>
  );
};

export default FamilyChat;