// Taf'Yaa — Hybrid Transcription Service
// Routes automatically: AWS Transcribe for major languages, OpenAI Whisper for African languages

const API_URL = import.meta.env.VITE_TRANSCRIBE_API_URL || '/api/transcribe';

// Languages that go to OpenAI Whisper (African + underrepresented)
const WHISPER_LANGUAGES = new Set(['ha', 'yo', 'ig', 'ff', 'am', 'zu', 'ln', 'wo', 'so', 'sn', 'xh', 'mg']);

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await res.text();
  if (!text) throw new Error('No response from server.');
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Invalid response: ${text.slice(0, 100)}`); }
  if (!res.ok) throw new Error(data.error || data.message || 'Transcription request failed');
  return data;
}

export const transcribeService = {

  async processAudio({ audioBlob, userId, treeId, personId, language = 'en', onProgress }) {
    if (!API_URL) throw new Error('Transcription API URL not configured.');

    onProgress?.('Preparing audio…', 15);
    const audioBase64 = await blobToBase64(audioBlob);
    const fileType = audioBlob.type || 'audio/webm';

    const isAfricanLang = WHISPER_LANGUAGES.has(language);
    const progressLabel = isAfricanLang
      ? 'Transcribing with Whisper AI…'
      : 'Transcribing with AWS…';

    onProgress?.(progressLabel, 40);

    const result = await apiFetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ audioBase64, fileType, language, userId, treeId, personId }),
    });

    onProgress?.('Done!', 100);
    return result;
  },

  // All supported languages with provider info
  languages: [
    // ── Major world languages (AWS Transcribe) ──────────────────────────────
    { code: 'en', label: 'English',    flag: '🌍', provider: 'aws',     group: 'global' },
    { code: 'fr', label: 'French',     flag: '🇫🇷', provider: 'aws',     group: 'global' },
    { code: 'ar', label: 'Arabic',     flag: '🌙', provider: 'aws',     group: 'global' },
    { code: 'es', label: 'Spanish',    flag: '🇪🇸', provider: 'aws',     group: 'global' },
    { code: 'pt', label: 'Portuguese', flag: '🇵🇹', provider: 'aws',     group: 'global' },
    { code: 'de', label: 'German',     flag: '🇩🇪', provider: 'aws',     group: 'global' },

    // ── African languages (OpenAI Whisper) ──────────────────────────────────
    { code: 'sw', label: 'Swahili',    flag: '🌍', provider: 'aws',     group: 'african', region: 'East Africa' },
    { code: 'ha', label: 'Hausa',      flag: '🌍', provider: 'whisper', group: 'african', region: 'West & Central Africa' },
    { code: 'yo', label: 'Yoruba',     flag: '🌍', provider: 'whisper', group: 'african', region: 'West Africa' },
    { code: 'ig', label: 'Igbo',       flag: '🌍', provider: 'whisper', group: 'african', region: 'West Africa' },
    { code: 'ff', label: 'Fulfulde',   flag: '🌍', provider: 'whisper', group: 'african', region: 'Central & West Africa' },
    { code: 'am', label: 'Amharic',    flag: '🌍', provider: 'whisper', group: 'african', region: 'East Africa' },
    { code: 'zu', label: 'Zulu',       flag: '🌍', provider: 'whisper', group: 'african', region: 'Southern Africa' },
    { code: 'xh', label: 'Xhosa',      flag: '🌍', provider: 'whisper', group: 'african', region: 'Southern Africa' },
    { code: 'sn', label: 'Shona',      flag: '🌍', provider: 'whisper', group: 'african', region: 'Southern Africa' },
    { code: 'ln', label: 'Lingala',    flag: '🌍', provider: 'whisper', group: 'african', region: 'Central Africa' },
    { code: 'wo', label: 'Wolof',      flag: '🌍', provider: 'whisper', group: 'african', region: 'West Africa' },
    { code: 'so', label: 'Somali',     flag: '🌍', provider: 'whisper', group: 'african', region: 'East Africa' },
  ],

  isAfricanLanguage(code) { return WHISPER_LANGUAGES.has(code); },
  getProvider(code) { return WHISPER_LANGUAGES.has(code) ? 'whisper' : 'aws'; },
};