// src/services/data/eventServiceLocal.js

// 1. Import the database manager, not the DB itself.
import { getDB, saveDB } from "./localDB.js";
import { generateId } from "../../utils/personUtils/idGenerator.js";

//  Event-Specific Data Access Functions (Local Storage Implementation) 

function addEvent(event) {
  const db = getDB();
  // Ensure the events array exists
  db.events = db.events || [];

  const exists = db.events.find(e => e.id === event.id);
  if (exists) {
    console.warn("eventServiceLocal.addEvent -> duplicate event id detected:", event.id);
    event = { ...event, id: generateId("event") };
  }
  db.events.push(event);
  saveDB();
  return Promise.resolve(event);
}

function getEvent(eventId) {
  const db = getDB();
  const ev = (db.events || []).find(e => e.id === eventId);
  return Promise.resolve(ev);
}

function updateEvent(eventId, updatedData) {
  const db = getDB();
  const eventIndex = (db.events || []).findIndex(e => e.id === eventId);
  if (eventIndex === -1) {
    return Promise.reject(new Error("Event not found"));
  }
  db.events[eventIndex] = { ...db.events[eventIndex], ...updatedData, updatedAt: new Date().toISOString() };
  saveDB();
  return Promise.resolve(db.events[eventIndex]);
}

function deleteEvent(eventId) {
  const db = getDB();
  const eventIndex = (db.events || []).findIndex(e => e.id === eventId);
  if (eventIndex === -1) {
    return Promise.reject(new Error("Event not found"));
  }
  const removed = db.events.splice(eventIndex, 1)[0];
  saveDB();
  return Promise.resolve(removed);
}

function getAllEvents() {
  const db = getDB();
  // Filter out deleted events
  const events = (db.events || []).filter(e => !e.isDeleted);
  return Promise.resolve(events);
}

function getEventsByPersonId(personId) {
  const db = getDB();
  // Filter out deleted events and only return events involving this person
  let evts = (db.events || []).filter(e => 
    !e.isDeleted && 
    Array.isArray(e.personIds) && 
    e.personIds.includes(personId)
  );

  // Sort: Birth first, then chronological by date
  const birthEvent = evts.find(e => e.type === 'birth');
  const otherEvents = evts.filter(e => e.type !== 'birth');

  // Sort other events by date (earliest first), null dates last
  otherEvents.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : Infinity;
    const dateB = b.date ? new Date(b.date).getTime() : Infinity;
    return dateA - dateB;
  });

  const sortedEvents = birthEvent ? [birthEvent, ...otherEvents] : otherEvents;
  return Promise.resolve(sortedEvents);
}

function findEventsByTitle(query) {
  const db = getDB();
  if (!query) return Promise.resolve([]);
  const q = String(query).trim().toLowerCase();
  // Filter out deleted events
  const results = (db.events || []).filter(e => 
    !e.isDeleted && 
    (e.title || '').toLowerCase().includes(q)
  );
  return Promise.resolve(results);
}

// Mark events as deleted for a person (used during person deletion)
function markEventsForPersonDeleted(personId, batchId, undoExpiresAt) {
  const db = getDB();
  const now = new Date().toISOString();
  let markedCount = 0;

  for (const event of db.events || []) {
    if (Array.isArray(event.personIds) && event.personIds.includes(personId)) {
      event.isDeleted = true;
      event.deletedAt = now;
      event.deletionMode = "cascade";
      event.pendingDeletion = true;
      event.undoExpiresAt = undoExpiresAt;
      event.deletionBatchId = batchId;
      markedCount++;
    }
  }

  saveDB();
  console.log(`DBG:eventServiceLocal.markEventsForPersonDeleted -> marked ${markedCount} events for person ${personId}`);
  return Promise.resolve({ markedCount });
}

// Undo deletion for events in a batch
function undoEventsDeletion(batchId) {
  const db = getDB();
  let restoredCount = 0;

  for (const event of db.events || []) {
    if (event.deletionBatchId === batchId && event.pendingDeletion) {
      delete event.isDeleted;
      delete event.deletedAt;
      delete event.deletionMode;
      delete event.pendingDeletion;
      delete event.undoExpiresAt;
      delete event.deletionBatchId;
      restoredCount++;
    }
  }

  saveDB();
  console.log(`DBG:eventServiceLocal.undoEventsDeletion -> restored ${restoredCount} events for batch ${batchId}`);
  return Promise.resolve({ restoredCount });
}

// Permanently remove expired deleted events
function purgeExpiredDeletedEvents() {
  const db = getDB();
  const now = new Date();
  let removedCount = 0;

  db.events = (db.events || []).filter(event => {
    if (event.pendingDeletion && event.undoExpiresAt) {
      const isExpired = new Date(event.undoExpiresAt) < now;
      if (isExpired) {
        removedCount++;
        return false; // Remove from array
      }
    }
    return true; // Keep in array
  });

  saveDB();
  console.log(`DBG:eventServiceLocal.purgeExpiredDeletedEvents -> removed ${removedCount} expired events`);
  return Promise.resolve({ removedCount });
}

// Export all the functions in a single, coherent service object.
export const eventServiceLocal = {
  addEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventsByPersonId,
  findEventsByTitle,
  markEventsForPersonDeleted,
  undoEventsDeletion,
  purgeExpiredDeletedEvents,
};
