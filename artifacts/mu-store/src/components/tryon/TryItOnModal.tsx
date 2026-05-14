import { lazy, Suspense, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useTryOn } from "./hooks/useTryOn";
import { usePollStatus } from "./hooks/usePollStatus";

const StepUpload = lazy(() => import("./steps/StepUpload"));
const StepGenerating = lazy(() => import("./steps/StepGenerating"));
const StepResult = lazy(() => import("./steps/StepResult"));

interface Props {
  open: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  productCategory?: string;
  onAddToCart?: () => void;
}

const STEP_LABELS = ["Upload", "Generating", "Result"];
const STEP_KEYS: Record<string, number> = { upload: 0, generating: 1, result: 2 };

export default function TryItOnModal({ open, onClose, productName, productImage, productCategory, onAddToCart }: Props) {
  const { state, dispatch, setPhoto, clearPhoto, reset } = useTryOn();
  const [isSubmitting, setIsSubmitting] = useState(false);

  usePollStatus({
    predictionId: state.predictionId,
    enabled: state.step === "generating",
    onStatus: (status, progress) => dispatch({ type: "UPDATE_STATUS", status: status as never, progress }),
    onComplete: url => dispatch({ type: "GENERATION_COMPLETE", resultImageUrl: url }),
    onFailed: error => dispatch({ type: "GENERATION_FAILED", error }),
    onTimeout: () => dispatch({ type: "GENERATION_FAILED", error: "Generation timed out. The AI service may be busy — please try again." }),
  });

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleClose = useCallback(() => { reset(); setIsSubmitting(false); onClose(); }, [reset, onClose]);

  const startGeneration = useCallback(async () => {
    if (!state.userPhoto) return;
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("userImage", state.userPhoto);
      const upRes = await fetch("/api/tryon/upload", { method: "POST", body: form });
      if (!upRes.ok) {
        const e = await upRes.json() as { error: string };
        dispatch({ type: "GENERATION_FAILED", error: e.error ?? "Upload failed" });
        return;
      }
      const { url: userImageUrl } = await upRes.json() as { url: string };

      const startRes = await fetch("/api/tryon/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userImageUrl, productImageUrl: productImage, productCategory: productCategory ?? "shoes", productName }),
      });
      if (!startRes.ok) {
        const e = await startRes.json() as { error: string };
        dispatch({ type: "GENERATION_FAILED", error: e.error ?? "Could not start generation" });
        return;
      }
      const { predictionId, provider } = await startRes.json() as { predictionId: string; provider: string };
      if (provider === "demo") {
        dispatch({ type: "DEMO_MODE" });
      } else {
        dispatch({ type: "START_GENERATING", predictionId, provider });
      }
    } catch {
      dispatch({ type: "GENERATION_FAILED", error: "Network error. Please check your connection." });
    } finally {
      setIsSubmitting(false);
    }
  }, [state.userPhoto, productImage, productCategory, productName, dispatch]);

  if (!open) return null;

  const stepIdx = STEP_KEYS[state.step] ?? 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)" }}
      >
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={handleClose} />

        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          className="relative z-10 w-full sm:max-w-[460px] max-h-[94dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl flex flex-col"
          style={{ backgroundColor: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 shrink-0"
            style={{ backgroundColor: "#0f0f0f", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#C9A96E]" />
              <span className="text-sm font-semibold text-white">AI Try-On</span>
            </div>
            <div className="flex items-center gap-1.5">
              {STEP_LABELS.map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-300 ${
                  i === stepIdx ? "w-5 h-1.5 bg-[#C9A96E]" : i < stepIdx ? "w-1.5 h-1.5 bg-white/35" : "w-1.5 h-1.5 bg-white/12"
                }`} />
              ))}
            </div>
            <button onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-white/[0.08] text-white/45 hover:text-white transition-all">
              <X size={15} />
            </button>
          </div>

          {/* Step content */}
          <Suspense fallback={
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
            </div>
          }>
            <AnimatePresence mode="wait">
              {state.step === "upload" && (
                <motion.div key="upload" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                  <StepUpload state={state} productImage={productImage} productName={productName}
                    onSetPhoto={setPhoto} onClearPhoto={clearPhoto}
                    onGenerate={startGeneration} isSubmitting={isSubmitting} />
                </motion.div>
              )}
              {state.step === "generating" && (
                <motion.div key="gen" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                  <StepGenerating userPhotoPreview={state.userPhotoPreview}
                    productImage={productImage} progress={state.progress}
                    onCancel={() => dispatch({ type: "RESET" })} />
                </motion.div>
              )}
              {state.step === "result" && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <StepResult resultImageUrl={state.resultImageUrl} productName={productName}
                    productCategory={productCategory}
                    provider={state.provider} isDemoMode={state.status === "demo"}
                    onGenerateAgain={startGeneration} onTryDifferent={() => dispatch({ type: "RESET" })}
                    onAddToCart={onAddToCart} isSubmitting={isSubmitting} />
                </motion.div>
              )}
            </AnimatePresence>
          </Suspense>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
