import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Smartphone, X, RotateCcw, ZoomIn, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

// Web component alias — avoids JSX IntrinsicElements declaration complexity
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ModelViewer = "model-viewer" as any;

type AR3DViewerProps = {
  modelUrl: string;
  productName: string;
  posterUrl?: string;
};

export default function AR3DViewer({ modelUrl, productName, posterUrl }: AR3DViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [arSupported, setArSupported] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const viewerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setArSupported(/Android|iPhone|iPad/i.test(navigator.userAgent));
    }
  }, []);

  const handleARClick = () => {
    const el = viewerRef.current as any;
    if (el?.activateAR) el.activateAR();
  };

  return (
    <div className="space-y-3">
      {/* Viewer */}
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-muted/60 to-muted shadow-lg">
        <ModelViewer
          ref={viewerRef}
          src={modelUrl}
          alt={`3D model of ${productName}`}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1"
          poster={posterUrl}
          loading="lazy"
          reveal="auto"
          style={{ width: "100%", height: "100%", background: "transparent" }}
          onLoad={() => setLoaded(true)}
        />

        {/* Loading overlay */}
        <AnimatePresence>
          {!loaded && (
            <motion.div
              initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted"
            >
              <div className="w-10 h-10 border-2 border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground">Loading 3D model…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls hint */}
        {loaded && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none"
          >
            <span className="text-[10px] bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full">
              Drag to rotate · Pinch to zoom
            </span>
          </motion.div>
        )}

        {/* Info toggle */}
        <button
          onClick={() => setShowInfo(v => !v)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          {showInfo ? <X size={14} /> : <Info size={14} />}
        </button>

        {/* Info panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute top-14 right-3 w-56 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-xl text-xs space-y-1.5"
            >
              <p className="font-semibold text-sm">3D Viewer Controls</p>
              <p className="text-muted-foreground">🖱 <strong>Drag</strong> — rotate the model</p>
              <p className="text-muted-foreground">🤏 <strong>Pinch / Scroll</strong> — zoom in/out</p>
              <p className="text-muted-foreground">📱 <strong>Try in AR</strong> — place in your space</p>
              {arSupported && <p className="text-[#C9A96E] font-medium">✓ AR supported on your device</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action bar */}
      <div className="flex gap-2">
        <button
          onClick={() => { const el = viewerRef.current as any; el?.resetTurntableRotation?.(); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors"
        >
          <RotateCcw size={12} /> Reset
        </button>
        <button
          onClick={() => { const el = viewerRef.current as any; el?.zoom?.(1.5); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors"
        >
          <ZoomIn size={12} /> Zoom in
        </button>
        {arSupported ? (
          <Button
            onClick={handleARClick}
            size="sm"
            className="flex-1 rounded-xl bg-[#C9A96E] text-[#0B1623] hover:bg-[#C9A96E]/90 font-semibold text-xs h-9"
          >
            <Smartphone size={13} className="mr-1.5" /> Try in AR
          </Button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted/50 text-xs text-muted-foreground">
            <Box size={12} /> AR available on mobile
          </div>
        )}
      </div>

      {/* AR CTA for desktop */}
      {!arSupported && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-xs">
          <Smartphone size={14} className="text-[#C9A96E] flex-shrink-0" />
          <p className="text-muted-foreground">
            <span className="text-[#C9A96E] font-semibold">Try in AR on mobile</span> — open this product on your phone to place it in your real space using your camera.
          </p>
        </div>
      )}
    </div>
  );
}
