// src/services/transcribeService.js
// Taf'Yaa — AWS Transcribe Service (v2 - base64 approach, no direct S3 upload)
// Audio is sent as base64 directly to Lambda — no S3 CORS issues!

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
  if (!text) throw new Error('No response from server.');
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Invalid response: ${text.slice(0, 100)}`); }
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

// Convert audio blob to base64 string
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result is "data:audio/webm;base64,XXXXXX"
      // we only want the base64 part after the comma
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const transcribeService = {

  // Send audio blob as base64 to Lambda → Lambda uploads to S3 → transcribes
  async processAudio({ audioBlob, userId, treeId, personId, language = 'en', onProgress }) {
    checkConfig();

    // Step 1: Convert audio to base64
    onProgress?.('Preparing audio…', 15);
    const audioBase64 = await blobToBase64(audioBlob);
    const fileType = audioBlob.type || 'audio/webm';
    const ext = fileType.includes('mp3') ? 'mp3' :
                fileType.includes('wav') ? 'wav' : 'webm';

    // Step 2: Send everything to Lambda in one request
    onProgress?.('Uploading and transcribing…', 40);
    const result = await apiFetch(`${API_URL}?action=process`, {
      method: 'POST',
      body: JSON.stringify({
        audioBase64,
        fileType,
        fileName: `recording.${ext}`,
        userId,
        treeId,
        personId,
        language,
      }),
    });

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
