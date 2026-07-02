const TRANSCRIBE_API = import.meta.env.VITE_TRANSCRIBE_API_URL;

export const RECORDING_LANGUAGES = {
  // AWS Transcribe — automatic voice to text
  "en-US": { name: "English", flag: "🇺🇸", engine: "aws", category: "auto" },
  "en-GB": { name: "English (UK)", flag: "🇬🇧", engine: "aws", category: "auto" },
  "fr-FR": { name: "French / Français", flag: "🇫🇷", engine: "aws", category: "auto" },
  "ar-SA": { name: "Arabic / عربي", flag: "🇸🇦", engine: "aws", category: "auto" },
  "ha-NG": { name: "Hausa", flag: "🇳🇬", engine: "aws", category: "african-aws" },
  "sw-KE": { name: "Swahili / Kiswahili", flag: "🇰🇪", engine: "aws", category: "african-aws" },
  "yo-NG": { name: "Yoruba", flag: "🇳🇬", engine: "aws", category: "african-aws" },
  "ig-NG": { name: "Igbo", flag: "🇳🇬", engine: "aws", category: "african-aws" },
  "pt-BR": { name: "Portuguese", flag: "🇧🇷", engine: "aws", category: "auto" },
  "es-US": { name: "Spanish", flag: "🇪🇸", engine: "aws", category: "auto" },
  "de-DE": { name: "German", flag: "🇩🇪", engine: "aws", category: "auto" },
  "am-ET": { name: "Amharic / አማርኛ", flag: "🇪🇹", engine: "aws", category: "african-aws" },

  // Manual transcription — user types after recording
  "ff":   { name: "Fulfulde", flag: "🌍", engine: "manual", category: "african-manual", region: "Cameroon/Niger/Nigeria" },
  "bas":  { name: "Bassa", flag: "🇨🇲", engine: "manual", category: "african-manual", region: "Cameroon" },
  "ewo":  { name: "Ewondo", flag: "🇨🇲", engine: "manual", category: "african-manual", region: "Cameroon" },
  "baf":  { name: "Bafia", flag: "🇨🇲", engine: "manual", category: "african-manual", region: "Cameroon" },
  "ybb":  { name: "Yemba (Bamileke)", flag: "🇨🇲", engine: "manual", category: "african-manual", region: "Cameroon" },
  "bum":  { name: "Bulu", flag: "🇨🇲", engine: "manual", category: "african-manual", region: "Cameroon" },
  "bm":   { name: "Bambara", flag: "🇲🇱", engine: "manual", category: "african-manual", region: "Mali/Guinea" },
  "ln":   { name: "Lingala", flag: "🇨🇩", engine: "manual", category: "african-manual", region: "DR Congo/Congo" },
  "wo":   { name: "Wolof", flag: "🇸🇳", engine: "manual", category: "african-manual", region: "Senegal/Gambia" },
  "tw":   { name: "Twi / Akan", flag: "🇬🇭", engine: "manual", category: "african-manual", region: "Ghana" },
  "rw":   { name: "Kinyarwanda", flag: "🇷🇼", engine: "manual", category: "african-manual", region: "Rwanda" },
  "sn":   { name: "Shona", flag: "🇿🇼", engine: "manual", category: "african-manual", region: "Zimbabwe" },
  "so":   { name: "Somali / Soomaali", flag: "🇸🇴", engine: "manual", category: "african-manual", region: "Somalia" },
  "zu":   { name: "Zulu / isiZulu", flag: "🇿🇦", engine: "manual", category: "african-manual", region: "South Africa" },
  "xh":   { name: "Xhosa / isiXhosa", flag: "🇿🇦", engine: "manual", category: "african-manual", region: "South Africa" },
};

// Group languages by category for UI display
export const LANGUAGE_GROUPS = {
  "auto": {
    label: "✅ Auto-transcribed languages ",
    desc: "Voice is automatically converted to text",
    languages: Object.entries(RECORDING_LANGUAGES)
      .filter(([,v]) => v.category === "auto")
      .map(([code, val]) => ({ code, ...val })),
  },
  "african-aws": {
    label: "✅ African languages (Auto)",
    desc: "Supported byTranscribe for automatic voice-to-text",
    languages: Object.entries(RECORDING_LANGUAGES)
      .filter(([,v]) => v.category === "african-aws")
      .map(([code, val]) => ({ code, ...val })),
  },
  "african-manual": {
    label: "📝 African languages (Type after recording)",
    desc: "Record your voice, then type what you said — the text will be saved",
    languages: Object.entries(RECORDING_LANGUAGES)
      .filter(([,v]) => v.category === "african-manual")
      .map(([code, val]) => ({ code, ...val })),
  },
};

// Convert audio blob to base64
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Main transcription function
export async function transcribeAudio(audioBlob, languageCode) {
  if (!TRANSCRIBE_API) throw new Error("VITE_TRANSCRIBE_API_URL not set in environment");

  const lang = RECORDING_LANGUAGES[languageCode];
  if (!lang) throw new Error(`Language "${languageCode}" not found`);

  // Manual languages — skip API, return empty transcript
  if (lang.engine === "manual") {
    return {
      transcript: "",
      languageCode,
      languageName: lang.name,
      requiresManualTranscription: true,
      message: `${lang.name} does not support automatic transcription. Please type your story in the text field below.`,
    };
  }

  // Convert audio to base64
  const audioBase64 = await blobToBase64(audioBlob);

  const response = await fetch(TRANSCRIBE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: audioBase64, languageCode }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Transcription failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Transcription failed");

  return {
    transcript: data.transcript,
    languageCode,
    languageName: lang.name,
    requiresManualTranscription: false,
  };
}

export default { transcribeAudio, RECORDING_LANGUAGES, LANGUAGE_GROUPS };