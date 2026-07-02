// src/hooks/useAutoTranslate.js (v2 - fixed)
import { useState, useEffect, useRef } from 'react';
import { useContentTranslation } from '../context/TranslationContext';

/**
 * Translate a single text string when language changes
 * Usage: const translatedBio = useAutoTranslate(biographyText);
 */
export function useAutoTranslate(text) {
  const { currentLang, translateText, needsTranslation } = useContentTranslation();
  const [translated, setTranslated] = useState(text || '');
  const prevLang = useRef(currentLang);
  const prevText = useRef(text);

  useEffect(() => {
    // Only re-translate if lang or text changed
    if (text === prevText.current && currentLang === prevLang.current) return;
    prevText.current = text;
    prevLang.current = currentLang;

    if (!needsTranslation || !text?.trim()) {
      setTranslated(text || '');
      return;
    }

    let cancelled = false;
    translateText(text).then(result => {
      if (!cancelled) setTranslated(result);
    });
    return () => { cancelled = true; };
  }, [text, currentLang, needsTranslation, translateText]);

  // Return original while translating
  return translated || text || '';
}

/**
 * Translate multiple fields at once
 * Usage: const t = useAutoTranslateFields({ bio: '...', tribe: '...' });
 */
export function useAutoTranslateFields(fields) {
  const { currentLang, translateFields, needsTranslation } = useContentTranslation();
  const [translated, setTranslated] = useState(fields || {});
  const prevLang = useRef(currentLang);

  useEffect(() => {
    prevLang.current = currentLang;

    if (!needsTranslation || !fields || Object.keys(fields).length === 0) {
      setTranslated(fields || {});
      return;
    }

    let cancelled = false;
    translateFields(fields).then(result => {
      if (!cancelled) setTranslated(result);
    });
    return () => { cancelled = true; };
  }, [currentLang, needsTranslation]);

  // Sync when fields themselves change
  useEffect(() => {
    if (!needsTranslation) setTranslated(fields || {});
  }, [fields, needsTranslation]);

  return translated;
}