import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, ExternalLink, Clock } from "lucide-react";
import type { StoreContact } from "./StoreConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  store: StoreContact;
}

export default function MapModal({ open, onClose, store }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapsUrl = store.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(store.addressEn)}`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (!ref.current?.contains(e.target as Node)) onClose(); }}
        >
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-[#C9A96E]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{store.storeName}</p>
                  {store.workingHours && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={11} /> {store.workingHours}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            {/* Embedded map */}
            <div className="h-56 bg-muted relative">
              <iframe
                src={store.mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                title="Store location map"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>

            {/* Address + CTA */}
            <div className="px-5 py-4 space-y-3">
              <address className="not-italic" itemScope itemType="https://schema.org/LocalBusiness">
                <meta itemProp="name" content={store.storeName} />
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin size={14} className="text-[#C9A96E] mt-0.5 flex-shrink-0" />
                  <span itemProp="address">{store.addressEn}</span>
                </div>
              </address>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#C9A96E] text-[#1A1A2E] text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
                <ExternalLink size={14} /> Get Directions
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
