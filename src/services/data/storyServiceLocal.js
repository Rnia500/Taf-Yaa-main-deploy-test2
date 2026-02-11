// src/services/data/storyServiceLocal.js

// 1. Import the database manager.
import { getDB, saveDB } from "./localDB.js";
import { generateId } from "../../utils/personUtils/idGenerator.js";

//  Story-Specific Data Access Functions (Local Storage Implementation) 

function addStory(story) {
  const db = getDB();
  db.stories = db.stories || [];

  const exists = db.stories.find(s => s.storyId === story.storyId);
  if (exists) {
    console.warn("storyServiceLocal.addStory -> duplicate story id detected:", story.storyId);
    story = { ...story, storyId: generateId("story") };
  }
  db.stories.push(story);
  saveDB();
  return Promise.resolve(story);
}

function getStory(storyId) {
  const db = getDB();
  const s = (db.stories || []).find(st => st.storyId === storyId);
  return Promise.resolve(s);
}

function updateStory(storyId, updatedData) {
  const db = getDB();
  const storyIndex = (db.stories || []).findIndex(s => s.storyId === storyId);
  if (storyIndex === -1) {
    return Promise.reject(new Error("Story not found"));
  }
  db.stories[storyIndex] = { ...db.stories[storyIndex], ...updatedData, updatedAt: new Date().toISOString() };
  saveDB();
  return Promise.resolve(db.stories[storyIndex]);
}

function deleteStory(storyId) {
  const db = getDB();
  const storyIndex = (db.stories || []).findIndex(s => s.storyId === storyId);
  if (storyIndex === -1) {
    return Promise.reject(new Error("Story not found"));
  }
  const removed = db.stories.splice(storyIndex, 1)[0];
  saveDB();
  return Promise.resolve(removed);
}

function getAllStories() {
  const db = getDB();
  // Filter out deleted stories
  const stories = (db.stories || []).filter(s => !s.isDeleted);
  return Promise.resolve(stories);
}

function getStoriesByPersonId(personId) {
  const db = getDB();
  // Filter out deleted stories and only return stories for this person
  const stories = (db.stories || []).filter(s => 
    !s.isDeleted && 
    (s.personId === personId || (Array.isArray(s.personIds) && s.personIds.includes(personId)))
  );
  return Promise.resolve(stories);
}

function findStoriesByTitle(query) {
  const db = getDB();
  if (!query) return Promise.resolve([]);
  const q = String(query).trim().toLowerCase();
  // Filter out deleted stories
  const results = (db.stories || []).filter(s => 
    !s.isDeleted && 
    (s.title || '').toLowerCase().includes(q)
  );
  return Promise.resolve(results);
}

// Mark stories as deleted for a person (used during person deletion)
function markStoriesForPersonDeleted(personId, batchId, undoExpiresAt) {
  const db = getDB();
  const now = new Date().toISOString();
  let markedCount = 0;

  for (const story of db.stories || []) {
    if (story.personId === personId || (Array.isArray(story.personIds) && story.personIds.includes(personId))) {
      story.isDeleted = true;
      story.deletedAt = now;
      story.deletionMode = "cascade";
      story.pendingDeletion = true;
      story.undoExpiresAt = undoExpiresAt;
      story.deletionBatchId = batchId;
      markedCount++;
    }
  }

  saveDB();
  console.log(`DBG:storyServiceLocal.markStoriesForPersonDeleted -> marked ${markedCount} stories for person ${personId}`);
  return Promise.resolve({ markedCount });
}

// Undo deletion for stories in a batch
function undoStoriesDeletion(batchId) {
  const db = getDB();
  let restoredCount = 0;

  for (const story of db.stories || []) {
    if (story.deletionBatchId === batchId && story.pendingDeletion) {
      delete story.isDeleted;
      delete story.deletedAt;
      delete story.deletionMode;
      delete story.pendingDeletion;
      delete story.undoExpiresAt;
      delete story.deletionBatchId;
      restoredCount++;
    }
  }

  saveDB();
  console.log(`DBG:storyServiceLocal.undoStoriesDeletion -> restored ${restoredCount} stories for batch ${batchId}`);
  return Promise.resolve({ restoredCount });
}

// Permanently remove expired deleted stories
function purgeExpiredDeletedStories() {
  const db = getDB();
  const now = new Date();
  let removedCount = 0;

  db.stories = (db.stories || []).filter(story => {
    if (story.pendingDeletion && story.undoExpiresAt) {
      const isExpired = new Date(story.undoExpiresAt) < now;
      if (isExpired) {
        removedCount++;
        return false; // Remove from array
      }
    }
    return true; // Keep in array
  });

  saveDB();
  console.log(`DBG:storyServiceLocal.purgeExpiredDeletedStories -> removed ${removedCount} expired stories`);
  return Promise.resolve({ removedCount });
}

// Export all the functions in a single, coherent service object.
export const storyServiceLocal = {
  addStory,
  getStory,
  updateStory,
  deleteStory,
  getAllStories,
  getStoriesByPersonId,
  findStoriesByTitle,
  markStoriesForPersonDeleted,
  undoStoriesDeletion,
  purgeExpiredDeletedStories,
};
