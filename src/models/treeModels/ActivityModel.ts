// src/models/treeModels/ActivityModel.ts
import { generateId } from "../../utils/personUtils/idGenerator";

// Activity types enum for consistency
export const ACTIVITY_TYPES = {
  PERSON_ADDED: 'person_added',
  PERSON_EDITED: 'person_edited',
  PERSON_DELETED: 'person_deleted',
  STORY_ADDED: 'story_added',
  STORY_EDITED: 'story_edited',
  STORY_DELETED: 'story_deleted',
  ATTACHMENT_ADDED: 'attachment_added',
  ROLE_CHANGED: 'role_changed',
  TREE_SETTINGS_EDITED: 'tree_settings_edited',
  INVITE_CREATED: 'invite_created',
  INVITE_EDITED: 'invite_edited',
  INVITE_REVOKED: 'invite_revoked',
} as const;

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

// Activity details interfaces for type safety
export interface PersonActivityDetails {
  personId: string;
  personName: string;
  personGender?: string;
  changedFields?: string[];
}

export interface StoryActivityDetails {
  storyId: string;
  storyTitle: string;
  storyContent?: string;
  changedFields?: string[];
}

export interface AttachmentActivityDetails {
  attachmentId: string;
  attachmentType: string;
  attachmentName: string;
  storyId: string;
  storyTitle: string;
}

export interface RoleChangeActivityDetails {
  targetUserId: string;
  targetUserName: string;
  oldRole: string;
  newRole: string;
}

export interface TreeSettingsActivityDetails {
  changedFields: string[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export interface InviteRevokedActivityDetails {
  inviteId: string;
  inviteCode: string;
  inviteType: string;
  inviteRole: string;
}

export interface InviteCreatedActivityDetails {
  inviteId: string;
  inviteCode: string;
  inviteType: string;
  inviteRole: string;
}

export interface InviteEditedActivityDetails {
  inviteId: string;
  inviteCode: string;
  inviteType: string;
  inviteRole: string;
  changedFields: string[];
}

export type ActivityDetails =
  | PersonActivityDetails
  | StoryActivityDetails
  | AttachmentActivityDetails
  | RoleChangeActivityDetails
  | TreeSettingsActivityDetails
  | InviteRevokedActivityDetails
  | InviteCreatedActivityDetails
  | InviteEditedActivityDetails;

export interface Activity {
  id: string;
  treeId: string;
  userId: string;
  userName: string;
  activityType: ActivityType;
  details: ActivityDetails;
  timestamp: Date;
  createdAt: string;
  updatedAt: string;
}

// Helper functions for activity creation
export function createActivity(input: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Activity {
  const id = input.id || generateId("activity");
  const now = new Date().toISOString();

  return {
    id,
    treeId: input.treeId,
    userId: input.userId,
    userName: input.userName,
    activityType: input.activityType,
    details: input.details,
    timestamp: input.timestamp || new Date(),
    createdAt: now,
    updatedAt: now,
  };
}

// Activity type validation
export function isValidActivityType(type: string): type is ActivityType {
  return Object.values(ACTIVITY_TYPES).includes(type as ActivityType);
}

// Get activity icon based on type
export function getActivityIcon(activityType: ActivityType): string {
  switch (activityType) {
    case ACTIVITY_TYPES.PERSON_ADDED:
    case ACTIVITY_TYPES.PERSON_EDITED:
    case ACTIVITY_TYPES.PERSON_DELETED:
      return '👤';
    case ACTIVITY_TYPES.STORY_ADDED:
    case ACTIVITY_TYPES.STORY_EDITED:
    case ACTIVITY_TYPES.STORY_DELETED:
      return '📖';
    case ACTIVITY_TYPES.ATTACHMENT_ADDED:
      return '📎';
    case ACTIVITY_TYPES.ROLE_CHANGED:
      return '👑';
    case ACTIVITY_TYPES.TREE_SETTINGS_EDITED:
      return '⚙️';
    case ACTIVITY_TYPES.INVITE_CREATED:
    case ACTIVITY_TYPES.INVITE_EDITED:
    case ACTIVITY_TYPES.INVITE_REVOKED:
      return '📨';
    default:
      return '📝';
  }
}

// Get activity description based on type and details
export function getActivityDescription(activity: Activity): string {
  const { activityType, details, userName } = activity;

  switch (activityType) {
    case ACTIVITY_TYPES.PERSON_ADDED:
      const personDetails = details as PersonActivityDetails;
      return `${userName} added a new person: ${personDetails.personName}`;
    case ACTIVITY_TYPES.PERSON_EDITED:
      const editDetails = details as PersonActivityDetails;
      return `${userName} edited person: ${editDetails.personName}`;
    case ACTIVITY_TYPES.PERSON_DELETED:
      const deleteDetails = details as PersonActivityDetails;
      return `${userName} deleted person: ${deleteDetails.personName}`;
    case ACTIVITY_TYPES.STORY_ADDED:
      const storyDetails = details as StoryActivityDetails;
      return `${userName} added a new story: "${storyDetails.storyTitle}"`;
    case ACTIVITY_TYPES.STORY_EDITED:
      const storyEditDetails = details as StoryActivityDetails;
      return `${userName} edited story: "${storyEditDetails.storyTitle}"`;
    case ACTIVITY_TYPES.STORY_DELETED:
      const storyDeleteDetails = details as StoryActivityDetails;
      return `${userName} deleted story: "${storyDeleteDetails.storyTitle}"`;
    case ACTIVITY_TYPES.ATTACHMENT_ADDED:
      const attachmentDetails = details as AttachmentActivityDetails;
      return `${userName} added an attachment to story: "${attachmentDetails.storyTitle}"`;
    case ACTIVITY_TYPES.ROLE_CHANGED:
      const roleDetails = details as RoleChangeActivityDetails;
      return `${userName} changed ${roleDetails.targetUserName}'s role from ${roleDetails.oldRole} to ${roleDetails.newRole}`;
    case ACTIVITY_TYPES.TREE_SETTINGS_EDITED:
      const settingsDetails = details as TreeSettingsActivityDetails;
      return `${userName} updated tree settings: ${settingsDetails.changedFields.join(', ')}`;
    case ACTIVITY_TYPES.INVITE_CREATED:
      const inviteCreatedDetails = details as InviteCreatedActivityDetails;
      return `${userName} created invite: ${inviteCreatedDetails.inviteCode} (${inviteCreatedDetails.inviteType} - ${inviteCreatedDetails.inviteRole})`;
    case ACTIVITY_TYPES.INVITE_EDITED:
      const inviteEditedDetails = details as InviteEditedActivityDetails;
      return `${userName} edited invite: ${inviteEditedDetails.inviteCode} (${inviteEditedDetails.inviteType} - ${inviteEditedDetails.inviteRole})`;
    case ACTIVITY_TYPES.INVITE_REVOKED:
      const inviteRevokedDetails = details as InviteRevokedActivityDetails;
      return `${userName} revoked invite: ${inviteRevokedDetails.inviteCode} (${inviteRevokedDetails.inviteType} - ${inviteRevokedDetails.inviteRole})`;
    default:
      return `${userName} performed an action: ${activityType}`;
  }
}

// Get activity variant for styling
export function getActivityVariant(activityType: ActivityType): 'person' | 'story' | 'attachment' | 'role' | 'settings' | 'invite' {
  switch (activityType) {
    case ACTIVITY_TYPES.PERSON_ADDED:
    case ACTIVITY_TYPES.PERSON_EDITED:
    case ACTIVITY_TYPES.PERSON_DELETED:
      return 'person';
    case ACTIVITY_TYPES.STORY_ADDED:
    case ACTIVITY_TYPES.STORY_EDITED:
    case ACTIVITY_TYPES.STORY_DELETED:
      return 'story';
    case ACTIVITY_TYPES.ATTACHMENT_ADDED:
      return 'attachment';
    case ACTIVITY_TYPES.ROLE_CHANGED:
      return 'role';
    case ACTIVITY_TYPES.TREE_SETTINGS_EDITED:
      return 'settings';
    case ACTIVITY_TYPES.INVITE_CREATED:
    case ACTIVITY_TYPES.INVITE_EDITED:
    case ACTIVITY_TYPES.INVITE_REVOKED:
      return 'invite';
    default:
      return 'person';
  }
}
