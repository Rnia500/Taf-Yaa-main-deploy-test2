import { generateId } from "../../utils/personUtils/idGenerator";

export interface Media {
  id: string;
  cloudinaryId: string;
  url: string;
  type: "image";

  // Context & Relationships
  treeId: string;
  personId?: string | null;
  storyId?: string | null;
  role: "profile" | "story" | "tree-banner" | "memory" | "gallery" | "placeholder";

  // Metadata
  title?: string;
  subTitle?: string;
  description?: string;
  tags?: string[];
  format: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number | null;
  resourceType: string;

  // Uploader Info
  uploadedBy: string;
  uploadedAt: any; // Firestore Timestamp
  visibility: "public" | "private";

  // Optional Reference Source
  source?: {
    fromStory: boolean;
    storyId?: string;
  };

  // Maintenance
  deleted: boolean;
  deletedAt?: any | null; // Firestore Timestamp
}

//  Helpers 

/** Factory to create a new media object */
export const createMedia = (params: {
  treeId: string;
  personId?: string | null;
  storyId?: string | null;
  role: "profile" | "story" | "tree-banner" | "memory" | "gallery" | "placeholder";
  cloudinaryId: string;
  url: string;
  type: "image";
  title?: string;
  subTitle?: string;
  description?: string;
  tags?: string[];
  format: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number | null;
  resourceType: string;
  uploadedBy: string;
  visibility: "public" | "private";
  source?: {
    fromStory: boolean;
    storyId?: string;
  };
}): Media => {
  return {
    id: generateId("media"),
    treeId: params.treeId,
    personId: params.personId || null,
    storyId: params.storyId || null,
    role: params.role,
    cloudinaryId: params.cloudinaryId,
    url: params.url,
    type: "image",
    title: params.title,
    subTitle: params.subTitle,
    description: params.description,
    tags: params.tags || [],
    format: params.format,
    size: params.size,
    width: params.width,
    height: params.height,
    duration: params.duration || null,
    resourceType: params.resourceType,
    uploadedBy: params.uploadedBy,
    visibility: params.visibility,
    source: params.source,
    uploadedAt: null, // Will be set by Firestore
    deleted: false,
    deletedAt: null,
  };
};

/** Check if media is an image */
export const isImage = (media: Media): boolean => media.type === "image";

/** Get media dimensions as string */
export const getDimensions = (media: Media): string | null => {
  if (media.width && media.height) {
    return `${media.width}x${media.height}`;
  }
  return null;
};
