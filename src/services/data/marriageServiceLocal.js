// src/services/data/marriageServiceLocal.js

// 1. Import the database manager, not the DB itself.
import { getDB, saveDB } from "./localDB.js"; 
import { generateId } from "../../utils/personUtils/idGenerator.js";

//  Marriage-Specific Data Access Functions (Local Storage Implementation) 

function addMarriage(marriage) {
  const db = getDB();

  // This is business logic, but it's so closely tied to data integrity
  // that keeping it in the data service is a valid choice.
  if (marriage.marriageType === "monogamous") {
    const [a, b] = marriage.spouses || [];
    const aHasPoly = db.marriages.some(m => m.marriageType === "polygamous" && m.husbandId === a);
    const bHasPoly = db.marriages.some(m => m.marriageType === "polygamous" && m.husbandId === b);
    if (aHasPoly || bHasPoly) {
      throw new Error("Invariant violation: cannot create monogamous marriage when a polygamous marriage exists for a spouse.");
    }
  }

  const exists = db.marriages.find(m => m.id === marriage.id);
  if (exists) {
    console.warn("marriageServiceLocal.addMarriage -> duplicate marriage id detected:", marriage.id);
    marriage = { ...marriage, id: generateId("marriage") };
  }
  db.marriages.push(marriage);
  saveDB();
  return Promise.resolve(marriage);
}

function getMarriage(id) {
  const db = getDB();
  const m = db.marriages.find((m) => m.id === id);
  return Promise.resolve(m);
}

function updateMarriage(marriageId, updatedMarriageData) {
  const db = getDB();
  const marriageIndex = db.marriages.findIndex(m => m.id === marriageId);
  if (marriageIndex === -1) {
    return Promise.reject(new Error("Marriage not found"));
  }
  db.marriages[marriageIndex] = { ...db.marriages[marriageIndex], ...updatedMarriageData, updatedAt: new Date().toISOString() };
  saveDB();
  return Promise.resolve(db.marriages[marriageIndex]);
}

function deleteMarriage(marriageId) {
  const db = getDB();
  const idx = db.marriages.findIndex(m => m.id === marriageId);
  if (idx === -1) {
    return Promise.reject(new Error("Marriage not found"));
  }
  const removed = db.marriages.splice(idx, 1)[0];
  saveDB();
  return Promise.resolve(removed);
}

function getAllMarriages() {
  const db = getDB();
  return Promise.resolve([...db.marriages]);
}

function getMarriagesByPersonId(personId) {
  const db = getDB();
  const marriages = db.marriages.filter(m => {
    if (m.marriageType === 'monogamous') {
      return m.spouses?.includes(personId);
    }
    if (m.marriageType === 'polygamous') {
      return m.husbandId === personId || m.wives?.some(w => w.wifeId === personId);
    }
    return false;
  });
  return Promise.resolve(marriages);
}

function getMarriagesByChildId(childId) {
  const db = getDB();
  const marriages = db.marriages.filter(m => {
    if (m.childrenIds?.includes(childId)) return true;
    if (m.marriageType === 'polygamous') {
      return m.wives.some(w => w.childrenIds?.includes(childId));
    }
    return false;
  });
  return Promise.resolve(marriages);
}

function addChildToMarriage(marriageId, childId, motherId = null) {
  const db = getDB();
  const marriage = db.marriages.find((m) => m.id === marriageId);

  console.log("DBG:addChildToMarriage -> marriage:", marriageId, "child:", childId, "mother:", motherId);

  if (marriage) {
    if (marriage.marriageType === 'monogamous') {
      marriage.childrenIds = marriage.childrenIds || [];
      if (!marriage.childrenIds.includes(childId)) {
        marriage.childrenIds.push(childId);
      } else {
        console.warn(`DBG: child ${childId} already in monogamous marriage ${marriageId}`);
      }
    } else if (marriage.marriageType === 'polygamous') {
      if (!motherId) {
        console.error("addChildToMarriage Error: motherId is required for polygamous marriages.");
        return Promise.reject(new Error("Mother ID is required for polygamous marriages."));
      }
      const wife = marriage.wives.find(w => w.wifeId === motherId);
      if (wife) {
        wife.childrenIds = wife.childrenIds || [];
        if (!wife.childrenIds.includes(childId)) {
          wife.childrenIds.push(childId);
        } else {
          console.warn(`DBG: child ${childId} already assigned to wife ${motherId} in marriage ${marriageId}`);
        }
      } else {
        console.error(`Could not find mother with ID ${motherId} in marriage ${marriageId}`);
        return Promise.reject(new Error(`Mother with ID ${motherId} not found in marriage ${marriageId}.`));
      }

      for (const w of marriage.wives) {
        if (w.wifeId !== motherId && w.childrenIds?.includes(childId)) {
          console.warn(`DBG: Removing duplicate child ${childId} from wife ${w.wifeId}`);
          w.childrenIds = w.childrenIds.filter(c => c !== childId);
        }
      }
    }
    saveDB();
  }
  return Promise.resolve(marriage);
}


// Export all the functions in a single, coherent service object.
export const marriageServiceLocal = {
  addMarriage,
  getMarriage,
  updateMarriage,
  deleteMarriage,
  getAllMarriages,
  getMarriagesByPersonId,
  getMarriagesByChildId,
  addChildToMarriage,
};