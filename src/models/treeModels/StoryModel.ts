import { generateId } from "../../utils/personUtils/idGenerator";

export interface MediaLink {
  mediaId: string;
  url: string;
  type: "image";
  caption?: string;
}

export interface StoryAttachment {
  attachmentId: string;
  url: string;
  type: "image" | "video" | "audio";
  caption?: string;
  cloudinaryId?: string;
  format?: string;
  size?: number;
  duration?: number;
  uploadedBy: string;
}

export interface Story {
  id: string;
  treeId: string;
  personId?: string; // Optional: whose story it is
  title: string;
  location?: string;
  description?: string;
  tags?: string[];

  // Media attachments (can be images, audio, or video)
  attachments?: StoryAttachment[];

  // Author Info
  createdBy: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  visibility: "public" | "private";

  // Contributors - list of user IDs who contributed to this story
  contributors?: string[];

  // Optional
  isPinned?: boolean; // Featured story
  linkedPersons?: string[]; // For group memories

  // Deletion metadata for soft/cascade delete with undo (keeping for compatibility)
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletionMode?: "soft" | "cascade" | null;
  pendingDeletion?: boolean;
  undoExpiresAt?: string | null;
  deletionBatchId?: string | null;
}

//  Helpers 

/** Format the story date for UI */
export const formatStoryDate = (story: Story, locale = "en-US"): string => {
  const date = story.createdAt?.toDate ? story.createdAt.toDate() : new Date(story.createdAt || Date.now());
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/** Check if story has attachments */
export const hasAttachments = (story: Story): boolean => !!(story.attachments && story.attachments.length > 0);

/** Check if story has images */
export const hasImages = (story: Story): boolean =>
  !!(story.attachments && story.attachments.some(a => a.type === "image"));

/** Check if story has audio */
export const hasAudio = (story: Story): boolean =>
  !!(story.attachments && story.attachments.some(a => a.type === "audio"));

/** Check if story has video */
export const hasVideo = (story: Story): boolean =>
  !!(story.attachments && story.attachments.some(a => a.type === "video"));

/** Factory to create a new story */
export const createStory = (params: {
  treeId: string;
  personId?: string;
  title: string;
  location?: string;
  description?: string;
  attachments?: StoryAttachment[];
  createdBy: string;
  visibility?: "public" | "private";
  tags?: string[];
  isPinned?: boolean;
  linkedPersons?: string[];
}): Story => {
  // Calculate contributors from createdBy and attachment uploaders
  const contributors = new Set<string>();
  contributors.add(params.createdBy);

  if (params.attachments) {
    params.attachments.forEach(attachment => {
      if (attachment.uploadedBy) {
        contributors.add(attachment.uploadedBy);
      }
    });
  }

  const result: any = {
    id: generateId("story"),
    treeId: params.treeId,
    title: params.title,
    attachments: params.attachments || [],
    createdBy: params.createdBy,
    contributors: Array.from(contributors),
    visibility: params.visibility || "public",
    tags: params.tags || [],
    isPinned: params.isPinned || false,
    linkedPersons: params.linkedPersons || [],
    // Deletion metadata defaults
    isDeleted: false,
    deletedAt: null,
    deletionMode: null,
    pendingDeletion: false,
    undoExpiresAt: null,
    deletionBatchId: null,
    createdAt: null, // Will be set by Firestore
    updatedAt: null, // Will be set by Firestore
  };

  if (params.personId != null) result.personId = params.personId;
  if (params.location != null) result.location = params.location;
  if (params.description != null) result.description = params.description;

  return result as Story;
};

/** Quick tag adder */
export const addTag = (story: Story, tag: string): Story => {
  return {
    ...story,
    tags: [...(story.tags || []), tag],
    updatedAt: new Date(), // update timestamp on change
  };
};

/** Add attachment to story */
export const addAttachmentToStory = (story: Story, attachment: StoryAttachment): Story => {
  const newAttachments = [...(story.attachments || []), attachment];
  const contributors = new Set(story.contributors || []);
  contributors.add(attachment.uploadedBy);

  return {
    ...story,
    attachments: newAttachments,
    contributors: Array.from(contributors),
    updatedAt: new Date(),
  };
};
