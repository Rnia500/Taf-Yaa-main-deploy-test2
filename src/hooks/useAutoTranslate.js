
// Used in any component to auto-translate content when language switches

import { useState, useEffect, useRef } from 'react';
import { useContentTranslation } from '../context/TranslationContext';

/**
 * Translates a single text string automatically when language changes.
 *
 * Usage:
 *   const translatedBio = useAutoTranslate(biographyText);
 *   const translatedTribe = useAutoTranslate(identity.tribe);
 */
export function useAutoTranslate(text) {
  const { currentLang, translateText, needsTranslation } = useContentTranslation();
  const [translated, setTranslated] = useState(text || '');
  const prevLang = useRef(currentLang);
  const prevText = useRef(text);

  useEffect(() => {
    // Only translate if language changed or text changed
    if (
      text === prevText.current &&
      currentLang === prevLang.current
    ) return;

    prevText.current = text;
    prevLang.current = currentLang;

    if (!needsTranslation || !text) {
      setTranslated(text || '');
      return;
    }

    let cancelled = false;
    translateText(text, currentLang).then((result) => {
      if (!cancelled) setTranslated(result);
    });

    return () => { cancelled = true; };
  }, [text, currentLang, needsTranslation, translateText]);

  return translated;
}

/**
 * Translates multiple fields automatically when language changes.
 *
 * Usage:
 *   const translated = useAutoTranslateFields({
 *     tribe: identity.tribe,
 *     language: identity.language,
 *     placeOfBirth: identity.placeOfBirth,
 *   });
 *   // then use translated.tribe, translated.language, etc.
 */
export function useAutoTranslateFields(fields) {
  const { currentLang, translateFields, needsTranslation } = useContentTranslation();
  const [translated, setTranslated] = useState(fields || {});
  const prevLang = useRef(currentLang);

  useEffect(() => {
    if (!fields || Object.keys(fields).length === 0) return;

    prevLang.current = currentLang;

    if (!needsTranslation) {
      setTranslated(fields);
      return;
    }

    let cancelled = false;
    translateFields(fields, currentLang).then((result) => {
      if (!cancelled) setTranslated(result);
    });

    return () => { cancelled = true; };
  }, [currentLang, needsTranslation]);

  // Always sync original values when fields change
  useEffect(() => {
    if (!needsTranslation) setTranslated(fields || {});
  }, [fields]);

  return translated;
}
