// src/context/TranslationContext.jsx (v2 - fixed, works properly)
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const TranslationContext = createContext();

export const useContentTranslation = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useContentTranslation must be used within TranslationProvider');
  return ctx;
};

const API_URL = import.meta.env.VITE_TRANSLATE_API_URL || '';

// Simple in-memory cache
const cache = new Map();

// Languages supported by AWS Translate
const SUPPORTED = new Set([
  'fr','es','ar','de','pt','it','ru','ja','ko','zh','hi','sw','ha','yo','am','so','zu','ff'
]);

async function callTranslateAPI(text, targetLang) {
  if (!API_URL) return text;
  const key = `${targetLang}::${text.trim()}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const res = await fetch(`${API_URL}?action=translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang, sourceLang: 'auto' }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    const translated = data.translated || text;
    cache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
}

export const TranslationProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language?.split('-')[0] || 'en');

  useEffect(() => {
    const handler = (lang) => {
      const code = lang.split('-')[0];
      setCurrentLang(code);
      cache.clear();
    };
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, [i18n]);

  const translateText = useCallback(async (text) => {
    if (!text?.trim()) return text || '';
    if (currentLang === 'en' || !SUPPORTED.has(currentLang)) return text;
    return callTranslateAPI(text, currentLang);
  }, [currentLang]);

  const translateFields = useCallback(async (fields) => {
    if (currentLang === 'en' || !SUPPORTED.has(currentLang)) return fields;
    const result = { ...fields };
    await Promise.all(
      Object.entries(fields).map(async ([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          result[key] = await callTranslateAPI(value, currentLang);
        }
      })
    );
    return result;
  }, [currentLang]);

  const needsTranslation = currentLang !== 'en' && SUPPORTED.has(currentLang);

  return (
    <TranslationContext.Provider value={{ currentLang, translateText, translateFields, needsTranslation }}>
      {children}
    </TranslationContext.Provider>
  );
};