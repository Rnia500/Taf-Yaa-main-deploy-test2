// src/hooks/useRealtimeTree.js
// Taf'Yaa — Real-time Firestore Collaboration Hook
// Drop this into any component to get live family tree updates

import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, onSnapshot, query,
  orderBy, updateDoc, addDoc, deleteDoc,
  serverTimestamp, where
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

/**
 * useRealtimeTree — subscribes to live Firestore updates for a family tree
 *
 * Usage:
 *   const { persons, marriages, events, loading } = useRealtimeTree(treeId);
 *
 * When ANY member adds/edits/deletes a person, everyone sees it instantly.
 */
export function useRealtimeTree(treeId) {
  const [persons,   setPersons]   = useState([]);
  const [marriages, setMarriages] = useState([]);
  const [events,    setEvents]    = useState([]);
  const [tree,      setTree]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [online,    setOnline]    = useState([]);

  useEffect(() => {
    if (!treeId) return;
    setLoading(true);

    // ── Tree metadata ────────────────────────────────────────────────────────
    const unsubTree = onSnapshot(doc(db, 'trees', treeId), snap => {
      if (snap.exists()) setTree({ id: snap.id, ...snap.data() });
    });

    // ── Persons (real-time) ──────────────────────────────────────────────────
    const unsubPersons = onSnapshot(
      collection(db, 'trees', treeId, 'persons'),
      snap => {
        setPersons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );

    // ── Marriages (real-time) ─────────────────────────────────────────────────
    const unsubMarriages = onSnapshot(
      query(collection(db, 'marriages'), where('treeId', '==', treeId)),
      snap => setMarriages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // ── Events (real-time) ────────────────────────────────────────────────────
    const unsubEvents = onSnapshot(
      query(collection(db, 'events'), where('treeId', '==', treeId), orderBy('date', 'asc')),
      snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubTree();
      unsubPersons();
      unsubMarriages();
      unsubEvents();
    };
  }, [treeId]);

  return { tree, persons, marriages, events, loading, online };
}

/**
 * useRealtimeStories — live stories for a specific person
 */
export function useRealtimeStories(personId, treeId) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!personId || !treeId) return;
    const q = query(
      collection(db, 'stories'),
      where('personId', '==', personId),
      where('treeId', '==', treeId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [personId, treeId]);

  return { stories, loading };
}

/**
 * useOnlinePresence — track who is viewing the tree right now
 */
export function useOnlinePresence(treeId, userId, userName) {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!treeId || !userId) return;

    // Mark user as online
    const presenceRef = doc(db, 'trees', treeId, 'presence', userId);
    updateDoc(presenceRef, {
      userId, userName, lastSeen: serverTimestamp(), online: true,
    }).catch(() => {
      // Doc doesn't exist yet, create it
      import('firebase/firestore').then(({ setDoc }) => {
        setDoc(presenceRef, { userId, userName, lastSeen: serverTimestamp(), online: true });
      });
    });

    // Listen to all online users
    const unsubPresence = onSnapshot(
      collection(db, 'trees', treeId, 'presence'),
      snap => {
        const now = Date.now();
        const active = snap.docs
          .map(d => d.data())
          .filter(u => {
            const lastSeen = u.lastSeen?.toDate?.()?.getTime() || 0;
            return now - lastSeen < 120000; // active in last 2 minutes
          });
        setOnlineUsers(active);
      }
    );

    // Mark as offline on cleanup
    return () => {
      unsubPresence();
      updateDoc(presenceRef, { online: false }).catch(() => {});
    };
  }, [treeId, userId]);

  return onlineUsers;
}