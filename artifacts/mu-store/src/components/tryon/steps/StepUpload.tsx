import { useRef, useState, useCallback, useEffect, type DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, X, Sparkles, AlertCircle, FlipHorizontal, RotateCcw } from "lucide-react";
import type { TryOnState } from "../hooks/useTryOn";
import { useCamera } from "../hooks/useCamera";

const TIPS = ["Full body visible", "Good lighting", "Plain background", "Avoid oversized clothing"];
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  state: TryOnState;
  productImage: string;
  productName: string;
  onSetPhoto: (f: File) => void;
  onClearPhoto: () => void;
  onGenerate: () => void;
  isSubmitting: boolean;
}

export default function StepUpload({ state, productImage, productName, onSetPhoto, onClearPhoto, onGenerate, isSubmitting }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const cam = useCamera();

  useEffect(() => {
    if (showCamera) { cam.start("user"); }
    else { cam.stop(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCamera]);

  const handleFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) return;
    if (!ACCEPT.includes(file.type)) return;
    onSetPhoto(file);
  }, [onSetPhoto]);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const takePhoto = () => {
    let c = 3;
    setCountdown(c);
    const t = setInterval(() => {
      c--;
      if (c === 0) {
        clearInterval(t);
        setCountdown(null);
        const file = cam.capture();
        if (file) { onSetPhoto(file); setShowCamera(false); }
      } else { setCountdown(c); }
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-4 p-5 text-white">
      <AnimatePresence mode="wait">
        {showCamera ? (
          <motion.div key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4]">
            {cam.error ? (
              <div className="flex items-center justify-center h-full p-6 text-center text-white/50 text-sm">{cam.error}</div>
            ) : (
              <>
                <video ref={cam.attachStream} autoPlay playsInline muted
                  className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <motion.span key={countdown} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="text-7xl font-bold text-white drop-shadow-2xl">{countdown}</motion.span>
                  </div>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-5">
                  <button onClick={cam.flip} className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur">
                    <FlipHorizontal size={18} />
                  </button>
                  <button onClick={takePhoto} disabled={countdown !== null}
                    className="w-16 h-16 rounded-full bg-white border-4 border-white/40 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50" />
                  <button onClick={() => setShowCamera(false)} className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur">
                    <X size={18} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ) : state.userPhotoPreview ? (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden border border-white/10">
            <img src={state.userPhotoPreview} alt="Your photo" className="w-full max-h-64 object-contain bg-black" />
            <button onClick={onClearPhoto}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur">
              <X size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.div key="drop" onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => fileRef.current?.click()}
            className={`flex flex-col items-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
              ${dragging ? "border-[#C9A96E] bg-[#C9A96E]/5" : "border-white/12 hover:border-white/25 bg-white/[0.02]"}`}>
            <Upload size={30} className="text-white/30" />
            <div className="text-center">
              <p className="text-sm font-medium text-white/70">Drop your photo here</p>
              <p className="text-xs text-white/35 mt-0.5">JPG, PNG or WebP · max 10MB</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileRef} type="file" accept={ACCEPT.join(",")} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      {!showCamera && !state.userPhotoPreview && (
        <button onClick={() => setShowCamera(true)}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:border-white/20 transition-all">
          <Camera size={15} /> Take Photo with Camera
        </button>
      )}

      {state.error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={14} />{state.error}
        </div>
      )}

      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5">
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Photo Tips</p>
        <div className="grid grid-cols-2 gap-1.5">
          {TIPS.map(t => (
            <div key={t} className="text-xs text-white/45 flex items-center gap-1.5">
              <span className="text-[#C9A96E] text-[10px]">✓</span>{t}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
          <img src={productImage} alt={productName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/35">Trying on</p>
          <p className="text-sm font-semibold text-white truncate">{productName}</p>
        </div>
        <motion.button onClick={onGenerate} disabled={!state.userPhotoPreview || isSubmitting}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A96E] text-black font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0">
          {isSubmitting ? <RotateCcw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Generate
        </motion.button>
      </div>
    </div>
  );
}
