// src/services/joinRequestService.js
import { createJoinRequest } from '../models/featuresModels/JoinRequestModel';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
  getDoc,
} from 'firebase/firestore';


// SUBMIT JOIN REQUEST

export async function submitJoinRequest({
  treeId,
  inviteCode,
  inviteId,
  submittedBy = null,
  claimedFatherId = null,
  claimedMotherId = null,
  name,
  gender,
  birthDate = null,
  notes = null,
  proofFiles = [],
}) {
  const joinRequest = createJoinRequest({
    treeId,
    inviteCode,
    inviteId,
    submittedBy,
    claimedFatherId,
    claimedMotherId,
    name,
    gender,
    birthDate,
    notes,
    proofFiles,
  });

  // Save to Firestore
  const joinRequestRef = doc(collection(db, 'joinRequests'), joinRequest.JoinRequestId);
  await setDoc(joinRequestRef, joinRequest);
  return joinRequest;
}


// REVIEW JOIN REQUEST
export async function reviewJoinRequest(joinRequestId, status, reviewedBy, approvedPersonId = null) {
  const joinRequestRef = doc(collection(db, 'joinRequests'), joinRequestId);
  const updateData = {
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy,
    approvedPersonId,
  };
  await updateDoc(joinRequestRef, updateData);
  return updateData;
}


// ACCEPT JOIN REQUEST (UNIFIED LOGIC)

export async function acceptJoinRequest(joinRequestId, reviewedBy) {
  // Load join request using direct getDoc()
  const joinRequestRef = doc(db, 'joinRequests', joinRequestId);
  const joinRequestSnap = await getDoc(joinRequestRef);

  if (!joinRequestSnap.exists()) {
    throw new Error('Join request not found');
  }

  const joinRequest = joinRequestSnap.data();

  if (joinRequest.status !== 'pending') {
    throw new Error('Join request is not pending');
  }

  // Load invite for role assignment
  const inviteRef = doc(db, 'invites', joinRequest.inviteId);
  const inviteDoc = await getDoc(inviteRef);
  if (!inviteDoc.exists()) throw new Error('Invite not found');

  const invite = inviteDoc.data();

  // Check if invite is revoked
  if (invite.status === 'revoked') {
    throw new Error('This invitation has been revoked and cannot be used to accept join requests');
  }

  // Increment the invite's uses count immediately after loading
  const inviteUpdateData = {
    uses: invite.uses + 1,
    updatedAt: new Date().toISOString()
  };
  await updateDoc(inviteRef, inviteUpdateData);

  // Lazy imports for heavy modules
  const dataService = (await import('../services/dataService')).default;
  const { addChild } = await import('../controllers/tree/addChild');

  // Validate parent info
  const parentId = joinRequest.claimedFatherId || joinRequest.claimedMotherId;

  if (!parentId) {
    throw new Error('Join request must specify at least one parent');
  }

  // Check if parent is already in a marriage
  let marriageId = null;
  let motherId = null;
  const existingMarriages = await dataService.getMarriagesByPersonId(parentId);
  const existingMonogamous = existingMarriages.find(m => m.marriageType === 'monogamous');
  const existingPolygamous = existingMarriages.find(m => m.marriageType === 'polygamous');

  if (existingMonogamous) {
    marriageId = existingMonogamous.id;
  } else if (existingPolygamous) {
    marriageId = existingPolygamous.id;
    // For polygamous marriages, use the specified mother if available
    if (joinRequest.claimedMotherId) {
      motherId = joinRequest.claimedMotherId;
    }
    // If no specific mother is claimed, leave motherId undefined so addChild creates a placeholder
  }

  // Prepare child data
  const childData = {
    fullName: joinRequest.name,
    gender: joinRequest.gender,
    dateOfBirth: joinRequest.birthDate,
    privacyLevel: 'membersOnly',
    allowGlobalMatching: false,
    linkedUserId: joinRequest.submittedBy
  };

  // Create person + link using addChild
  const result = await addChild(joinRequest.treeId, {
    marriageId,
    parentId,
    childData,
    motherId,
    createdBy: reviewedBy,
  });

  const newPerson = result.child;

  // Add member to tree
  if (joinRequest.submittedBy) {
    await dataService.addMember(joinRequest.treeId, {
      userId: joinRequest.submittedBy,
      role: invite.role,
      joinedAt: new Date().toISOString(),
    });
  }

  window.dispatchEvent(new Event('familyDataChanged'));

  // Update join request
  const updateData = {
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy,
    approvedPersonId: newPerson?.id || null,
  };

  await updateDoc(joinRequestRef, updateData);

  return { newPerson, updateData };
}

export async function getJoinRequestsByUserId(userId) {
  const joinRequestsRef = collection(db, "joinRequests");
  const q = query(joinRequestsRef, where("submittedBy", "==", userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}


export async function getJoinRequestsForTree(treeId) {
  const joinRequestsRef = collection(db, 'joinRequests');
  const q = query(joinRequestsRef, where('treeId', '==', treeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
