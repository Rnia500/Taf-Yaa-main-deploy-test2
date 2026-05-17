// src/services/translateService.js
// Taf'Yaa — AWS Translate Service

const API_URL = import.meta.env.VITE_TRANSLATE_API_URL || '';

function checkConfig() {
  if (!API_URL) throw new Error('VITE_TRANSLATE_API_URL not configured.');
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await res.text();
  if (!text) throw new Error('No response from translate server.');
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Invalid response: ${text.slice(0, 100)}`); }
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export const translateService = {

  // Translate a single text
  async translateText(text, targetLang, sourceLang = 'auto') {
    checkConfig();
    const data = await apiFetch(`${API_URL}?action=translate`, {
      method: 'POST',
      body: JSON.stringify({ text, targetLang, sourceLang }),
    });
    return data.translated;
  },

  // Translate multiple fields at once
  async translateFields(fields, targetLang, sourceLang = 'auto') {
    checkConfig();
    const data = await apiFetch(`${API_URL}?action=translate-fields`, {
      method: 'POST',
      body: JSON.stringify({ fields, targetLang, sourceLang }),
    });
    return data.translated;
  },

  // Translate a story by ID
  async translateStory(storyId, targetLang, saveTranslation = true) {
    checkConfig();
    return apiFetch(`${API_URL}?action=translate-story`, {
      method: 'POST',
      body: JSON.stringify({ storyId, targetLang, saveTranslation }),
    });
  },

  // Translate a person's profile fields
  async translatePerson(personId, treeId, targetLang) {
    checkConfig();
    return apiFetch(`${API_URL}?action=translate-person`, {
      method: 'POST',
      body: JSON.stringify({ personId, treeId, targetLang }),
    });
  },

  // Supported languages
  languages: [
    { code: 'en', name: 'English',    flag: '🇬🇧' },
    { code: 'fr', name: 'French',     flag: '🇫🇷' },
    { code: 'ar', name: 'Arabic',     flag: '🇸🇦' },
    { code: 'es', name: 'Spanish',    flag: '🇪🇸' },
    { code: 'de', name: 'German',     flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
    { code: 'sw', name: 'Swahili',    flag: '🌍' },
    { code: 'yo', name: 'Yoruba',     flag: '🌍' },
    { code: 'ha', name: 'Hausa',      flag: '🌍' },
  ],

  getLanguageName(code) {
    return this.languages.find(l => l.code === code)?.name || code;
  },
};
