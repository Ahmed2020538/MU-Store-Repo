import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Sparkles } from "lucide-react";
import { useStyleProfile, type StyleProfile } from "@/hooks/useStyleProfile";
import MUStylistAvatar from "@/components/MUStylistAvatar";

interface Props { open: boolean; onClose: () => void; }

const STEPS = [
  {
    key: "vibe" as const,
    question: "What's your signature style?",
    options: [
      { value: "minimal", label: "Quiet Luxury", desc: "Understated, refined, timeless" },
      { value: "romantic", label: "Romantic Elegance", desc: "Feminine, flowing, soft" },
      { value: "modern", label: "Modern Edge", desc: "Bold, architectural, confident" },
      { value: "classic", label: "Old Money", desc: "Polished, heritage, investment pieces" },
    ],
  },
  {
    key: "palette" as const,
    question: "Your colour world?",
    options: [
      { value: "neutrals", label: "Neutrals & Nudes", desc: "Ivory, camel, champagne" },
      { value: "earth", label: "Earth Tones", desc: "Terracotta, sand, olive" },
      { value: "monochromes", label: "Monochrome", desc: "Black, white, grey" },
      { value: "bold", label: "Rich Jewels", desc: "Midnight, burgundy, emerald" },
    ],
  },
  {
    key: "occasion" as const,
    question: "Where do you wear MU most?",
    options: [
      { value: "casual", label: "Daily Life", desc: "Errands, coffee, weekends" },
      { value: "work", label: "Work & Meetings", desc: "Professional, polished" },
      { value: "evening", label: "Evenings Out", desc: "Dinners, events, celebrations" },
      { value: "wedding", label: "Special Occasions", desc: "Weddings, galas, milestones" },
    ],
  },
  {
    key: "budget" as const,
    question: "Your comfort zone?",
    options: [
      { value: "700-1000", label: "700–1,000 EGP", desc: "Accessible luxury" },
      { value: "1000-1500", label: "1,000–1,500 EGP", desc: "Premium essentials" },
      { value: "1500-2500", label: "1,500–2,500 EGP", desc: "Investment pieces" },
      { value: "any", label: "It depends on the piece", desc: "Quality over budget" },
    ],
  },
];

export default function StyleDNAQuiz({ open, onClose }: Props) {
  const { save } = useStyleProfile();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<StyleProfile>>({});

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const pick = (value: string) => {
    const updated = { ...answers, [current.key]: value };
    setAnswers(updated);
    if (isLast) {
      save(updated as StyleProfile);
      setTimeout(onClose, 600);
    } else {
      setTimeout(() => setStep(s => s + 1), 300);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center px-4"
        style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}>
        <div className="absolute inset-0" onClick={onClose} />
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1A1A2E 100%)", border: "1px solid rgba(201,169,110,0.2)" }}
          onClick={e => e.stopPropagation()}>

          <div className="p-6 pb-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(201,169,110,0.1)" }}>
            <div className="flex items-center gap-2.5">
              <MUStylistAvatar size={30} />
              <div>
                <p className="text-white text-sm font-semibold">MU Style DNA</p>
                <p className="text-white/40 text-[10px]">Question {step + 1} of {STEPS.length}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all">
              <X size={15} />
            </button>
          </div>

          <div className="px-1.5">
            <div className="h-0.5 bg-white/[0.06] mx-4 mt-4 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }} className="h-full bg-[#C9A96E] rounded-full" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }} className="p-6 pt-5">
              <p className="text-white font-serif text-xl font-semibold mb-5 leading-snug">{current.question}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {current.options.map(opt => {
                  const selected = answers[current.key] === opt.value;
                  return (
                    <motion.button key={opt.value} onClick={() => pick(opt.value)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className={`text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                        selected ? "border-[#C9A96E] bg-[#C9A96E]/10" : "border-white/[0.08] hover:border-[#C9A96E]/40 hover:bg-white/[0.03]"
                      }`}>
                      <p className={`text-sm font-semibold mb-0.5 ${selected ? "text-[#C9A96E]" : "text-white"}`}>{opt.label}</p>
                      <p className="text-[11px] text-white/35 leading-snug">{opt.desc}</p>
                    </motion.button>
                  );
                })}
              </div>

              {isLast && (
                <p className="text-center text-[11px] text-white/25 mt-4 flex items-center justify-center gap-1">
                  <Sparkles size={10} /> Your recommendations will be personalised
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-6 pb-4 text-[11px] text-white/30 hover:text-white/50 transition-colors flex items-center gap-1">
              <ChevronRight size={11} className="rotate-180" /> Back
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
