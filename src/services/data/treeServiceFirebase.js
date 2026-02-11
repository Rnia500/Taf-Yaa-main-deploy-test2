// src/services/data/treeServiceFirebase.js

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
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase.js';
import { generateId } from '../../utils/personUtils/idGenerator.js';
import dataService from '../dataService.js';

// Helper function to get current timestamp
const getCurrentTimestamp = () => serverTimestamp();

async function addTree(tree) {
  try {
   
    if (!tree.id) {
      tree.id = generateId("tree");
    }

    const treeRef = doc(db, 'trees', tree.id);
    const uid = tree.createdBy;

    const treeData = {
      ...tree,
      id: tree.id,
      members: tree.members || [{
        userId: uid,
        role: "admin",
        joinedAt: new Date().toISOString(),
      }],
      memberUIDs: tree.memberUIDs || [uid],
      invitesEnabled: tree.invitesEnabled ?? true,
      mergeOptIn: tree.mergeOptIn ?? false,
      currentRootId: tree.currentRootId || null,
      active: true,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await setDoc(treeRef, treeData);
    return treeData;
  } catch (error) {
    throw new Error(`Failed to add tree: ${error.message}`);
  }
}

async function getTree(treeId) {
  try {
    const treeRef = doc(db, 'trees', treeId);
    const treeSnap = await getDoc(treeRef);
    
    if (treeSnap.exists()) {
      return { id: treeSnap.id, ...treeSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(`Failed to get tree: ${error.message}`);
  }
}

async function getTreesByUserId(userId, includeDeleted = false) {
  try {
    const treesRef = collection(db, 'trees');
    const q = query(treesRef, where('memberUIDs', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    
    const trees = [];
    querySnapshot.forEach((doc) => {
      const tree = { id: doc.id, ...doc.data() };
      // Check if user is a member of this tree
      if (tree.members?.some(m => m.userId === userId)) {
        if (includeDeleted || !tree.deletedAt) {
          trees.push(tree);
        }
      }
    });
    
    return trees;
  } catch (error) {
    throw new Error(`Failed to get trees by user ID: ${error.message}`);
  }
}

async function getAllTrees() {
  try {
    const treesRef = collection(db, 'trees');
    const q = query(treesRef, where('active', '==', true));
    const querySnapshot = await getDocs(q);
    
    const trees = [];
    querySnapshot.forEach((doc) => {
      trees.push({ id: doc.id, ...doc.data() });
    });
    
    return trees;
  } catch (error) {
    throw new Error(`Failed to get all trees: ${error.message}`);
  }
}

async function updateTree(treeId, updates) {
  try {
    const treeRef = doc(db, 'trees', treeId);
    const updateData = {
      ...updates,
      updatedAt: getCurrentTimestamp()
    };

    // Define public fields that can be displayed in notifications (non-disclosing)
    const publicFields = ['name', 'description', 'invitesEnabled', 'mergeOptIn'];

    // Log activity for tree settings changes (only for public fields)
    const currentUser = auth.currentUser;
    if (currentUser && Object.keys(updates).length > 0) {
      const tree = await getTree(treeId);
      const memberData = tree?.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        const changedFields = Object.keys(updates).filter(key => publicFields.includes(key) && key !== 'updatedAt');
        if (changedFields.length > 0) {
          await dataService.activityService.logActivity(
            treeId,
            currentUser.uid,
            memberData.displayName || currentUser.email || 'Unknown User',
            'tree_settings_edited',
            { changedFields: changedFields }
          );
        }
      }
    }

    await updateDoc(treeRef, updateData);

    // Return updated tree
    return await getTree(treeId);
  } catch (error) {
    throw new Error(`Failed to update tree: ${error.message}`);
  }
}

async function addMember(treeId, member) {
  try {
    const tree = await getTree(treeId);
    if (!tree) {
      throw new Error("Tree not found");
    }

    const members = tree.members || [];
    const memberUIDs = tree.memberUIDs || [];
    
    const existingMemberIndex = members.findIndex(m => m.userId === member.userId);
    if (existingMemberIndex !== -1) {
      throw new Error("Member already exists in this tree");
    }

    const newMember = {
      ...member,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    members.push(newMember);
    memberUIDs.push(member.userId); 
    
    await updateTree(treeId, { members, memberUIDs });
    return newMember;
  } catch (error) {
    throw new Error(`Failed to add member: ${error.message}`);
  }
}

async function removeMember(treeId, userId) {
  try {
    const tree = await getTree(treeId);
    if (!tree) {
      throw new Error("Tree not found");
    }

    const members = tree.members || [];
    const memberIndex = members.findIndex(m => m.userId === userId);
    
    if (memberIndex === -1) {
      throw new Error("Member not found in this tree");
    }

    const removedMember = members.splice(memberIndex, 1)[0];
    const memberUIDs = (tree.memberUIDs || []).filter(uid => uid !== userId);
    
    await updateTree(treeId, { members, memberUIDs });
    return removedMember;
  } catch (error) {
    throw new Error(`Failed to remove member: ${error.message}`);
  }
}

async function changeMemberRole(treeId, userId, newRole) {
  try {
    const tree = await getTree(treeId);
    if (!tree) {
      throw new Error("Tree not found");
    }

    const members = tree.members || [];
    const memberIndex = members.findIndex(m => m.userId === userId);

    if (memberIndex === -1) {
      throw new Error("Member not found in this tree");
    }

    const oldRole = members[memberIndex].role;
    members[memberIndex].role = newRole;
    members[memberIndex].updatedAt = new Date().toISOString();

    await updateTree(treeId, { members });

    // Log activity for role change
    const currentUser = auth.currentUser;
    if (currentUser) {
      const targetUser = await getUser(userId);
      const memberData = tree.members?.find(m => m.userId === currentUser.uid);
      if (memberData) {
        await dataService.activityService.logActivity(
          treeId,
          currentUser.uid,
          memberData.displayName || currentUser.email || 'Unknown User',
          'role_changed',
          {
            targetUserName: targetUser?.displayName || targetUser?.email || 'Unknown User',
            oldRole: oldRole,
            newRole: newRole
          }
        );
      }
    }

    return members[memberIndex];
  } catch (error) {
    throw new Error(`Failed to change member role: ${error.message}`);
  }
}

async function banMember(treeId, userId, banPeriod = null) {
  try {
    const tree = await getTree(treeId);
    if (!tree) {
      throw new Error("Tree not found");
    }

    const members = tree.members || [];
    const memberIndex = members.findIndex(m => m.userId === userId);

    if (memberIndex === -1) {
      throw new Error("Member not found in this tree");
    }

    members[memberIndex].banned = true;
    members[memberIndex].banPeriod = banPeriod;
    members[memberIndex].updatedAt = new Date().toISOString();

    await updateTree(treeId, { members });
    return members[memberIndex];
  } catch (error) {
    throw new Error(`Failed to ban member: ${error.message}`);
  }
}

async function unbanMember(treeId, userId) {
  try {
    const tree = await getTree(treeId);
    if (!tree) {
      throw new Error("Tree not found");
    }

    const members = tree.members || [];
    const memberIndex = members.findIndex(m => m.userId === userId);

    if (memberIndex === -1) {
      throw new Error("Member not found in this tree");
    }

    members[memberIndex].banned = false;
    members[memberIndex].updatedAt = new Date().toISOString();

    await updateTree(treeId, { members });
    return members[memberIndex];
  } catch (error) {
    throw new Error(`Failed to unban member: ${error.message}`);
  }
}

async function updateMemberLastActive(treeId, userId, lastActive) {
  try {
    const tree = await getTree(treeId);
    if (!tree) {
      throw new Error("Tree not found");
    }

    const members = tree.members || [];
    const memberIndex = members.findIndex(m => m.userId === userId);

    if (memberIndex === -1) {
      throw new Error("Member not found in this tree");
    }

    members[memberIndex].lastActive = lastActive;
    members[memberIndex].updatedAt = new Date().toISOString();

    await updateTree(treeId, { members });
    return members[memberIndex];
  } catch (error) {
    throw new Error(`Failed to update member last active: ${error.message}`);
  }
}

async function setRootPerson(treeId, personId) {
  try {
    await updateTree(treeId, { currentRootId: personId });
    return await getTree(treeId);
  } catch (error) {
    throw new Error(`Failed to set root person: ${error.message}`);
  }
}

async function toggleInvites(treeId, enabled) {
  try {
    await updateTree(treeId, { invitesEnabled: enabled });
    return await getTree(treeId);
  } catch (error) {
    throw new Error(`Failed to toggle invites: ${error.message}`);
  }
}

async function setMergeOptIn(treeId, optIn) {
  try {
    await updateTree(treeId, { mergeOptIn: optIn });
    return await getTree(treeId);
  } catch (error) {
    throw new Error(`Failed to set merge opt-in: ${error.message}`);
  }
}

async function getUserLatestTree(userId) {
  try {
    const trees = await getTreesByUserId(userId);
    
    if (trees.length === 0) {
      return null;
    }

    // Sort by updatedAt (most recent first), then by createdAt
    const sortedTrees = trees.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return dateB - dateA;
    });

    return sortedTrees[0];
  } catch (error) {
    throw new Error(`Failed to get user latest tree: ${error.message}`);
  }}

async function deleteTree(treeId) {
  try {
    const treeRef = doc(db, 'trees', treeId);
    await deleteDoc(treeRef);
  } catch (error) {
    throw new Error(`Failed to delete tree: ${error.message}`);
  }
}

async function softDeleteTree(treeId) {
  try {
    await updateTree(treeId, { deletedAt: getCurrentTimestamp() });
    return await getTree(treeId);
  } catch (error) {
    throw new Error(`Failed to soft delete tree: ${error.message}`);
  }
}

async function restoreTree(treeId) {
  try {
    await updateTree(treeId, { deletedAt: null });
    return await getTree(treeId);
  } catch (error) {
    throw new Error(`Failed to restore tree: ${error.message}`);
  }
}

async function purgeTree(treeId) {
  try {
    await deleteTree(treeId);
  } catch (error) {
    throw new Error(`Failed to purge tree: ${error.message}`);
  }
}

// Get user by ID (from users collection)
async function getUser(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}


export const treeServiceFirebase = {
  addTree,
  getTree,
  getTreesByUserId,
  getAllTrees,
  updateTree,
  addMember,
  removeMember,
  changeMemberRole,
  banMember,
  unbanMember,
  updateMemberLastActive,
  setRootPerson,
  toggleInvites,
  setMergeOptIn,
  getUserLatestTree,
  getUser,
  deleteTree,
  softDeleteTree,
  restoreTree,
  purgeTree,
};
