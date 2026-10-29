import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';

export const LOCALE_KEY = 'whatsdemo-locale';
export const locales = ['en', 'es', 'pt-BR'] as const;
export type Locale = (typeof locales)[number];
export type MessageKey = keyof typeof en;
export const catalogs = { en, es, 'pt-BR': ptBR };
export function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (locales.includes(saved as Locale)) return saved as Locale;
  } catch {
    /* Local files and private browsing may deny storage. */
  }
  return 'en';
}
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es }, 'pt-BR': { translation: ptBR } },
  lng: initialLocale(),
  fallbackLng: 'en',
  supportedLngs: [...locales],
  load: 'currentOnly',
  keySeparator: false,
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});
function applyLocale(language: string) {
  if (typeof document !== 'undefined') document.documentElement.lang = language;
  try {
    localStorage.setItem(LOCALE_KEY, language);
  } catch {
    /* The in-memory choice still works. */
  }
}
i18n.on('languageChanged', applyLocale);
if (typeof document !== 'undefined') document.documentElement.lang = i18n.language;
export function t(key: MessageKey, values?: Record<string, unknown>): string {
  return String(i18n.t(key, values));
}
/** Subscribe each reusable component to language changes; no translated user content. */
export function useT() {
  useTranslation();
  return t;
}
export { i18n };
