// src/services/data/treeSettingsService.js

import { getDB, saveDB } from "./localDB";

/**
 * Get the settings object for a given tree.
 */
function getSettings(treeId) {
  const db = getDB();
  const tree = db.trees.find(t => t.id === treeId);
  if (!tree) {
    return Promise.reject(new Error("Tree not found"));
  }
  return Promise.resolve(tree.settings || {});
}

/**
 * Update specific settings of a tree.
 * 
 * Example: updateSettings("tree001", { privacy: { isPublic: true } })
 */
function updateSettings(treeId, updatedSettings) {
  const db = getDB();
  const idx = db.trees.findIndex(t => t.id === treeId);
  if (idx === -1) {
    return Promise.reject(new Error("Tree not found"));
  }

  // Merge deeply (but shallow per category)
  db.trees[idx].settings = {
    ...db.trees[idx].settings,
    ...updatedSettings,
    privacy: {
      ...db.trees[idx].settings.privacy,
      ...updatedSettings.privacy,
    },
    relationship: {
      ...db.trees[idx].settings.relationship,
      ...updatedSettings.relationship,
    },
    display: {
      ...db.trees[idx].settings.display,
      ...updatedSettings.display,
    },
    language: {
      ...db.trees[idx].settings.language,
      ...updatedSettings.language,
    },
    lifeEvents: {
      ...db.trees[idx].settings.lifeEvents,
      ...updatedSettings.lifeEvents,
    },
    limits: {
      ...db.trees[idx].settings.limits,
      ...updatedSettings.limits,
    },
  };

  db.trees[idx].updatedAt = new Date().toISOString();
  saveDB();

  return Promise.resolve(db.trees[idx].settings);
}

/**
 * Reset settings back to default for a tree.
 */
function resetSettings(treeId) {
  const db = getDB();
  const idx = db.trees.findIndex(t => t.id === treeId);
  if (idx === -1) {
    return Promise.reject(new Error("Tree not found"));
  }

  db.trees[idx].settings = {
    privacy: {
      isPublic: false,
      allowMergeRequests: false,
      globalMatchOptIn: false,
      defaultMemberVisibility: "visible",
    },
    relationship: {
      allowPolygamy: false,
      allowMultipleMarriages: true,
      allowUnknownParentLinking: false,
      maxGenerationsDisplayed: 10,
    },
    display: {
      showRoleBadges: true,
      showGenderIcons: true,
      defaultRootPerson: null,
      nodeColorScheme: "classic",
    },
    language: {
      interfaceLanguage: "en",
      defaultStorytellingDialect: null,
      allowPerUserLanguageOverride: true,
    },
    lifeEvents: {
      birth: true,
      death: true,
      marriage: true,
      divorce: true,
      migration: false,
    },
    limits: {
      maxStoryLength: 500,
      maxImageFileSize: "2mb",
      maxAudioFileSize: "5mb",
    },
  };

  db.trees[idx].updatedAt = new Date().toISOString();
  saveDB();

  return Promise.resolve(db.trees[idx].settings);
}

// Export service
export const treeSettingsService = {
  getSettings,
  updateSettings,
  resetSettings,
};
