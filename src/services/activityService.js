import { db } from '../config/firebase.js';
import { collection, addDoc, query, orderBy, limit, getDocs, where, onSnapshot, startAfter, deleteDoc } from 'firebase/firestore';
import { ACTIVITY_TYPES, getActivityDescription, getActivityIcon, createActivity } from '../models/treeModels/ActivityModel.js';

// Cache for activity data
const activityCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cache key
const getCacheKey = (treeId, pageSize, lastDoc) => {
  return `${treeId}_${pageSize}_${lastDoc ? lastDoc.id : 'first'}`;
};

// Helper function to check if cache is valid
const isCacheValid = (cachedData) => {
  return Date.now() - cachedData.timestamp < CACHE_DURATION;
};

// Helper function to set cache
const setCache = (key, data) => {
  activityCache.set(key, {
    ...data,
    timestamp: Date.now(),
  });
};

// Helper function to get from cache
const getFromCache = (key) => {
  const cached = activityCache.get(key);
  if (cached && isCacheValid(cached)) {
    console.log('Returning cached activities for key:', key);
    return cached;
  }
  return null;
};

// Activity service for logging and retrieving family tree activities
const activityService = {
  // Log an activity
  async logActivity(treeId, userId, userName, activityType, details = {}) {
    try {
      const activity = createActivity({
        treeId,
        userId,
        userName,
        activityType,
        details,
        timestamp: new Date(),
      });

      const docRef = await addDoc(collection(db, 'activities'), activity);
      console.log('Activity logged with ID: ', docRef.id);

      // Invalidate cache when new activity is logged
      activityCache.clear();
      console.log('Cache cleared due to new activity');

      return docRef.id;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  },

  // Get activities for a tree with pagination and caching
  async getActivities(treeId, pageSize = 50, lastDoc = null) {
    try {
      const cacheKey = getCacheKey(treeId, pageSize, lastDoc);

      // Check cache first (only for first page to avoid complexity)
      if (!lastDoc) {
        const cachedData = getFromCache(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }

      let q = query(
        collection(db, 'activities'),
        where('treeId', '==', treeId),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        });
      });

      const result = {
        activities,
        hasMore: querySnapshot.size === pageSize,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      };

      // Cache first page results
      if (!lastDoc) {
        setCache(cacheKey, result);
        console.log('Cached activities for key:', cacheKey);
      }

      return result;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },

  // Subscribe to real-time activity updates
  subscribeToActivities(treeId, callback) {
    const q = query(
      collection(db, 'activities'),
      where('treeId', '==', treeId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    return onSnapshot(q, (querySnapshot) => {
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        });
      });
      callback(activities);
    });
  },

  // Clean up old activities (data retention policy)
  async cleanupOldActivities(treeId, daysToKeep = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const q = query(
        collection(db, 'activities'),
        where('treeId', '==', treeId),
        where('timestamp', '<', cutoffDate)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = [];

      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);

      console.log(`Cleaned up ${deletePromises.length} old activities for tree ${treeId}`);
      return deletePromises.length;
    } catch (error) {
      console.error('Error cleaning up old activities:', error);
      throw error;
    }
  },

  // Get activity statistics
  async getActivityStats(treeId) {
    try {
      const q = query(
        collection(db, 'activities'),
        where('treeId', '==', treeId)
      );

      const querySnapshot = await getDocs(q);
      const stats = {
        total: querySnapshot.size,
        byType: {},
        byUser: {},
        dateRange: {
          oldest: null,
          newest: null
        }
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp.toDate();

        // Count by type
        stats.byType[data.activityType] = (stats.byType[data.activityType] || 0) + 1;

        // Count by user
        stats.byUser[data.userName || 'Unknown'] = (stats.byUser[data.userName || 'Unknown'] || 0) + 1;

        // Track date range
        if (!stats.dateRange.oldest || timestamp < stats.dateRange.oldest) {
          stats.dateRange.oldest = timestamp;
        }
        if (!stats.dateRange.newest || timestamp > stats.dateRange.newest) {
          stats.dateRange.newest = timestamp;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting activity stats:', error);
      throw error;
    }
  },

  // Get activity description based on type and details
  getActivityDescription(activity) {
    return getActivityDescription(activity);
  },

  // Get icon for activity type
  getActivityIcon(activityType) {
    return getActivityIcon(activityType);
  },
};

export default activityService;
