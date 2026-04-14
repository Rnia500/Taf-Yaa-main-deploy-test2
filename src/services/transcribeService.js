// src/services/transcribeService.js
// Taf'Yaa — AWS Transcribe Voice-to-Text Service

const API_URL = import.meta.env.VITE_TRANSCRIBE_API_URL || '';

function checkConfig() {
  if (!API_URL) throw new Error('VITE_TRANSCRIBE_API_URL not configured.');
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await res.text();
  if (!text) throw new Error('No response from transcribe server.');
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Invalid response: ${text.slice(0, 100)}`); }
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export const transcribeService = {

  // Step 1: Get a signed S3 URL to upload the audio blob
  async getUploadUrl({ userId, treeId, personId, fileName, fileType }) {
    checkConfig();
    return apiFetch(`${API_URL}?action=get-upload-url`, {
      method: 'POST',
      body: JSON.stringify({ userId, treeId, personId, fileName, fileType }),
    });
  },

  // Step 2: Upload audio blob directly to S3 using the signed URL
  async uploadAudioToS3(signedUrl, audioBlob) {
    const res = await fetch(signedUrl, {
      method: 'PUT',
      body: audioBlob,
      headers: { 'Content-Type': audioBlob.type || 'audio/webm' },
    });
    if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
  },

  // Step 3: Start transcription and wait for result
  async transcribe({ s3Key, userId, treeId, personId, language = 'en' }) {
    checkConfig();
    return apiFetch(`${API_URL}?action=transcribe`, {
      method: 'POST',
      body: JSON.stringify({ s3Key, userId, treeId, personId, language }),
    });
  },

  // Full pipeline: upload audio → transcribe → return text
  async processAudio({ audioBlob, userId, treeId, personId, language = 'en', onProgress }) {
    checkConfig();

    // Step 1: Get upload URL
    onProgress?.('Preparing upload…', 10);
    const ext = audioBlob.type.includes('mp3') ? 'mp3' :
                audioBlob.type.includes('wav') ? 'wav' : 'webm';
    const { uploadUrl, s3Key } = await this.getUploadUrl({
      userId, treeId, personId,
      fileName: `recording.${ext}`,
      fileType: audioBlob.type,
    });

    // Step 2: Upload to S3
    onProgress?.('Uploading audio to cloud…', 35);
    await this.uploadAudioToS3(uploadUrl, audioBlob);

    // Step 3: Transcribe
    onProgress?.('Transcribing your voice…', 60);
    const result = await this.transcribe({ s3Key, userId, treeId, personId, language });

    onProgress?.('Done!', 100);
    return result;
  },

  // Supported languages
  languages: [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'French' },
    { code: 'ar', label: 'Arabic' },
    { code: 'es', label: 'Spanish' },
    { code: 'de', label: 'German' },
    { code: 'pt', label: 'Portuguese' },
  ],
};