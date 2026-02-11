import { canUserAccessPerson, canUserAccessContent } from './lineageUtils.js';

/**
 * Permission check result object
 */
export class PermissionResult {
  constructor(allowed, requiredRole = null, reason = null, guidance = null) {
    this.allowed = allowed;
    this.requiredRole = requiredRole;
    this.reason = reason;
    this.guidance = guidance;
  }

  static allowed() {
    return new PermissionResult(true);
  }

  static denied(requiredRole, reason, guidance = null) {
    return new PermissionResult(false, requiredRole, reason, guidance);
  }
}

/**
 * Actions that can be performed in the system
 */
export const ACTIONS = {
  // Person actions
  CREATE_PERSON: 'create_person',
  EDIT_PERSON: 'edit_person',
  DELETE_PERSON: 'delete_person',
  VIEW_PERSON: 'view_person',

  // Content actions
  CREATE_STORY: 'create_story',
  EDIT_STORY: 'edit_story',
  DELETE_STORY: 'delete_story',
  VIEW_STORY: 'view_story',

  CREATE_EVENT: 'create_event',
  EDIT_EVENT: 'edit_event',
  DELETE_EVENT: 'delete_event',
  VIEW_EVENT: 'view_event',

  // Tree actions
  CREATE_TREE: 'create_tree',
  MANAGE_MEMBERS: 'manage_members',
  MANAGE_INVITES: 'manage_invites',
  EXPORT_TREE: 'export_tree',
  DELETE_TREE: 'delete_tree',
};

/**
 * Maps actions to minimum required roles
 */
export const ACTION_ROLE_REQUIREMENTS = {
  [ACTIONS.CREATE_PERSON]: ['admin', 'moderator', 'editor'],
  [ACTIONS.EDIT_PERSON]: ['admin', 'moderator', 'editor'],
  [ACTIONS.DELETE_PERSON]: ['admin', 'moderator'], // Editors can't delete
  [ACTIONS.VIEW_PERSON]: ['admin', 'moderator', 'editor', 'viewer'],

  [ACTIONS.CREATE_STORY]: ['admin', 'moderator', 'editor'],
  [ACTIONS.EDIT_STORY]: ['admin', 'moderator', 'editor'],
  [ACTIONS.DELETE_STORY]: ['admin', 'moderator'], // Editors can't delete others' content
  [ACTIONS.VIEW_STORY]: ['admin', 'moderator', 'editor', 'viewer'],

  [ACTIONS.CREATE_EVENT]: ['admin', 'moderator', 'editor'],
  [ACTIONS.EDIT_EVENT]: ['admin', 'moderator', 'editor'],
  [ACTIONS.DELETE_EVENT]: ['admin', 'moderator'], // Editors can't delete others' content
  [ACTIONS.VIEW_EVENT]: ['admin', 'moderator', 'editor', 'viewer'],

  [ACTIONS.CREATE_TREE]: ['admin', 'moderator', 'editor', 'viewer'], // Allow all roles to create trees
  [ACTIONS.MANAGE_MEMBERS]: ['admin', 'moderator'],
  [ACTIONS.MANAGE_INVITES]: ['admin', 'moderator'],
  [ACTIONS.EXPORT_TREE]: ['admin', 'moderator', 'editor', 'viewer'],
  [ACTIONS.DELETE_TREE]: ['admin'],
};

/**
 * Check if a user can perform an action
 * @param {string} userId - User ID
 * @param {string} userRole - User's role
 * @param {string} action - Action to check
 * @param {string} targetPersonId - Target person ID (for person/content actions)
 * @param {string} treeId - Tree ID
 * @param {string} contentCreatorId - Content creator ID (for content actions)
 * @returns {Promise<PermissionResult>}
 */
export async function checkPermission(userId, userRole, action, targetPersonId = null, treeId = null, contentCreatorId = null) {

  // Special case for tree creation - any authenticated user can create trees
  if (action === ACTIONS.CREATE_TREE) {
    return PermissionResult.allowed();
  }

  // Check if user has required role for the action
  const requiredRoles = ACTION_ROLE_REQUIREMENTS[action];
  if (!requiredRoles) {
    return PermissionResult.denied('admin', `Unknown action: ${action}`);
  }

  if (!requiredRoles.includes(userRole)) {
    const requiredRole = getHighestRole(requiredRoles);

    return PermissionResult.denied(
      requiredRole,
      `This action requires ${requiredRole} permissions`,
      getRoleGuidance(requiredRole)
    );
  }

  // For person-specific actions, check lineage access
  if (targetPersonId && treeId && isPersonAction(action)) {
    const hasAccess = await canUserAccessPerson(userId, userRole, targetPersonId, treeId, getActionType(action));
    if (!hasAccess) {
      return PermissionResult.denied(
        userRole === 'editor' ? 'admin' : 'moderator',
        'You can only perform this action on people in your lineage',
        'Contact an admin or moderator to perform this action, or ask them to change your role to access this person.'
      );
    }
  }

  // For content-specific actions, check content access
  if (targetPersonId && treeId && isContentAction(action)) {
    const hasAccess = await canUserAccessContent(userId, userRole, targetPersonId, treeId, getActionType(action), contentCreatorId);
    if (!hasAccess) {
      const reason = contentCreatorId && contentCreatorId !== userId
        ? 'You can only edit or delete content you created'
        : 'You can only perform this action on content for people in your lineage';

      return PermissionResult.denied(
        userRole === 'editor' ? 'admin' : 'moderator',
        reason,
        'Contact an admin or moderator to perform this action, or ask them to change your role.'
      );
    }
  }

  return PermissionResult.allowed();
}

/**
 * Get user-friendly error message from permission result
 * @param {PermissionResult} result
 * @returns {string}
 */
export function getPermissionErrorMessage(result) {
  if (result.allowed) return '';

  let message = result.reason || 'Permission denied';

  if (result.guidance) {
    message += ` ${result.guidance}`;
  }

  return message;
}

/**
 * Get the highest role from a list of roles
 * @param {string[]} roles
 * @returns {string}
 */
function getHighestRole(roles) {
  const roleHierarchy = ['viewer', 'editor', 'moderator', 'admin'];
  return roles.sort((a, b) => roleHierarchy.indexOf(b) - roleHierarchy.indexOf(a))[0];
}

/**
 * Get guidance text for a required role
 * @param {string} role
 * @returns {string}
 */
function getRoleGuidance(role) {
  switch (role) {
    case 'admin':
      return 'Contact the tree administrator to grant you admin access.';
    case 'moderator':
      return 'Contact an admin or moderator to upgrade your role.';
    case 'editor':
      return 'Contact an admin or moderator to change your role to editor.';
    default:
      return 'Contact an administrator for assistance.';
  }
}

/**
 * Check if action is person-related
 * @param {string} action
 * @returns {boolean}
 */
function isPersonAction(action) {
  return [
    ACTIONS.CREATE_PERSON,
    ACTIONS.EDIT_PERSON,
    ACTIONS.DELETE_PERSON,
    ACTIONS.VIEW_PERSON
  ].includes(action);
}

/**
 * Check if action is content-related
 * @param {string} action
 * @returns {boolean}
 */
function isContentAction(action) {
  return [
    ACTIONS.CREATE_STORY,
    ACTIONS.EDIT_STORY,
    ACTIONS.DELETE_STORY,
    ACTIONS.VIEW_STORY,
    ACTIONS.CREATE_EVENT,
    ACTIONS.EDIT_EVENT,
    ACTIONS.DELETE_EVENT,
    ACTIONS.VIEW_EVENT
  ].includes(action);
}

/**
 * Convert action to access type for lineage utils
 * @param {string} action
 * @returns {string}
 */
function getActionType(action) {
  if (action.includes('view')) return 'view';
  if (action.includes('edit')) return 'edit';
  if (action.includes('delete')) return 'delete';
  if (action.includes('create')) return 'add';
  return 'view';
}

/**
 * Hook for checking permissions in components
 * @param {string} userId
 * @param {string} userRole
 * @param {string} treeId
 * @returns {object}
 */
export function usePermissions(userId, userRole, treeId) {
  return {
    canCreatePerson: (targetPersonId) =>
      checkPermission(userId, userRole, ACTIONS.CREATE_PERSON, targetPersonId, treeId),

    canEditPerson: (targetPersonId) =>
      checkPermission(userId, userRole, ACTIONS.EDIT_PERSON, targetPersonId, treeId),

    canDeletePerson: (targetPersonId) =>
      checkPermission(userId, userRole, ACTIONS.DELETE_PERSON, targetPersonId, treeId),

    canViewPerson: (targetPersonId) =>
      checkPermission(userId, userRole, ACTIONS.VIEW_PERSON, targetPersonId, treeId),

    canCreateStory: (targetPersonId) =>
      checkPermission(userId, userRole, ACTIONS.CREATE_STORY, targetPersonId, treeId),

    canEditStory: (targetPersonId, contentCreatorId) =>
      checkPermission(userId, userRole, ACTIONS.EDIT_STORY, targetPersonId, treeId, contentCreatorId),

    canDeleteStory: (targetPersonId, contentCreatorId) =>
      checkPermission(userId, userRole, ACTIONS.DELETE_STORY, targetPersonId, treeId, contentCreatorId),

    canCreateTree: () =>
      checkPermission(userId, userRole, ACTIONS.CREATE_TREE, null, null),

    canManageMembers: () =>
      checkPermission(userId, userRole, ACTIONS.MANAGE_MEMBERS, null, treeId),

    canManageInvites: () =>
      checkPermission(userId, userRole, ACTIONS.MANAGE_INVITES, null, treeId),

    canExportTree: () =>
      checkPermission(userId, userRole, ACTIONS.EXPORT_TREE, null, treeId),
  };
}
