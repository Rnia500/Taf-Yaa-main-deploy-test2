import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkPermission, ACTIONS } from '../utils/permissions';
import { useUserRole } from './useUserRole';

export const usePermissions = (treeId) => {
  const { currentUser } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole(treeId);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading) return;

    const checkAllPermissions = async () => {
      setLoading(true);

      try {
        const permissionChecks = {
          canCreatePerson: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.CREATE_PERSON,
            null,
            treeId
          ),
          canEditPerson: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.EDIT_PERSON,
            null,
            treeId
          ),
          canDeletePerson: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.DELETE_PERSON,
            null,
            treeId
          ),
          canCreateStory: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.CREATE_STORY,
            null,
            treeId
          ),
          canEditStory: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.EDIT_STORY,
            null,
            treeId
          ),
          canDeleteStory: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.DELETE_STORY,
            null,
            treeId
          ),
          canCreateEvent: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.CREATE_EVENT,
            null,
            treeId
          ),
          canEditEvent: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.EDIT_EVENT,
            null,
            treeId
          ),
          canDeleteEvent: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.DELETE_EVENT,
            null,
            treeId
          ),
          canCreateTree: await checkPermission(
            currentUser?.uid || "anonymous",
            null,
            ACTIONS.CREATE_TREE,
            null,
            null
          ),
          canInviteUsers: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.INVITE_USERS,
            null,
            treeId
          ),
          canManageRoles: await checkPermission(
            currentUser?.uid || "anonymous",
            userRole,
            ACTIONS.MANAGE_ROLES,
            null,
            treeId
          ),
        };

        setPermissions(permissionChecks);
      } catch (error) {

        // Set all permissions to false on error
        setPermissions({
          canCreatePerson: { allowed: false },
          canEditPerson: { allowed: false },
          canDeletePerson: { allowed: false },
          canCreateStory: { allowed: false },
          canEditStory: { allowed: false },
          canDeleteStory: { allowed: false },
          canCreateEvent: { allowed: false },
          canEditEvent: { allowed: false },
          canDeleteEvent: { allowed: false },
          canCreateTree: { allowed: false },
          canInviteUsers: { allowed: false },
          canManageRoles: { allowed: false },
        });
      } finally {
        setLoading(false);
      }
    };

    checkAllPermissions();
  }, [currentUser, userRole, treeId, roleLoading]);

  return { permissions, loading, userRole };
};

// Hook for checking a specific permission
export const usePermission = (action, targetPersonId = null, treeId = null, contentCreatorId = null) => {
  const { currentUser } = useAuth();
  const { userRole } = useUserRole(treeId);
  const [permission, setPermission] = useState({ allowed: false, reason: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSpecificPermission = async () => {
      setLoading(true);
      try {
        const result = await checkPermission(
          currentUser?.uid || "anonymous",
          userRole,
          action,
          targetPersonId,
          treeId,
          contentCreatorId
        );
        setPermission(result);
      } catch (error) {
        console.error('Error checking permission:', error);
        setPermission({ allowed: false, reason: 'Error checking permission' });
      } finally {
        setLoading(false);
      }
    };

    checkSpecificPermission();
  }, [currentUser, userRole, action, targetPersonId, treeId, contentCreatorId]);

  return { permission, loading };
};
