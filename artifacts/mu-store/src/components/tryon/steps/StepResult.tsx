import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Share2, ShoppingBag, RotateCcw, ZoomIn, ZoomOut, Zap } from "lucide-react";

interface Props {
  resultImageUrl: string | null;
  productName: string;
  provider: string | null;
  isDemoMode: boolean;
  onGenerateAgain: () => void;
  onTryDifferent: () => void;
  onAddToCart?: () => void;
  isSubmitting: boolean;
}

export default function StepResult({
  resultImageUrl, productName, provider, isDemoMode,
  onGenerateAgain, onTryDifferent, onAddToCart, isSubmitting,
}: Props) {
  const [zoomed, setZoomed] = useState(false);

  const download = useCallback(async () => {
    if (!resultImageUrl) return;
    try {
      const res = await fetch(resultImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mu-tryon-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }, [resultImageUrl]);

  const share = useCallback(async () => {
    if (!resultImageUrl) return;
    if (navigator.share) {
      try { await navigator.share({ title: `${productName} — MU Try-On`, url: window.location.href }); } catch { /* ignore */ }
    } else {
      navigator.clipboard?.writeText(window.location.href).catch(() => {});
    }
  }, [resultImageUrl, productName]);

  if (isDemoMode) {
    return (
      <div className="flex flex-col items-center gap-6 p-6 text-center text-white">
        <div className="w-20 h-20 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center">
          <Zap size={32} className="text-[#C9A96E]" />
        </div>
        <div>
          <p className="text-base font-semibold text-white mb-2">AI Try-On Ready</p>
          <p className="text-sm text-white/45 max-w-xs leading-relaxed">
            Add a <code className="text-[#C9A96E] text-xs bg-white/5 px-1.5 py-0.5 rounded">FASHN_API_KEY</code> or{" "}
            <code className="text-[#C9A96E] text-xs bg-white/5 px-1.5 py-0.5 rounded">REPLICATE_API_KEY</code>{" "}
            environment variable to enable real AI-generated try-on images.
          </p>
        </div>
        <button onClick={onTryDifferent}
          className="px-5 py-2.5 rounded-xl border border-white/15 text-sm text-white/60 hover:text-white hover:border-white/30 transition-all">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5 text-white">
      <div
        className="relative group cursor-pointer rounded-2xl overflow-hidden border border-white/[0.06] bg-black"
        onClick={() => setZoomed(z => !z)}
      >
        {resultImageUrl && (
          <motion.img
            src={resultImageUrl} alt="AI Try-On Result"
            className="w-full object-contain transition-all duration-300"
            style={{ maxHeight: zoomed ? "72dvh" : "320px" }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {zoomed ? <ZoomOut size={22} className="text-white drop-shadow-lg" /> : <ZoomIn size={22} className="text-white drop-shadow-lg" />}
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 text-[9px] text-white/40 font-medium backdrop-blur">
          AI Generated Preview
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Download, label: "Save", action: download },
          { icon: Share2, label: "Share", action: share },
          { icon: RotateCcw, label: "Retry", action: onGenerateAgain },
        ].map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action} disabled={isSubmitting}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04] text-xs text-white/50 hover:text-white transition-all disabled:opacity-40">
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {onAddToCart && (
        <motion.button onClick={onAddToCart} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#C9A96E] text-black font-semibold text-sm">
          <ShoppingBag size={16} /> Add to Cart
        </motion.button>
      )}

      <p className="text-[10px] text-center text-white/20 leading-relaxed px-2">
        This preview is AI-generated for visualization purposes only.
        {provider === "fashn" && " Powered by Fashn.ai."}
        {provider === "replicate" && " Powered by Replicate IDM-VTON."}
      </p>

      <button onClick={onTryDifferent}
        className="text-xs text-center text-white/30 hover:text-white/55 transition-colors underline underline-offset-2">
        Try a Different Photo
      </button>
    </div>
  );
}
