import { useRef, useState, useCallback } from "react";

export type VoiceState = "idle" | "listening" | "unsupported";

const LANG_MAP: Record<string, string> = {
  ar: "ar-EG", en: "en-US", fr: "fr-FR", de: "de-DE",
  es: "es-ES", it: "it-IT", tr: "tr-TR", fa: "fa-IR",
  ur: "ur-PK", zh: "zh-CN", ja: "ja-JP", ru: "ru-RU",
};

interface Options {
  onResult: (transcript: string) => void;
  lang?: string;
}

export function useVoiceSearch({ onResult, lang = "en" }: Options) {
  const ref = useRef<any>(null);
  const [state, setState] = useState<VoiceState>(() => {
    if (typeof window === "undefined") return "unsupported";
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      ? "idle"
      : "unsupported";
  });

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    ref.current?.abort();
    const rec = new SR();
    rec.lang = LANG_MAP[lang] ?? "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setState("listening");
    rec.onresult = (e: any) => {
      const t = e.results[0]?.[0]?.transcript ?? "";
      if (t.trim()) onResult(t.trim());
      setState("idle");
    };
    rec.onerror = () => setState("idle");
    rec.onend = () => setState("idle");
    ref.current = rec;
    rec.start();
  }, [lang, onResult]);

  const stop = useCallback(() => {
    ref.current?.stop();
    setState("idle");
  }, []);

  return { state, start, stop };
}
