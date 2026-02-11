// src/services/data/personServiceLocal.js

import { getDB, saveDB } from "./localDB"; 
import { generateId } from "../../utils/personUtils/idGenerator";
import { eventServiceLocal } from "./eventServiceLocal";
import { storyServiceLocal } from "./storyServiceLocal";

function addPerson(person) {
  const db = getDB();
  const exists = db.people.find(p => p.id === person.id);
  if (exists) {
    console.warn("personServiceLocal.addPerson -> duplicate person id detected:", person.id);
    person = { ...person, id: generateId("person") };
  }
  db.people.push(person);
  saveDB();
  return Promise.resolve(person);
}

function getPerson(id) {
  const db = getDB();
  const p = db.people.find((p) => p.id === id);
  return Promise.resolve(p);
}

function updatePerson(personId, updatedPersonData) {
  const db = getDB();
  const idx = db.people.findIndex(p => p.id === personId);
  if (idx === -1) {
    return Promise.reject(new Error("Person not found"));
  }
  db.people[idx] = { ...db.people[idx], ...updatedPersonData, updatedAt: new Date().toISOString() };
  saveDB();
  return Promise.resolve(db.people[idx]);
}

/**
 * Delete a person with two supported modes:
 * - mode: "soft" => replace person with placeholder (reversible)
 * - mode: "cascade" => conditionally delete marriages + descendants (reversible)
 *
 * Direct line spouse (monogamous or polygamous):
 *   -> entire marriage + descendants marked deleted.
 * Non-direct line child:
 *   -> person + descendants marked deleted, marriage kept intact.
 *
 * Options:
 * - undoWindowDays: number of days to allow undo (default 30)
 */
function deletePerson(personId, mode = "soft", options = {}) {
  const db = getDB();
  const person = db.people.find(p => p.id === personId);
  if (!person) {
    return Promise.reject(new Error("Person not found"));
  }

  const now = new Date();
  const undoWindowDays = Number.isFinite(options.undoWindowDays) ? options.undoWindowDays : 30;
  const undoExpiresAt = new Date(now.getTime() + undoWindowDays * 24 * 60 * 60 * 1000).toISOString();
  const batchId = generateId("deletion");

  if (mode === "soft") {
    // Convert to placeholder, keep relationships
    person.isPlaceholder = true;
    person.name = person.name || "Unknown";
    person.deletedAt = now.toISOString();
    person.deletionMode = "soft";
    person.pendingDeletion = true;
    person.undoExpiresAt = undoExpiresAt;
    person.deletionBatchId = batchId;
    
    // Mark related events and stories as deleted (but keep them in DB for undo)
    Promise.all([
      eventServiceLocal.markEventsForPersonDeleted(personId, batchId, undoExpiresAt),
      storyServiceLocal.markStoriesForPersonDeleted(personId, batchId, undoExpiresAt)
    ]).then(() => {
      console.log(`DBG:personServiceLocal.deletePerson[soft] -> marked related events and stories`);
    });
    
    saveDB();
    console.log(`DBG:personServiceLocal.deletePerson[soft] -> ${personId} now placeholder, batch=${batchId}`);
    return Promise.resolve({ person, removedMarriageIds: [], batchId, undoExpiresAt });
  }

  if (mode === "cascade") {
    const toDelete = new Set();
    const marriagesToDelete = new Set();
    const now = new Date();

    // Helpers
    const handleSpouseMarriages = (id) => {
      for (const m of db.marriages) {
        if (!m) continue;
        //  Case 1: Person is a spouse (direct line) 
        if (
          (m.marriageType === "monogamous" && Array.isArray(m.spouses) && m.spouses.includes(id)) ||
          (m.marriageType === "polygamous" && (m.husbandId === id || (Array.isArray(m.wives) && m.wives.some(w => w.wifeId === id))))
        ) {
          const isSpouseOnly = false; // direct line deletion from a spouse always cascades the marriage

          if (isSpouseOnly) {
            // Spouse deletion: only delete the specific spouse and their children
            if (m.marriageType === "monogamous") {
              // For monogamous: delete the marriage and all children
              marriagesToDelete.add(m.id);
              if (Array.isArray(m.childrenIds)) {
                m.childrenIds.forEach(childId => collectDescendants(childId));
              }
            } else if (m.marriageType === "polygamous") {
              if (m.husbandId === id) {
                marriagesToDelete.add(m.id);
                if (Array.isArray(m.wives)) {
                  m.wives.forEach(w => {
                    toDelete.add(w.wifeId);
                    (w.childrenIds || []).forEach(childId => collectDescendants(childId));
                  });
                }
              } else {
                const wifeData = m.wives.find(w => w.wifeId === id);
                if (wifeData) {
                  (wifeData.childrenIds || []).forEach(childId => collectDescendants(childId));
                }
              }
            }
          } else {
            // Direct line deletion: delete all spouses and children
            marriagesToDelete.add(m.id);

            // Add all spouses in this marriage to deletion set
            if (m.marriageType === "monogamous" && Array.isArray(m.spouses)) {
              m.spouses.forEach(spouseId => toDelete.add(spouseId));
            } else if (m.marriageType === "polygamous") {
              toDelete.add(m.husbandId);
              if (Array.isArray(m.wives)) {
                m.wives.forEach(w => toDelete.add(w.wifeId));
              }
            }

            // Cascade to all children of this marriage
            if (Array.isArray(m.childrenIds)) {
              m.childrenIds.forEach(childId => collectDescendants(childId));
            }
            if (Array.isArray(m.wives)) {
              m.wives.forEach(w => (w.childrenIds || []).forEach(childId => collectDescendants(childId)));
            }
          }
        }
      }
    };

    // Recursive helper to collect descendants only (not ancestors)
    const collectDescendants = (id) => {
      if (toDelete.has(id)) return;
      toDelete.add(id);

      // First, handle marriages where this person is a spouse
      handleSpouseMarriages(id);

      // Then, handle marriages where this person is a child
      for (const m of db.marriages) {
        if (!m) continue;

        //  Case 2: Person is a child (non-direct line) 
        if (Array.isArray(m.childrenIds) && m.childrenIds.includes(id)) {
          // Cascade delete this child + their descendants
          collectDescendants(id);
        }
        if (Array.isArray(m.wives)) {
          for (const w of m.wives) {
            if (Array.isArray(w.childrenIds) && w.childrenIds.includes(id)) {
              collectDescendants(id);
            }
          }
        }
      }
    };

    collectDescendants(personId);

    // Mark people
    const nowIso = now.toISOString();
    for (const p of db.people) {
      if (toDelete.has(p.id)) {
        p.isDeleted = true;
        p.deletedAt = nowIso;
        p.deletionMode = "cascade";
        p.pendingDeletion = true;
        p.undoExpiresAt = undoExpiresAt;
        p.deletionBatchId = batchId;
      }
    }

    // Mark the initiating person as the cascade root for UI logic
    if (person) {
      person.isCascadeRoot = true;
    }

    // Ensure only the initiating person is the cascade root in this batch
    for (const p of db.people) {
      if (p.deletionBatchId === batchId && p.id !== personId) {
        delete p.isCascadeRoot;
      }
    }

    // Mark marriages
    for (const m of db.marriages) {
      if (marriagesToDelete.has(m.id)) {
        m.isDeleted = true;
        m.deletedAt = nowIso;
        m.deletionMode = "cascade";
        m.pendingDeletion = true;
        m.undoExpiresAt = undoExpiresAt;
        m.deletionBatchId = batchId;
      }
    }

    // Mark related events and stories for all deleted people
    Promise.all([
      ...Array.from(toDelete).map(id => eventServiceLocal.markEventsForPersonDeleted(id, batchId, undoExpiresAt)),
      ...Array.from(toDelete).map(id => storyServiceLocal.markStoriesForPersonDeleted(id, batchId, undoExpiresAt))
    ]).then(() => {
      console.log(`DBG:personServiceLocal.deletePerson[cascade] -> marked related events and stories`);
    });

    saveDB();
    console.log(`DBG:personServiceLocal.deletePerson[cascade] -> batch=${batchId}, marked ${toDelete.size} people and ${marriagesToDelete.size} marriages as deleted, undo until ${undoExpiresAt}`);
    return Promise.resolve({ batchId, deletedIds: Array.from(toDelete), deletedMarriageIds: Array.from(marriagesToDelete), undoExpiresAt });
  }

  return Promise.reject(new Error(`Unsupported delete mode: ${mode}`));
}

/**
 * Compute the set of people and marriages that would be affected by a cascade delete, without modifying data.
 */
function previewCascadeDelete(personId) {
  const db = getDB();
  const person = db.people.find(p => p.id === personId);
  if (!person) return Promise.resolve({ peopleIds: [], marriageIds: [] });

  const toDelete = new Set();
  const marriagesToDelete = new Set();

  // Determine if the person being deleted is a spouse or direct line person
  const isSpouseDeletion = () => {
    // Check if person is only a spouse (not a child in any marriage)
    const isChild = db.marriages.some(m => 
      (m.marriageType === "monogamous" && m.childrenIds?.includes(personId)) ||
      (m.marriageType === "polygamous" && m.wives?.some(w => w.childrenIds?.includes(personId)))
    );
    
    const isSpouse = db.marriages.some(m =>
      (m.marriageType === "monogamous" && m.spouses?.includes(personId)) ||
      (m.marriageType === "polygamous" && (m.husbandId === personId || m.wives?.some(w => w.wifeId === personId)))
    );
    
    // If person is a spouse but not a child, it's a spouse deletion
    return isSpouse && !isChild;
  };

  const isSpouseOnly = isSpouseDeletion();

  const collectDescendants = (id) => {
    if (toDelete.has(id)) return;
    toDelete.add(id);

    for (const m of db.marriages) {
      if (!m) continue;

      if (
        (m.marriageType === "monogamous" && Array.isArray(m.spouses) && m.spouses.includes(id)) ||
        (m.marriageType === "polygamous" && (m.husbandId === id || (Array.isArray(m.wives) && m.wives.some(w => w.wifeId === id))))
      ) {
        if (isSpouseOnly) {
          // Spouse deletion: only delete the specific spouse and their children
          if (m.marriageType === "monogamous") {
            // For monogamous: delete the marriage and all children
            marriagesToDelete.add(m.id);
            if (Array.isArray(m.childrenIds)) {
              m.childrenIds.forEach(childId => collectDescendants(childId));
            }
          } else if (m.marriageType === "polygamous") {
            // For polygamous: only delete the specific spouse and their children
            if (m.husbandId === id) {
              // Deleting husband: delete all wives and their children
              marriagesToDelete.add(m.id);
              if (Array.isArray(m.wives)) {
                m.wives.forEach(w => {
                  toDelete.add(w.wifeId);
                  (w.childrenIds || []).forEach(childId => collectDescendants(childId));
                });
              }
            } else {
              // Deleting a wife: only delete that wife and her children
              const wifeData = m.wives.find(w => w.wifeId === id);
              if (wifeData) {
                (wifeData.childrenIds || []).forEach(childId => collectDescendants(childId));
              }
              // Don't delete the marriage, just remove the wife from it
            }
          }
        } else {
          // Direct line deletion: delete all spouses and children
          marriagesToDelete.add(m.id);

          // Add all spouses in this marriage to deletion set
          if (m.marriageType === "monogamous" && Array.isArray(m.spouses)) {
            m.spouses.forEach(spouseId => toDelete.add(spouseId));
          } else if (m.marriageType === "polygamous") {
            toDelete.add(m.husbandId);
            if (Array.isArray(m.wives)) {
              m.wives.forEach(w => toDelete.add(w.wifeId));
            }
          }

          // Cascade to all children of this marriage
          if (Array.isArray(m.childrenIds)) {
            m.childrenIds.forEach(childId => collectDescendants(childId));
          }
          if (Array.isArray(m.wives)) {
            m.wives.forEach(w => (w.childrenIds || []).forEach(childId => collectDescendants(childId)));
          }
        }
      }

      //  Case 2: Person is a child (non-direct line) 
      if (Array.isArray(m.childrenIds) && m.childrenIds.includes(id)) {
        collectDescendants(id);
      }
      if (Array.isArray(m.wives)) {
        for (const w of m.wives) {
          if (Array.isArray(w.childrenIds) && w.childrenIds.includes(id)) collectDescendants(id);
        }
      }
    }
  };

  collectDescendants(personId);
  return Promise.resolve({ peopleIds: Array.from(toDelete), marriageIds: Array.from(marriagesToDelete) });
}

/**
 * Undo a previous deletion operation (soft or cascade) using personId as entry point.
 * For cascade, all entities in the same deletion batch will be restored.
 */
function undoDelete(personId) {
  const db = getDB();
  const person = db.people.find(p => p.id === personId);
  if (!person) return Promise.reject(new Error("Person not found"));

  // Determine batch scope
  const batchId = person.deletionBatchId || null;
  const mode = person.deletionMode || null;

  if (!mode) {
    return Promise.reject(new Error("This person is not marked for deletion"));
  }

  const now = new Date();
  const expired = person.undoExpiresAt && new Date(person.undoExpiresAt) < now;
  if (expired) {
    return Promise.reject(new Error("Undo window has expired for this deletion"));
  }

  if (mode === "soft") {
    // Restore this single person
    delete person.isPlaceholder;
    delete person.deletedAt;
    delete person.deletionMode;
    delete person.pendingDeletion;
    delete person.undoExpiresAt;
    delete person.deletionBatchId;
    saveDB();
    console.log(`DBG:personServiceLocal.undoDelete[soft] -> restored ${personId}`);
    return Promise.resolve({ restoredIds: [personId], restoredMarriageIds: [] });
  }

  if (mode === "cascade") {
    if (!batchId) return Promise.reject(new Error("Missing deletion batch id for cascade undo"));

    const restoredIds = [];
    const restoredMarriageIds = [];

    for (const p of db.people) {
      if (p.deletionBatchId === batchId && p.deletionMode === "cascade" && p.pendingDeletion) {
        delete p.isDeleted;
        delete p.deletedAt;
        delete p.deletionMode;
        delete p.pendingDeletion;
        delete p.undoExpiresAt;
        delete p.deletionBatchId;
        if (p.isCascadeRoot) delete p.isCascadeRoot;
        restoredIds.push(p.id);
      }
    }

    for (const m of db.marriages) {
      if (m.deletionBatchId === batchId && m.deletionMode === "cascade" && m.pendingDeletion) {
        delete m.isDeleted;
        delete m.deletedAt;
        delete m.deletionMode;
        delete m.pendingDeletion;
        delete m.undoExpiresAt;
        delete m.deletionBatchId;
        restoredMarriageIds.push(m.id);
      }
    }

    // Restore related events and stories
    Promise.all([
      eventServiceLocal.undoEventsDeletion(batchId),
      storyServiceLocal.undoStoriesDeletion(batchId)
    ]).then(() => {
      console.log(`DBG:personServiceLocal.undoDelete[cascade] -> restored related events and stories`);
    });

    saveDB();
    console.log(`DBG:personServiceLocal.undoDelete[cascade] -> restored ${restoredIds.length} people and ${restoredMarriageIds.length} marriages (batch=${batchId})`);
    return Promise.resolve({ restoredIds, restoredMarriageIds });
  }

  return Promise.reject(new Error("Unsupported deletion mode to undo"));
}

/**
 * Permanently remove expired deletions. For soft deletes, the placeholder remains but metadata is cleared.
 * For cascade deletes, remove people and marriages marked with expired undo window, and cleanup references.
 */
function purgeExpiredDeletions() {
  const db = getDB();
  const now = new Date();

  // Identify expired entities
  const expiredSoft = [];
  const expiredCascadePeople = [];
  const expiredCascadeMarriages = [];

  for (const p of db.people) {
    if (!p || !p.pendingDeletion || !p.undoExpiresAt) continue;
    const isExpired = new Date(p.undoExpiresAt) < now;
    if (!isExpired) continue;
    if (p.deletionMode === "soft") expiredSoft.push(p);
    else if (p.deletionMode === "cascade") expiredCascadePeople.push(p);
  }
  for (const m of db.marriages) {
    if (!m || !m.pendingDeletion || !m.undoExpiresAt) continue;
    const isExpired = new Date(m.undoExpiresAt) < now;
    if (!isExpired) continue;
    if (m.deletionMode === "cascade") expiredCascadeMarriages.push(m);
  }

  // Soft: keep placeholder, clear metadata
  for (const p of expiredSoft) {
    delete p.pendingDeletion;
    delete p.undoExpiresAt;
    delete p.deletionBatchId;
    // keep isPlaceholder + deletedAt to indicate permanent anonymization
    console.log(`DBG:purge -> finalized soft delete for ${p.id}`);
  }

  // Cascade: build sets by batch to ensure consistent cleanup
  const cascadePeopleIdsToRemove = new Set(expiredCascadePeople.map(p => p.id));
  const cascadeMarriageIdsToRemove = new Set(expiredCascadeMarriages.map(m => m.id));

  // Remove references in marriages that are NOT being removed
  for (const m of db.marriages) {
    if (!m) continue;
    if (cascadeMarriageIdsToRemove.has(m.id)) continue; // will be removed entirely

    if (Array.isArray(m.childrenIds)) {
      m.childrenIds = m.childrenIds.filter(cid => !cascadePeopleIdsToRemove.has(cid));
    }
    if (Array.isArray(m.wives)) {
      m.wives.forEach(w => {
        if (Array.isArray(w.childrenIds)) {
          w.childrenIds = w.childrenIds.filter(cid => !cascadePeopleIdsToRemove.has(cid));
        }
      });
      // Also drop wives entries that themselves are removed
      m.wives = m.wives.filter(w => !cascadePeopleIdsToRemove.has(w.wifeId));
    }

    // For monogamous marriages, if a spouse is removed but the marriage isn't flagged for removal, keep as-is.
    if (m.marriageType === "monogamous" && Array.isArray(m.spouses)) {
      m.spouses = m.spouses.filter(spId => !cascadePeopleIdsToRemove.has(spId));
    }
  }

  // Physically remove people
  if (cascadePeopleIdsToRemove.size > 0) {
    db.people = db.people.filter(p => !cascadePeopleIdsToRemove.has(p.id));
  }

  // Physically remove marriages
  if (cascadeMarriageIdsToRemove.size > 0) {
    db.marriages = db.marriages.filter(m => !cascadeMarriageIdsToRemove.has(m.id));
  }

  // Purge expired events and stories
  Promise.all([
    eventServiceLocal.purgeExpiredDeletedEvents(),
    storyServiceLocal.purgeExpiredDeletedStories()
  ]).then(() => {
    console.log(`DBG:purgeExpiredDeletions -> purged related events and stories`);
  });

  saveDB();

  return Promise.resolve({
    finalizedSoftCount: expiredSoft.length,
    removedPeopleCount: cascadePeopleIdsToRemove.size,
    removedMarriageCount: cascadeMarriageIdsToRemove.size,
  });
}

function getAllPeople() {
  const db = getDB();
  // Filter out deleted people
  const people = (db.people || []).filter(p => !p.isDeleted);
  return Promise.resolve(people);
}

function findPeopleByName(query) {
  const db = getDB();
  if (!query) return Promise.resolve([]);
  const q = String(query).trim().toLowerCase();
  // Filter out deleted people
  const results = (db.people || []).filter(p => 
    !p.isDeleted && 
    (p.name || '').toLowerCase().includes(q)
  );
  return Promise.resolve(results);
}

function getPeopleByTreeId(treeId) {
  const db = getDB();
  if (!treeId) return Promise.resolve([]);
  // Filter out cascade-deleted people, but include soft-deleted placeholders
  const results = (db.people || []).filter(p => 
    !p.isDeleted &&  // Exclude cascade-deleted people
    p.treeId === treeId
    // Include soft-deleted people (they become placeholders)
  );
  return Promise.resolve(results);
}

/**
 * Get all deleted persons (both soft and cascade deleted) with their deletion metadata
 */
function getDeletedPersons() {
  const db = getDB();
  const now = new Date();
  
  const deletedPersons = (db.people || []).filter(p => 
    p.pendingDeletion && (p.isPlaceholder || p.isDeleted)
  ).map(person => {
    const undoExpiresAt = person.undoExpiresAt ? new Date(person.undoExpiresAt) : null;
    const timeRemaining = undoExpiresAt ? Math.max(0, undoExpiresAt.getTime() - now.getTime()) : 0;
    const isExpired = timeRemaining === 0;
    
    return {
      ...person,
      timeRemaining,
      isExpired,
      daysRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)),
      hoursRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60)),
      minutesRemaining: Math.ceil(timeRemaining / (1000 * 60))
    };
  });
  
  return Promise.resolve(deletedPersons);
}

/**
 * Get deleted persons by tree ID
 */
function getDeletedPersonsByTreeId(treeId) {
  const db = getDB();
  const now = new Date();
  
  const deletedPersons = (db.people || []).filter(p => 
    p.treeId === treeId && 
    p.pendingDeletion && (p.isPlaceholder || p.isDeleted)
  ).map(person => {
    const undoExpiresAt = person.undoExpiresAt ? new Date(person.undoExpiresAt) : null;
    const timeRemaining = undoExpiresAt ? Math.max(0, undoExpiresAt.getTime() - now.getTime()) : 0;
    const isExpired = timeRemaining === 0;
    
    return {
      ...person,
      timeRemaining,
      isExpired,
      daysRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)),
      hoursRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60)),
      minutesRemaining: Math.ceil(timeRemaining / (1000 * 60))
    };
  });
  
  return Promise.resolve(deletedPersons);
}

/**
 * Permanently delete a person (purge) - this is irreversible
 */
function purgePerson(personId) {
  const db = getDB();
  const person = db.people.find(p => p.id === personId);
  if (!person) {
    return Promise.reject(new Error("Person not found"));
  }

  if (!person.pendingDeletion) {
    return Promise.reject(new Error("Person is not marked for deletion"));
  }

  // Remove the person from the database
  db.people = db.people.filter(p => p.id !== personId);
  
  // Clean up references in marriages
  for (const marriage of db.marriages) {
    if (!marriage) continue;
    
    // Remove from spouses array
    if (Array.isArray(marriage.spouses)) {
      marriage.spouses = marriage.spouses.filter(id => id !== personId);
    }
    
    // Remove from husbandId
    if (marriage.husbandId === personId) {
      marriage.husbandId = null;
    }
    
    // Remove from wives array
    if (Array.isArray(marriage.wives)) {
      marriage.wives = marriage.wives.filter(w => w.wifeId !== personId);
    }
    
    // Remove from childrenIds
    if (Array.isArray(marriage.childrenIds)) {
      marriage.childrenIds = marriage.childrenIds.filter(id => id !== personId);
    }
    
    // Remove from wives childrenIds
    if (Array.isArray(marriage.wives)) {
      marriage.wives.forEach(w => {
        if (Array.isArray(w.childrenIds)) {
          w.childrenIds = w.childrenIds.filter(id => id !== personId);
        }
      });
    }
  }
  
  saveDB();
  console.log(`DBG:personServiceLocal.purgePerson -> permanently removed ${personId}`);
  return Promise.resolve({ purgedId: personId });
}

// Additional function used by controllers
function findPersonByFields(fields) {
  const db = getDB();
  if (!fields || !fields.treeId) {
    return Promise.resolve(null);
  }

  const people = (db.people || []).filter(p => 
    !p.isDeleted && 
    p.treeId === fields.treeId
  );

  // Add additional field filters if provided
  let filteredPeople = people;
  if (fields.name) {
    filteredPeople = filteredPeople.filter(p => p.name === fields.name);
  }
  if (fields.gender) {
    filteredPeople = filteredPeople.filter(p => p.gender === fields.gender);
  }
  if (fields.dob) {
    filteredPeople = filteredPeople.filter(p => p.dob === fields.dob);
  }

  return Promise.resolve(filteredPeople.length > 0 ? filteredPeople[0] : null);
}

// Export all the functions in a single service object.
export const personServiceLocal = {
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
