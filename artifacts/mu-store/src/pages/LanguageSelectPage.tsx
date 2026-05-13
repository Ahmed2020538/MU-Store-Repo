import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import i18n from "@/i18n";

export const LANGUAGES = [
  { code: "ar", name: "العربية", english: "Arabic", flag: "🇸🇦" },
  { code: "en", name: "English", english: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", english: "French", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", english: "German", flag: "🇩🇪" },
  { code: "es", name: "Español", english: "Spanish", flag: "🇪🇸" },
  { code: "it", name: "Italiano", english: "Italian", flag: "🇮🇹" },
  { code: "tr", name: "Türkçe", english: "Turkish", flag: "🇹🇷" },
  { code: "fa", name: "فارسی", english: "Persian", flag: "🇮🇷" },
  { code: "ur", name: "اردو", english: "Urdu", flag: "🇵🇰" },
  { code: "zh", name: "中文", english: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "日本語", english: "Japanese", flag: "🇯🇵" },
  { code: "ru", name: "Русский", english: "Russian", flag: "🇷🇺" },
];

const SUBTITLES: Record<string, string> = {
  ar: "اختاري لغتك المفضلة للبدء",
  en: "Choose your preferred language to get started",
  fr: "Choisissez votre langue préférée pour commencer",
  de: "Wählen Sie Ihre bevorzugte Sprache",
  es: "Elige tu idioma preferido para comenzar",
  it: "Scegli la tua lingua preferita per iniziare",
  tr: "Tercih ettiğiniz dili seçerek başlayın",
  fa: "زبان مورد نظر خود را برای شروع انتخاب کنید",
  ur: "شروع کرنے کے لیے اپنی پسندیدہ زبان منتخب کریں",
  zh: "请选择您偏好的语言以开始",
  ja: "ご希望の言語を選択して始めましょう",
  ru: "Выберите предпочитаемый язык для начала работы",
};

interface Props {
  onSelect: () => void;
}

export default function LanguageSelectPage({ onSelect }: Props) {
  const [selected, setSelected] = useState<string>("");
  const [hovered, setHovered] = useState<string>("");

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem("mu_language", selected);
    i18n.changeLanguage(selected);
    onSelect();
  };

  const displayCode = hovered || selected || "en";
  const isRTL = ["ar", "fa", "ur"].includes(displayCode);

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <span className="font-serif text-6xl font-bold text-[#C9A96E] tracking-widest">MU</span>
        <p className="text-[#C9A96E]/50 text-xs tracking-[0.3em] uppercase mt-1">Where Every Step Tells Your Story</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={displayCode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-5 text-white/60 text-base"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {SUBTITLES[displayCode]}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl w-full"
      >
        {LANGUAGES.map((lang, i) => (
          <motion.button
            key={lang.code}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + i * 0.035 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(lang.code)}
            onMouseEnter={() => setHovered(lang.code)}
            onMouseLeave={() => setHovered("")}
            dir={["ar", "fa", "ur"].includes(lang.code) ? "rtl" : "ltr"}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
              selected === lang.code
                ? "border-[#C9A96E] bg-[#C9A96E]/12 shadow-[0_0_20px_rgba(201,169,110,0.2)]"
                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30"
            }`}
          >
            <div className="text-2xl mb-1.5">{lang.flag}</div>
            <div className="font-semibold text-white text-sm leading-tight">{lang.name}</div>
            <div className="text-white/40 text-xs mt-0.5">{lang.english}</div>
            {selected === lang.code && (
              <div className="mt-1.5 w-4 h-4 rounded-full bg-[#C9A96E] flex items-center justify-center text-[#1A1A2E] text-xs font-bold">✓</div>
            )}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10"
      >
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="px-12 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 bg-[#C9A96E] text-[#1A1A2E] hover:bg-[#C9A96E]/90 hover:shadow-[0_0_24px_rgba(201,169,110,0.4)] disabled:opacity-25 disabled:cursor-not-allowed"
        >
          {selected ? `Continue in ${LANGUAGES.find(l => l.code === selected)?.english} →` : "Select a language to continue"}
        </button>
      </motion.div>
    </div>
  );
}
