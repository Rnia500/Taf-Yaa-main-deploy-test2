import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkPermission,
  getPermissionErrorMessage,
  usePermissions,
  ACTIONS,
  ACTION_ROLE_REQUIREMENTS
} from '../utils/permissions.js';

// Mock the lineageUtils functions
vi.mock('../utils/lineageUtils.js', () => ({
  canUserAccessPerson: vi.fn().mockResolvedValue(true),
  canUserAccessContent: vi.fn().mockResolvedValue(true)
}));

describe('Permission System Tests', () => {
  describe('checkPermission', () => {
    it('should allow admin to perform any action', async () => {
      const result = await checkPermission('user1', 'admin', ACTIONS.CREATE_PERSON);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('should allow moderator to perform moderator-level actions', async () => {
      const result = await checkPermission('user1', 'moderator', ACTIONS.EDIT_PERSON);
      expect(result.allowed).toBe(true);
    });

    it('should allow editor to perform editor-level actions', async () => {
      const result = await checkPermission('user1', 'editor', ACTIONS.CREATE_STORY);
      expect(result.allowed).toBe(true);
    });

    it('should allow viewer to perform viewer-level actions', async () => {
      const result = await checkPermission('user1', 'viewer', ACTIONS.VIEW_PERSON);
      expect(result.allowed).toBe(true);
    });

    it('should deny viewer from performing admin actions', async () => {
      const result = await checkPermission('user1', 'viewer', ACTIONS.DELETE_PERSON);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('This action requires admin permissions');
    });

    it('should deny editor from performing admin actions', async () => {
      const result = await checkPermission('user1', 'editor', ACTIONS.DELETE_TREE);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('This action requires admin permissions');
    });
  });

  describe('getPermissionErrorMessage', () => {
    it('should return appropriate message for insufficient role', () => {
      const result = { allowed: false, reason: 'This action requires moderator permissions', requiredRole: 'moderator' };
      const message = getPermissionErrorMessage(result);
      expect(message).toContain('moderator');
      expect(message).toContain('permissions');
    });

    it('should return appropriate message for lineage restriction', () => {
      const result = { allowed: false, reason: 'You can only perform this action on people in your lineage' };
      const message = getPermissionErrorMessage(result);
      expect(message).toContain('lineage');
    });

    it('should return appropriate message for content ownership', () => {
      const result = { allowed: false, reason: 'You can only edit or delete content you created' };
      const message = getPermissionErrorMessage(result);
      expect(message).toContain('content you created');
    });

    it('should return default message for unknown reason', () => {
      const result = { allowed: false, reason: 'unknown' };
      const message = getPermissionErrorMessage(result);
      expect(message).toContain('unknown');
    });
  });

  describe('ACTION_ROLE_REQUIREMENTS constant', () => {
    it('should contain all expected actions with correct role requirements', () => {
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.CREATE_PERSON);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.EDIT_PERSON);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.DELETE_PERSON);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.VIEW_PERSON);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.CREATE_STORY);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.EDIT_STORY);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.DELETE_STORY);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.VIEW_STORY);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.MANAGE_MEMBERS);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.MANAGE_INVITES);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.EXPORT_TREE);
      expect(ACTION_ROLE_REQUIREMENTS).toHaveProperty(ACTIONS.DELETE_TREE);
    });

    it('should have correct role requirements for admin actions', () => {
      expect(ACTION_ROLE_REQUIREMENTS[ACTIONS.DELETE_TREE]).toEqual(['admin']);
      expect(ACTION_ROLE_REQUIREMENTS[ACTIONS.MANAGE_MEMBERS]).toEqual(['admin', 'moderator']);
    });

    it('should have correct role requirements for editor actions', () => {
      expect(ACTION_ROLE_REQUIREMENTS[ACTIONS.CREATE_PERSON]).toContain('editor');
      expect(ACTION_ROLE_REQUIREMENTS[ACTIONS.CREATE_STORY]).toContain('editor');
    });

    it('should have correct role requirements for viewer actions', () => {
      expect(ACTION_ROLE_REQUIREMENTS[ACTIONS.VIEW_PERSON]).toContain('viewer');
      expect(ACTION_ROLE_REQUIREMENTS[ACTIONS.VIEW_STORY]).toContain('viewer');
    });
  });

  describe('ACTIONS constant', () => {
    it('should contain all expected actions', () => {
      expect(ACTIONS).toHaveProperty('CREATE_PERSON');
      expect(ACTIONS).toHaveProperty('EDIT_PERSON');
      expect(ACTIONS).toHaveProperty('DELETE_PERSON');
      expect(ACTIONS).toHaveProperty('VIEW_PERSON');
      expect(ACTIONS).toHaveProperty('CREATE_STORY');
      expect(ACTIONS).toHaveProperty('EDIT_STORY');
      expect(ACTIONS).toHaveProperty('DELETE_STORY');
      expect(ACTIONS).toHaveProperty('VIEW_STORY');
      expect(ACTIONS).toHaveProperty('MANAGE_MEMBERS');
      expect(ACTIONS).toHaveProperty('MANAGE_INVITES');
      expect(ACTIONS).toHaveProperty('EXPORT_TREE');
      expect(ACTIONS).toHaveProperty('DELETE_TREE');
    });
  });
});
