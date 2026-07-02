import React, { useState, useEffect } from 'react';
import { MessageCircle, X, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

// ─── Floating Chat Button (updated) ──────────────────────────────────────────
export const ChatButton = ({ treeId, treeName, members = [], userRole }) => {
  const navigate  = useNavigate();
  const [unread, setUnread] = useState(0);
  const { currentUser } = useAuth();

  // Listen for new messages to drive the unread badge.
  // We store lastSeenAt in localStorage per treeId so it persists across sessions.
  useEffect(() => {
    if (!treeId || !currentUser) return;

    const storageKey = `tafyaa_chat_seen_${treeId}_${currentUser.uid}`;
    const lastSeen   = parseInt(localStorage.getItem(storageKey) || '0', 10);

    const unsub = onSnapshot(doc(db, 'chats', treeId), (snap) => {
      if (!snap.exists()) { setUnread(0); return; }
      const data = snap.data();
      const lastMsgAt = data.lastMessageAt?.toDate?.()?.getTime?.() ?? 0;
      const lastBy    = data.lastMessageBy ?? '';

      
      if (lastBy === (currentUser.displayName || currentUser.email)) {
        setUnread(0);
      } else if (lastMsgAt > lastSeen) {
        setUnread(1); 
      } else {
        setUnread(0);
      }
    }, () => setUnread(0));

    return unsub;
  }, [treeId, currentUser]);

  const handleClick = () => {
    // Mark as seen
    if (treeId && currentUser) {
      const storageKey = `tafyaa_chat_seen_${treeId}_${currentUser.uid}`;
      localStorage.setItem(storageKey, Date.now().toString());
      setUnread(0);
    }
    // Navigate to the ChatPage
    navigate(`/family-tree/${treeId}/chat`);
  };

  return (
    <>
      <style>{`
        @keyframes fc-fadein { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
        @keyframes fc-pulse  { 0%,100%{box-shadow:0 4px 20px rgba(22,163,74,.4)} 50%{box-shadow:0 4px 28px rgba(22,163,74,.7)} }
        .fc-float-btn {
          position:fixed; bottom:24px; right:24px;
          width:56px; height:56px; border-radius:50%;
          background:linear-gradient(135deg,#14532d,#16a34a);
          border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 20px rgba(22,163,74,.4);
          z-index:1001; transition:all .25s;
          animation:fc-fadein .3s ease, fc-pulse 3s ease-in-out infinite;
        }
        .fc-float-btn:hover { transform:scale(1.1) !important; }
        .fc-tooltip {
          position:absolute; bottom:64px; right:0;
          background:#111827; color:#fff; font-size:12px; font-weight:600;
          padding:5px 10px; border-radius:8px; white-space:nowrap;
          opacity:0; pointer-events:none; transition:opacity .2s;
        }
        .fc-float-btn:hover .fc-tooltip { opacity:1; }
      `}</style>

      <button
        className="fc-float-btn"
        onClick={handleClick}
        title={`Open ${treeName ? treeName + ' ' : ''}Family Chat`}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageCircle size={24} color="#fff" />

        {/* Unread badge */}
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 16, height: 16, borderRadius: '50%',
            background: '#dc2626', border: '2px solid #fff',
            animation: 'fc-fadein .2s ease',
          }} />
        )}

        {/* Hover tooltip */}
        <span className="fc-tooltip">
          {treeName ? `${treeName} Chat` : 'Family Chat'} →
        </span>
      </button>
    </>
  );
};


// ─── Events Button ───────────────────────────────────────────────────────────
export const EventsButton = ({ treeId }) => {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @keyframes evb-fadein { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
        .evb-float-btn {
          position:fixed; bottom:92px; right:24px;
          width:48px; height:48px; border-radius:50%;
          background:linear-gradient(135deg,#92400e,#C9731E);
          border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 16px rgba(201,115,30,.45);
          z-index:1001; transition:all .25s;
          animation:evb-fadein .3s ease;
        }
        .evb-float-btn:hover { transform:scale(1.1); }
        .evb-tooltip {
          position:absolute; bottom:54px; right:0;
          background:#111827; color:#fff; font-size:11px; font-weight:600;
          padding:4px 9px; border-radius:7px; white-space:nowrap;
          opacity:0; pointer-events:none; transition:opacity .2s;
        }
        .evb-float-btn:hover .evb-tooltip { opacity:1; }
      `}</style>

      <button
        className="evb-float-btn"
        onClick={() => navigate(`/family-tree/${treeId}/family-events`)}
        title="Family Events Calendar"
      >
        <CalendarDays size={20} color="#fff" />
        <span className="evb-tooltip">Events Calendar</span>
      </button>
    </>
  );
};

export default ChatButton;