import { useEffect, useRef } from 'react';

export const useClickOutside = (callback, isActive = true, delay = 0) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    if (isActive) {
      const addListener = () => {
        document.addEventListener('mousedown', handleClickOutside);
      };

      if (delay > 0) {
        const timeoutId = setTimeout(addListener, delay);
        return () => {
          clearTimeout(timeoutId);
          document.removeEventListener('mousedown', handleClickOutside);
        };
      } else {
        addListener();
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }
  }, [callback, isActive, delay]);

  return ref;
};

/**
 * Custom hook for handling escape key press
 * @param {Function} callback - Function to call when escape key is pressed
 * @param {boolean} isActive - Whether the escape key detection should be active
 */
export const useEscapeKey = (callback, isActive = true) => {
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (isActive && event.key === 'Escape') {
        callback();
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [callback, isActive]);
};
