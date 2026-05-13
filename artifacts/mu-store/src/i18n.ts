import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import it from "./locales/it.json";
import tr from "./locales/tr.json";
import fa from "./locales/fa.json";
import ur from "./locales/ur.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import ru from "./locales/ru.json";

export const RTL_LANGS = new Set(["ar", "fa", "ur"]);

export function applyLangDir(lng: string) {
  const isRTL = RTL_LANGS.has(lng);
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = lng;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      es: { translation: es },
      it: { translation: it },
      tr: { translation: tr },
      fa: { translation: fa },
      ur: { translation: ur },
      zh: { translation: zh },
      ja: { translation: ja },
      ru: { translation: ru },
    },
    fallbackLng: "ar",
    defaultNS: "translation",
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "mu_language",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

i18n.on("languageChanged", applyLangDir);

const stored = localStorage.getItem("mu_language");
if (stored) applyLangDir(stored);

export default i18n;
