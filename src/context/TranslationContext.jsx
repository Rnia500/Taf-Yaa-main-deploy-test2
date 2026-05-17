// Auto-translates ALL user content when i18next language switches

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { translateService } from '../services/translateService';

const TranslationContext = createContext();

export const useContentTranslation = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useContentTranslation must be used within TranslationProvider');
  return ctx;
};

// In-memory cache: avoid re-translating same text + language
const cache = new Map();
const cacheKey = (text, lang) => `${lang}::${String(text).trim()}`;

// Languages AWS Translate supports (mapped from i18next codes)
const SUPPORTED = new Set([
  'fr','es','ar','de','pt','it','ru','ja','ko','zh','hi','sw','yo','ha'
]);

export const TranslationProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(
    i18n.language?.split('-')[0] || 'en'
  );
  const [isTranslating, setIsTranslating] = useState(false);

  // Listen to i18next language changes
  useEffect(() => {
    const handler = (lang) => {
      const code = lang.split('-')[0];
      setCurrentLang(code);
      cache.clear(); // clear cache so everything re-translates
    };
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, [i18n]);

  // Translate a single text string
  const translateText = useCallback(async (text, targetLang) => {
    const lang = targetLang || currentLang;

    // Return original if English or not supported
    if (!text || !text.trim() || lang === 'en' || !SUPPORTED.has(lang)) {
      return text || '';
    }

    const key = cacheKey(text, lang);
    if (cache.has(key)) return cache.get(key);

    try {
      const translated = await translateService.translateText(text, lang, 'auto');
      cache.set(key, translated);
      return translated;
    } catch (err) {
      console.warn('Translation failed for:', text?.substring(0, 30), err.message);
      return text; // fallback to original
    }
  }, [currentLang]);

  // Translate multiple fields at once
  const translateFields = useCallback(async (fields, targetLang) => {
    const lang = targetLang || currentLang;
    if (lang === 'en' || !SUPPORTED.has(lang)) return fields;

    const result = { ...fields };
    await Promise.all(
      Object.entries(fields).map(async ([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          result[key] = await translateText(value, lang);
        }
      })
    );
    return result;
  }, [currentLang, translateText]);

  const isEnglish = currentLang === 'en';
  const needsTranslation = !isEnglish && SUPPORTED.has(currentLang);

  return (
    <TranslationContext.Provider value={{
      currentLang,
      isTranslating,
      isEnglish,
      needsTranslation,
      translateText,
      translateFields,
    }}>
      {children}
    </TranslationContext.Provider>
  );
};
