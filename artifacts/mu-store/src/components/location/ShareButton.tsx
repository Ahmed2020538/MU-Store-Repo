import { useState, useRef, useEffect, useCallback } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { FaWhatsapp, FaFacebook } from "react-icons/fa6";
import { toast } from "sonner";
import type { StoreContact } from "./StoreConfig";

interface Props {
  store: StoreContact;
  className?: string;
  variant?: "light" | "dark";
}

export default function ShareButton({ store, className = "", variant = "light" }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mapsUrl = store.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(store.addressEn)}`;
  const shareText = `Find us here: ${store.storeName} — ${store.addressEn}`;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleClick = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title: store.storeName, text: shareText, url: mapsUrl }); } catch { /* cancelled */ }
      return;
    }
    setOpen(o => !o);
  }, [store, mapsUrl, shareText]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(mapsUrl);
    setCopied(true);
    toast.success("Store location link copied!");
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  const isDark = variant === "dark";
  const btnClass = isDark
    ? "flex items-center gap-1.5 px-3 py-2 rounded-xl border border-background/20 text-sm text-background/70 hover:text-background hover:border-background/40 hover:bg-background/5 transition-all"
    : "flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted transition-all";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button onClick={handleClick} className={btnClass}>
        <Share2 size={14} />
        <span>Share</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-52 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
          <button onClick={copyLink}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left">
            {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} className="text-muted-foreground" />}
            <span>{copied ? "Copied!" : "Copy link"}</span>
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${mapsUrl}`)}`}
            target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors">
            <FaWhatsapp size={15} style={{ color: "#25D366" }} /> Share on WhatsApp
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(mapsUrl)}`}
            target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors">
            <FaFacebook size={15} style={{ color: "#1877F2" }} /> Share on Facebook
          </a>
        </div>
      )}
    </div>
  );
}
