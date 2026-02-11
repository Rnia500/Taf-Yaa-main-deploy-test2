import { generateId } from '../utils/personUtils/idGenerator.js';

export const mediaService = {
  async uploadFileToCloudinary(file) {
    // Step 1: Ask Netlify for signature
    const sigRes = await fetch("/.netlify/functions/upload-media", { method: "POST" });
    if (!sigRes.ok) {
      throw new Error('Failed to get upload signature');
    }
    const { timestamp, signature, cloudName, apiKey, folder } = await sigRes.json();

    // Step 2: Send file directly to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    return data;
  },

  async uploadMedia(file, treeId, personId, userId, options = {}) {
    try {
      // Validate that file is an image
      if (!file.type.startsWith('image/')) {
        throw new Error('uploadMedia only accepts image files');
      }

      // Upload file directly to Cloudinary using signature
      const uploadResult = await this.uploadFileToCloudinary(file);

      // Store reference in Firestore via Netlify function
      const storeResponse = await fetch('/.netlify/functions/manage-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
          resource_type: uploadResult.resource_type,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          width: uploadResult.width,
          height: uploadResult.height,
          duration: uploadResult.duration,
          treeId,
          personId,
          role: options.role || 'profile',
          title: options.title || null,
          subTitle: options.subTitle || null,
          description: options.description || null,
          tags: options.tags || [],
          uploadedBy: userId,
          visibility: options.visibility || 'public',
          source: options.source || null,
        }),
      });

      if (!storeResponse.ok) {
        throw new Error('Failed to store media reference');
      }

      const storeResult = await storeResponse.json();
      return storeResult.data;

    } catch (error) {
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  },

  async uploadAttachment(file, treeId, personId, userId, _options = {}) {
    try {
      // Validate that file is image, audio, video, or PDF
      const validTypes = ['image/', 'audio/', 'video/', 'application/pdf'];
      if (!validTypes.some(type => file.type.startsWith(type) || file.type === 'application/pdf')) {
        throw new Error('uploadAttachment only accepts image, audio, video, or PDF files');
      }

      // Upload file directly to Cloudinary using signature
      const uploadResult = await this.uploadFileToCloudinary(file);

      // Determine type based on resource_type and format
      let type = 'image';
      if (uploadResult.resource_type === 'video') {
        if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm'].includes(uploadResult.format)) {
          type = 'audio';
        } else {
          type = 'video';
        }
      } else if (uploadResult.resource_type === 'raw' && uploadResult.format === 'pdf') {
        type = 'pdf';
      }

      // Return attachment object
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

  async uploadStory(file, treeId, personId, userId, options = {}) {
    try {
      // Validate that file is image, audio, or video
      const validTypes = ['image/', 'audio/', 'video/'];
      if (!validTypes.some(type => file.type.startsWith(type))) {
        throw new Error('uploadStory only accepts image, audio, or video files');
      }

      // Upload file directly to Cloudinary using signature
      const uploadResult = await this.uploadFileToCloudinary(file);

      // Store reference in Firestore via Netlify function
      const storeResponse = await fetch('/.netlify/functions/manage-stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          treeId,
          personId,
          title: options.title || null,
          subTitle: options.subTitle || null,
          description: options.description || null,
          tags: options.tags || [],
          attachments: [{
            attachmentId: generateId('attachment'),
            url: uploadResult.secure_url,
            type: uploadResult.resource_type === 'video' ?
              (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm'].includes(uploadResult.format) ? 'audio' : 'video') :
              'image',
            caption: options.caption || null,
            cloudinaryId: uploadResult.public_id,
            format: uploadResult.format,
            size: uploadResult.bytes,
            duration: uploadResult.duration,
            width: uploadResult.width,
            height: uploadResult.height,
            uploadedBy: userId
          }],
          createdBy: userId,
          visibility: options.visibility || 'public',
          isPinned: options.isPinned || false,
          linkedPersons: options.linkedPersons || [],
        }),
      });

      if (!storeResponse.ok) {
        throw new Error('Failed to store story reference');
      }

      const storeResult = await storeResponse.json();
      return storeResult.data;

    } catch (error) {
      throw new Error(`Failed to upload story: ${error.message}`);
    }
  },

  // Get media by ID
  async getMedia(mediaId) {
    try {
      const response = await fetch(`/.netlify/functions/manage-media/${mediaId}`);

      if (!response.ok) {
        throw new Error('Media not found');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      throw new Error(`Failed to get media: ${error.message}`);
    }
  },

  // Delete media
  async deleteMedia(mediaId) {
    try {
      const response = await fetch(`/.netlify/functions/manage-media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Failed to delete media: ${error.message}`);
    }
  }
};
