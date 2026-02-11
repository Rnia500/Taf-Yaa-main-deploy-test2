// src/services/dataService.js
import { personServiceLocal } from './data/personServiceLocal.js';
import { personServiceFirebase } from './data/personServiceFirebase.js';
import { marriageServiceLocal } from './data/marriageServiceLocal.js';
import { marriageServiceFirebase } from './data/marriageServiceFirebase.js';
import { eventServiceLocal } from './data/eventServiceLocal.js';
import { eventServiceFirebase } from './data/eventServiceFirebase.js';
import { storyServiceLocal } from './data/storyServiceLocal.js';
import { storyServiceFirebase } from './data/storyServiceFirebase.js';
import { mediaServiceFirebase } from './data/mediaServiceFirebase.js';
import { treeServiceLocal } from './data/treeServiceLocal.js';
import { treeServiceFirebase } from './data/treeServiceFirebase.js';
import { treeSettingsService } from './data/treeSettingLocal.js';
import { clearDB as clearLocalDB } from './data/localDB.js';

import { mediaService } from './mediaService.js';
import activityService from './activityService.js';

const BACKEND = "firebase"; // or4 "local"

const services = {
  local: {
    ...personServiceLocal,
    ...marriageServiceLocal,
    ...eventServiceLocal,
    ...storyServiceLocal,
    ...treeServiceLocal,
    ...treeSettingsService,
  },
  firebase: {
    ...personServiceFirebase,
    ...marriageServiceFirebase,
    ...eventServiceFirebase,
    ...storyServiceFirebase,
    ...mediaServiceFirebase,
    ...treeServiceFirebase,
  },
};

// Cloud storage wrapper for backward compatibility
const cloudStorageService = {
  async uploadFile(file, type, context = {}) {
    const { treeId, personId, userId } = context;
    if (!treeId || !userId) {
      throw new Error('treeId and userId are required for cloud storage');
    }
    return mediaService.uploadAttachment(file, treeId, personId, userId);
  },

  async uploadMedia(file, treeId, personId, userId, options = {}) {
    return mediaService.uploadMedia(file, treeId, personId, userId, options);
  },

  async uploadStory(file, treeId, personId, userId, options = {}) {
    return mediaService.uploadStory(file, treeId, personId, userId, options);
  }
};

const dataService = {
  ...services[BACKEND],
  ...cloudStorageService,
  clearLocalDB: clearLocalDB,
  getUser: services[BACKEND].getUser || services.firebase.getUser,
  activityService,
};

export default dataService;
