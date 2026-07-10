// src/services/transcribeService.js
// FIXED: clean URL, no query params

const TRANSCRIBE_API = (import.meta.env.VITE_TRANSCRIBE_API_URL || '').replace(/\/$/, '');

export const RECORDING_LANGUAGES = {
  // AWS Transcribe
  "en-US": { name:"English (US)",        flag:"🇺🇸", engine:"aws", category:"world" },
  "en-GB": { name:"English (UK)",        flag:"🇬🇧", engine:"aws", category:"world" },
  "fr-FR": { name:"Français",            flag:"🇫🇷", engine:"aws", category:"world" },
  "ar-SA": { name:"العربية (Arabic)",    flag:"🇸🇦", engine:"aws", category:"world" },
  "pt-BR": { name:"Português",           flag:"🇧🇷", engine:"aws", category:"world" },
  "es-US": { name:"Español",             flag:"🇪🇸", engine:"aws", category:"world" },
  "de-DE": { name:"Deutsch",             flag:"🇩🇪", engine:"aws", category:"world" },
  "hi-IN": { name:"हिन्दी (Hindi)",      flag:"🇮🇳", engine:"aws", category:"world" },
  // African - AWS
  "ha-NG": { name:"Hausa",               flag:"🇳🇬", engine:"aws", category:"african", region:"Nigeria/Niger/Chad/Cameroon" },
  "sw-KE": { name:"Kiswahili",           flag:"🇰🇪", engine:"aws", category:"african", region:"East Africa" },
  "yo-NG": { name:"Yoruba",              flag:"🇳🇬", engine:"aws", category:"african", region:"Nigeria/Benin/Togo" },
  "ig-NG": { name:"Igbo",                flag:"🇳🇬", engine:"aws", category:"african", region:"Nigeria" },
  "am-ET": { name:"አማርኛ (Amharic)",     flag:"🇪🇹", engine:"aws", category:"african", region:"Ethiopia" },
  // African - Whisper
  "ff":    { name:"Fulfulde",             flag:"🌍",  engine:"whisper", category:"cameroon", region:"Cameroon/Niger/Nigeria" },
  "bas":   { name:"Bassa",               flag:"🇨🇲", engine:"whisper", category:"cameroon", region:"Cameroon (Littoral)" },
  "ewo":   { name:"Ewondo",              flag:"🇨🇲", engine:"whisper", category:"cameroon", region:"Cameroon (Centre/South)" },
  "baf":   { name:"Bafia",               flag:"🇨🇲", engine:"whisper", category:"cameroon", region:"Cameroon (Centre)" },
  "ybb":   { name:"Yemba (Bamileke)",    flag:"🇨🇲", engine:"whisper", category:"cameroon", region:"Cameroon (West)" },
  "bum":   { name:"Bulu",                flag:"🇨🇲", engine:"whisper", category:"cameroon", region:"Cameroon (South)" },
  "bm":    { name:"Bambara",             flag:"🇲🇱", engine:"whisper", category:"west-africa", region:"Mali/Guinea" },
  "ln":    { name:"Lingala",             flag:"🇨🇩", engine:"whisper", category:"central-africa", region:"DR Congo/Congo" },
  "wo":    { name:"Wolof",               flag:"🇸🇳", engine:"whisper", category:"west-africa", region:"Senegal/Gambia" },
  "rw":    { name:"Kinyarwanda",         flag:"🇷🇼", engine:"whisper", category:"east-africa", region:"Rwanda" },
  "sn":    { name:"Shona",               flag:"🇿🇼", engine:"whisper", category:"southern-africa", region:"Zimbabwe" },
  "zu":    { name:"isiZulu (Zulu)",      flag:"🇿🇦", engine:"whisper", category:"southern-africa", region:"South Africa" },
  "tw":    { name:"Twi / Akan",          flag:"🇬🇭", engine:"whisper", category:"west-africa", region:"Ghana" },
  "so":    { name:"Soomaali (Somali)",   flag:"🇸🇴", engine:"whisper", category:"east-africa", region:"Somalia" },
};

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function transcribeAudio(audioBlob, languageCode) {
  if (!TRANSCRIBE_API) throw new Error('VITE_TRANSCRIBE_API_URL is not set');

  const lang = RECORDING_LANGUAGES[languageCode];
  if (!lang) throw new Error(`Language "${languageCode}" not supported`);

  const audioBase64 = await blobToBase64(audioBlob);

  // ✅ FIX: POST directly to the base URL — no query params
  const res = await fetch(TRANSCRIBE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: audioBase64, languageCode }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Transcription failed (${res.status})`);
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Transcription failed');

  return {
    transcript:    data.transcript,
    languageCode,
    languageName:  lang.name,
    engine:        data.engine,
    requiresManualTranscription: false,
  };
}

export function getGroupedLanguages() {
  const groups = {
    'world':          { label:'🌐 World Languages (AWS)', languages:[] },
    'african':        { label:'✅ African Languages (AWS)', languages:[] },
    'cameroon':       { label:'🇨🇲 Cameroon Languages (Whisper)', languages:[] },
    'west-africa':    { label:'🌍 West Africa (Whisper)', languages:[] },
    'central-africa': { label:'🌍 Central Africa (Whisper)', languages:[] },
    'east-africa':    { label:'🌍 East Africa (Whisper)', languages:[] },
    'southern-africa':{ label:'🌍 Southern Africa (Whisper)', languages:[] },
  };
  Object.entries(RECORDING_LANGUAGES).forEach(([code, val]) => {
    if (groups[val.category]) groups[val.category].languages.push({ code, ...val });
  });
  return Object.values(groups).filter(g => g.languages.length > 0);
}

export default { transcribeAudio, RECORDING_LANGUAGES, getGroupedLanguages };