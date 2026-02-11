// src/models/fileUploadModel.js
import { generateId } from "../../utils/personUtils/idGenerator";

// Allowed file types (extend as needed)
const VALID_TYPES = ["image", "audio", "pdf", "video", "generic"];

export function createFileUpload({ id, name, dataUrl }, type = "generic") {
  if (!VALID_TYPES.includes(type)) {
    throw new Error(
      `Invalid file type: "${type}". Must be one of: ${VALID_TYPES.join(", ")}`
    );
  }

  return {
    id: id || generateId("file"),
    name: name || "untitled",
    type,
    dataUrl, // base64 string (can be empty if failed)
    createdAt: new Date().toISOString(),
    synced: false, // for cloud tracking later
  };
}
