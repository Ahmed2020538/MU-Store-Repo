import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ExternalLink } from "lucide-react";
import MapModal from "./MapModal";
import ShareButton from "./ShareButton";
import { useStoreContact } from "./StoreConfig";

export { default as MapModal } from "./MapModal";
export { default as ShareButton } from "./ShareButton";
export { useStoreContact } from "./StoreConfig";

// ── LocationButton ────────────────────────────────────────────────────────────
// Small inline pin button — opens MapModal on click
export function LocationButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const store = useStoreContact();

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#C9A96E] transition-colors group ${className}`}
        title="View store location"
      >
        <MapPin size={13} className="text-[#C9A96E] group-hover:scale-110 transition-transform" />
        <span>Available in store · Cairo</span>
      </motion.button>
      <MapModal open={open} onClose={() => setOpen(false)} store={store} />
    </>
  );
}

// ── StoreLocationSection ──────────────────────────────────────────────────────
// Full section for use in footer and standalone pages
export function StoreLocationSection() {
  const [mapOpen, setMapOpen] = useState(false);
  const store = useStoreContact();
  const mapsUrl = store.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(store.addressEn)}`;

  return (
    <section className="border-t border-background/10 pt-8 pb-2" aria-label="Store location">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-xs tracking-[0.20em] uppercase text-[#C9A96E] font-medium mb-1">Visit Us</p>
          <h3 className="font-serif text-xl font-bold text-background">Find Our Store</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMapOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-background/20 text-sm text-background/70 hover:text-background hover:border-background/40 hover:bg-background/5 transition-all"
          >
            <MapPin size={14} /> View Map
          </button>
          <ShareButton store={store} variant="dark" />
        </div>
      </div>

      {/* Embedded OpenStreetMap — no API key required */}
      <div className="rounded-2xl overflow-hidden border border-background/10 h-44 mb-4 group relative">
        <iframe
          src={store.mapEmbedUrl}
          className="w-full h-full border-0 grayscale opacity-75 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500"
          loading="lazy"
          title="MU Store location"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* Address + Directions */}
      <address
        className="not-italic flex flex-col sm:flex-row sm:items-start justify-between gap-3"
        itemScope itemType="https://schema.org/LocalBusiness"
      >
        <div>
          <span itemProp="name" className="font-semibold text-sm text-background block">{store.storeName}</span>
          <p itemProp="address" className="text-sm text-background/60 mt-0.5">{store.addressEn}</p>
          {store.workingHours && <p className="text-xs text-background/40 mt-0.5">{store.workingHours}</p>}
        </div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A96E] text-[#1A1A2E] text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all self-start sm:self-center whitespace-nowrap">
          <ExternalLink size={13} /> Get Directions
        </a>
      </address>

      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} store={store} />
    </section>
  );
}
