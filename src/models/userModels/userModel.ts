// src/models/treeModels/UserModel.ts
import { generateId } from "../../utils/personUtils/idGenerator";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  profilePhoto?: string | null;
  linkedPersonId?: string | null;

  preferences: {
    language: string; // Consider ISO code
    darkMode: boolean;
    treeDefaultView?: "radial" | "vertical" | "horizontal" | string;
    notificationEnabled?: boolean;
    [key: string]: any; // For future extensibility
  };

  invitedBy?: string | null;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

/** Create a new User object with sensible defaults */
export function createUser(input: Partial<User>): User {
  const now = new Date().toISOString();
  return {
    uid: input.uid || generateId("user"),
    email: input.email || "",
    displayName: input.displayName || "Unknown",
    profilePhoto: input.profilePhoto || null,
    linkedPersonId: input.linkedPersonId || null,
    preferences: {
      language: input.preferences?.language || "en",
      darkMode: input.preferences?.darkMode ?? false,
      treeDefaultView: input.preferences?.treeDefaultView || "radial",
      notificationEnabled: input.preferences?.notificationEnabled ?? true,
      ...input.preferences,
    },
    invitedBy: input.invitedBy || null,
    lastLogin: input.lastLogin || null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    isActive: input.isActive ?? true,
    isDeleted: input.isDeleted || false,
    deletedAt: input.deletedAt || null,
  };
}
