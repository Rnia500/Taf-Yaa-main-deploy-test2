// src/models/tree.ts
import { generateId } from "../../utils/personUtils/idGenerator";

export interface Tree {
  id: string;
  familyName: string;
  familyDescription: string;
  orgineTribe: string,
  origineTongue: string,
  origineHomeLand: string,
  familyPhoto?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  currentRootId?: string | null;

  roles: Record<string, "admin" | "moderator" | "editor" | "viewer">;

  members: Array<{
    userId: string;
    role: "admin" | "moderator" | "editor" | "viewer";
    joinedAt: string;
    banned?: boolean;
    banPeriod?: string | null; // ISO date string for ban expiration, null if permanent or not banned
    lastActive?: string;
  }>;
  memberUIDs: string[];

  
  settings: {
    privacy: {
      isPublic: boolean;
      allowMergeRequests: boolean;
      globalMatchOptIn: boolean;
      allowInvites:boolean;
      allowJoinRequests: boolean;
    };

    relationship: {
      allowPolygamy: boolean;
      allowMultipleMarriages: boolean;
      allowUnknownParentLinking: boolean;
      maxGenerationsDisplayed: number; 
    };

    display: {
      showRoleBadges: boolean;
      showGenderIcons: boolean;
      defaultRootPerson?: string | null;
    };

    language: {
      interfaceLanguage: string;      
      allowPerUserLanguageOverride: boolean;
    };

    lifeEvents: {
      birth: boolean;
      death: boolean;
      marriage: boolean;
      divorce: boolean;
      migration?: boolean;
      [key: string]: boolean | undefined;
    };

    limits: {
      maxStoryLength: number;          
      maxImageFileSize: string;        
      maxAudioFileSize: string;        
    };
  };
}

//  Factory 
export function createTree(input: Partial<Tree>): Tree {
  const id = input.id || generateId("tree");
  return {
    id,
    familyName: input.familyName || "Untitled Tree",
    createdBy: input.createdBy!,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString(),
    currentRootId: input.currentRootId || null,
    familyDescription: input.familyDescription || "No Description",
    orgineTribe: input.orgineTribe || "No tribe given",
    origineHomeLand: input.origineHomeLand || "No homeland given",
    origineTongue: input.origineTongue || "No mother tongue given",
    familyPhoto: input.familyPhoto || null,
    roles: input.roles || { [input.createdBy!]: "admin" },
    members: input.members || [],
    memberUIDs: input.memberUIDs || [input.createdBy!],

    settings: {
      privacy: {
        isPublic: input.settings?.privacy?.isPublic ?? false,
        allowMergeRequests: input.settings?.privacy?.allowMergeRequests ?? false,
        globalMatchOptIn: input.settings?.privacy?.globalMatchOptIn ?? false,
        allowInvites: input.settings?.privacy?.allowInvites || true,
        allowJoinRequests: input.settings?.privacy?.allowJoinRequests ?? false,
      },
      relationship: {
        allowPolygamy: input.settings?.relationship?.allowPolygamy ?? false,
        allowMultipleMarriages: input.settings?.relationship?.allowMultipleMarriages ?? true,
        allowUnknownParentLinking: input.settings?.relationship?.allowUnknownParentLinking ?? false,
        maxGenerationsDisplayed: input.settings?.relationship?.maxGenerationsDisplayed || 10,
      },
      display: {
        showRoleBadges: input.settings?.display?.showRoleBadges ?? true,
        showGenderIcons: input.settings?.display?.showGenderIcons ?? true,
        defaultRootPerson: input.settings?.display?.defaultRootPerson || null,
      },
      language: {
        interfaceLanguage: input.settings?.language?.interfaceLanguage || "en",
        allowPerUserLanguageOverride: input.settings?.language?.allowPerUserLanguageOverride ?? true,
      },
      lifeEvents: {
        birth: true,
        death: true,
        marriage: true,
        divorce: true,
        migration: false,
        ...(input.settings?.lifeEvents || {}),
      },
      limits: {
        maxStoryLength: input.settings?.limits?.maxStoryLength || 500,
        maxImageFileSize: input.settings?.limits?.maxImageFileSize || "2mb",
        maxAudioFileSize: input.settings?.limits?.maxAudioFileSize || "5mb",
      },
    },
  };
}
