// src/components/chat/FamilyChat.jsx
// Taf'Yaa — Family Tree Group Chat + DM + Role Requests

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Send, X, Users, ArrowLeft,
  Bell, ChevronDown, UserCheck, Clock, Check,
  CheckCheck, AlertCircle, Lock
} from 'lucide-react';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

  .fc-input {
    flex:1; padding:10px 16px; border:1.5px solid #e5e7eb;
    border-radius:24px; font-size:14px; outline:none;
    font-family:inherit; background:#f9fafb;
    transition:border-color .15s, background .15s;
  }
  .fc-input:focus { border-color:#16a34a; background:#fff; }

  .fc-send-btn {
    width:42px; height:42px; border-radius:50%; border:none;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:all .15s; flex-shrink:0;
  }
  .fc-send-btn:hover:not(:disabled) { filter:brightness(.9); transform:scale(.96); }
  .fc-send-btn:disabled { opacity:.5; cursor:not-allowed; }

  .fc-tab-btn {
    flex:1; padding:10px; font-size:13px; font-weight:600;
    border:none; cursor:pointer; transition:all .15s;
    font-family:inherit; border-bottom:2px solid transparent;
  }
  .fc-tab-btn.active { color:#16a34a; border-bottom-color:#16a34a; background:#f0fdf4; }
  .fc-tab-btn:not(.active) { color:#6b7280; background:#fff; }

  .fc-role-btn {
    padding:7px 14px; border-radius:8px; font-size:12px; font-weight:600;
    border:none; cursor:pointer; transition:all .15s; font-family:inherit;
  }
  .fc-role-btn:hover { filter:brightness(.92); }

  .fc-member-row:hover { background:#f9fafb !important; }
`;

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photo, size = 36 }) {
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
  const colors = ['#16a34a','#2563eb','#7c3aed','#db2777','#ea580c','#0891b2'];
  const color = colors[name?.charCodeAt(0) % colors.length] || '#16a34a';
  if (photo) return <img src={photo} alt={name} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>;
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:size*0.35,fontWeight:700,color:'#fff'}}>
      {initials}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }) {
  return (
    <div style={{display:'flex',flexDirection:isOwn?'row-reverse':'row',alignItems:'flex-end',gap:8,marginBottom:12,animation:'fadeIn .25s ease'}}>
      {!isOwn && <Avatar name={msg.senderName} photo={msg.senderPhoto} size={30}/>}
      <div style={{maxWidth:'72%'}}>
        {!isOwn && (
          <div style={{fontSize:11,fontWeight:600,color:'#6b7280',marginBottom:3,paddingLeft:4}}>{msg.senderName}</div>
        )}
        <div style={{
          background: isOwn ? 'linear-gradient(135deg,#14532d,#16a34a)' : '#f3f4f6',
          color: isOwn ? '#fff' : '#111827',
          padding:'10px 14px', borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          fontSize:14, lineHeight:1.5, wordBreak:'break-word',
          boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
        }}>
          {msg.text}
        </div>
        <div style={{fontSize:10,color:'#9ca3af',marginTop:3,textAlign:isOwn?'right':'left',paddingLeft:4,paddingRight:4}}>
          {chatService.formatTime(msg.createdAt)}
        </div>
      </div>
    </div>
  );
}

// ─── Group Chat ───────────────────────────────────────────────────────────────
function GroupChat({ treeId, currentUser, treeName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = chatService.subscribeToGroupChat(treeId, setMessages);
    return unsub;
  }, [treeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await chatService.sendGroupMessage({
        treeId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        userPhoto: currentUser.photoURL,
        text,
      });
      setText('');
    } finally { setSending(false); }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Header */}
      <div style={{padding:'12px 16px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'center',gap:10,background:'#f9fafb'}}>
        <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#14532d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Users size={18} color="#fff"/>
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>{treeName || 'Family Tree'}</div>
          <div style={{fontSize:11,color:'#9ca3af'}}>Group Chat · All members</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column'}}>
        {messages.length === 0 ? (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#9ca3af',textAlign:'center',gap:12}}>
            <MessageCircle size={40} color="#d1d5db"/>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:'#6b7280',marginBottom:4}}>No messages yet</div>
              <div style={{fontSize:12}}>Be the first to say hello to your family! 👋</div>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === currentUser.uid}/>
          ))
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:'12px 16px',borderTop:'1px solid #f0f0f0',display:'flex',gap:10,alignItems:'center',background:'#fff'}}>
        <input
          className="fc-input"
          placeholder="Type a message…"
          value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={handleKey}
          maxLength={1000}
        />
        <button className="fc-send-btn" onClick={send} disabled={!text.trim()||sending}
          style={{background: text.trim() ? 'linear-gradient(135deg,#14532d,#16a34a)' : '#e5e7eb'}}>
          <Send size={18} color={text.trim()?'#fff':'#9ca3af'}/>
        </button>
      </div>
    </div>
  );
}

// ─── Direct Messages ──────────────────────────────────────────────────────────
function DirectMessages({ currentUser, members, treeId }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [messages, setMessages]             = useState([]);
  const [text, setText]                     = useState('');
  const [sending, setSending]               = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!selectedMember) return;
    const unsub = chatService.subscribeToDM(currentUser.uid, selectedMember.userId, setMessages);
    return unsub;
  }, [selectedMember]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !selectedMember || sending) return;
    setSending(true);
    try {
      await chatService.sendDirectMessage({
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || 'User',
        fromUserPhoto: currentUser.photoURL,
        toUserId: selectedMember.userId,
        toUserName: selectedMember.name,
        text,
      });
      setText('');
    } finally { setSending(false); }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const otherMembers = (members || []).filter(m => m.userId !== currentUser.uid);

  if (selectedMember) {
    return (
      <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
        {/* Header */}
        <div style={{padding:'12px 16px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'center',gap:10,background:'#f9fafb'}}>
          <button onClick={()=>{setSelectedMember(null);setMessages([]);}} style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280',padding:4,display:'flex'}}>
            <ArrowLeft size={18}/>
          </button>
          <Avatar name={selectedMember.name} size={34}/>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>{selectedMember.name}</div>
            <div style={{fontSize:11,color:'#9ca3af'}}>{selectedMember.role || 'Member'}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column'}}>
          {messages.length === 0 ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#9ca3af',textAlign:'center',gap:12}}>
              <MessageCircle size={40} color="#d1d5db"/>
              <div style={{fontSize:12}}>Start a conversation with {selectedMember.name}!</div>
            </div>
          ) : (
            messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId===currentUser.uid}/>
            ))
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{padding:'12px 16px',borderTop:'1px solid #f0f0f0',display:'flex',gap:10,alignItems:'center',background:'#fff'}}>
          <input className="fc-input" placeholder={`Message ${selectedMember.name}…`} value={text} onChange={e=>setText(e.target.value)} onKeyDown={handleKey} maxLength={1000}/>
          <button className="fc-send-btn" onClick={send} disabled={!text.trim()||sending}
            style={{background:text.trim()?'linear-gradient(135deg,#14532d,#16a34a)':'#e5e7eb'}}>
            <Send size={18} color={text.trim()?'#fff':'#9ca3af'}/>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid #f0f0f0',background:'#f9fafb'}}>
        <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>Direct Messages</div>
        <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>Chat privately with a family member</div>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {otherMembers.length === 0 ? (
          <div style={{padding:24,textAlign:'center',color:'#9ca3af',fontSize:13}}>
            No other members in this tree yet.
          </div>
        ) : (
          otherMembers.map(member => (
            <div key={member.userId} className="fc-member-row" onClick={()=>setSelectedMember(member)}
              style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',cursor:'pointer',borderBottom:'1px solid #f9fafb',transition:'background .15s'}}>
              <Avatar name={member.name} size={40}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{member.name}</div>
                <div style={{fontSize:12,color:'#9ca3af'}}>{member.role || 'Member'}</div>
              </div>
              <Send size={15} color="#9ca3af"/>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Role Requests ────────────────────────────────────────────────────────────
function RoleRequests({ treeId, currentUser, userRole, members }) {
  const [requests, setRequests]       = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [requestedRole, setRequestedRole] = useState('Editor');
  const [message, setMessage]         = useState('');
  const [sending, setSending]         = useState(false);
  const [success, setSuccess]         = useState(false);

  const isAdmin = userRole === 'Admin' || userRole === 'Owner';

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = chatService.subscribeToRoleRequests(treeId, setRequests);
    return unsub;
  }, [treeId, isAdmin]);

  const submitRequest = async () => {
    setSending(true);
    try {
      await chatService.sendRoleRequest({
        treeId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        currentRole: userRole || 'Member',
        requestedRole,
        message,
      });
      setSuccess(true);
      setShowForm(false);
      setMessage('');
    } finally { setSending(false); }
  };

  const respond = async (requestId, status) => {
    await chatService.respondToRoleRequest(requestId, status, currentUser.uid);
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid #f0f0f0',background:'#f9fafb'}}>
        <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>Role Requests</div>
        <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>
          {isAdmin ? 'Manage member role requests' : 'Request a role upgrade from the admin'}
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
        {/* Success */}
        {success && (
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            <Check size={16} color="#16a34a"/>
            <span style={{fontSize:13,color:'#15803d'}}>Request sent! The admin will review it soon.</span>
          </div>
        )}

        {/* Member: request form */}
        {!isAdmin && (
          <div>
            <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:12,padding:'16px',marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:4}}>Your current role</div>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600,color:'#16a34a'}}>
                <UserCheck size={13}/>{userRole || 'Member'}
              </div>
            </div>

            {!showForm ? (
              <button onClick={()=>setShowForm(true)}
                style={{width:'100%',padding:'12px',borderRadius:10,border:'2px dashed #e5e7eb',background:'none',cursor:'pointer',fontSize:13,color:'#6b7280',fontFamily:'inherit',transition:'all .15s'}}
                onMouseEnter={e=>{e.target.style.borderColor='#16a34a';e.target.style.color='#16a34a';}}
                onMouseLeave={e=>{e.target.style.borderColor='#e5e7eb';e.target.style.color='#6b7280';}}>
                + Request a role upgrade
              </button>
            ) : (
              <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'16px',animation:'fadeIn .3s ease'}}>
                <div style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>Request Role</div>
                <select value={requestedRole} onChange={e=>setRequestedRole(e.target.value)}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:13,marginBottom:10,fontFamily:'inherit',outline:'none',background:'#fff'}}>
                  <option value="Editor">Editor — Can add/edit members</option>
                  <option value="Moderator">Moderator — Can manage stories</option>
                  <option value="Admin">Admin — Full access</option>
                </select>
                <textarea
                  placeholder="Why do you need this role? (optional)"
                  value={message}
                  onChange={e=>setMessage(e.target.value)}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:13,fontFamily:'inherit',resize:'vertical',minHeight:80,outline:'none',boxSizing:'border-box',marginBottom:10}}
                />
                <div style={{display:'flex',gap:8}}>
                  <button className="fc-role-btn" onClick={()=>setShowForm(false)} style={{background:'#f3f4f6',color:'#374151'}}>Cancel</button>
                  <button className="fc-role-btn" onClick={submitRequest} disabled={sending}
                    style={{flex:1,background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff'}}>
                    {sending?'Sending…':'Send Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin: pending requests */}
        {isAdmin && (
          <div>
            {requests.length === 0 ? (
              <div style={{textAlign:'center',padding:'32px 16px',color:'#9ca3af'}}>
                <UserCheck size={36} color="#d1d5db" style={{marginBottom:8}}/>
                <div style={{fontSize:13}}>No pending role requests</div>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'14px',marginBottom:12,animation:'fadeIn .3s ease'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                    <Avatar name={req.userName} size={36}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{req.userName}</div>
                      <div style={{fontSize:12,color:'#9ca3af'}}>
                        {req.currentRole} → <strong style={{color:'#16a34a'}}>{req.requestedRole}</strong>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:'#9ca3af'}}>{chatService.formatTime(req.createdAt)}</div>
                  </div>
                  {req.message && (
                    <div style={{background:'#f9fafb',borderRadius:8,padding:'8px 10px',fontSize:12,color:'#6b7280',marginBottom:10,lineHeight:1.5}}>
                      "{req.message}"
                    </div>
                  )}
                  <div style={{display:'flex',gap:8}}>
                    <button className="fc-role-btn" onClick={()=>respond(req.id,'rejected')} style={{flex:1,background:'#fef2f2',color:'#dc2626',border:'1px solid #fca5a5'}}>
                      ✕ Reject
                    </button>
                    <button className="fc-role-btn" onClick={()=>respond(req.id,'approved')} style={{flex:1,background:'linear-gradient(135deg,#14532d,#16a34a)',color:'#fff'}}>
                      ✓ Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Chat Component ──────────────────────────────────────────────────────
const FamilyChat = ({ treeId, treeName, members = [], userRole, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('group');
  const [unread, setUnread]       = useState(0);

  if (!isOpen) return null;

  return (
    <>
      <style>{css}</style>
      <div style={{
        position:'fixed', bottom:20, right:20,
        width:380, height:560,
        background:'#fff',
        borderRadius:20,
        boxShadow:'0 20px 60px rgba(0,0,0,0.18)',
        display:'flex', flexDirection:'column',
        zIndex:1000,
        overflow:'hidden',
        animation:'slideIn .3s ease',
        border:'1px solid #e5e7eb',
      }}>
        {/* Top bar */}
        <div style={{background:'linear-gradient(135deg,#14532d,#166534)',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <MessageCircle size={18} color="#fff"/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>Family Chat</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.7)'}}>{treeName || 'Your Tree'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,cursor:'pointer',padding:8,color:'#fff',display:'flex'}}>
            <X size={16}/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid #f0f0f0',flexShrink:0}}>
          {[
            { id:'group', label:'Group', icon:<Users size={13}/> },
            { id:'dm',    label:'Direct', icon:<MessageCircle size={13}/> },
            { id:'roles', label:'Roles', icon:<UserCheck size={13}/> },
          ].map(tab => (
            <button key={tab.id} className={`fc-tab-btn ${activeTab===tab.id?'active':''}`}
              onClick={()=>setActiveTab(tab.id)}
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          {activeTab==='group' && (
            <GroupChat treeId={treeId} currentUser={currentUser} treeName={treeName}/>
          )}
          {activeTab==='dm' && (
            <DirectMessages currentUser={currentUser} members={members} treeId={treeId}/>
          )}
          {activeTab==='roles' && (
            <RoleRequests treeId={treeId} currentUser={currentUser} userRole={userRole} members={members}/>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Chat Button (floating) ───────────────────────────────────────────────────
export const ChatButton = ({ treeId, treeName, members, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FamilyChat
        treeId={treeId}
        treeName={treeName}
        members={members}
        userRole={userRole}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
      {/* Floating button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={{
          position:'fixed', bottom:24, right:24,
          width:56, height:56, borderRadius:'50%',
          background:'linear-gradient(135deg,#14532d,#16a34a)',
          border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 20px rgba(22,163,74,0.4)',
          zIndex:999, transition:'all .2s',
          animation:'fadeIn .3s ease',
        }}
          onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'}
          onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
          <MessageCircle size={24} color="#fff"/>
        </button>
      )}
    </>
  );
};

export default FamilyChat;
