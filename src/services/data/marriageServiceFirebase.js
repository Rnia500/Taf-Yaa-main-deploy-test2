// src/services/data/marriageServiceFirebase.js

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

async function addMarriage(marriage) {
  try {
    // Ensure an id
    if (!marriage?.id) {
      marriage.id = generateId("marriage");
    }

    // Must have treeId for rules and indexing
    if (!marriage?.treeId) {
      console.error("addMarriage -> missing treeId:", marriage);
      throw new Error("Missing treeId for marriage");
    }

    // Prepare marriage document to write (don't pre-read to avoid rule denial on non-existent doc)
    const marriageRef = doc(db, 'marriages', marriage.id);
    const marriageData = {
      ...marriage,
      active: true,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      createdBy: marriage.createdBy || null
    };

    console.log("addMarriage -> writing marriage:", marriageData);
    await setDoc(marriageRef, marriageData);
    return marriageData;
  } catch (error) {
    throw new Error(`Failed to add marriage: ${error.message}`);
  }
}

async function getMarriage(id) {
  try {
    const marriageRef = doc(db, 'marriages', id);
    const marriageSnap = await getDoc(marriageRef);
    
    if (marriageSnap.exists()) {
      return { id: marriageSnap.id, ...marriageSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(`Failed to get marriage: ${error.message}`);
  }
}

async function updateMarriage(marriageId, updatedMarriageData) {
  try {
    console.log('updateMarriage called with:', JSON.stringify(updatedMarriageData, null, 2));

    const marriageRef = doc(db, 'marriages', marriageId);

    // Prepare update data, handling undefined fields with deleteField
    const updateData = {};
    const deleteFields = [];

    // Add updatedAt
    updateData.updatedAt = getCurrentTimestamp();

    // Process each field
    for (const [key, value] of Object.entries(updatedMarriageData)) {
      if (value === undefined) {
        // Use deleteField for undefined values (indicating removal)
        deleteFields.push(key);
      } else {
        // Check for undefined in nested structures
        if (Array.isArray(value) || typeof value === 'object') {
          checkForUndefinedInArrays(value, `${key}`);
        }
        updateData[key] = value;
      }
    }

    // Apply updates
    const updateObj = { ...updateData };
    deleteFields.forEach(field => {
      updateObj[field] = deleteField();
    });

    await updateDoc(marriageRef, updateObj);

    // Return updated marriage
    return await getMarriage(marriageId);
  } catch (error) {
    throw new Error(`Failed to update marriage: ${error.message}`);
  }
}

// Helper function to check for undefined in arrays
function checkForUndefinedInArrays(obj, path = '') {
  if (obj === null || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      if (item === undefined) {
        throw new Error(`Undefined value found in array at ${path}[${index}]`);
      }
      checkForUndefinedInArrays(item, `${path}[${index}]`);
    });
  } else {
    for (const key in obj) {
      if (obj[key] === undefined) {
        throw new Error(`Undefined value found in object at ${path}.${key}`);
      }
      checkForUndefinedInArrays(obj[key], `${path}.${key}`);
    }
  }
}

async function deleteMarriage(marriageId) {
  try {
    const marriage = await getMarriage(marriageId);
    if (!marriage) {
      throw new Error("Marriage not found");
    }

    // Permanently delete the marriage
    await deleteDoc(doc(db, 'marriages', marriageId));
    
    console.log(`DBG:marriageServiceFirebase.deleteMarriage -> permanently removed ${marriageId}`);
    return marriage;
  } catch (error) {
    throw new Error(`Failed to delete marriage: ${error.message}`);
  }
}

async function getAllMarriages(treeId) {
  try {
    if (!treeId) throw new Error("treeId is required to fetch marriages");

    const marriagesRef = collection(db, 'marriages');
    const q = query(
      marriagesRef,
      where('treeId', '==', treeId),
      where('active', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const marriages = [];
    querySnapshot.forEach(doc => marriages.push({ id: doc.id, ...doc.data() }));
    return marriages;
  } catch (error) {
    throw new Error(`Failed to get all marriages: ${error.message}`);
  }
}


async function getMarriagesByPersonId(personId) {
  try {
    const marriagesRef = collection(db, 'marriages');
    const q = query(marriagesRef, where('active', '==', true));
    const querySnapshot = await getDocs(q);
    
    const marriages = [];
    querySnapshot.forEach((doc) => {
      const marriage = { id: doc.id, ...doc.data() };
      
      // Check if person is involved in this marriage
      if (marriage.marriageType === 'monogamous') {
        if (marriage.spouses?.includes(personId)) {
          marriages.push(marriage);
        }
      } else if (marriage.marriageType === 'polygamous') {
        if (marriage.husbandId === personId || 
            marriage.wives?.some(w => w.wifeId === personId)) {
          marriages.push(marriage);
        }
      }
    });
    
    return marriages;
  } catch (error) {
    throw new Error(`Failed to get marriages by person ID: ${error.message}`);
  }
}

async function getMarriagesByChildId(childId) {
  try {
    const marriagesRef = collection(db, 'marriages');
    const q = query(marriagesRef, where('active', '==', true));
    const querySnapshot = await getDocs(q);
    
    const marriages = [];
    querySnapshot.forEach((doc) => {
      const marriage = { id: doc.id, ...doc.data() };
      
      // Check if child is in this marriage
      if (marriage.childrenIds?.includes(childId)) {
        marriages.push(marriage);
      } else if (marriage.marriageType === 'polygamous' && marriage.wives) {
        for (const wife of marriage.wives) {
          if (wife.childrenIds?.includes(childId)) {
            marriages.push(marriage);
            break;
          }
        }
      }
    });
    
    return marriages;
  } catch (error) {
    throw new Error(`Failed to get marriages by child ID: ${error.message}`);
  }
}

async function addChildToMarriage(marriageId, childId, motherId = null) {
  try {
    const marriage = await getMarriage(marriageId);
    if (!marriage) {
      throw new Error("Marriage not found");
    }

    console.log("DBG:addChildToMarriage -> marriage:", marriageId, "child:", childId, "mother:", motherId);

    if (marriage.marriageType === 'monogamous') {
      // Add to main children array
      const childrenIds = marriage.childrenIds || [];
      if (!childrenIds.includes(childId)) {
        childrenIds.push(childId);
        await updateMarriage(marriageId, { childrenIds });
      } else {
        console.warn(`DBG: child ${childId} already in monogamous marriage ${marriageId}`);
      }
    } else if (marriage.marriageType === 'polygamous') {
      if (!motherId) {
        throw new Error("Mother ID is required for polygamous marriages.");
      }
      
      const wives = marriage.wives || [];
      const wifeIndex = wives.findIndex(w => w.wifeId === motherId);
      
      if (wifeIndex === -1) {
        throw new Error(`Mother with ID ${motherId} not found in marriage ${marriageId}.`);
      }
      
      const wife = wives[wifeIndex];
      const childrenIds = wife.childrenIds || [];
      
      if (!childrenIds.includes(childId)) {
        childrenIds.push(childId);
        wives[wifeIndex] = { ...wife, childrenIds };
        
        // Remove child from other wives if present
        for (let i = 0; i < wives.length; i++) {
          if (i !== wifeIndex && wives[i].childrenIds?.includes(childId)) {
            console.warn(`DBG: Removing duplicate child ${childId} from wife ${wives[i].wifeId}`);
            wives[i].childrenIds = wives[i].childrenIds.filter(c => c !== childId);
          }
        }
        
        await updateMarriage(marriageId, { wives });
      } else {
        console.warn(`DBG: child ${childId} already assigned to wife ${motherId} in marriage ${marriageId}`);
      }
    }

    return await getMarriage(marriageId);
  } catch (error) {
    throw new Error(`Failed to add child to marriage: ${error.message}`);
  }
}

// Export all the functions in a single service object.
export const marriageServiceFirebase = {
  addMarriage,
  getMarriage,
  updateMarriage,
  deleteMarriage,
  getAllMarriages,
  getMarriagesByPersonId,
  getMarriagesByChildId,
  addChildToMarriage,
};