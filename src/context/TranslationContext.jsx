// src/context/TranslationContext.jsx
// FIXED: removed ?action=translate from URL — action goes in body

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const TranslationContext = createContext();

export const useContentTranslation = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useContentTranslation must be used within TranslationProvider');
  return ctx;
};

const cache = new Map();

// All languages supported (AWS Translate + custom African dictionaries)
const SUPPORTED = new Set([
  // AWS Translate
  'fr','es','ar','de','pt','it','ru','ja','ko','zh','hi','sw','ha','yo','am','so','zu','ig',
  // Custom African dictionaries
  'ff','bas','ewo','bm','ln','wo','rw','tw','sn',
]);

export const TranslationProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language?.split('-')[0] || 'en');
  const apiUrl = (import.meta.env.VITE_TRANSLATE_API_URL || '').replace(/\/$/, ''); // remove trailing slash

  // Listen to i18next language changes
  useEffect(() => {
    const handler = (lang) => {
      const code = lang.split('-')[0];
      setCurrentLang(code);
      cache.clear();
      console.log('🌍 Language changed to:', code);
    };
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, [i18n]);

  // ─── Core translate function ───────────────────────────────────────────────
  const translateText = useCallback(async (text) => {
    if (!text?.trim()) return text || '';
    if (currentLang === 'en') return text;                    // English = original
    if (!SUPPORTED.has(currentLang)) return text;             // unsupported = original
    if (!apiUrl) {
      console.warn('VITE_TRANSLATE_API_URL not set');
      return text;
    }

    const cacheKey = `${currentLang}::${text.trim()}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
      // ✅ FIX: NO ?action=translate in URL — just POST to the base URL
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang: currentLang,
          sourceLang: 'auto',
        }),
      });

      if (!res.ok) {
        console.warn('Translate API error:', res.status, res.statusText);
        return text;
      }

      const data = await res.json();
      const translated = data.translated || text;
      cache.set(cacheKey, translated);
      return translated;
    } catch (err) {
      console.warn('Translation failed:', err.message);
      return text; // fallback to original text
    }
  }, [currentLang, apiUrl]);

  // ─── Translate multiple fields at once ────────────────────────────────────
  const translateFields = useCallback(async (fields) => {
    if (currentLang === 'en') return fields;
    if (!SUPPORTED.has(currentLang)) return fields;

    const result = { ...fields };
    await Promise.all(
      Object.entries(fields).map(async ([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          result[key] = await translateText(value);
        }
      })
    );
    return result;
  }, [currentLang, translateText]);

  const needsTranslation = currentLang !== 'en' && SUPPORTED.has(currentLang) && !!apiUrl;

  return (
    <TranslationContext.Provider value={{
      currentLang,
      translateText,
      translateFields,
      needsTranslation,
      supportedLanguages: SUPPORTED,
    }}>
      {children}
    </TranslationContext.Provider>
  );
};