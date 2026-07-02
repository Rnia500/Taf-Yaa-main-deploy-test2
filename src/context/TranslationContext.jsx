// src/context/TranslationContext.jsx (v3 - FIXED, properly calls Lambda)
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const TranslationContext = createContext();

export const useContentTranslation = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useContentTranslation must be used within TranslationProvider');
  return ctx;
};

// Cache to avoid redundant API calls
const cache = new Map();

// Languages AWS Translate supports
const SUPPORTED = new Set(['fr','es','ar','de','pt','it','ru','ja','ko','zh','hi','sw','ha','yo','am','so','zu','ff']);

export const TranslationProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language?.split('-')[0] || 'en');
  const apiUrl = import.meta.env.VITE_TRANSLATE_API_URL || '';

  // Listen to language changes
  useEffect(() => {
    const handler = (lang) => {
      const code = lang.split('-')[0];
      setCurrentLang(code);
      cache.clear(); // clear cache on language change
      console.log('🌍 Language changed to:', code);
    };
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, [i18n]);

  // Core translate function
  const translateText = useCallback(async (text) => {
    if (!text?.trim()) return text || '';
    if (currentLang === 'en' || !SUPPORTED.has(currentLang)) return text;
    if (!apiUrl) { console.warn('VITE_TRANSLATE_API_URL not set'); return text; }

    const cacheKey = `${currentLang}::${text.trim()}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
      const res = await fetch(`${apiUrl}?action=translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: currentLang, sourceLang: 'auto' }),
      });
      if (!res.ok) { console.warn('Translate API error:', res.status); return text; }
      const data = await res.json();
      const translated = data.translated || text;
      cache.set(cacheKey, translated);
      return translated;
    } catch (err) {
      console.warn('Translation failed:', err.message);
      return text; // fallback to original
    }
  }, [currentLang, apiUrl]);

  // Translate multiple fields at once
  const translateFields = useCallback(async (fields) => {
    if (currentLang === 'en' || !SUPPORTED.has(currentLang)) return fields;
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
    <TranslationContext.Provider value={{ currentLang, translateText, translateFields, needsTranslation }}>
      {children}
    </TranslationContext.Provider>
  );
};