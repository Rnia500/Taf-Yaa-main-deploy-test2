const TRANSLATE_API = import.meta.env.VITE_TRANSLATE_API_URL;

export const TRANSLATION_LANGUAGES = {
  // Major world languages — AWS Translate
  "en": { name: "English", flag: "🇬🇧", engine: "aws" },
  "fr": { name: "Français (French)", flag: "🇫🇷", engine: "aws" },
  "ar": { name: "العربية (Arabic)", flag: "🇸🇦", engine: "aws" },
  "es": { name: "Español (Spanish)", flag: "🇪🇸", engine: "aws" },
  "pt": { name: "Português (Portuguese)", flag: "🇧🇷", engine: "aws" },
  "de": { name: "Deutsch (German)", flag: "🇩🇪", engine: "aws" },
  "it": { name: "Italiano (Italian)", flag: "🇮🇹", engine: "aws" },
  "ru": { name: "Русский (Russian)", flag: "🇷🇺", engine: "aws" },
  "zh": { name: "中文 (Chinese)", flag: "🇨🇳", engine: "aws" },
  "hi": { name: "हिन्दी (Hindi)", flag: "🇮🇳", engine: "aws" },
  "tr": { name: "Türkçe (Turkish)", flag: "🇹🇷", engine: "aws" },

  // African languages — AWS Translate native
  "ha": { name: "Hausa", flag: "🇳🇬", engine: "aws", region: "Nigeria/Niger/Chad" },
  "sw": { name: "Kiswahili (Swahili)", flag: "🇰🇪", engine: "aws", region: "East Africa" },
  "yo": { name: "Yoruba", flag: "🇳🇬", engine: "aws", region: "Nigeria/Benin/Togo" },
  "ig": { name: "Igbo", flag: "🇳🇬", engine: "aws", region: "Nigeria" },
  "am": { name: "አማርኛ (Amharic)", flag: "🇪🇹", engine: "aws", region: "Ethiopia" },
  "so": { name: "Soomaali (Somali)", flag: "🇸🇴", engine: "aws", region: "Somalia/Djibouti" },
  "zu": { name: "isiZulu (Zulu)", flag: "🇿🇦", engine: "aws", region: "South Africa" },

  // African languages — Custom dictionaries
  "ff":  { name: "Fulfulde (Diamaré)", flag: "🌍", engine: "custom", region: "Cameroon/Niger/Nigeria" },
  "bas": { name: "Bassa", flag: "🇨🇲", engine: "custom", region: "Cameroon" },
  "ewo": { name: "Ewondo", flag: "🇨🇲", engine: "custom", region: "Cameroon" },
  "bm":  { name: "Bambara", flag: "🇲🇱", engine: "custom", region: "Mali/Guinea/Burkina Faso" },
  "ln":  { name: "Lingala", flag: "🇨🇩", engine: "custom", region: "DR Congo/Congo/CAR" },
  "wo":  { name: "Wolof", flag: "🇸🇳", engine: "custom", region: "Senegal/Gambia" },
  "rw":  { name: "Kinyarwanda", flag: "🇷🇼", engine: "custom", region: "Rwanda/Burundi" },
  "tw":  { name: "Twi / Akan", flag: "🇬🇭", engine: "custom", region: "Ghana/Ivory Coast" },
  "sn":  { name: "Shona", flag: "🇿🇼", engine: "custom", region: "Zimbabwe/Mozambique" },
};

// Group for UI display
export const TRANSLATION_GROUPS = {
  "world": {
    label: "🌐 World Languages",
    languages: Object.entries(TRANSLATION_LANGUAGES)
      .filter(([,v]) => v.engine === "aws" && !v.region)
      .map(([code, val]) => ({ code, ...val })),
  },
  "african-aws": {
    label: "✅ African Languages (Full Translation)",
    desc: "Supported  by Translate",
    languages: Object.entries(TRANSLATION_LANGUAGES)
      .filter(([,v]) => v.engine === "aws" && v.region)
      .map(([code, val]) => ({ code, ...val })),
  },
  "african-custom": {
    label: "📖 African Languages (Dictionary)",
    desc: "Custom dictionaries for unsupported languages",
    languages: Object.entries(TRANSLATION_LANGUAGES)
      .filter(([,v]) => v.engine === "custom")
      .map(([code, val]) => ({ code, ...val })),
  },
};

// In-memory cache
const cache = new Map();
function cacheKey(text, src, tgt) { return `${tgt}:${src}:${text.slice(0,50)}`; }

// Translate a single text
export async function translateText(text, targetLang, sourceLang = "auto") {
  if (!text || !text.trim()) return { translated: text, coverage: 100 };
  if (!TRANSLATE_API) throw new Error("VITE_TRANSLATE_API_URL not set");

  const key = cacheKey(text, sourceLang, targetLang);
  if (cache.has(key)) return cache.get(key);

  const response = await fetch(TRANSLATE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Translation failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Translation failed");

  const result = {
    translated: data.translated,
    coverage: data.coverage ?? 100,
    languageName: TRANSLATION_LANGUAGES[targetLang]?.name || targetLang,
    engine: TRANSLATION_LANGUAGES[targetLang]?.engine || "aws",
  };

  cache.set(key, result);
  return result;
}

// Translate multiple fields at once (batch)
export async function translateFields(fieldsObj, targetLang, sourceLang = "auto") {
  if (!TRANSLATE_API) throw new Error("VITE_TRANSLATE_API_URL not set");

  // Filter out empty fields
  const nonEmpty = Object.fromEntries(
    Object.entries(fieldsObj).filter(([, v]) => v && String(v).trim())
  );
  if (Object.keys(nonEmpty).length === 0) return {};

  const response = await fetch(TRANSLATE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: nonEmpty, sourceLang, targetLang }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Batch translation failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || "Batch translation failed");

  return data.results; 
}

// Get display info for a language code
export function getLanguageInfo(code) {
  return TRANSLATION_LANGUAGES[code] || { name: code, flag: "🌍", engine: "unknown" };
}

export default { translateText, translateFields, TRANSLATION_LANGUAGES, TRANSLATION_GROUPS, getLanguageInfo };