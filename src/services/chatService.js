// src/services/chatService.js
// Taf'Yaa — Firebase Chat Service
// Handles: Group Chat, Direct Messages, Role Requests

import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, where, getDocs,
  doc, setDoc, getDoc, updateDoc, arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

// ─── GROUP CHAT ───────────────────────────────────────────────────────────────
// Each family tree has its own group chat
// Collection: chats/{treeId}/messages/{messageId}

export const chatService = {

  // Send a message to the tree group chat
  async sendGroupMessage({ treeId, userId, userName, userPhoto, text }) {
    if (!text?.trim()) return;
    const ref = collection(db, 'chats', treeId, 'messages');
    await addDoc(ref, {
      text: text.trim(),
      senderId: userId,
      senderName: userName || 'Unknown',
      senderPhoto: userPhoto || null,
      type: 'group',
      createdAt: serverTimestamp(),
      readBy: [userId],
    });
    // Update last message in tree chat metadata
    await setDoc(doc(db, 'chats', treeId), {
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp(),
      lastMessageBy: userName,
    }, { merge: true });
  },

  // Listen to group chat messages (real-time)
  subscribeToGroupChat(treeId, callback, msgLimit = 50) {
    const ref = collection(db, 'chats', treeId, 'messages');
    const q = query(ref, orderBy('createdAt', 'asc'), limit(msgLimit));
    return onSnapshot(q, (snap) => {
      const messages = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
      }));
      callback(messages);
    });
  },

  // ─── DIRECT MESSAGES ────────────────────────────────────────────────────────
  // DM between two users
  // Collection: directMessages/{dmId}/messages/{messageId}
  // dmId = sorted combination of two userIds

  getDMId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  },

  async sendDirectMessage({ fromUserId, fromUserName, fromUserPhoto, toUserId, toUserName, text }) {
    if (!text?.trim()) return;
    const dmId = this.getDMId(fromUserId, toUserId);
    const ref = collection(db, 'directMessages', dmId, 'messages');
    await addDoc(ref, {
      text: text.trim(),
      senderId: fromUserId,
      senderName: fromUserName || 'Unknown',
      senderPhoto: fromUserPhoto || null,
      createdAt: serverTimestamp(),
      readBy: [fromUserId],
    });
    // Update DM metadata
    await setDoc(doc(db, 'directMessages', dmId), {
      participants: [fromUserId, toUserId],
      participantNames: { [fromUserId]: fromUserName, [toUserId]: toUserName },
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp(),
      lastMessageBy: fromUserId,
    }, { merge: true });
  },

  subscribeToDM(userId1, userId2, callback, msgLimit = 50) {
    const dmId = this.getDMId(userId1, userId2);
    const ref = collection(db, 'directMessages', dmId, 'messages');
    const q = query(ref, orderBy('createdAt', 'asc'), limit(msgLimit));
    return onSnapshot(q, (snap) => {
      const messages = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
      }));
      callback(messages);
    });
  },

  // Get all DM conversations for a user
  async getUserDMs(userId) {
    const ref = collection(db, 'directMessages');
    const q = query(ref, where('participants', 'array-contains', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ─── ROLE REQUESTS ──────────────────────────────────────────────────────────
  // Collection: roleRequests/{requestId}

  async sendRoleRequest({ treeId, userId, userName, currentRole, requestedRole, message }) {
    const ref = collection(db, 'roleRequests');
    await addDoc(ref, {
      treeId,
      userId,
      userName,
      currentRole: currentRole || 'Member',
      requestedRole,
      message: message || '',
      status: 'pending', // pending | approved | rejected
      createdAt: serverTimestamp(),
    });
  },

  // Listen to role requests for a tree (admin use)
  subscribeToRoleRequests(treeId, callback) {
    const ref = collection(db, 'roleRequests');
    const q = query(
      ref,
      where('treeId', '==', treeId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const requests = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
      }));
      callback(requests);
    });
  },

  // Admin: approve or reject role request
  async respondToRoleRequest(requestId, status, adminId) {
    await updateDoc(doc(db, 'roleRequests', requestId), {
      status, // 'approved' or 'rejected'
      respondedBy: adminId,
      respondedAt: serverTimestamp(),
    });
  },

  // Get role requests for a specific user
  async getUserRoleRequests(userId) {
    const ref = collection(db, 'roleRequests');
    const q = query(ref, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Format timestamp
  formatTime(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
  },
};
