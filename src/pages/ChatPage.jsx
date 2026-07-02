// src/pages/ChatPage.jsx
// FIXED: correct firebase import + working real-time chat

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Send, X, Users, ArrowLeft, Search,
  MoreVertical, Paperclip, Image as ImageIcon,
  FileText, Check, CheckCheck, Plus, Camera,
  Film, BookOpen, MapPin, Lock, Phone, Video
} from 'lucide-react';
import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, where, doc,
  setDoc, getDoc, getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

const css = `
  @keyframes fadeIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes appear   { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  .cp-input { flex:1;border:none;outline:none;background:transparent;font-size:14px;font-family:inherit;color:#111827;resize:none;max-height:120px;line-height:1.5;padding:0; }
  .cp-input::placeholder { color:#9ca3af; }
  .cp-send-btn { width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0; }
  .cp-send-btn:hover:not(:disabled) { transform:scale(1.08); }
  .cp-send-btn:disabled { opacity:.5;cursor:not-allowed; }
  .cp-conv-item { display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;transition:background .15s;border-bottom:1px solid #f5f5f5; }
  .cp-conv-item:hover { background:#f9fafb; }
  .cp-conv-item.active { background:#f0fdf4;border-right:3px solid #16a34a; }
  .cp-msg-bubble { max-width:68%;padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.55;word-break:break-word;animation:appear .18s ease; }
  .cp-tab { flex:1;padding:12px 0;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .15s;font-family:inherit;border-bottom:2px solid transparent;background:none;color:#9ca3af; }
  .cp-tab.active { color:#16a34a;border-bottom-color:#16a34a;background:#f0fdf4; }
  .messages-scroll::-webkit-scrollbar { width:4px; }
  .messages-scroll::-webkit-scrollbar-thumb { background:#e5e7eb;border-radius:4px; }
`;

function timeAgo(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  const diff = Math.floor((Date.now()-d)/1000);
  if (diff<60) return 'Now';
  if (diff<3600) return `${Math.floor(diff/60)}m`;
  if (diff<86400) return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
}
function fullTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}
function dateLabel(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  if (d.toDateString()===now.toDateString()) return 'Today';
  const yest=new Date(now); yest.setDate(yest.getDate()-1);
  if (d.toDateString()===yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long'});
}

function Avatar({ name, photo, size=40, online=false }) {
  const initials = name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
  const colors=['#16a34a','#2563eb','#7c3aed','#db2777','#ea580c','#0891b2'];
  const color=colors[(name?.charCodeAt(0)||0)%colors.length];
  return (
    <div style={{position:'relative',flexShrink:0}}>
      {photo?<img src={photo} alt={name} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover'}}/>
        :<div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.34,fontWeight:700,color:'#fff'}}>{initials}</div>}
      {online&&<div style={{position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',background:'#22c55e',border:'2px solid #fff'}}/>}
    </div>
  );
}

function DateSep({ date }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px'}}>
      <div style={{flex:1,height:1,background:'#f0f0f0'}}/>
      <span style={{fontSize:11,fontWeight:600,color:'#9ca3af',background:'#f8fafc',padding:'3px 12px',borderRadius:20,border:'1px solid #f0f0f0',whiteSpace:'nowrap'}}>{dateLabel(date)}</span>
      <div style={{flex:1,height:1,background:'#f0f0f0'}}/>
    </div>
  );
}

function Bubble({ msg, isOwn, showAvatar, showName }) {
  const time = msg.createdAt?.toDate ? msg.createdAt.toDate() : msg.createdAt ? new Date(msg.createdAt) : null;
  return (
    <div style={{display:'flex',flexDirection:isOwn?'row-reverse':'row',alignItems:'flex-end',gap:8,marginBottom:2,padding:'0 12px',animation:'fadeIn .2s ease'}}>
      {!isOwn&&<div style={{width:28,flexShrink:0}}>{showAvatar&&<Avatar name={msg.senderName} photo={msg.senderPhoto} size={28}/>}</div>}
      <div style={{display:'flex',flexDirection:'column',alignItems:isOwn?'flex-end':'flex-start',maxWidth:'68%'}}>
        {!isOwn&&showName&&<span style={{fontSize:11,fontWeight:600,color:'#6b7280',marginBottom:2,paddingLeft:2}}>{msg.senderName}</span>}
        <div className="cp-msg-bubble" style={{
          background:isOwn?'linear-gradient(135deg,#14532d,#16a34a)':'#fff',
          color:isOwn?'#fff':'#111827',
          borderRadius:isOwn?'18px 18px 4px 18px':showAvatar?'18px 18px 18px 4px':'18px',
          boxShadow:isOwn?'0 2px 8px rgba(22,163,74,.2)':'0 1px 3px rgba(0,0,0,.08)',
          border:isOwn?'none':'1px solid #f0f0f0',
        }}>
          {msg.type==='image'&&msg.mediaUrl&&<img src={msg.mediaUrl} alt="shared" style={{width:'100%',borderRadius:10,marginBottom:4,maxWidth:200}}/>}
          {msg.type==='file'&&<div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.15)',borderRadius:8,padding:'6px 10px',marginBottom:4}}><FileText size={18}/><span style={{fontSize:12}}>{msg.fileName||'File'}</span></div>}
          {msg.text&&<span>{msg.text}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2,padding:'0 2px'}}>
          <span style={{fontSize:10,color:'#9ca3af'}}>{fullTime(time)}</span>
          {isOwn&&<CheckCheck size={12} color="#9ca3af"/>}
        </div>
      </div>
    </div>
  );
}

function AttachMenu({ onSelect, onClose }) {
  const options=[
    {icon:<ImageIcon size={22}/>,label:'Photo',color:'#2563eb',type:'image'},
    {icon:<Film size={22}/>,label:'Video',color:'#7c3aed',type:'video'},
    {icon:<FileText size={22}/>,label:'Document',color:'#ea580c',type:'file'},
    {icon:<BookOpen size={22}/>,label:'Story',color:'#16a34a',type:'story'},
    {icon:<MapPin size={22}/>,label:'Location',color:'#db2777',type:'location'},
    {icon:<Camera size={22}/>,label:'Camera',color:'#d97706',type:'camera'},
  ];
  return (
    <div style={{position:'absolute',bottom:70,left:12,background:'#fff',borderRadius:16,boxShadow:'0 8px 32px rgba(0,0,0,.15)',border:'1px solid #f0f0f0',padding:'12px',animation:'slideUp .2s ease',zIndex:100}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4}}>
        {options.map(o=>(
          <button key={o.type} onClick={()=>{onSelect(o.type);onClose();}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'12px 16px',borderRadius:12,border:'none',cursor:'pointer',transition:'all .15s',fontFamily:'inherit',background:'none'}}
            onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <div style={{width:46,height:46,borderRadius:14,background:`${o.color}18`,display:'flex',alignItems:'center',justifyContent:'center',color:o.color}}>{o.icon}</div>
            <span style={{fontSize:11,color:'#374151',fontWeight:500}}>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConversationWindow({ conv, currentUser, onBack }) {
  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState('');
  const [sending, setSending]       = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fileRef   = useRef(null);

  useEffect(()=>{
    if (!conv||!currentUser) return;
    setMessages([]);
    setLoadingMsgs(true);
    let ref, q;
    if (conv.type==='group') {
      ref = collection(db,'chats',conv.id,'messages');
      q = query(ref,orderBy('createdAt','asc'),limit(100));
    } else {
      const dmId=[currentUser.uid,conv.userId].sort().join('_');
      ref = collection(db,'directMessages',dmId,'messages');
      q = query(ref,orderBy('createdAt','asc'),limit(100));
    }
    const unsub = onSnapshot(q,snap=>{
      setMessages(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoadingMsgs(false);
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),80);
    },err=>{console.error('messages error:',err);setLoadingMsgs(false);});
    return unsub;
  },[conv,currentUser]);

  const sendMsg = async (type='text',extra={}) => {
    if (type==='text'&&!text.trim()) return;
    if (!currentUser||!conv) return;
    setSending(true);
    const trimmed = text.trim();
    setText('');
    try {
      const payload = {
        text:type==='text'?trimmed:(extra.text||''),
        type,
        senderId:currentUser.uid,
        senderName:currentUser.displayName||currentUser.email?.split('@')[0]||'User',
        senderPhoto:currentUser.photoURL||null,
        createdAt:serverTimestamp(),
        readBy:[currentUser.uid],
        ...extra,
      };
      if (conv.type==='group') {
        await addDoc(collection(db,'chats',conv.id,'messages'),payload);
        await setDoc(doc(db,'chats',conv.id),{lastMessage:payload.text||`[${type}]`,lastMessageAt:serverTimestamp(),treeName:conv.name},{merge:true});
      } else {
        const dmId=[currentUser.uid,conv.userId].sort().join('_');
        await addDoc(collection(db,'directMessages',dmId,'messages'),payload);
        await setDoc(doc(db,'directMessages',dmId),{participants:[currentUser.uid,conv.userId],lastMessage:payload.text||`[${type}]`,lastMessageAt:serverTimestamp()},{merge:true});
      }
    } catch(e){console.error('send error:',e);setText(trimmed);}
    finally{setSending(false);inputRef.current?.focus();}
  };

  const handleKey = e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}};
  const handleAttach = type=>{
    if (type==='image'||type==='video'||type==='file') fileRef.current?.click();
    else if (type==='story') sendMsg('story',{text:'📖 Shared a family story'});
    else if (type==='location') sendMsg('location',{text:'📍 Shared their location'});
  };

  // Group messages by date + consecutive sender
  const grouped = messages.reduce((acc,msg,i)=>{
    const prev=messages[i-1];
    const msgDate=msg.createdAt?.toDate?msg.createdAt.toDate():null;
    const prevDate=prev?.createdAt?.toDate?prev.createdAt.toDate():null;
    const cDate=msgDate?.toDateString?.();
    const pDate=prevDate?.toDateString?.();
    const showDate=cDate&&cDate!==pDate;
    const showAvatar=!prev||prev.senderId!==msg.senderId||showDate;
    const showName=showAvatar&&msg.senderId!==currentUser?.uid;
    acc.push({...msg,_showDate:showDate,_showAvatar:showAvatar,_showName:showName,_dateObj:msgDate});
    return acc;
  },[]);

  if (!conv) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,background:'#f8fafc'}}>
      <div style={{width:72,height:72,borderRadius:20,background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #bbf7d0',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <MessageCircle size={32} color="#16a34a"/>
      </div>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:18,fontWeight:700,color:'#111827',marginBottom:4}}>Welcome to Family Chat</div>
        <div style={{fontSize:13,color:'#9ca3af'}}>Select a conversation from the left to start messaging</div>
      </div>
    </div>
  );

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:'#f8fafc',position:'relative',minWidth:0}}>
      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid #f0f0f0',padding:'12px 16px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 4px rgba(0,0,0,.04)',zIndex:10,flexShrink:0}}>
        {onBack&&<button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280',padding:4,display:'flex',borderRadius:8}}><ArrowLeft size={20}/></button>}
        <Avatar name={conv.name} photo={conv.photo} size={40} online={conv.type==='dm'}/>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:700,color:'#111827'}}>{conv.name}</div>
          <div style={{fontSize:11,color:conv.type==='group'?'#9ca3af':'#22c55e',fontWeight:500}}>
            {conv.type==='group'?'Group · All members':'Online'}
          </div>
        </div>
        <div style={{display:'flex',gap:4}}>
          {[Video,Phone,Search,MoreVertical].map((Icon,i)=>(
            <button key={i} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:8,display:'flex',borderRadius:8,transition:'background .15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#f3f4f6'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}><Icon size={18}/></button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-scroll" style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
        {loadingMsgs?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:32,color:'#9ca3af',fontSize:13}}>
            <div style={{width:20,height:20,border:'2px solid #16a34a',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',marginRight:8}}/>Loading messages…
          </div>
        ):messages.length===0?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:'60px 24px',textAlign:'center',height:'80%'}}>
            <Avatar name={conv.name} photo={conv.photo} size={60}/>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:'#111827',marginBottom:4}}>{conv.name}</div>
              <div style={{fontSize:13,color:'#9ca3af',lineHeight:1.6}}>{conv.type==='group'?'Be the first to say hello to your family! 👋':'Start a private conversation.'}</div>
            </div>
          </div>
        ):(
          grouped.map((msg,i)=>(
            <div key={msg.id||i}>
              {msg._showDate&&msg._dateObj&&<DateSep date={msg._dateObj}/>}
              <Bubble msg={msg} isOwn={msg.senderId===currentUser?.uid} showAvatar={msg._showAvatar} showName={msg._showName}/>
            </div>
          ))
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Attach menu */}
      {showAttach&&<AttachMenu onSelect={handleAttach} onClose={()=>setShowAttach(false)}/>}
      <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" style={{display:'none'}}
        onChange={e=>{const f=e.target.files?.[0];if(!f)return;const isImg=f.type.startsWith('image/');sendMsg(isImg?'image':'file',{text:`📎 ${f.name}`,fileName:f.name});e.target.value='';}}/>

      {/* Input */}
      <div style={{background:'#fff',borderTop:'1px solid #f0f0f0',padding:'10px 12px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:8,background:'#f3f4f6',borderRadius:24,padding:'8px 8px 8px 16px',border:'1.5px solid transparent',transition:'border-color .15s'}}
          onFocusCapture={e=>e.currentTarget.style.borderColor='#16a34a'}
          onBlurCapture={e=>e.currentTarget.style.borderColor='transparent'}>
          <button onClick={()=>setShowAttach(o=>!o)}
            style={{background:showAttach?'#16a34a':'none',border:'none',cursor:'pointer',color:showAttach?'#fff':'#9ca3af',padding:6,display:'flex',borderRadius:'50%',transition:'all .15s',marginBottom:2,flexShrink:0}}>
            <Plus size={20}/>
          </button>
          <textarea ref={inputRef} className="cp-input" placeholder="Type a message…" value={text} rows={1} maxLength={2000}
            onChange={e=>{setText(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px';}}
            onKeyDown={handleKey} style={{height:'auto',minHeight:28}}/>
          <button className="cp-send-btn" onClick={()=>sendMsg()} disabled={!text.trim()||sending}
            style={{background:text.trim()?'linear-gradient(135deg,#14532d,#16a34a)':'#e5e7eb',marginBottom:0,flexShrink:0}}>
            <Send size={18} color={text.trim()?'#fff':'#9ca3af'}/>
          </button>
        </div>
        <div style={{textAlign:'center',fontSize:10,color:'#d1d5db',marginTop:4}}>Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { currentUser }          = useAuth();
  const { treeId }               = useParams();
  const navigate                 = useNavigate();
  const [activeTab, setActiveTab]= useState('chats');
  const [conversations, setConvs]= useState([]);
  const [selected, setSelected]  = useState(null);
  const [search, setSearch]      = useState('');
  const [loading, setLoading]    = useState(true);
  const isMobile                 = window.innerWidth<768;
  const [showList, setShowList]  = useState(true);

  useEffect(()=>{
    if (!treeId||!currentUser) return;
    setLoading(true);

    // Build group conversation
    const groupConv = {id:treeId,type:'group',name:'Family Group Chat',photo:null,memberCount:0,lastMessage:'Tap to chat with your family',lastMessageAt:null,unread:0};

    // Listen to group chat metadata
    const unsubGroup = onSnapshot(doc(db,'chats',treeId),snap=>{
      const d=snap.exists()?snap.data():{};
      setConvs(prev=>{
        const without=prev.filter(c=>c.id!==treeId||c.type!=='group');
        return [{...groupConv,lastMessage:d.lastMessage||groupConv.lastMessage,lastMessageAt:d.lastMessageAt||null,name:d.treeName||groupConv.name},...without];
      });
    },()=>{
      setConvs(prev=>{if(prev.find(c=>c.id===treeId&&c.type==='group'))return prev;return[groupConv,...prev];});
    });

    // Load tree members for DMs
    const unsubTree = onSnapshot(doc(db,'trees',treeId),snap=>{
      if(!snap.exists()){setLoading(false);return;}
      const tree=snap.data();
      const mems=(tree.members||[])
        .map(m=>{const uid=typeof m==='string'?m:m.userId;const role=typeof m==='string'?'Member':(m.role||'Member');return{userId:uid,role};})
        .filter(m=>m.userId&&m.userId!==currentUser.uid);

      const dmConvs=mems.map(m=>({
        id:[currentUser.uid,m.userId].sort().join('_'),
        type:'dm',userId:m.userId,
        name:m.userId.slice(0,10)+'…',
        photo:null,role:m.role,
        lastMessage:'Tap to send a message',lastMessageAt:null,unread:0,
      }));

      setConvs(prev=>{
        const group=prev.find(c=>c.type==='group')||groupConv;
        return[group,...dmConvs];
      });
      setLoading(false);
    },()=>setLoading(false));

    return()=>{unsubGroup();unsubTree();};
  },[treeId,currentUser]);

  const handleSelect=(conv)=>{setSelected(conv);if(isMobile)setShowList(false);};
  const handleBack=()=>{setSelected(null);setShowList(true);};

  const filtered=conversations.filter(c=>{
    if(activeTab==='groups')return c.type==='group';
    if(activeTab==='direct')return c.type==='dm';
    return true;
  }).filter(c=>!search||c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <style>{css}</style>
      <div style={{display:'flex',height:'100vh',background:'#f8fafc',overflow:'hidden'}}>
        {/* Left sidebar */}
        {(!isMobile||showList)&&(
          <div style={{width:isMobile?'100%':360,background:'#fff',borderRight:'1px solid #f0f0f0',display:'flex',flexDirection:'column',flexShrink:0}}>
            {/* Header */}
            <div style={{background:'linear-gradient(135deg,#14532d,#166534)',padding:'16px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button onClick={()=>navigate(-1)} style={{background:'rgba(255,255,255,.15)',border:'none',borderRadius:8,cursor:'pointer',padding:6,color:'#fff',display:'flex'}}><ArrowLeft size={18}/></button>
                <div>
                  <div style={{fontSize:17,fontWeight:800,color:'#fff'}}>Family Chat</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.65)'}}>{conversations.length} conversation{conversations.length!==1?'s':''}</div>
                </div>
              </div>
              <button style={{background:'rgba(255,255,255,.15)',border:'none',borderRadius:8,cursor:'pointer',padding:7,color:'#fff',display:'flex'}}><MoreVertical size={18}/></button>
            </div>
            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'1px solid #f0f0f0',flexShrink:0}}>
              {[{id:'chats',label:'All'},{id:'groups',label:'Groups'},{id:'direct',label:'Direct'}].map(tab=>(
                <button key={tab.id} className={`cp-tab ${activeTab===tab.id?'active':''}`} onClick={()=>setActiveTab(tab.id)}>{tab.label}</button>
              ))}
            </div>
            {/* Search */}
            <div style={{padding:'10px 14px',borderBottom:'1px solid #f5f5f5',flexShrink:0}}>
              <div style={{position:'relative'}}>
                <Search size={14} color="#9ca3af" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations…"
                  style={{width:'100%',padding:'8px 12px 8px 32px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit',background:'#f9fafb',transition:'border-color .15s'}}
                  onFocus={e=>e.target.style.borderColor='#16a34a'}
                  onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
              </div>
            </div>
            {/* List */}
            <div style={{flex:1,overflowY:'auto'}}>
              {loading?(
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:40,color:'#9ca3af',fontSize:13}}>
                  <div style={{width:20,height:20,border:'2px solid #16a34a',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',marginRight:8}}/>Loading…
                </div>
              ):filtered.length===0?(
                <div style={{padding:24,textAlign:'center',color:'#9ca3af',fontSize:13}}>No conversations yet</div>
              ):(
                filtered.map((conv,i)=>(
                  <div key={conv.id+conv.type} className={`cp-conv-item ${selected?.id===conv.id&&selected?.type===conv.type?'active':''}`}
                    onClick={()=>handleSelect(conv)} style={{animation:`fadeIn .25s ease ${i*.04}s both`}}>
                    <div style={{position:'relative',flexShrink:0}}>
                      <Avatar name={conv.name} photo={conv.photo} size={48} online={conv.type==='dm'}/>
                      {conv.type==='group'&&<div style={{position:'absolute',bottom:0,right:0,width:16,height:16,borderRadius:'50%',background:'#16a34a',border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center'}}><Users size={8} color="#fff"/></div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
                        <div style={{fontSize:14,fontWeight:600,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{conv.name}</div>
                        <div style={{fontSize:11,color:'#9ca3af',flexShrink:0}}>{timeAgo(conv.lastMessageAt)}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        {conv.type==='group'?<Users size={11} color="#9ca3af"/>:<Lock size={11} color="#9ca3af"/>}
                        <span style={{fontSize:12,color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{conv.lastMessage}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {/* Right: conversation */}
        {(!isMobile||!showList)&&(
          <ConversationWindow conv={selected} currentUser={currentUser} onBack={isMobile?handleBack:null}/>
        )}
      </div>
    </>
  );
}