// src/components/CollaborationIndicator.jsx
// Taf'Yaa — Shows who is viewing the tree right now (like Google Docs)

import React from 'react';
import { useOnlinePresence } from '../hooks/useRealtimeTree';
import { useAuth } from '../context/AuthContext';
import { Users } from 'lucide-react';

function Avatar({ name, size = 28 }) {
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
  const colors = ['#16a34a','#2563eb','#7c3aed','#db2777','#ea580c'];
  const color = colors[(name?.charCodeAt(0)||0) % colors.length];
  return (
    <div title={name} style={{
      width: size, height: size, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.35,
      fontWeight: 700, color: '#fff',
      border: '2px solid #fff',
      marginLeft: -6, flexShrink: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,.15)',
      cursor: 'default',
    }}>
      {initials}
    </div>
  );
}

const CollaborationIndicator = ({ treeId }) => {
  const { currentUser } = useAuth();
  const onlineUsers = useOnlinePresence(
    treeId,
    currentUser?.uid,
    currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'
  );

  const others = onlineUsers.filter(u => u.userId !== currentUser?.uid);

  if (others.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 20, padding: '5px 12px 5px 8px',
      boxShadow: '0 2px 8px rgba(0,0,0,.08)',
      animation: 'fadeIn .3s ease',
    }}>
      {/* Online dot */}
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }}/>

      {/* Avatars */}
      <div style={{ display: 'flex', paddingLeft: 6 }}>
        {others.slice(0, 4).map((user, i) => (
          <Avatar key={user.userId} name={user.userName} size={26}/>
        ))}
        {others.length > 4 && (
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: '#f3f4f6', border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#6b7280',
            marginLeft: -6,
          }}>
            +{others.length - 4}
          </div>
        )}
      </div>

      {/* Label */}
      <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
        {others.length === 1
          ? `${others[0].userName} is viewing`
          : `${others.length} people viewing`}
      </span>
    </div>
  );
};

export default CollaborationIndicator;