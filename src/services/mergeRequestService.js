import {
  collection, addDoc, query, where, orderBy, getDocs,
  doc, updateDoc, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Create a request to merge `sourceTreeId` (the requester's tree) into `targetTreeId`.
export async function createMergeRequest({
  sourceTreeId, sourceTreeName,
  targetTreeId, targetTreeName,
  requestedBy, requestedByName,
  commonAncestorName, message,
}) {
  return addDoc(collection(db, 'mergeRequests'), {
    sourceTreeId, sourceTreeName,
    targetTreeId, targetTreeName,
    requestedBy, requestedByName,
    commonAncestorName: commonAncestorName || '',
    message: message || '',
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

// All merge requests involving a tree — either as the sender or the receiver.
export async function getMergeRequestsForTree(treeId) {
  const [asSource, asTarget] = await Promise.all([
    getDocs(query(collection(db, 'mergeRequests'), where('sourceTreeId', '==', treeId), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'mergeRequests'), where('targetTreeId', '==', treeId), orderBy('createdAt', 'desc'))),
  ]);
  const out = [];
  asSource.forEach(d => out.push({ id: d.id, direction: 'outgoing', ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? new Date() }));
  asTarget.forEach(d => out.push({ id: d.id, direction: 'incoming', ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? new Date() }));
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

// Real-time version — used by MergeRequestsPage so approvals show instantly.
export function subscribeToMergeRequests(treeId, callback) {
  const qSource = query(collection(db, 'mergeRequests'), where('sourceTreeId', '==', treeId));
  const qTarget = query(collection(db, 'mergeRequests'), where('targetTreeId', '==', treeId));

  let sourceItems = [];
  let targetItems = [];
  const emit = () => {
    const merged = [...sourceItems, ...targetItems].sort((a, b) => b.createdAt - a.createdAt);
    callback(merged);
  };

  const unsub1 = onSnapshot(qSource, snap => {
    sourceItems = snap.docs.map(d => ({ id: d.id, direction: 'outgoing', ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? new Date() }));
    emit();
  });
  const unsub2 = onSnapshot(qTarget, snap => {
    targetItems = snap.docs.map(d => ({ id: d.id, direction: 'incoming', ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? new Date() }));
    emit();
  });

  return () => { unsub1(); unsub2(); };
}

// Approve or reject — only the target tree's admin should call this (enforced in Firestore rules).
export async function respondToMergeRequest(requestId, status, respondedBy) {
  return updateDoc(doc(db, 'mergeRequests', requestId), {
    status, // 'approved' | 'rejected'
    respondedBy,
    respondedAt: serverTimestamp(),
  });
}

// Count of pending merge requests for a tree — used by NotificationCenter's tab badge.
export async function getPendingMergeRequestCount(treeId) {
  const snap = await getDocs(query(collection(db, 'mergeRequests'), where('targetTreeId', '==', treeId), where('status', '==', 'pending')));
  return snap.size;
}