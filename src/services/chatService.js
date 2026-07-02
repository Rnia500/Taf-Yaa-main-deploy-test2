// src/services/chatService.js
// Taf'Yaa — Family Chat Service (Extended)
// Handles: Group Chat, Direct Messages, Reactions,
//          Reply-To, Typing Indicators, Read Receipts,
//          Pagination, Role Requests, Member Profile Hydration

import {
  collection, addDoc, query, orderBy, limit, startAfter,
  onSnapshot, serverTimestamp, where, getDocs, doc,
  setDoc, getDoc, updateDoc, arrayUnion, arrayRemove,
  increment, deleteField, writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

// ─── Firestore collection paths ───────────────────────────────────────────────
// chats/{treeId}                          → group-chat metadata
// chats/{treeId}/messages/{messageId}     → group messages
// directMessages/{dmId}                   → DM metadata (dmId = uid1_uid2 sorted)
// directMessages/{dmId}/messages/{msgId}  → DM messages
// typingStatus/{convId}                   → typing indicators
// roleRequests/{requestId}                → role-change requests

const DEFAULT_MSG_LIMIT = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the canonical DM conversation ID for two users.
 * Always sorted so uid_a_uid_b === uid_b_uid_a.
 */
function getDMId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

/**
 * Resolve a user's display name + photo from the `users` collection.
 * Falls back gracefully so callers never crash.
 */
async function resolveUser(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const d = snap.data();
      return {
        // Field names from src/models/userModels/userModel.ts
        name:  d.displayName || d.name || d.email?.split('@')[0] || uid,
        photo: d.profilePhoto || d.photoURL || d.photoUrl || null,
        email: d.email || null,
      };
    }
  } catch { /* silent */ }
  return { name: uid.slice(0, 10) + '…', photo: null, email: null };
}

// ─── GROUP CHAT ───────────────────────────────────────────────────────────────

export const chatService = {

  getDMId,

  // ---------------------------------------------------------------------------
  // Send a message to the tree group chat.
  // Supports: text, image, video, file, story, location, system messages.
  // ---------------------------------------------------------------------------
  async sendGroupMessage({
    treeId, userId, userName, userPhoto,
    text = '',
    type = 'text',         // 'text' | 'image' | 'video' | 'file' | 'story' | 'location' | 'system'
    replyTo = null,        // { id, text, senderName } | null
    storyTitle = null,
    fileName   = null,
    mediaUrl   = null,
  }) {
    if (!treeId || !userId) throw new Error('treeId and userId are required');
    if (type === 'text' && !text.trim()) return;

    const payload = {
      text:        type === 'text' ? text.trim() : (text || ''),
      type,
      senderId:    userId,
      senderName:  userName  || 'Family Member',
      senderPhoto: userPhoto || null,
      createdAt:   serverTimestamp(),
      readBy:      [userId],
      reactions:   {},
      ...(replyTo   ? { replyTo }   : {}),
      ...(storyTitle? { storyTitle } : {}),
      ...(fileName  ? { fileName }   : {}),
      ...(mediaUrl  ? { mediaUrl }   : {}),
    };

    const msgRef = await addDoc(
      collection(db, 'chats', treeId, 'messages'),
      payload
    );

    // Update group-chat metadata (shown in conversation list)
    await setDoc(doc(db, 'chats', treeId), {
      lastMessage:    type === 'text' ? text.trim() : `[${type}]`,
      lastMessageAt:  serverTimestamp(),
      lastMessageBy:  userName || userId,
      lastSenderId:   userId,
    }, { merge: true });

    return msgRef.id;
  },

  // ---------------------------------------------------------------------------
  // Subscribe to group chat messages (real-time, newest 60, chronological).
  // Returns unsubscribe function.
  // ---------------------------------------------------------------------------
  subscribeToGroupChat(treeId, callback, msgLimit = DEFAULT_MSG_LIMIT) {
    const q = query(
      collection(db, 'chats', treeId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(msgLimit)
    );
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        }))
      );
    });
  },

  // ---------------------------------------------------------------------------
  // Load older messages for pagination (call when user scrolls to top).
  // Pass the oldest message doc from current list as `beforeDoc`.
  // ---------------------------------------------------------------------------
  async loadMoreGroupMessages(treeId, beforeDoc, msgLimit = DEFAULT_MSG_LIMIT) {
    const q = query(
      collection(db, 'chats', treeId, 'messages'),
      orderBy('createdAt', 'desc'),
      startAfter(beforeDoc),
      limit(msgLimit)
    );
    const snap = await getDocs(q);
    return snap.docs
      .reverse()
      .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? new Date() }));
  },

  // ---------------------------------------------------------------------------
  // Subscribe to group-chat metadata (last message preview, unread count).
  // ---------------------------------------------------------------------------
  subscribeToGroupChatMeta(treeId, callback) {
    return onSnapshot(doc(db, 'chats', treeId), snap => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  },

  // ─── DIRECT MESSAGES ──────────────────────────────────────────────────────

  // ---------------------------------------------------------------------------
  // Send a direct message between two users.
  // ---------------------------------------------------------------------------
  async sendDirectMessage({
    fromUserId, fromUserName, fromUserPhoto,
    toUserId, toUserName,
    text = '',
    type = 'text',
    replyTo   = null,
    fileName  = null,
    mediaUrl  = null,
  }) {
    if (!fromUserId || !toUserId) throw new Error('fromUserId and toUserId are required');
    if (type === 'text' && !text.trim()) return;

    const dmId   = getDMId(fromUserId, toUserId);
    const payload = {
      text:        type === 'text' ? text.trim() : (text || ''),
      type,
      senderId:    fromUserId,
      senderName:  fromUserName  || 'Family Member',
      senderPhoto: fromUserPhoto || null,
      createdAt:   serverTimestamp(),
      readBy:      [fromUserId],
      reactions:   {},
      ...(replyTo  ? { replyTo }  : {}),
      ...(fileName ? { fileName } : {}),
      ...(mediaUrl ? { mediaUrl } : {}),
    };

    const msgRef = await addDoc(
      collection(db, 'directMessages', dmId, 'messages'),
      payload
    );

    // Upsert DM metadata
    await setDoc(doc(db, 'directMessages', dmId), {
      participants:     [fromUserId, toUserId],
      participantNames: {
        [fromUserId]: fromUserName  || fromUserId,
        [toUserId]:   toUserName    || toUserId,
      },
      lastMessage:    type === 'text' ? text.trim() : `[${type}]`,
      lastMessageAt:  serverTimestamp(),
      lastMessageBy:  fromUserId,
      // Unread counter for recipient
      [`unread_${toUserId}`]: increment(1),
    }, { merge: true });

    return msgRef.id;
  },

  // ---------------------------------------------------------------------------
  // Subscribe to a DM conversation (real-time).
  // ---------------------------------------------------------------------------
  subscribeToDM(uid1, uid2, callback, msgLimit = DEFAULT_MSG_LIMIT) {
    const dmId = getDMId(uid1, uid2);
    const q = query(
      collection(db, 'directMessages', dmId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(msgLimit)
    );
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        }))
      );
    });
  },

  // ---------------------------------------------------------------------------
  // Subscribe to all DM conversations a user participates in.
  // Used to build the sidebar conversation list.
  // ---------------------------------------------------------------------------
  subscribeToUserDMs(userId, callback) {
    const q = query(
      collection(db, 'directMessages'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc'),
      limit(30)
    );
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        lastMessageAt: d.data().lastMessageAt?.toDate?.() ?? null,
        unread: d.data()[`unread_${userId}`] || 0,
      })));
    });
  },

  // ---------------------------------------------------------------------------
  // Mark all messages in a DM as read by the given user.
  // Resets the unread counter for that user.
  // ---------------------------------------------------------------------------
  async markDMRead(uid1, uid2, readerId) {
    const dmId = getDMId(uid1, uid2);
    await updateDoc(doc(db, 'directMessages', dmId), {
      [`unread_${readerId}`]: 0,
    }).catch(() => {});
  },

  // ─── REACTIONS ────────────────────────────────────────────────────────────

  // ---------------------------------------------------------------------------
  // Toggle an emoji reaction on a group message.
  // Adds the userId to reactions.{emoji} if not present, removes if already there.
  // ---------------------------------------------------------------------------
  async toggleGroupReaction(treeId, messageId, emoji, userId) {
    const msgRef = doc(db, 'chats', treeId, 'messages', messageId);
    const snap   = await getDoc(msgRef);
    if (!snap.exists()) return;

    const current   = snap.data().reactions?.[emoji] || [];
    const hasReacted = current.includes(userId);

    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: hasReacted
        ? arrayRemove(userId)
        : arrayUnion(userId),
    });
  },

  // ---------------------------------------------------------------------------
  // Toggle an emoji reaction on a DM message.
  // ---------------------------------------------------------------------------
  async toggleDMReaction(uid1, uid2, messageId, emoji, userId) {
    const dmId   = getDMId(uid1, uid2);
    const msgRef = doc(db, 'directMessages', dmId, 'messages', messageId);
    const snap   = await getDoc(msgRef);
    if (!snap.exists()) return;

    const current    = snap.data().reactions?.[emoji] || [];
    const hasReacted = current.includes(userId);

    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: hasReacted
        ? arrayRemove(userId)
        : arrayUnion(userId),
    });
  },

  // ─── READ RECEIPTS ────────────────────────────────────────────────────────

  // ---------------------------------------------------------------------------
  // Mark a batch of group messages as read by the current user.
  // Call this whenever a conversation is opened or scrolled to bottom.
  // ---------------------------------------------------------------------------
  async markGroupMessagesRead(treeId, messageIds, userId) {
    if (!messageIds?.length) return;
    const batch = writeBatch(db);
    messageIds.forEach(msgId => {
      batch.update(doc(db, 'chats', treeId, 'messages', msgId), {
        readBy: arrayUnion(userId),
      });
    });
    await batch.commit().catch(() => {});
  },

  // ─── TYPING INDICATORS ────────────────────────────────────────────────────

  // ---------------------------------------------------------------------------
  // Set the current user as "typing" in a conversation.
  // convId: treeId for group, getDMId(a,b) for DM.
  // Call with isTyping=false when the user stops typing or sends a message.
  // ---------------------------------------------------------------------------
  async setTyping(convId, userId, userName, isTyping) {
    const ref = doc(db, 'typingStatus', convId);
    if (isTyping) {
      await setDoc(ref, {
        [`${userId}`]: { name: userName, at: serverTimestamp() },
      }, { merge: true });
    } else {
      await updateDoc(ref, { [`${userId}`]: deleteField() }).catch(() => {});
    }
  },

  // ---------------------------------------------------------------------------
  // Subscribe to typing status for a conversation.
  // Callback receives array of { userId, name } of people currently typing.
  // Stale indicators (>8 seconds old) are filtered out client-side.
  // ---------------------------------------------------------------------------
  subscribeToTyping(convId, currentUserId, callback) {
    return onSnapshot(doc(db, 'typingStatus', convId), snap => {
      if (!snap.exists()) { callback([]); return; }
      const data  = snap.data();
      const now   = Date.now();
      const typing = Object.entries(data)
        .filter(([uid, val]) => uid !== currentUserId && val?.at)
        .filter(([, val]) => {
          const ts = val.at?.toDate?.()?.getTime?.() ?? 0;
          return now - ts < 8000; // stale after 8s
        })
        .map(([uid, val]) => ({ userId: uid, name: val.name }));
      callback(typing);
    });
  },

  // ─── MEMBER PROFILE HYDRATION ─────────────────────────────────────────────

  // ---------------------------------------------------------------------------
  // Given a list of raw members (from tree.members), fetch real names + photos
  // from the users/{uid} collection. This is the fix for the display-name bug
  // that was showing userId.slice(0,12)+'…' in the DM list.
  //
  // Input:  [{ userId, role, ...}, ...] or [uid, ...]
  // Output: [{ userId, name, photo, role }, ...]
  // ---------------------------------------------------------------------------
  async hydrateMemberProfiles(rawMembers = [], excludeUid = null) {
    const normalized = rawMembers.map(m =>
      typeof m === 'string'
        ? { userId: m, role: 'Member' }
        : { userId: m.userId || m.uid, role: m.role || 'Member' }
    ).filter(m => m.userId && m.userId !== excludeUid);

    const hydrated = await Promise.all(
      normalized.map(async m => {
        const profile = await resolveUser(m.userId);
        return { ...m, ...profile };
      })
    );

    return hydrated;
  },

  // ─── ROLE REQUESTS ────────────────────────────────────────────────────────

  async sendRoleRequest({ treeId, userId, userName, currentRole, requestedRole, message }) {
    await addDoc(collection(db, 'roleRequests'), {
      treeId,
      userId,
      userName,
      currentRole:   currentRole   || 'Member',
      requestedRole: requestedRole || 'Editor',
      message:       message       || '',
      status:        'pending',
      createdAt:     serverTimestamp(),
    });
  },

  subscribeToRoleRequests(treeId, callback) {
    const q = query(
      collection(db, 'roleRequests'),
      where('treeId', '==', treeId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      })));
    });
  },

  async respondToRoleRequest(requestId, status, adminId) {
    await updateDoc(doc(db, 'roleRequests', requestId), {
      status,
      respondedBy: adminId,
      respondedAt: serverTimestamp(),
    });
  },

  async getUserRoleRequests(userId) {
    const q = query(
      collection(db, 'roleRequests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id, ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
    }));
  },

  // ─── SYSTEM MESSAGES ──────────────────────────────────────────────────────

  // ---------------------------------------------------------------------------
  // Post a system/activity message to the group chat (e.g. "Amara joined the tree").
  // These are displayed differently (centred, muted) in the ChatPage bubble renderer.
  // ---------------------------------------------------------------------------
  async sendSystemMessage(treeId, text) {
    await addDoc(collection(db, 'chats', treeId, 'messages'), {
      text,
      type:      'system',
      senderId:  'system',
      senderName:'Taf\'Yaa',
      createdAt: serverTimestamp(),
      readBy:    [],
      reactions: {},
    });
    await setDoc(doc(db, 'chats', treeId), {
      lastMessage:   text,
      lastMessageAt: serverTimestamp(),
      lastMessageBy: 'system',
    }, { merge: true });
  },

  // ─── UTILITY ──────────────────────────────────────────────────────────────

  formatTime(date) {
    if (!date) return '';
    const d    = date instanceof Date ? date : new Date(date);
    const now  = new Date();
    const diff = now - d;
    if (diff < 60_000)     return 'Just now';
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  },
};

export default chatService;