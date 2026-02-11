import { useState, useEffect } from 'react';
import { treeFirebase } from '../services/data/treeSettingsFirebase.js';

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

export function useTreeSettings(initialTreeId) {
  const [treeId] = useState(initialTreeId);
  const [tree, setTree] = useState(defaultTree);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'

  useEffect(() => {
    if (treeId) {
      treeFirebase.getTree(treeId)
        .then(data => {
          setTree(data);
        })
        .catch(() => {
          setTree(defaultTree);
        });
    }
  }, [treeId]);

  // Update a nested setting by path string like 'privacy.isPublic' or top-level like 'familyName'
  const updateSetting = (path, value) => {
    const keys = path.split('.');
    setTree(prev => {
      const updated = { ...prev };
      let nested = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!nested[keys[i]]) nested[keys[i]] = {};
        nested[keys[i]] = { ...nested[keys[i]] };
        nested = nested[keys[i]];
      }
      nested[keys[keys.length - 1]] = value;
      return updated;
    });
    setSaveStatus('unsaved');
  };

  // Save tree to Firebase
  const saveSettings = async () => {
    if (!treeId) return;
    setSaveStatus('saving');
    try {
      await treeFirebase.updateTree(treeId, tree);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch {
      setSaveStatus('error');
    }
  };

  // Reset settings to default in Firebase
  const resetSettings = async () => {
    if (!treeId) return;
    setSaveStatus('saving');
    try {
      const resetData = await treeFirebase.resetTreeSettings(treeId);
      setTree(resetData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch {
      setSaveStatus('error');
    }
  };

  return {
    tree,
    updateSetting,
    saveSettings,
    resetSettings,
    saveStatus,
  };
}
