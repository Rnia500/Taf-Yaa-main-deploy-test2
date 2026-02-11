// src/services/data/eventServiceFirebase.js

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

async function addEvent(event) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check user permissions for adding event
    if (event.treeId && event.personIds && event.personIds.length > 0) {
      const tree = await dataService.getTree(event.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        // Check access for each person in the event
        for (const personId of event.personIds) {
          const hasAccess = await canUserAccessContent(currentUser.uid, memberData.role, personId, event.treeId, 'add', currentUser.uid);
          if (!hasAccess) {
            // For editors, mark event as pending review instead of blocking
            if (memberData.role === 'editor') {
              event.pendingReview = true;
              event.reviewReason = 'Event added for person(s) outside editor\'s lineage';
              break; // Mark as pending and stop checking further
            } else {
              throw new Error(`User ${currentUser.uid} does not have permission to add events for person ${personId}`);
            }
          }
        }
      }
    }

    // Log activity for event creation
    if (currentUser && event.treeId) {
      const tree = await dataService.getTree(event.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        await dataService.activityService.logActivity(
          event.treeId,
          currentUser.uid,
          memberData.displayName || currentUser.email || 'Unknown User',
          event.pendingReview ? 'event_pending_review' : 'event_added',
          { eventTitle: event.title || 'Untitled Event', eventId: event.id }
        );
      }
    }

    const eventRef = doc(db, 'events', event.id);
    const eventData = {
      ...event,
      active: true, // Add active field for better querying
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await setDoc(eventRef, eventData);
    return event;
  } catch (error) {
    throw new Error(`Failed to add event: ${error.message}`);
  }
}

async function getEvent(eventId) {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (eventSnap.exists()) {
      return { id: eventSnap.id, ...eventSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(`Failed to get event: ${error.message}`);
  }
}

async function updateEvent(eventId, updatedData) {
  try {
    const eventRef = doc(db, 'events', eventId);

    // Get current event to access createdBy and existing data
    const currentEvent = await getEvent(eventId);
    if (!currentEvent) {
      throw new Error("Event not found");
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check user permissions for updating event
    if (currentEvent.treeId && currentEvent.personIds && currentEvent.personIds.length > 0) {
      const tree = await dataService.getTree(currentEvent.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        // Check access for each person in the event
        for (const personId of currentEvent.personIds) {
          const hasAccess = await canUserAccessContent(currentUser.uid, memberData.role, personId, currentEvent.treeId, 'edit', currentEvent.createdBy);
          if (!hasAccess) {
            throw new Error(`User ${currentUser.uid} does not have permission to edit this event`);
          }
        }
      }
    }

    // Log activity for event update
    if (currentUser && currentEvent.treeId) {
      const tree = await dataService.getTree(currentEvent.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        await dataService.activityService.logActivity(
          currentEvent.treeId,
          currentUser.uid,
          memberData.displayName || currentUser.email || 'Unknown User',
          'event_edited',
          { eventTitle: currentEvent.title || 'Untitled Event', eventId: eventId }
        );
      }
    }

    const updateData = {
      ...updatedData,
      updatedAt: getCurrentTimestamp()
    };

    await updateDoc(eventRef, updateData);

    // Return updated event
    return await getEvent(eventId);
  } catch (error) {
    throw new Error(`Failed to update event: ${error.message}`);
  }
}

async function deleteEvent(eventId) {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check user permissions for deleting event
    if (event.treeId && event.personIds && event.personIds.length > 0) {
      const tree = await dataService.getTree(event.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        // Check access for each person in the event
        for (const personId of event.personIds) {
          const hasAccess = await canUserAccessContent(currentUser.uid, memberData.role, personId, event.treeId, 'delete', event.createdBy);
          if (!hasAccess) {
            throw new Error(`User ${currentUser.uid} does not have permission to delete this event`);
          }
        }
      }
    }

    // Log activity for event deletion
    if (currentUser && event.treeId) {
      const tree = await dataService.getTree(event.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        await dataService.activityService.logActivity(
          event.treeId,
          currentUser.uid,
          memberData.displayName || currentUser.email || 'Unknown User',
          'event_deleted',
          { eventTitle: event.title || 'Untitled Event', eventId: eventId }
        );
      }
    }

    // Permanently delete the event
    await deleteDoc(doc(db, 'events', eventId));

    console.log(`DBG:eventServiceFirebase.deleteEvent -> permanently removed ${eventId}`);
    return event;
  } catch (error) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }
}

async function getAllEvents(treeId) {
  try {
    if (!treeId) throw new Error("treeId is required to fetch events");

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('treeId', '==', treeId),
      where('active', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const events = [];
    querySnapshot.forEach(doc => events.push({ id: doc.id, ...doc.data() }));

    return events;
  } catch (error) {
    throw new Error(`Failed to get all events: ${error.message}`);
  }
}

async function getEventsByPersonId(personId, treeId) {
  try {
    if (!treeId) throw new Error("treeId is required to fetch events by person ID");

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('treeId', '==', treeId),
      where('active', '==', true),
      where('personIds', 'array-contains', personId)
    );
    const querySnapshot = await getDocs(q);

    const events = [];
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });

    // Sort: Birth first, then chronological by date
    const birthEvent = events.find(e => e.type === 'birth');
    const otherEvents = events.filter(e => e.type !== 'birth');

    // Sort other events by date (earliest first), null dates last
    otherEvents.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : Infinity;
      const dateB = b.date ? new Date(b.date).getTime() : Infinity;
      return dateA - dateB;
    });

    const sortedEvents = birthEvent ? [birthEvent, ...otherEvents] : otherEvents;
    return sortedEvents;
  } catch (error) {
    throw new Error(`Failed to get events by person ID: ${error.message}`);
  }
}

async function findEventsByTitle(query) {
  try {
    if (!query) {
      return [];
    }

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('active', '==', true),
      where('title', '>=', query.trim()),
      where('title', '<=', query.trim() + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(q);
    const results = [];
    
    querySnapshot.forEach((doc) => {
      const event = { id: doc.id, ...doc.data() };
      if (event.title && event.title.toLowerCase().includes(query.toLowerCase())) {
        results.push(event);
      }
    });
    
    return results;
  } catch (error) {
    throw new Error(`Failed to find events by title: ${error.message}`);
  }
}

// Mark events as deleted for a person (used during person deletion)
async function markEventsForPersonDeleted(personId, treeId, batchId, undoExpiresAt) {
  try {
    if (!treeId) throw new Error("treeId is required to mark events for person deleted");

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('treeId', '==', treeId),
      where('active', '==', true),
      where('personIds', 'array-contains', personId)
    );
    const querySnapshot = await getDocs(q);

    let markedCount = 0;
    const now = new Date().toISOString();

    for (const doc of querySnapshot.docs) {
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

    console.log(`DBG:eventServiceFirebase.markEventsForPersonDeleted -> marked ${markedCount} events for person ${personId} in tree ${treeId}`);
    return { markedCount };
  } catch (error) {
    throw new Error(`Failed to mark events for person deleted: ${error.message}`);
  }
}

// Undo deletion for events in a batch
async function undoEventsDeletion(batchId) {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('deletionBatchId', '==', batchId));
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

    console.log(`DBG:eventServiceFirebase.undoEventsDeletion -> restored ${restoredCount} events for batch ${batchId}`);
    return { restoredCount };
  } catch (error) {
    throw new Error(`Failed to undo events deletion: ${error.message}`);
  }
}

// Permanently remove expired deleted events
async function purgeExpiredDeletedEvents() {
  try {
    const eventsRef = collection(db, 'events');
    const now = new Date();
    const q = query(
      eventsRef,
      where('pendingDeletion', '==', true),
      where('undoExpiresAt', '<=', now.toISOString())
    );
    const querySnapshot = await getDocs(q);
    
    let removedCount = 0;

    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
      removedCount++;
    }

    console.log(`DBG:eventServiceFirebase.purgeExpiredDeletedEvents -> removed ${removedCount} expired events`);
    return { removedCount };
  } catch (error) {
    throw new Error(`Failed to purge expired deleted events: ${error.message}`);
  }
}

// Export all the functions in a single service object.
export const eventServiceFirebase = {
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