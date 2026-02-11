// src/services/inviteService.js
import QRCode from 'qrcode';
import { createInvite } from '../models/featuresModels/InviteModel';
import { db, auth } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

// Helper to generate a random code of 8-12 characters
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * 5) + 8; // 8 to 12
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate QR code data URL
async function generateQr(text) {
  const dataUrl = await QRCode.toDataURL(text, { errorCorrectionLevel: 'H', margin: 2, scale: 6 });
  return dataUrl;
}

// Create a new invite
export async function createInviteService({
  treeId,
  createdBy,
  type,
  role,
  fatherId = null,
  motherId = null,
  personId = null,
  usesAllowed = 1,
  expiresAt,
  notes,
  appBaseUrl = 'https://tafyaa.netlify.app',
}) {
  const code = generateInviteCode();
  const joinUrl = `${appBaseUrl}/join?code=${encodeURIComponent(code)}`;
  const qrDataUrl = await generateQr(joinUrl);

  const invite = createInvite({
    code,
    treeId,
    createdBy,
    type,
    role,
    fatherId,
    motherId,
    personId,
    usesAllowed,
    expiresAt,
    qrDataUrl,
    joinUrl,
    notes,
  });

  // Save to Firestore
  const inviteRef = doc(collection(db, 'invites'), invite.InviteId);
  await setDoc(inviteRef, invite);

  // Log activity for invite creation
  const activityService = (await import('./activityService')).default;
  await activityService.logActivity(
    treeId,
    createdBy,
    '', // userName will be resolved in the service
    'invite_created',
    {
      inviteId: invite.InviteId,
      inviteCode: code,
      inviteType: type,
      inviteRole: role,
    }
  );

  return { id: invite.InviteId, ...invite };
}

export async function validateInviteCode(code) {
  try {
    const response = await fetch('/.netlify/functions/validate-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to validate invite');
    }

    return {
      invite: data.invite,
      inviteId: data.invite.id,
      tree: data.tree,
    };
  } catch (error) {
    throw new Error(`Failed to validate invite: ${error.message}`);
  }
}



// Get invites for a tree (for admin management) - now uses server function
export async function getInvitesForTree(treeId) {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/.netlify/functions/manage-invites', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch invites');
    }

    // Filter by treeId since the function returns all user's invites
    return data.data.filter(invite => invite.treeId === treeId);
  } catch (error) {
    throw new Error(`Failed to get invites: ${error.message}`);
  }
}



// Update an invite
export async function updateInviteService({
  id,
  treeId,
  type,
  role,
  fatherId = null,
  motherId = null,
  personId = null,
  usesAllowed = 1,
  expiresAt,
  notes,
}) {
  const inviteRef = doc(collection(db, 'invites'), id);
  const updateData = {
    type,
    role,
    fatherId,
    motherId,
    personId,
    usesAllowed,
    expiresAt,
    notes,
    updatedAt: new Date().toISOString()
  };

  await updateDoc(inviteRef, updateData);

  // Log activity for invite editing
  const activityService = (await import('./activityService')).default;
  await activityService.logActivity(
    treeId,
    '', // userId will be resolved in the service
    '', // userName will be resolved in the service
    'invite_edited',
    {
      inviteId: id,
      inviteCode: '', // Will need to be passed or fetched
      inviteType: type,
      inviteRole: role,
      changedFields: Object.keys(updateData),
    }
  );

  // Return the updated invite data
  return { id, ...updateData };
}

// Revoke an invite
export async function revokeInvite(inviteId, treeId, userId, userName) {
  const inviteRef = doc(collection(db, 'invites'), inviteId);
  await updateDoc(inviteRef, { status: 'revoked', updatedAt: new Date().toISOString() });

  // Log activity for invite revocation
  const activityService = (await import('./activityService')).default;
  await activityService.logActivity(
    treeId,
    userId,
    userName,
    'invite_revoked',
    {
      inviteId: inviteId,
      inviteCode: '', // Will be fetched from invite data if needed
      inviteType: '', // Will be fetched from invite data if needed
      inviteRole: '', // Will be fetched from invite data if needed
    }
  );
}

// Get invites created by a specific user
export async function getInvitesForUser(createdBy) {
  const invitesRef = collection(db, 'invites');
  const q = query(invitesRef, where('createdBy', '==', createdBy));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
