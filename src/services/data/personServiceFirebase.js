// src/services/data/personServiceFirebase.js

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
import { marriageServiceFirebase } from './marriageServiceFirebase.js';
import { eventServiceFirebase } from './eventServiceFirebase.js';
import { storyServiceFirebase } from './storyServiceFirebase.js';
import dataService from '../dataService.js';
import { canUserAccessPerson } from '../../utils/lineageUtils.js';

// Helper function to get current timestamp
const getCurrentTimestamp = () => serverTimestamp();

// Helper function to generate deletion batch ID
const generateDeletionBatchId = () => generateId("deletion");

async function addPerson(person) {
  try {
    // Ensure unique ID
    if (!person?.id) {
      person.id = generateId("person");
    }

    // Firestore rule requires treeId for permission validation
    if (!person.treeId) {
      throw new Error("Missing treeId in person data (required for Firestore permissions)");
    }

    // Debug logging for permissions
    const currentUser = auth.currentUser;
    console.log("addPerson -> Current user:", currentUser?.uid);
    console.log("addPerson -> Person treeId:", person.treeId);
    console.log("addPerson -> Person data:", person);

    // Check if user is authenticated
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Check tree membership
    const tree = await dataService.getTree(person.treeId);
    console.log("addPerson -> Tree data:", tree);

    if (!tree) {
      throw new Error(`Tree ${person.treeId} not found`);
    }

    if (!tree.memberUIDs?.includes(currentUser.uid)) {
      throw new Error(`User ${currentUser.uid} is not a member of tree ${person.treeId}`);
    }

    // Check user role in tree
    const memberData = tree.members?.find(m => m.userId === currentUser.uid);
    console.log("addPerson -> Member data:", memberData);

    if (!memberData) {
      throw new Error(`User ${currentUser.uid} member data not found in tree ${person.treeId}`);
    }

    const allowedRoles = ['admin', 'moderator', 'editor'];
    if (!allowedRoles.includes(memberData.role)) {
      throw new Error(`User ${currentUser.uid} has role '${memberData.role}' which is not allowed to create people in tree ${person.treeId}`);
    }

    // For editors, check lineage restrictions - they can only add people to their lineage
    if (memberData.role === 'editor') {
      // When adding a person, we need to check if they have permission to add to the specified parent
      // This will be checked in the controller based on the parent relationship
      // For now, we'll allow the creation but restrict based on parent in the UI/controller
    }

    const personRef = doc(db, "people", person.id);
    const personData = {
      ...person,
      active: true,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    console.log("addPerson -> Attempting to create person with data:", personData);
    await setDoc(personRef, personData);
    console.log("addPerson -> Person created successfully");

    // Log activity
    await dataService.activityService.logActivity(
      person.treeId,
      currentUser.uid,
      currentUser.displayName || 'Unknown User',
      'person_added',
      { personName: person.name || 'Unknown', personId: person.id }
    );

    return { id: person.id, ...personData };
  } catch (error) {
    console.error("addPerson -> Firestore error:", error);
    console.error("addPerson -> Error details:", error.message);
    throw new Error(`Failed to add person: ${error.message}`);
  }
}


async function getPerson(id) {
  try {
    const personRef = doc(db, 'people', id);
    const personSnap = await getDoc(personRef);

    if (personSnap.exists()) {
      const person = { id: personSnap.id, ...personSnap.data() };

      // Check lineage restrictions for editors
      const currentUser = auth.currentUser;
      if (currentUser && person.treeId) {
        const tree = await dataService.getTree(person.treeId);
        const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
        if (memberData && memberData.role === 'editor') {
          if (!(await canUserAccessPerson(currentUser.uid, memberData.role, id, person.treeId, 'view'))) {
            throw new Error(`Editor ${currentUser.uid} does not have access to person ${id} (not in their lineage)`);
          }
        }
      }

      return person;
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(`Failed to get person: ${error.message}`);
  }
}

async function updatePerson(personId, updatedPersonData) {
  try {
    // Get original person data before update
    const originalPerson = await getPerson(personId);
    if (!originalPerson) {
      throw new Error("Person not found");
    }

    const personRef = doc(db, 'people', personId);
    const updateData = {
      ...updatedPersonData,
      updatedAt: getCurrentTimestamp()
    };

    await updateDoc(personRef, updateData);

    // Calculate changed fields with old and new values
    const changedFields = [];
    const fieldsToCheck = [
      'name', 'gender', 'dob', 'dod', 'bio', 'occupation', 'location', 'notes', 'photoUrl',
      'email', 'phoneNumber', 'nationality', 'countryOfResidence', 'placeOfBirth', 'placeOfDeath',
      'tribe', 'language', 'biography', 'isDeceased', 'linkedUserId'
    ];

    // Helper function to normalize values for comparison
    const normalizeValue = (value) => {
      if (value === undefined || value === null || value === '') return null;
      return value;
    };

    for (const field of fieldsToCheck) {
      const normalizedOld = normalizeValue(originalPerson[field]);
      const normalizedNew = normalizeValue(updateData[field]);

      // Only consider it changed if the field is in updateData and the normalized values differ
      if (Object.prototype.hasOwnProperty.call(updateData, field) && normalizedOld !== normalizedNew) {
        changedFields.push({
          field,
          oldValue: originalPerson[field] || null,
          newValue: updateData[field] || null
        });
      }
    }

    // If no known fields changed, check if any unknown fields were changed
    if (changedFields.length === 0) {
      const updateFields = Object.keys(updateData).filter(key => key !== 'updatedAt');
      for (const field of updateFields) {
        if (!fieldsToCheck.includes(field)) {
          const normalizedOld = normalizeValue(originalPerson[field]);
          const normalizedNew = normalizeValue(updateData[field]);

          if (normalizedOld !== normalizedNew) {
            changedFields.push({
              field: 'unknown fields',
              oldValue: null,
              newValue: null
            });
            break; // Only add once
          }
        }
      }
    }

    // Log activity for the update
    if (originalPerson.treeId) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const tree = await dataService.getTree(originalPerson.treeId);
        const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
        if (memberData) {
          await dataService.activityService.logActivity(
            originalPerson.treeId,
            currentUser.uid,
            currentUser.displayName || 'Unknown User',
            'person_edited',
            {
              personName: originalPerson.name || 'Unknown',
              personId: personId,
              changedFields: changedFields
            }
          );
        }
      }
    }

    // Return updated person
    return await getPerson(personId);
  } catch (error) {
    throw new Error(`Failed to update person: ${error.message}`);
  }
}

async function deletePerson(personId, mode = "soft", options = {}) {
  try {
    const person = await getPerson(personId);
    if (!person) {
      throw new Error("Person not found");
    }

    // Log activity before deletion
    const currentUser = auth.currentUser;
    if (currentUser && person.treeId) {
      const tree = await dataService.getTree(person.treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        await dataService.activityService.logActivity(
          person.treeId,
          currentUser.uid,
          currentUser.displayName || 'Unknown User',
          'person_deleted',
          { personName: person.name || 'Unknown', personId: personId, deletionMode: mode }
        );
      }
    }

    const now = new Date();
    const undoWindowDays = Number.isFinite(options.undoWindowDays) ? options.undoWindowDays : 30;
    const undoExpiresAt = new Date(now.getTime() + undoWindowDays * 24 * 60 * 60 * 1000).toISOString();
    const batchId = generateDeletionBatchId();

    if (mode === "soft") {
      // Convert to placeholder, keep relationships
      const updateData = {
        isPlaceholder: true,
        name: person.name || "Unknown",
        deletedAt: now.toISOString(),
        deletionMode: "soft",
        pendingDeletion: true,
        undoExpiresAt: undoExpiresAt,
        deletionBatchId: batchId,
        active: false, // Mark as inactive for querying
        updatedAt: getCurrentTimestamp()
      };

      await updatePerson(personId, updateData);
      // Mark related events and stories as deleted (implement when event/story services are ready)
      console.log(`DBG:personServiceFirebase.deletePerson[soft] -> marked related events and stories`);

      console.log(`DBG:personServiceFirebase.deletePerson[soft] -> ${personId} now placeholder, batch=${batchId}`);
      return { person: { ...person, ...updateData }, removedMarriageIds: [], batchId, undoExpiresAt };
    }

    if (mode === "cascade") {
      // Helper function to collect descendants and handle direct line spouse deletion
      const toDelete = new Set();
      const marriagesToDelete = new Set();

      // Helper function to collect descendants and handle direct line spouse deletion
      const collectDescendants = async (id) => {
        if (toDelete.has(id)) return;
        toDelete.add(id);

        // Get marriages where this person is a spouse
        const marriages = await marriageServiceFirebase.getMarriagesByPersonId(id);

        for (const marriageRecord of marriages) {
          if (marriageRecord.marriageType === "monogamous") {
            // Check if person is direct line spouse
            if (marriageRecord.spouses.includes(id)) {
              // Direct line spouse deletion: delete entire marriage and descendants
              marriagesToDelete.add(marriageRecord.id);
              marriageRecord.spouses.forEach(spouseId => toDelete.add(spouseId));
              if (Array.isArray(marriageRecord.childrenIds)) {
                for (const childId of marriageRecord.childrenIds) {
                  await collectDescendants(childId);
                }
              }
            }
          } else if (marriageRecord.marriageType === "polygamous") {
            if (marriageRecord.husbandId === id) {
              // Direct line spouse deletion: delete entire marriage and descendants
              marriagesToDelete.add(marriageRecord.id);
              toDelete.add(marriageRecord.husbandId);
              if (Array.isArray(marriageRecord.wives)) {
                marriageRecord.wives.forEach(w => {
                  toDelete.add(w.wifeId);
                  if (Array.isArray(w.childrenIds)) {
                    w.childrenIds.forEach(childId => collectDescendants(childId));
                  }
                });
              }
            } else {
              // Check if person is a wife
              const wifeData = marriageRecord.wives.find(w => w.wifeId === id);
              if (wifeData) {
                // Wife deletion: delete wife and descendants, but keep marriage
                toDelete.add(wifeData.wifeId);
                if (Array.isArray(wifeData.childrenIds)) {
                  for (const childId of wifeData.childrenIds) {
                    await collectDescendants(childId);
                  }
                }
              }
            }
          }
        }


      };

      // Start cascade from the root person
      await collectDescendants(personId);

      // Mark all people as deleted
      const nowIso = now.toISOString();
      for (const personIdToDelete of toDelete) {
        const updateData = {
          isDeleted: true,
          deletedAt: nowIso,
          deletionMode: "cascade",
          pendingDeletion: true,
          undoExpiresAt: undoExpiresAt,
          deletionBatchId: batchId,
          active: false,
          updatedAt: getCurrentTimestamp()
        };

        // Mark the initiating person as cascade root
        if (personIdToDelete === personId) {
          updateData.isCascadeRoot = true;
        }

        await updatePerson(personIdToDelete, updateData);
      }

      // Mark all marriages as deleted
      for (const marriageId of marriagesToDelete) {
        const marriageUpdateData = {
          isDeleted: true,
          deletedAt: nowIso,
          deletionMode: "cascade",
          pendingDeletion: true,
          undoExpiresAt: undoExpiresAt,
          deletionBatchId: batchId,
          active: false,
          updatedAt: getCurrentTimestamp()
        };

        await marriageServiceFirebase.updateMarriage(marriageId, marriageUpdateData);
      }

      // Mark related events and stories for all deleted people
      for (const personIdToDelete of toDelete) {
        const person = await getPerson(personIdToDelete);
        if (person && person.treeId) {
          await Promise.all([
            eventServiceFirebase.markEventsForPersonDeleted(personIdToDelete, person.treeId, batchId, undoExpiresAt),
            storyServiceFirebase.markStoriesForPersonDeleted(personIdToDelete, batchId, undoExpiresAt)
          ]);
        }
      }

      console.log(`DBG:personServiceFirebase.deletePerson[cascade] -> batch=${batchId}, marked ${toDelete.size} people and ${marriagesToDelete.size} marriages as deleted, undo until ${undoExpiresAt}`);
      return { batchId, deletedIds: Array.from(toDelete), deletedMarriageIds: Array.from(marriagesToDelete), undoExpiresAt };
    }

    throw new Error(`Unsupported delete mode: ${mode}`);
  } catch (error) {
    throw new Error(`Failed to delete person: ${error.message}`);
  }
}

async function previewCascadeDelete(personId) {
  try {
    const person = await getPerson(personId);
    if (!person) {
      return { peopleIds: [], marriageIds: [] };
    }

    const toDelete = new Set();
    const marriagesToDelete = new Set();

    // Helper function to collect descendants (same logic as deletePerson)
    const collectDescendants = async (id) => {
      if (toDelete.has(id)) return;
      toDelete.add(id);

      // Get marriages where this person is a spouse
      const marriages = await marriageServiceFirebase.getMarriagesByPersonId(id);

      for (const marriage of marriages) {
        if (marriage.marriageType === "monogamous") {
          // Add all spouses to deletion set
          if (Array.isArray(marriage.spouses)) {
            marriage.spouses.forEach(spouseId => toDelete.add(spouseId));
          }
          // Add all children to deletion set
          if (Array.isArray(marriage.childrenIds)) {
            for (const childId of marriage.childrenIds) {
              await collectDescendants(childId);
            }
          }
          marriagesToDelete.add(marriage.id);
        } else if (marriage.marriageType === "polygamous") {
          // Add husband to deletion set
          if (marriage.husbandId) {
            toDelete.add(marriage.husbandId);
          }
          // Add all wives to deletion set
          if (Array.isArray(marriage.wives)) {
            marriage.wives.forEach(wife => {
              toDelete.add(wife.wifeId);
              // Add children of each wife
              if (Array.isArray(wife.childrenIds)) {
                wife.childrenIds.forEach(childId => collectDescendants(childId));
              }
            });
          }
          marriagesToDelete.add(marriage.id);
        }
      }

      // Get marriages where this person is a child
      const childMarriages = await marriageServiceFirebase.getMarriagesByChildId(id);
      for (const _ of childMarriages) {
        await collectDescendants(id);
      }
    };

    // Start cascade from the root person
    await collectDescendants(personId);

    return { peopleIds: Array.from(toDelete), marriageIds: Array.from(marriagesToDelete) };
  } catch (error) {
    throw new Error(`Failed to preview cascade delete: ${error.message}`);
  }
}

async function undoDelete(personId) {
  try {
    const person = await getPerson(personId);
    if (!person) {
      throw new Error("Person not found");
    }

    const batchId = person.deletionBatchId || null;
    const mode = person.deletionMode || null;

    if (!mode) {
      throw new Error("This person is not marked for deletion");
    }

    const now = new Date();
    const expired = person.undoExpiresAt && new Date(person.undoExpiresAt) < now;
    if (expired) {
      throw new Error("Undo window has expired for this deletion");
    }

    if (mode === "soft") {
      // Restore this single person using FieldValue.delete() to properly remove fields
      const updateData = {
        isPlaceholder: deleteField(),
        deletedAt: deleteField(),
        deletionMode: deleteField(),
        pendingDeletion: deleteField(),
        undoExpiresAt: deleteField(),
        deletionBatchId: deleteField(),
        active: true, // Restore active status
        updatedAt: getCurrentTimestamp()
      };

      await updatePerson(personId, updateData);
      console.log(`DBG:personServiceFirebase.undoDelete[soft] -> restored ${personId}`);
      return { restoredIds: [personId], restoredMarriageIds: [] };
    }

    if (mode === "cascade") {
      if (!batchId) {
        throw new Error("Missing deletion batch id for cascade undo");
      }

      // Restore all people in the same deletion batch
      const peopleRef = collection(db, 'people');
      const peopleQuery = query(
        peopleRef,
        where('deletionBatchId', '==', batchId),
        where('deletionMode', '==', 'cascade')
      );
      const peopleSnapshot = await getDocs(peopleQuery);

      const restoredIds = [];
      for (const doc of peopleSnapshot.docs) {
        const updateData = {
          isDeleted: deleteField(),
          deletedAt: deleteField(),
          deletionMode: deleteField(),
          pendingDeletion: deleteField(),
          undoExpiresAt: deleteField(),
          deletionBatchId: deleteField(),
          isCascadeRoot: deleteField(),
          active: true, 
          updatedAt: getCurrentTimestamp()
        };

        await updateDoc(doc.ref, updateData);
        restoredIds.push(doc.id);
      }

      // Restore all marriages in the same deletion batch
      const marriagesRef = collection(db, 'marriages');
      const marriagesQuery = query(
        marriagesRef,
        where('deletionBatchId', '==', batchId),
        where('deletionMode', '==', 'cascade')
      );
      const marriagesSnapshot = await getDocs(marriagesQuery);

      const restoredMarriageIds = [];
      for (const doc of marriagesSnapshot.docs) {
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
        restoredMarriageIds.push(doc.id);
      }

      // Restore related events and stories
      await Promise.all([
        eventServiceFirebase.undoEventsDeletion(batchId),
        storyServiceFirebase.undoStoriesDeletion(batchId)
      ]);

      console.log(`DBG:personServiceFirebase.undoDelete[cascade] -> restored ${restoredIds.length} people and ${restoredMarriageIds.length} marriages (batch=${batchId})`);
      return { restoredIds, restoredMarriageIds };
    }

    throw new Error("Unsupported deletion mode to undo");
  } catch (error) {
    throw new Error(`Failed to undo delete: ${error.message}`);
  }
}

async function purgeExpiredDeletions() {
  try {
    const now = new Date();
    const peopleRef = collection(db, 'people');

    // Get all people with pending deletions
    const q = query(
      peopleRef,
      where('pendingDeletion', '==', true),
      where('undoExpiresAt', '<=', now.toISOString())
    );

    const querySnapshot = await getDocs(q);
    const expiredPeople = [];

    querySnapshot.forEach((doc) => {
      expiredPeople.push({ id: doc.id, ...doc.data() });
    });

    let finalizedSoftCount = 0;
    let removedPeopleCount = 0;

    for (const person of expiredPeople) {
      if (person.deletionMode === "soft") {
        // Keep placeholder, clear metadata using FieldValue.delete()
        const updateData = {
          pendingDeletion: deleteField(),
          undoExpiresAt: deleteField(),
          deletionBatchId: deleteField(),
          updatedAt: getCurrentTimestamp()
        };

        await updatePerson(person.id, updateData);
        finalizedSoftCount++;
        console.log(`DBG:purge -> finalized soft delete for ${person.id}`);
      } else if (person.deletionMode === "cascade") {
        // TODO: Check for marriage/event references before permanent deletion
        // Permanently remove
        await deleteDoc(doc(db, 'people', person.id));
        removedPeopleCount++;
        console.log(`DBG:purge -> permanently removed ${person.id}`);
      }
    }

    // Purge expired marriages
    const marriagesRef = collection(db, 'marriages');
    const marriagesQuery = query(
      marriagesRef,
      where('pendingDeletion', '==', true),
      where('undoExpiresAt', '<=', now.toISOString())
    );
    const marriagesSnapshot = await getDocs(marriagesQuery);

    let removedMarriageCount = 0;
    for (const doc of marriagesSnapshot.docs) {
      await deleteDoc(doc.ref);
      removedMarriageCount++;
    }

    // Purge expired events and stories
    const [eventPurgeResult, storyPurgeResult] = await Promise.all([
      eventServiceFirebase.purgeExpiredDeletedEvents(),
      storyServiceFirebase.purgeExpiredDeletedStories()
    ]);

    console.log(`DBG:purgeExpiredDeletions -> purged ${eventPurgeResult.removedCount} events and ${storyPurgeResult.removedCount} stories`);

    return {
      finalizedSoftCount,
      removedPeopleCount,
      removedMarriageCount
    };
  } catch (error) {
    throw new Error(`Failed to purge expired deletions: ${error.message}`);
  }
}

async function getAllPeople(treeId = null) {
  try {
    const peopleRef = collection(db, 'people');
    let q;

    if (treeId) {
      // Only fetch people belonging to the given tree
      q = query(
        peopleRef,
        where('treeId', '==', treeId),
        where('active', '==', true)
      );
    } else {
      // Fallback: fetch all active people (less secure, use only in admin/dev contexts)
      console.warn("⚠️ getAllPeople called without treeId – fetching all active people");
      q = query(peopleRef, where('active', '==', true));
    }

    const querySnapshot = await getDocs(q);
    const people = [];

    querySnapshot.forEach((doc) => {
      people.push({ id: doc.id, ...doc.data() });
    });

    return people;
  } catch (error) {
    throw new Error(`Failed to get all people: ${error.message}`);
  }
}


async function findPeopleByName(query) {
  try {
    if (!query) {
      return [];
    }

    const peopleRef = collection(db, 'people');
    const q = query(
      peopleRef,
      where('active', '==', true),
      where('name', '>=', query.trim()),
      where('name', '<=', query.trim() + '\uf8ff')
    );

    const querySnapshot = await getDocs(q);
    const results = [];

    querySnapshot.forEach((doc) => {
      const person = { id: doc.id, ...doc.data() };
      if (person.name && person.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(person);
      }
    });

    return results;
  } catch (error) {
    throw new Error(`Failed to find people by name: ${error.message}`);
  }
}

async function getPeopleByTreeId(treeId, bypassMembershipCheck = false) {
  try {
    console.log('getPeopleByTreeId called with treeId:', treeId, 'User:', auth.currentUser?.uid, 'bypassMembershipCheck:', bypassMembershipCheck);
    if (!treeId) {
      return [];
    }

    // Skip membership check if bypassMembershipCheck is true (for join requests)
    if (!bypassMembershipCheck) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check tree membership
      const tree = await dataService.getTree(treeId);
      if (!tree) {
        throw new Error(`Tree ${treeId} not found`);
      }

      if (!tree.memberUIDs?.includes(currentUser.uid)) {
        throw new Error(`User ${currentUser.uid} is not a member of tree ${treeId}`);
      }
    }

    const peopleRef = collection(db, 'people');
    // Query for active people
    const activeQuery = query(
      peopleRef,
      where('treeId', '==', treeId),
      where('active', '==', true)
    );
    // Query for soft deleted placeholders
    const placeholderQuery = query(
      peopleRef,
      where('treeId', '==', treeId),
      where('isPlaceholder', '==', true),
      where('pendingDeletion', '==', true)
    );
    const [activeSnapshot, placeholderSnapshot] = await Promise.all([
      getDocs(activeQuery),
      getDocs(placeholderQuery)
    ]);
    const results = [];
    activeSnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    placeholderSnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });

    // Apply lineage restrictions for editors (only if user is a member)
    if (!bypassMembershipCheck) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const tree = await dataService.getTree(treeId);
        const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
        if (memberData && memberData.role === 'editor') {
          const accessPromises = results.map(person => canUserAccessPerson(currentUser.uid, memberData.role, person.id, treeId, 'view'));
          const accessResults = await Promise.all(accessPromises);
          const filteredResults = results.filter((_, index) => accessResults[index]);
          return filteredResults;
        }
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to get people by tree ID: ${error.message}`);
  }
}

async function getDeletedPersons() {
  try {
    const peopleRef = collection(db, 'people');
    const q = query(
      peopleRef,
      where('pendingDeletion', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const now = new Date();
    const deletedPersons = [];

    querySnapshot.forEach((doc) => {
      const person = { id: doc.id, ...doc.data() };
      if (person.isPlaceholder || person.isDeleted) {
        const undoExpiresAt = person.undoExpiresAt ? new Date(person.undoExpiresAt) : null;
        const timeRemaining = undoExpiresAt ? Math.max(0, undoExpiresAt.getTime() - now.getTime()) : 0;
        const isExpired = timeRemaining === 0;

        deletedPersons.push({
          ...person,
          timeRemaining,
          isExpired,
          daysRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)),
          hoursRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60)),
          minutesRemaining: Math.ceil(timeRemaining / (1000 * 60))
        });
      }
    });

    return deletedPersons;
  } catch (error) {
    throw new Error(`Failed to get deleted persons: ${error.message}`);
  }
}

async function getDeletedPersonsByTreeId(treeId) {
  try {
    if (!treeId) {
      return [];
    }

    const peopleRef = collection(db, 'people');
    const q = query(
      peopleRef,
      where('treeId', '==', treeId),
      where('pendingDeletion', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const now = new Date();
    const deletedPersons = [];

    querySnapshot.forEach((doc) => {
      const person = { id: doc.id, ...doc.data() };
      if (person.isPlaceholder || person.isDeleted) {
        const undoExpiresAt = person.undoExpiresAt ? new Date(person.undoExpiresAt) : null;
        const timeRemaining = undoExpiresAt ? Math.max(0, undoExpiresAt.getTime() - now.getTime()) : 0;
        const isExpired = timeRemaining === 0;

        deletedPersons.push({
          ...person,
          timeRemaining,
          isExpired,
          daysRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)),
          hoursRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60)),
          minutesRemaining: Math.ceil(timeRemaining / (1000 * 60))
        });
      }
    });

    return deletedPersons;
  } catch (error) {
    throw new Error(`Failed to get deleted persons by tree ID: ${error.message}`);
  }
}

async function purgePerson(personId) {
  try {
    const person = await getPerson(personId);
    if (!person) {
      throw new Error("Person not found");
    }

    if (!person.pendingDeletion) {
      throw new Error("Person is not marked for deletion");
    }

    // Clean up references in marriages before permanent deletion
    const marriages = await marriageServiceFirebase.getMarriagesByPersonId(personId);
    for (const currentMarriage of marriages) {
      // Log activity for permanent deletion
      if (person.treeId) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const tree = await dataService.getTree(person.treeId);
          const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
          if (memberData) {
            await dataService.activityService.logActivity(
              person.treeId,
              currentUser.uid,
              currentUser.displayName || 'Unknown User',
              'person_purged',
              { personName: person.name || 'Unknown', personId: personId }
            );
          }
        }
      }
      if (currentMarriage.marriageType === "monogamous") {
        // Remove person from spouses array
        const updatedSpouses = currentMarriage.spouses?.filter(id => id !== personId) || [];
        await marriageServiceFirebase.updateMarriage(currentMarriage.id, { spouses: updatedSpouses });
      } else if (currentMarriage.marriageType === "polygamous") {
        if (currentMarriage.husbandId === personId) {
          // Remove husband
          await marriageServiceFirebase.updateMarriage(currentMarriage.id, { husbandId: null });
        } else {
          // Remove person from wives array
          const updatedWives = currentMarriage.wives?.filter(w => w.wifeId !== personId) || [];
          await marriageServiceFirebase.updateMarriage(currentMarriage.id, { wives: updatedWives });
        }
      }
    }

    // Permanently delete the person
    await deleteDoc(doc(db, 'people', personId));

    console.log(`DBG:personServiceFirebase.purgePerson -> permanently removed ${personId}`);
    return { purgedId: personId };
  } catch (error) {
    throw new Error(`Failed to purge person: ${error.message}`);
  }
}

// Additional function used by controllers
async function findPersonByFields(fields) {
  try {
    if (!fields || !fields.treeId) {
      return null;
    }

    const peopleRef = collection(db, 'people');
    let q = query(
      peopleRef,
      where('treeId', '==', fields.treeId),
      where('active', '==', true)
    );

    // Add additional field filters if provided
    if (fields.name) {
      q = query(q, where('name', '==', fields.name));
    }
    if (fields.gender) {
      q = query(q, where('gender', '==', fields.gender));
    }
    if (fields.dob) {
      q = query(q, where('dob', '==', fields.dob));
    }

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Return the first match
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    throw new Error(`Failed to find person by fields: ${error.message}`);
  }
}

// Export all the functions in a single service object.
export const personServiceFirebase = {
  addPerson,
  getPerson,
  updatePerson,
  deletePerson,
  previewCascadeDelete,
  undoDelete,
  purgeExpiredDeletions,
  getAllPeople,
  findPeopleByName,
  getPeopleByTreeId,
  getDeletedPersons,
  getDeletedPersonsByTreeId,
  purgePerson,
  findPersonByFields, // Added missing function
};
