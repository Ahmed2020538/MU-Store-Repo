import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const MESSAGES = [
  "Analyzing body proportions…",
  "Mapping garment structure…",
  "Adjusting lighting and shadows…",
  "Rendering photorealistic output…",
  "Finalizing your look…",
];

interface Props {
  userPhotoPreview: string | null;
  productImage: string;
  progress: number;
  onCancel: () => void;
}

export default function StepGenerating({ userPhotoPreview, productImage, progress, onCancel }: Props) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [displayed, setDisplayed] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Smooth progress — only increase, cap at 95 while waiting
    setDisplayed(prev => Math.max(prev, Math.min(progress, 95)));
  }, [progress]);

  const eta = Math.max(1, Math.ceil(((100 - displayed) / 100) * 55));

  return (
    <div className="flex flex-col items-center gap-5 p-5 text-white">
      <div className="grid grid-cols-2 gap-2.5 w-full">
        {[
          { src: userPhotoPreview, label: "Your Photo" },
          { src: productImage, label: "Product" },
        ].map(({ src, label }) => (
          <div key={label} className="relative rounded-xl overflow-hidden border border-white/[0.06] aspect-square bg-white/[0.03]">
            {src && <img src={src} alt={label} className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] text-white/60 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="w-full space-y-1.5">
        <div className="flex justify-between text-[11px] text-white/35">
          <span>Generating try-on</span>
          <span>~{eta}s remaining</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#C9A96E] to-[#e8c98d]"
            animate={{ width: `${displayed}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="text-center space-y-3 py-2">
        <motion.p
          key={msgIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-sm text-white/75 font-medium min-h-[20px]"
        >
          {MESSAGES[msgIdx]}
        </motion.p>
        <div className="flex gap-2 justify-center">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.4, delay: i * 0.45, repeat: Infinity }} />
          ))}
        </div>
      </div>

      <div className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
        <p className="text-xs text-white/40">Our AI is compositing your image in high resolution</p>
        <p className="text-[11px] text-white/22 mt-1">Generation typically takes 20–60 seconds</p>
      </div>

      <button onClick={onCancel}
        className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/55 transition-colors">
        <X size={12} /> Cancel generation
      </button>
    </div>
  );
}
