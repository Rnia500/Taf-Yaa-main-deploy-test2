import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: false,
    
    // Configure path for translation files
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false
    }
  });

// Set initial language and direction from localStorage
const savedLanguage = localStorage.getItem('lang');
if (savedLanguage) {
  i18n.changeLanguage(savedLanguage);
  if (savedLanguage === 'ar') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }
}

export default i18n;