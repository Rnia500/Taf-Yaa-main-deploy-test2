// src/services/transcribeService.js
// Taf'Yaa — Transcribe Service (v3 - dual engine)
// AWS Transcribe → main languages (EN, FR, AR, ES, DE, PT)
// OpenAI Whisper → African languages (HA, YO, SW, AM, ZU, IG, SO)

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

// Convert audio blob to base64
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// AWS Transcribe languages
const AWS_LANGUAGES = new Set(['en', 'fr', 'ar', 'es', 'de', 'pt']);

// OpenAI Whisper languages (African + others)
const WHISPER_LANGUAGES = new Set(['ha', 'yo', 'sw', 'am', 'zu', 'ig', 'so']);

export const transcribeService = {

  // Main process function — picks engine automatically based on language
  async processAudio({ audioBlob, userId, treeId, personId, language = 'en', engine, onProgress }) {
    checkConfig();

    // Determine which engine to use
    const useEngine = engine ||
      (AWS_LANGUAGES.has(language) ? 'aws' :
       WHISPER_LANGUAGES.has(language) ? 'whisper' : 'aws');

    // Convert audio to base64
    onProgress?.('Preparing audio…', 15);
    const audioBase64 = await blobToBase64(audioBlob);
    const fileType = audioBlob.type || 'audio/webm';
    const ext = fileType.includes('mp3') ? 'mp3' :
                fileType.includes('wav') ? 'wav' : 'webm';

    onProgress?.(`Uploading and transcribing with ${useEngine === 'whisper' ? 'OpenAI Whisper' : 'AWS Transcribe'}…`, 40);

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
        engine: useEngine,
      }),
    });

    onProgress?.('Done!', 100);
    return result;
  },

  // All supported languages
  languages: [
    // AWS Transcribe
    { code: 'en', name: 'English',    flag: '🇬🇧', engine: 'aws'     },
    { code: 'fr', name: 'French',     flag: '🇫🇷', engine: 'aws'     },
    { code: 'ar', name: 'Arabic',     flag: '🇸🇦', engine: 'aws'     },
    { code: 'es', name: 'Spanish',    flag: '🇪🇸', engine: 'aws'     },
    { code: 'de', name: 'German',     flag: '🇩🇪', engine: 'aws'     },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷', engine: 'aws'     },
    // OpenAI Whisper (African)
    { code: 'ha', name: 'Hausa',      flag: '🌍', engine: 'whisper'  },
    { code: 'yo', name: 'Yoruba',     flag: '🌍', engine: 'whisper'  },
    { code: 'sw', name: 'Swahili',    flag: '🌍', engine: 'whisper'  },
    { code: 'am', name: 'Amharic',    flag: '🌍', engine: 'whisper'  },
    { code: 'zu', name: 'Zulu',       flag: '🌍', engine: 'whisper'  },
    { code: 'ig', name: 'Igbo',       flag: '🌍', engine: 'whisper'  },
    { code: 'so', name: 'Somali',     flag: '🌍', engine: 'whisper'  },
    // Manual fallback
    { code: 'ff', name: 'Fulfulde',   flag: '🌍', engine: 'manual'  },
    { code: 'bm', name: 'Bambara',    flag: '🌍', engine: 'manual'  },
    { code: 'ln', name: 'Lingala',    flag: '🌍', engine: 'manual'  },
  ],
};