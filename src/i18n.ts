import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const LOCALES = ['en', 'de', 'dk', 'it', 'fr'] as const;

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: LOCALES,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    ns: ['common'],
    defaultNS: 'common',
    // Translations stay in public/locales so `bun run downloadLocales` keeps working.
    backend: { loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json` },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    interpolation: { escapeValue: false }
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
