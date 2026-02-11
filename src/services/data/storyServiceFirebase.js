// src/services/data/storyServiceFirebase.js

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
import { db, auth } from '../../config/firebase.js';
import { generateId } from '../../utils/personUtils/idGenerator.js';
import dataService from '../dataService.js';
import { canUserAccessContent } from '../../utils/lineageUtils.js';
import { checkPermission, ACTIONS, getPermissionErrorMessage } from '../../utils/permissions.js';

// Helper function to get current timestamp
const getCurrentTimestamp = () => serverTimestamp();

// Helper function to calculate contributors from createdBy and attachments
const calculateContributors = (createdBy, attachments = []) => {
  const contributors = new Set();
  contributors.add(createdBy);

  if (attachments && attachments.length > 0) {
    attachments.forEach(attachment => {
      if (attachment.uploadedBy) {
        contributors.add(attachment.uploadedBy);
      }
    });
  }

  return Array.from(contributors);
};

async function addStory(story) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check user permissions for adding story
    if (story.treeId && story.personId) {
      const tree = await dataService.getTree(story.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        const hasAccess = await canUserAccessContent(currentUser.uid, memberData.role, story.personId, story.treeId, 'add', currentUser.uid);
        if (!hasAccess) {
          // For editors, mark story as pending review instead of blocking
          if (memberData.role === 'editor') {
            story.pendingReview = true;
            story.reviewReason = 'Content added for person outside editor\'s lineage';
          } else {
            throw new Error(`User ${currentUser.uid} does not have permission to add stories for person ${story.personId}`);
          }
        }
      }
    }

    // Log activity for story creation
    if (currentUser && story.treeId) {
      const tree = await dataService.getTree(story.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        await dataService.activityService.logActivity(
          story.treeId,
          currentUser.uid,
          memberData.displayName || currentUser.email || 'Unknown User',
          story.pendingReview ? 'story_pending_review' : 'story_added',
          { storyTitle: story.title || 'Untitled', storyId: story.id || generateId("story") }
        );
      }
    }

    const storyRef = doc(db, 'stories', story.id || generateId("story"));
    const storyData = {
      ...story,
      active: true, // Add active field for better querying
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await setDoc(storyRef, storyData);
    return story;
  } catch (error) {
    throw new Error(`Failed to add story: ${error.message}`);
  }
}

async function getStory(storyId) {
  try {
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (storySnap.exists()) {
      return { id: storySnap.id, ...storySnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(`Failed to get story: ${error.message}`);
  }
}

async function updateStory(storyId, updatedData) {
  try {
    const storyRef = doc(db, 'stories', storyId);

    // Get current story to access createdBy and existing attachments
    const currentStory = await getStory(storyId);
    if (!currentStory) {
      throw new Error("Story not found");
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check user permissions for updating story
    if (currentStory.treeId && currentStory.personId) {
      const tree = await dataService.getTree(currentStory.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        const hasAccess = await canUserAccessContent(currentUser.uid, memberData.role, currentStory.personId, currentStory.treeId, 'edit', currentStory.createdBy);
        if (!hasAccess) {
          throw new Error(`User ${currentUser.uid} does not have permission to edit this story`);
        }
      }
    }

    // Log activity for story update
    if (currentUser && currentStory.treeId) {
      const tree = await dataService.getTree(currentStory.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        await dataService.activityService.logActivity(
          currentStory.treeId,
          currentUser.uid,
          memberData.displayName || currentUser.email || 'Unknown User',
          'story_edited',
          { storyTitle: currentStory.title || 'Untitled', storyId: storyId }
        );
      }
    }

    const updateData = {
      ...updatedData,
      updatedAt: getCurrentTimestamp()
    };

    // Log activity for attachment addition if attachments are being added
    if (updatedData.attachments && updatedData.attachments.length > 0) {
      const currentUser = auth.currentUser;
      if (currentUser && currentStory.treeId) {
        const tree = await dataService.getTree(currentStory.treeId);
        const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
        if (memberData) {
          await dataService.activityService.logActivity(
            currentStory.treeId,
            currentUser.uid,
            memberData.displayName || currentUser.email || 'Unknown User',
            'attachment_added',
            { storyTitle: currentStory.title || 'Untitled', storyId: storyId }
          );
        }
      }
    }

    // Recalculate contributors if attachments are being updated
    if (updatedData.attachments) {
      updateData.contributors = calculateContributors(currentStory.createdBy, updatedData.attachments);
    }

    await updateDoc(storyRef, updateData);

    // Return updated story
    return await getStory(storyId);
  } catch (error) {
    throw new Error(`Failed to update story: ${error.message}`);
  }
}

async function deleteStory(storyId) {
  try {
    const story = await getStory(storyId);
    if (!story) {
      throw new Error("Story not found");
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check user permissions for deleting story
    if (story.treeId && story.personId) {
      const tree = await dataService.getTree(story.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        const hasAccess = await canUserAccessContent(currentUser.uid, memberData.role, story.personId, story.treeId, 'delete', story.createdBy);
        if (!hasAccess) {
          throw new Error(`User ${currentUser.uid} does not have permission to delete this story`);
        }
      }
    }

    // Log activity for story deletion
    if (currentUser && story.treeId) {
      const tree = await dataService.getTree(story.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        await dataService.activityService.logActivity(
          story.treeId,
          currentUser.uid,
          memberData.displayName || currentUser.email || 'Unknown User',
          'story_deleted',
          { storyTitle: story.title || 'Untitled', storyId: storyId }
        );
      }
    }

    // Permanently delete the story
    await deleteDoc(doc(db, 'stories', storyId));

    console.log(`DBG:storyServiceFirebase.deleteStory -> permanently removed ${storyId}`);
    return story;
  } catch (error) {
    throw new Error(`Failed to delete story: ${error.message}`);
  }
}

async function getAllStories(treeId) {
  try {
    if (!treeId) throw new Error("treeId is required to fetch stories");

    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('treeId', '==', treeId),
      where('active', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const stories = [];
    querySnapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() });
    });

    return stories;
  } catch (error) {
    throw new Error(`Failed to get all stories: ${error.message}`);
  }
}


async function getStoriesByPersonId(personId, treeId) {
  try {
    if (!treeId) throw new Error("treeId is required to fetch stories by person ID");

    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('treeId', '==', treeId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);

    const stories = [];
    querySnapshot.forEach((doc) => {
      const story = { id: doc.id, ...doc.data() };

      // Check if story is for this person
      if (story.personId === personId ||
          (Array.isArray(story.personIds) && story.personIds.includes(personId))) {
        stories.push(story);
      }
    });

    return stories;
  } catch (error) {
    throw new Error(`Failed to get stories by person ID: ${error.message}`);
  }
}

async function findStoriesByTitle(query) {
  try {
    if (!query) {
      return [];
    }

    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('active', '==', true),
      where('title', '>=', query.trim()),
      where('title', '<=', query.trim() + '\uf8ff')
    );

    const querySnapshot = await getDocs(q);
    const results = [];

    querySnapshot.forEach((doc) => {
      const story = { id: doc.id, ...doc.data() };
      if (story.title && story.title.toLowerCase().includes(query.toLowerCase())) {
        results.push(story);
      }
    });

    return results;
  } catch (error) {
    throw new Error(`Failed to find stories by title: ${error.message}`);
  }
}

async function getStoriesByCreator(creatorId) {
  try {
    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('active', '==', true),
      where('createdBy', '==', creatorId)
    );
    const querySnapshot = await getDocs(q);

    const stories = [];
    querySnapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() });
    });

    return stories;
  } catch (error) {
    throw new Error(`Failed to get stories by creator: ${error.message}`);
  }
}

async function getStoriesByContributor(contributorId) {
  try {
    const storiesRef = collection(db, 'stories');

    // Get stories where user is the creator
    const creatorQuery = query(
      storiesRef,
      where('active', '==', true),
      where('createdBy', '==', contributorId)
    );
    const creatorSnapshot = await getDocs(creatorQuery);
    const creatorStories = creatorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get stories where user is in contributors array
    const contributorQuery = query(
      storiesRef,
      where('active', '==', true),
      where('contributors', 'array-contains', contributorId)
    );
    const contributorSnapshot = await getDocs(contributorQuery);
    const contributorStories = contributorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Combine and deduplicate stories
    const allStories = [...creatorStories];
    contributorStories.forEach(story => {
      if (!allStories.find(s => s.id === story.id)) {
        allStories.push(story);
      }
    });

    return allStories;
  } catch (error) {
    throw new Error(`Failed to get stories by contributor: ${error.message}`);
  }
}

// Mark stories as deleted for a person (used during person deletion)
async function markStoriesForPersonDeleted(personId, batchId, undoExpiresAt) {
  try {
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, where('active', '==', true));
    const querySnapshot = await getDocs(q);

    let markedCount = 0;
    const now = new Date().toISOString();

    for (const doc of querySnapshot.docs) {
      const story = { id: doc.id, ...doc.data() };

      // Check if story is for this person
      if (story.personId === personId ||
          (Array.isArray(story.personIds) && story.personIds.includes(personId))) {

        const updateData = {
          isDeleted: true,
          deletedAt: now,
          deletionMode: "cascade",
          pendingDeletion: true,
          undoExpiresAt: undoExpiresAt,
          deletionBatchId: batchId,
          active: false, // Mark as inactive
          updatedAt: getCurrentTimestamp()
        };

        await updateDoc(doc.ref, updateData);
        markedCount++;
      }
    }

    console.log(`DBG:storyServiceFirebase.markStoriesForPersonDeleted -> marked ${markedCount} stories for person ${personId}`);
    return { markedCount };
  } catch (error) {
    throw new Error(`Failed to mark stories for person deleted: ${error.message}`);
  }
}

// Undo deletion for stories in a batch
async function undoStoriesDeletion(batchId) {
  try {
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, where('deletionBatchId', '==', batchId));
    const querySnapshot = await getDocs(q);

    let restoredCount = 0;

    for (const doc of querySnapshot.docs) {
      const updateData = {
        isDeleted: deleteField(),
        deletedAt: deleteField(),
        deletionMode: deleteField(),
        pendingDeletion: deleteField(),
        undoExpiresAt: deleteField(),
        deletionBatchId: deleteField(),
        active: true, // Restore active status
        updatedAt: getCurrentTimestamp()
      };

      await updateDoc(doc.ref, updateData);
      restoredCount++;
    }

    console.log(`DBG:storyServiceFirebase.undoStoriesDeletion -> restored ${restoredCount} stories for batch ${batchId}`);
    return { restoredCount };
  } catch (error) {
    throw new Error(`Failed to undo stories deletion: ${error.message}`);
  }
}

// Permanently remove expired deleted stories
async function purgeExpiredDeletedStories() {
  try {
    const storiesRef = collection(db, 'stories');
    const now = new Date();
    const q = query(
      storiesRef,
      where('pendingDeletion', '==', true),
      where('undoExpiresAt', '<=', now.toISOString())
    );
    const querySnapshot = await getDocs(q);

    let removedCount = 0;

    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
      removedCount++;
    }

    console.log(`DBG:storyServiceFirebase.purgeExpiredDeletedStories -> removed ${removedCount} expired stories`);
    return { removedCount };
  } catch (error) {
    throw new Error(`Failed to purge expired deleted stories: ${error.message}`);
  }
}

// Export all the functions in a single service object.
export const storyServiceFirebase = {
  addStory,
  getStory,
  updateStory,
  deleteStory,
  getAllStories,
  getStoriesByPersonId,
  getStoriesByCreator,
  getStoriesByContributor,
  findStoriesByTitle,
  markStoriesForPersonDeleted,
  undoStoriesDeletion,
  purgeExpiredDeletedStories,
};
