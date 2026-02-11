// src/utils/audioValidator.js

/**
 * Validate audio file type and size.
 * 
 * @param {File} file - The file to validate.
 * @param {Object} options - Validation options.
 * @param {string[]} [options.allowedTypes] - Allowed MIME types.
 * @param {number} [options.maxSizeMB] - Max file size in MB.
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateAudioFile(file, options = {}) {
  const {
    allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm"],
    maxSizeMB = 50,
  } = options;

  if (!file) {
    return { valid: false, error: "No file selected" };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}` };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File exceeds ${maxSizeMB}MB limit` };
  }

  return { valid: true };
}
