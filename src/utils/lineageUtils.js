import dataService from '../services/dataService.js';

/**
 * Checks if a target person is in the user's downward lineage
 * @param {string} userId - The user ID (must be linked to a person)
 * @param {string} targetPersonId - The person ID to check
 * @param {string} treeId - The tree ID
 * @returns {Promise<boolean>} - True if target is in user's lineage
 */
export async function isInUserLineage(userId, targetPersonId, treeId) {
  try {
    if (!userId || !targetPersonId || !treeId) {
      return false;
    }

    // If it's the same person, they're in their own lineage
    if (userId === targetPersonId) {
      return true;
    }

    // Get all people and marriages for the tree
    const people = await dataService.getPeopleByTreeId(treeId);
    const marriages = await dataService.getMarriagesByTreeId(treeId);

    // Find the person linked to the user
    const userPerson = people.find(p => p.linkedUserId === userId);
    if (!userPerson) {
      return false;
    }

    // Use the existing getDescendantIds function to get all descendants
    const { getDescendantIds } = await import('./treeUtils/treeLayout.js');
    const descendants = getDescendantIds(userPerson.id, marriages);

    // Check if target person is a descendant
    if (descendants.includes(targetPersonId)) {
      return true;
    }

    // Also check spouses of the user and their descendants
    const userSpouseIds = getSpouseIds(userPerson.id, marriages);
    if (userSpouseIds.includes(targetPersonId)) {
      return true;
    }

    // Check spouses of descendants
    for (const descendantId of descendants) {
      const descendantSpouseIds = getSpouseIds(descendantId, marriages);
      if (descendantSpouseIds.includes(targetPersonId)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking user lineage:', error);
    return false;
  }
}

/**
 * Gets spouse IDs for a given person
 * @param {string} personId - The person ID
 * @param {Array} marriages - Array of marriages
 * @returns {Array<string>} - Array of spouse IDs
 */
function getSpouseIds(personId, marriages) {
  const spouseIds = [];

  for (const marriage of marriages) {
    if (marriage.isDeleted || marriage.pendingDeletion) continue;

    if (marriage.marriageType === 'monogamous') {
      if (marriage.spouses && marriage.spouses.includes(personId)) {
        marriage.spouses.forEach(spouseId => {
          if (spouseId && spouseId !== personId) {
            spouseIds.push(spouseId);
          }
        });
      }
    } else if (marriage.marriageType === 'polygamous') {
      if (marriage.husbandId === personId) {
        marriage.wives?.forEach(wife => {
          if (wife.wifeId) {
            spouseIds.push(wife.wifeId);
          }
        });
      } else {
        const wifeData = marriage.wives?.find(w => w.wifeId === personId);
        if (wifeData && marriage.husbandId) {
          spouseIds.push(marriage.husbandId);
        }
      }
    }
  }

  return spouseIds;
}

/**
 * Checks if a user can perform an action on a target person based on role and lineage
 * @param {string} userId - The user ID
 * @param {string} userRole - The user's role ('admin', 'moderator', 'editor', 'viewer')
 * @param {string} targetPersonId - The target person ID
 * @param {string} treeId - The tree ID
 * @param {string} action - The action being performed ('view', 'edit', 'delete', 'add')
 * @returns {Promise<boolean>} - True if action is allowed
 */
export async function canUserAccessPerson(userId, userRole, targetPersonId, treeId, action = 'view') {
  try {
    // Admins can do everything
    if (userRole === 'admin') {
      return true;
    }

    // Moderators have global access for their allowed actions
    if (userRole === 'moderator') {
      return true; // Moderators can access all people for viewing/editing (except cascade delete)
    }

    // Viewers can view the entire tree
    if (userRole === 'viewer') {
      return action === 'view';
    }

    // Editors are restricted to their lineage
    if (userRole === 'editor') {
      const inLineage = await isInUserLineage(userId, targetPersonId, treeId);
      return inLineage;
    }

    return false;
  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
}

/**
 * Checks if a user can perform an action on a story/event/media based on role and lineage
 * @param {string} userId - The user ID
 * @param {string} userRole - The user's role
 * @param {string} personId - The person associated with the content
 * @param {string} treeId - The tree ID
 * @param {string} action - The action ('view', 'edit', 'delete', 'add')
 * @param {string} contentCreatorId - The user who created the content (optional)
 * @returns {Promise<boolean>} - True if action is allowed
 */
export async function canUserAccessContent(userId, userRole, personId, treeId, action = 'view', contentCreatorId = null) {
  try {
    // Admins can do everything
    if (userRole === 'admin') {
      return true;
    }

    // Moderators have global access
    if (userRole === 'moderator') {
      return true;
    }

    // Viewers can view all content
    if (userRole === 'viewer') {
      return action === 'view';
    }

    // Editors can only access content for people in their lineage
    if (userRole === 'editor') {
      const inLineage = await isInUserLineage(userId, personId, treeId);
      if (!inLineage) {
        return false;
      }

      // For editing/deleting, editors can only modify content they created
      // or content for people in their lineage (but not delete others' content)
      if (action === 'edit' || action === 'delete') {
        // Editors cannot delete content created by others, even in their lineage
        if (contentCreatorId && contentCreatorId !== userId) {
          return false;
        }
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking content access:', error);
    return false;
  }
}
