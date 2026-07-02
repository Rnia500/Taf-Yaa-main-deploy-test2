import { generateId } from '../utils/personUtils/idGenerator.js';
import { mediaServiceFirebase } from './data/mediaServiceFirebase.js';
import { storyServiceFirebase } from './data/storyServiceFirebase.js';
import { createMedia } from '../models/treeModels/MediaModel';
import { createStory } from '../models/treeModels/StoryModel';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const mediaService = {
  // Uploads directly to Cloudinary using an unsigned preset — no backend involved
  async uploadFileToCloudinary(file, folder) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    if (folder) formData.append('folder', folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    return data;
  },

  // getMediaByPersonId / getMediaByRole already query against.
  async uploadMedia(file, treeId, personId, userId, options = {}) {
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('uploadMedia only accepts image files');
      }

      // A few callers (addSpouse, addParent, addChild, EditPersonController) pass
      const opts = typeof options === 'string' ? { role: options } : options;

      const uploadResult = await this.uploadFileToCloudinary(file, `trees/${treeId}/media`);

      const media = createMedia({
        treeId,
        personId: personId || null,
        role: opts.role || 'profile',
        cloudinaryId: uploadResult.public_id,
        url: uploadResult.secure_url,
        type: 'image',
        title: opts.title,
        subTitle: opts.subTitle,
        description: opts.description,
        tags: opts.tags || [],
        format: uploadResult.format,
        size: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        resourceType: uploadResult.resource_type,
        uploadedBy: userId,
        visibility: opts.visibility || 'public',
        source: opts.source,
      });

      return await mediaServiceFirebase.addMedia(media);
    } catch (error) {
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  },

  // Callers (PhotoUploadModal, AddAttachmentModal, MediaAttachment, AudioUploadCard)
  async uploadAttachment(file, treeId, personId, userId, _options = {}) {
    try {
      const validTypes = ['image/', 'audio/', 'video/', 'application/pdf'];
      if (!validTypes.some(type => file.type.startsWith(type) || file.type === 'application/pdf')) {
        throw new Error('uploadAttachment only accepts image, audio, video, or PDF files');
      }

      const uploadResult = await this.uploadFileToCloudinary(file, `trees/${treeId}/attachments`);

      let type = 'image';
      if (uploadResult.resource_type === 'video') {
        type = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm'].includes(uploadResult.format)
          ? 'audio'
          : 'video';
      } else if (uploadResult.resource_type === 'raw' && uploadResult.format === 'pdf') {
        type = 'pdf';
      }

      return {
        url: uploadResult.secure_url,
        type,
        cloudinaryId: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes,
        duration: uploadResult.duration,
        width: uploadResult.width,
        height: uploadResult.height,
      };
    } catch (error) {
      throw new Error(`Failed to upload attachment: ${error.message}`);
    }
  },

  // Uploads an audio/image/video file and creates a complete Story for it via
  // the existing createStory model + storyServiceFirebase.addStory (which also
  // handles permission checks and activity logging — the Netlify function never did).
  async uploadStory(file, treeId, personId, userId, options = {}) {
    try {
      const validTypes = ['image/', 'audio/', 'video/'];
      if (!validTypes.some(type => file.type.startsWith(type))) {
        throw new Error('uploadStory only accepts image, audio, or video files');
      }

      const uploadResult = await this.uploadFileToCloudinary(file, `trees/${treeId}/stories`);

      const attachmentType = uploadResult.resource_type === 'video'
        ? (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm'].includes(uploadResult.format) ? 'audio' : 'video')
        : 'image';

      const attachment = {
        attachmentId: generateId('attachment'),
        url: uploadResult.secure_url,
        type: attachmentType,
        caption: options.caption || null,
        cloudinaryId: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes,
        duration: uploadResult.duration,
        width: uploadResult.width,
        height: uploadResult.height,
        uploadedBy: userId,
      };

      const story = createStory({
        treeId,
        personId: personId || undefined,
        title: options.title || 'Untitled Story',
        // Some callers pass subTitle, others pass location — both map to the
        // model's "location" field since Story has no subTitle of its own.
        location: options.location || options.subTitle || undefined,
        description: options.description || undefined,
        attachments: [attachment],
        createdBy: userId,
        visibility: options.visibility || 'public',
        tags: options.tags || [],
        isPinned: options.isPinned || false,
        linkedPersons: options.linkedPersons || [],
      });

      return await storyServiceFirebase.addStory(story);
    } catch (error) {
      throw new Error(`Failed to upload story: ${error.message}`);
    }
  },
};