import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, RotateCcw, ScanLine } from "lucide-react";

const PLACEHOLDER_MODEL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Shoe/glTF-Binary/Shoe.glb";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ModelViewer = "model-viewer" as any;

export interface ShoeVariant {
  id: string | number;
  label: string;
  thumbnail: string;
  modelUrl?: string;
}

type Props = {
  modelUrl?: string | null;
  productName: string;
  posterUrl?: string;
  variants?: ShoeVariant[];
};

export default function AR3DViewer({ modelUrl, productName, posterUrl, variants = [] }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [arSupported, setArSupported] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const viewerRef = useRef<HTMLElement | null>(null);

  const activeModel = variants[activeIdx]?.modelUrl ?? modelUrl ?? PLACEHOLDER_MODEL;
  const isPlaceholder = !modelUrl && !variants[activeIdx]?.modelUrl;

  useEffect(() => {
    setArSupported(/Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  useEffect(() => { setLoaded(false); }, [activeModel]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const onLoad = () => setLoaded(true);
    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
  }, [activeModel]);

  const handleAR = () => { (viewerRef.current as any)?.activateAR?.(); };
  const handleReset = () => {
    const el = viewerRef.current as any;
    el?.resetTurntableRotation?.();
  };

  const qrUrl = typeof window !== "undefined"
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=0B1623&margin=8`
    : "";

  return (
    <div className="space-y-3">
      {/* ── Viewer card ── */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-md"
        style={{ background: "linear-gradient(145deg,#fafaf9 0%,#f0ede8 100%)", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        {/* model-viewer */}
        <div className="relative aspect-square">
          <ModelViewer
            ref={viewerRef}
            src={activeModel}
            alt={`3D view of ${productName}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            auto-rotate-delay="2000"
            shadow-intensity="1"
            shadow-softness="1"
            environment-image="neutral"
            exposure="1.15"
            poster={posterUrl}
            loading="eager"
            style={{ width: "100%", height: "100%", background: "transparent" }}
          />

          {/* Loading overlay */}
          <AnimatePresence>
            {!loaded && (
              <motion.div
                initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
                style={{ background: "linear-gradient(145deg,#fafaf9 0%,#f0ede8 100%)" }}
              >
                <div className="w-8 h-8 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
                <p className="text-xs text-neutral-400">Loading 3D model…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating: reset button */}
          <button
            onClick={handleReset}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-white transition-all"
            title="Reset view"
          >
            <RotateCcw size={13} />
          </button>

          {/* Placeholder notice */}
          {isPlaceholder && loaded && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-[10px] text-white/75 font-medium">
              Sample 3D model
            </div>
          )}

          {/* Drag hint */}
          {loaded && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <span className="text-[10px] bg-black/40 backdrop-blur-sm text-white/90 px-3 py-1 rounded-full whitespace-nowrap">
                Drag to rotate · Pinch to zoom
              </span>
            </motion.div>
          )}
        </div>

        {/* ── Dot pagination (color variants) ── */}
        {variants.length > 1 && (
          <div className="flex justify-center gap-1.5 pt-2 pb-3">
            {variants.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx ? "w-5 h-2 bg-[#C9A96E]" : "w-2 h-2 bg-neutral-300 hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── AR Button (mobile) / QR Code (desktop) ── */}
      {arSupported ? (
        <motion.button
          onClick={handleAR}
          whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm"
          style={{ background: "#C9A96E", color: "#0B1623" }}
        >
          <Smartphone size={15} />
          Try On with AR
        </motion.button>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border">
          <img
            src={qrUrl}
            alt="Scan to try in AR"
            className="w-[70px] h-[70px] rounded-xl flex-shrink-0 bg-white"
            loading="lazy"
          />
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <ScanLine size={13} className="text-[#C9A96E] flex-shrink-0" />
              Try in AR on your phone
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scan to open on your phone and place the shoe in your real environment with your camera.
            </p>
          </div>
        </div>
      )}

      {/* ── Shoe switcher ── */}
      {variants.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground mb-2">Colors</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {variants.map((v, i) => (
              <button key={v.id} onClick={() => setActiveIdx(i)} className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
                <div
                  className={`w-[68px] h-[68px] rounded-xl overflow-hidden transition-all duration-200 ${
                    i === activeIdx
                      ? "ring-2 ring-[#C9A96E] shadow-lg shadow-[#C9A96E]/25"
                      : "ring-1 ring-transparent hover:ring-border"
                  }`}
                >
                  <img src={v.thumbnail} alt={v.label} className="w-full h-full object-cover" />
                </div>
                <span className={`text-[10px] font-medium transition-colors leading-tight ${i === activeIdx ? "text-[#C9A96E]" : "text-muted-foreground"}`}>
                  {v.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
