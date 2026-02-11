import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';

const getCurrentTimestamp = () => serverTimestamp();

const defaultTree = {
  familyName: 'Untitled Tree',
  familyDescription: 'No Description',
  orgineTribe: 'No tribe given',
  origineTongue: 'No mother tongue given',
  origineHomeLand: 'No homeland given',
  familyPhoto: null,
  createdBy: 'Unknown',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  currentRootId: null,
  roles: {},
  settings: {
    privacy: { isPublic: false, allowMergeRequests: false, globalMatchOptIn: false, allowInvites: true },
    relationship: { allowPolygamy: false, allowMultipleMarriages: true, allowUnknownParentLinking: false, maxGenerationsDisplayed: 10 },
    display: { showRoleBadges: true, showGenderIcons: true, defaultRootPerson: null },
    language: { interfaceLanguage: 'en', allowPerUserLanguageOverride: true },
    lifeEvents: { birth: true, death: true, marriage: true, divorce: true, migration: false },
    limits: { maxStoryLength: 500, maxImageFileSize: '2mb', maxAudioFileSize: '5mb' },
  },
};

async function getTree(treeId) {
  try {
    const treeRef = doc(db, 'trees', treeId);
    const treeSnap = await getDoc(treeRef);

    if (treeSnap.exists()) {
      return { id: treeSnap.id, ...treeSnap.data() };
    } else {
      // Return default tree if not found
      return { id: treeId, ...defaultTree };
    }
  } catch (error) {
    throw new Error(`Failed to get tree: ${error.message}`);
  }
}

async function updateTree(treeId, treeData) {
  try {
    const treeRef = doc(db, 'trees', treeId);
    const updateData = {
      ...treeData,
      updatedAt: getCurrentTimestamp(),
    };

    // Use setDoc with merge to create if not exists
    await setDoc(treeRef, updateData, { merge: true });

    return await getTree(treeId);
  } catch (error) {
    throw new Error(`Failed to update tree: ${error.message}`);
  }
}

async function resetTreeSettings(treeId) {
  try {
    const tree = await getTree(treeId);
    const resetData = {
      ...tree,
      settings: defaultTree.settings,
      updatedAt: getCurrentTimestamp(),
    };

    const treeRef = doc(db, 'trees', treeId);
    await setDoc(treeRef, resetData, { merge: true });

    return await getTree(treeId);
  } catch (error) {
    throw new Error(`Failed to reset tree settings: ${error.message}`);
  }
}

export const treeFirebase = {
  getTree,
  updateTree,
  resetTreeSettings,
};
