// src/utils/fileUtils.js

// Convert File/Blob to base64 DataURL
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof Blob)) {
      return reject(new Error("Invalid file: must be a File or Blob"));
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Extract file extension
export function getFileExtension(name = "") {
  return name.includes(".") ? name.split(".").pop().toLowerCase() : "";
}

// Quick type guards
export function isImage(file) {
  return file?.type?.startsWith("image/");
}
export function isAudio(file) {
  return file?.type?.startsWith("audio/");
}
export function isPdf(file) {
  return file?.type === "application/pdf";
}
export function isVideo(file) {
  return file?.type?.startsWith("video/");
}
