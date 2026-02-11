// src/services/data/treeServiceLocal.js

import { getDB, saveDB } from "./localDB";
import { generateId } from "../../utils/personUtils/idGenerator";

//  Create 
//  Create 
function addTree(tree) {
  const db = getDB();
  const exists = db.trees.find(t => t.id === tree.id);
  if (exists) {
    console.warn("treeServiceLocal.addTree -> duplicate tree id detected:", tree.id);
    tree = { ...tree, id: generateId("tree") };
  }

  const newTree = {
    ...tree,
    id: tree.id || generateId("tree"),
    members: tree.members || [],
    invitesEnabled: tree.invitesEnabled ?? true,
    mergeOptIn: tree.mergeOptIn ?? false,
    currentRootId: tree.currentRootId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.trees.push(newTree);
  saveDB();
  return Promise.resolve(newTree);
}


//  Get 
function getTree(treeId) {
  const db = getDB();
  const tree = db.trees.find(t => t.id === treeId);
  return Promise.resolve(tree || null);
}

function getTreesByUserId(userId) {
  const db = getDB();
  const trees = db.trees.filter(t => t.members.some(m => m.userId === userId));
  return Promise.resolve(trees);
}

function getAllTrees() {
  const db = getDB();
  return Promise.resolve([...db.trees]);
}

//  Update 
function updateTree(treeId, updatedData) {
  const db = getDB();
  const idx = db.trees.findIndex(t => t.id === treeId);
  if (idx === -1) {
    return Promise.reject(new Error("Tree not found"));
  }
  db.trees[idx] = { 
    ...db.trees[idx], 
    ...updatedData, 
    updatedAt: new Date().toISOString() 
  };
  saveDB();
  return Promise.resolve(db.trees[idx]);
}

//  Membership 
function addMember(treeId, userId, role) {
  const db = getDB();
  const tree = db.trees.find(t => t.id === treeId);
  if (!tree) return Promise.reject(new Error("Tree not found"));

  const alreadyMember = tree.members.find(m => m.userId === userId);
  if (alreadyMember) {
    return Promise.reject(new Error("User already a member"));
  }

  tree.members.push({
    userId,
    role,
    joinedAt: new Date().toISOString(),
  });
  tree.updatedAt = new Date().toISOString();

  saveDB();
  return Promise.resolve(tree);
}

function removeMember(treeId, userId) {
  const db = getDB();
  const tree = db.trees.find(t => t.id === treeId);
  if (!tree) return Promise.reject(new Error("Tree not found"));

  tree.members = tree.members.filter(m => m.userId !== userId);
  tree.updatedAt = new Date().toISOString();

  saveDB();
  return Promise.resolve(tree);
}

function changeMemberRole(treeId, userId, newRole) {
  const db = getDB();
  const tree = db.trees.find(t => t.id === treeId);
  if (!tree) return Promise.reject(new Error("Tree not found"));

  const member = tree.members.find(m => m.userId === userId);
  if (!member) return Promise.reject(new Error("User not a member of tree"));

  member.role = newRole;
  tree.updatedAt = new Date().toISOString();

  saveDB();
  return Promise.resolve(tree);
}

//  Root person 
function setRootPerson(treeId, personId) {
  const db = getDB();
  const tree = db.trees.find(t => t.id === treeId);
  if (!tree) return Promise.reject(new Error("Tree not found"));

  tree.currentRootId = personId;
  tree.updatedAt = new Date().toISOString();

  saveDB();
  return Promise.resolve(tree);
}

//  Invites 
function toggleInvites(treeId, enabled) {
  const db = getDB();
  const tree = db.trees.find(t => t.id === treeId);
  if (!tree) return Promise.reject(new Error("Tree not found"));

  tree.invitesEnabled = enabled;
  tree.updatedAt = new Date().toISOString();

  saveDB();
  return Promise.resolve(tree);
}

//  Merge opt-in 
function setMergeOptIn(treeId, enabled) {
  const db = getDB();
  const tree = db.trees.find(t => t.id === treeId);
  if (!tree) return Promise.reject(new Error("Tree not found"));

  tree.mergeOptIn = enabled;
  tree.updatedAt = new Date().toISOString();

  saveDB();
  return Promise.resolve(tree);
}

//  Get latest tree for user 
function getUserLatestTree(userId) {
  const db = getDB();

  // Find all trees where user is a member
  const trees = db.trees.filter(t => 
    t.members.some(m => m.userId === userId)
  );

  if (trees.length === 0) {
    return Promise.resolve(null);
  }

  // Sort by updatedAt (fallback createdAt)
  const latestTree = trees.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt) -
      new Date(a.updatedAt || a.createdAt)
  )[0];

  return Promise.resolve(latestTree || null);
}

//  Export 
export const treeServiceLocal = {
  addTree,
  getTree,
  getTreesByUserId,
  getAllTrees,
  updateTree,
  addMember,
  removeMember,
  changeMemberRole,
  setRootPerson,
  toggleInvites,
  setMergeOptIn,
  getUserLatestTree,
};
