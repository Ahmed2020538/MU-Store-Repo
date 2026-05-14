import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, ZoomIn, ZoomOut, SlidersHorizontal, Sparkles, MoveIcon } from "lucide-react";
import { useCamera } from "./useCamera";
import { useTryOnOverlay } from "./useTryOnOverlay";
import { usePoseDetection } from "./usePoseDetection";
import type { Landmarks } from "./usePoseDetection";
import TryOnCapture from "./TryOnCapture";

interface Props {
  open: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  productCategory: string;
}

type TrackStatus = "loading" | "scanning" | "tracking" | "lost";

export default function TryItOnModal({ open, onClose, productName, productImage, productCategory }: Props) {
  const { videoRef, state, start, stop, flip } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [opacity, setOpacity] = useState(85);
  const [scale, setScale] = useState(100);
  const [showSliders, setShowSliders] = useState(false);
  const [trackStatus, setTrackStatus] = useState<TrackStatus>("loading");

  // Stable refs — read by RAF loop without needing deps
  const opacityRef = useRef(opacity);
  const scaleRef = useRef(scale);
  const categoryRef = useRef(productCategory);
  const landmarksRef = useRef<Landmarks>(null);
  useEffect(() => { opacityRef.current = opacity; }, [opacity]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { categoryRef.current = productCategory; }, [productCategory]);

  const onLandmarks = useCallback((lm: Landmarks, tracking: boolean) => {
    landmarksRef.current = lm;
    setTrackStatus(tracking ? "tracking" : "scanning");
  }, []);

  const { startLoop, stopLoop, onPointerDown, onPointerMove, onPointerUp } =
    useTryOnOverlay(videoRef, canvasRef, productImage, categoryRef, opacityRef, scaleRef, landmarksRef);

  const { start: startPose, stop: stopPose } = usePoseDetection(videoRef, onLandmarks);

  // Open: start camera
  useEffect(() => {
    if (!open) return;
    setTrackStatus("loading");
    landmarksRef.current = null;
    start("user");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Camera active: kick off render loop + pose detection
  useEffect(() => {
    if (state === "active") {
      startLoop();
      setTrackStatus("scanning");
      startPose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const close = useCallback(() => {
    stopLoop();
    stopPose();
    stop();
    landmarksRef.current = null;
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, close]);

  const statusBadge = () => {
    if (state !== "active") return null;
    if (trackStatus === "loading") return (
      <span className="text-xs text-white/50">Initializing…</span>
    );
    if (trackStatus === "scanning") return (
      <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-xs text-[#C9A96E] font-medium">AI Scanning…</motion.span>
    );
    if (trackStatus === "tracking") return (
      <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
        className="text-xs text-green-400 font-medium">✓ Tracking Live</motion.span>
    );
    return <span className="text-xs text-white/40">Reposition yourself</span>;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[3000] bg-black flex flex-col overflow-hidden">

          <video ref={videoRef} className="hidden" muted playsInline autoPlay />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pb-3"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={14} className="text-[#C9A96E] flex-shrink-0" />
              <span className="text-white text-sm font-medium truncate">{productName}</span>
              <AnimatePresence mode="wait">{statusBadge()}</AnimatePresence>
            </div>
            <button onClick={close}
              className="ml-3 w-9 h-9 flex-shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Camera canvas */}
          {state === "active" && (
            <canvas ref={canvasRef}
              className="flex-1 w-full object-cover touch-none"
              style={{ cursor: "move" }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
          )}
          {state === "requesting" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-2 border-white/20 border-t-[#C9A96E] rounded-full animate-spin" />
              <p className="text-white/40 text-sm">Starting camera…</p>
            </div>
          )}
          {state === "denied" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <X size={28} className="text-white/40" />
              </div>
              <p className="text-white text-lg font-semibold">Camera access denied</p>
              <p className="text-white/50 text-sm max-w-xs leading-relaxed">
                Enable camera permission in your browser settings, then reload the page.
              </p>
            </div>
          )}
          {(state === "unavailable" || state === "idle") && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/40 text-sm">No camera available on this device.</p>
            </div>
          )}

          {/* Controls bar */}
          {state === "active" && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.1 }}
              className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-5 space-y-2.5"
              style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(14px)" }}>

              <button onClick={() => setShowSliders(s => !s)}
                className="flex items-center gap-1.5 mx-auto text-white/50 hover:text-white/80 text-xs transition-colors">
                <SlidersHorizontal size={12} />
                {showSliders ? "Hide adjustments" : "Adjust overlay"}
              </button>

              <AnimatePresence>
                {showSliders && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-white/50 text-xs w-16 flex-shrink-0">Opacity</span>
                      <input type="range" min={20} max={100} value={opacity}
                        onChange={e => setOpacity(+e.target.value)} className="flex-1 accent-[#C9A96E] h-1" />
                      <span className="text-white/50 text-xs w-8 text-right">{opacity}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/50 text-xs w-16 flex-shrink-0">Size</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setScale(s => Math.max(40, s - 10))}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                          <ZoomOut size={13} />
                        </button>
                        <span className="text-white text-xs w-10 text-center font-medium">{scale}%</span>
                        <button onClick={() => setScale(s => Math.min(220, s + 10))}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                          <ZoomIn size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-0.5">
                <button onClick={flip}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">
                  <RotateCcw size={14} /> Flip
                </button>
                <p className="text-white/30 text-[11px] hidden sm:flex items-center gap-1">
                  <MoveIcon size={10} /> Drag to reposition
                </p>
                <TryOnCapture canvasRef={canvasRef} productName={productName} />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
