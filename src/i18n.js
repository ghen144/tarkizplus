import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationAR from './locales/ar/translation.json';
import translationHE from './locales/he/translation.json';

i18n
  .use(LanguageDetector) // بيحاول يكتشف اللغة من المتصفح
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translationEN },
      ar: { translation: translationAR },
      he: { translation: translationHE }
    },
    fallbackLng: 'en', // لو ما عرف اللغة، بروح عالإنجليزي
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
