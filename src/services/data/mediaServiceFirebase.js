// src/services/data/mediaServiceFirebase.js

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { generateId } from '../../utils/personUtils/idGenerator.js';

// Helper function to get current timestamp
const getCurrentTimestamp = () => serverTimestamp();

async function addMedia(media) {
  try {
    // Check if media with same ID already exists
    const existingMedia = await getMedia(media.id);
    if (existingMedia) {
      console.warn("mediaServiceFirebase.addMedia -> duplicate media id detected:", media.id);
      media = { ...media, id: generateId("media") };
    }

    const mediaRef = doc(db, 'media', media.id);
    const mediaData = {
      ...media,
      active: true, // Add active field for better querying
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await setDoc(mediaRef, mediaData);
    return media;
  } catch (error) {
    throw new Error(`Failed to add media: ${error.message}`);
  }
}

async function getMedia(mediaId) {
  try {
    const mediaRef = doc(db, 'media', mediaId);
    const mediaSnap = await getDoc(mediaRef);

    if (mediaSnap.exists()) {
      return { id: mediaSnap.id, ...mediaSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(`Failed to get media: ${error.message}`);
  }
}

async function updateMedia(mediaId, updatedData) {
  try {
    const mediaRef = doc(db, 'media', mediaId);
    const updateData = {
      ...updatedData,
      updatedAt: getCurrentTimestamp()
    };

    await updateDoc(mediaRef, updateData);

    // Return updated media
    return await getMedia(mediaId);
  } catch (error) {
    throw new Error(`Failed to update media: ${error.message}`);
  }
}

async function deleteMedia(mediaId) {
  try {
    const media = await getMedia(mediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    // Permanently delete the media
    await deleteDoc(doc(db, 'media', mediaId));

    console.log(`DBG:mediaServiceFirebase.deleteMedia -> permanently removed ${mediaId}`);
    return media;
  } catch (error) {
    throw new Error(`Failed to delete media: ${error.message}`);
  }
}

async function getAllMedia() {
  try {
    const mediaRef = collection(db, 'media');
    const q = query(mediaRef, where('active', '==', true));
    const querySnapshot = await getDocs(q);

    const media = [];
    querySnapshot.forEach((doc) => {
      media.push({ id: doc.id, ...doc.data() });
    });

    return media;
  } catch (error) {
    throw new Error(`Failed to get all media: ${error.message}`);
  }
}

async function getMediaByTreeId(treeId) {
  try {
    const mediaRef = collection(db, 'media');
    const q = query(mediaRef, where('active', '==', true), where('treeId', '==', treeId));
    const querySnapshot = await getDocs(q);

    const media = [];
    querySnapshot.forEach((doc) => {
      media.push({ id: doc.id, ...doc.data() });
    });

    return media;
  } catch (error) {
    throw new Error(`Failed to get media by tree ID: ${error.message}`);
  }
}

async function getMediaByPersonId(personId) {
  try {
    const mediaRef = collection(db, 'media');
    const q = query(mediaRef, where('active', '==', true), where('personId', '==', personId));
    const querySnapshot = await getDocs(q);

    const media = [];
    querySnapshot.forEach((doc) => {
      media.push({ id: doc.id, ...doc.data() });
    });

    return media;
  } catch (error) {
    throw new Error(`Failed to get media by person ID: ${error.message}`);
  }
}

async function getMediaByRole(treeId, role) {
  try {
    const mediaRef = collection(db, 'media');
    const q = query(
      mediaRef,
      where('active', '==', true),
      where('treeId', '==', treeId),
      where('role', '==', role)
    );
    const querySnapshot = await getDocs(q);

    const media = [];
    querySnapshot.forEach((doc) => {
      media.push({ id: doc.id, ...doc.data() });
    });

    return media;
  } catch (error) {
    throw new Error(`Failed to get media by role: ${error.message}`);
  }
}

// Mark media as deleted for a person (used during person deletion)
async function markMediaForPersonDeleted(personId, _batchId, _undoExpiresAt) {
  try {
    const mediaRef = collection(db, 'media');
    const q = query(mediaRef, where('active', '==', true), where('personId', '==', personId));
    const querySnapshot = await getDocs(q);

    let markedCount = 0;
    const now = new Date().toISOString();

    for (const doc of querySnapshot.docs) {
      const updateData = {
        deleted: true,
        deletedAt: now,
        active: false, // Mark as inactive
        updatedAt: getCurrentTimestamp()
      };

      await updateDoc(doc.ref, updateData);
      markedCount++;
    }

    console.log(`DBG:mediaServiceFirebase.markMediaForPersonDeleted -> marked ${markedCount} media for person ${personId}`);
    return { markedCount };
  } catch (error) {
    throw new Error(`Failed to mark media for person deleted: ${error.message}`);
  }
}

// Undo deletion for media in a batch
async function undoMediaDeletion(batchId) {
  try {
    const mediaRef = collection(db, 'media');
    const q = query(mediaRef, where('deletionBatchId', '==', batchId));
    const querySnapshot = await getDocs(q);

    let restoredCount = 0;

    for (const doc of querySnapshot.docs) {
      const updateData = {
        deleted: deleteField(),
        deletedAt: deleteField(),
        active: true, // Restore active status
        updatedAt: getCurrentTimestamp()
      };

      await updateDoc(doc.ref, updateData);
      restoredCount++;
    }

    console.log(`DBG:mediaServiceFirebase.undoMediaDeletion -> restored ${restoredCount} media for batch ${batchId}`);
    return { restoredCount };
  } catch (error) {
    throw new Error(`Failed to undo media deletion: ${error.message}`);
  }
}

// Permanently remove expired deleted media
async function purgeExpiredDeletedMedia() {
  try {
    const mediaRef = collection(db, 'media');
    const now = new Date();
    const q = query(
      mediaRef,
      where('pendingDeletion', '==', true),
      where('undoExpiresAt', '<=', now.toISOString())
    );
    const querySnapshot = await getDocs(q);

    let removedCount = 0;

    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
      removedCount++;
    }

    console.log(`DBG:mediaServiceFirebase.purgeExpiredDeletedMedia -> removed ${removedCount} expired media`);
    return { removedCount };
  } catch (error) {
    throw new Error(`Failed to purge expired deleted media: ${error.message}`);
  }
}

// Export all the functions in a single service object.
export const mediaServiceFirebase = {
  addMedia,
  getMedia,
  updateMedia,
  deleteMedia,
  getAllMedia,
  getMediaByTreeId,
  getMediaByPersonId,
  getMediaByRole,
  markMediaForPersonDeleted,
  undoMediaDeletion,
  purgeExpiredDeletedMedia,
};
