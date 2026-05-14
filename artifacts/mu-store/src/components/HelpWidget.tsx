import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Ruler, Truck, RotateCcw, Phone, MessageCircle } from "lucide-react";
import { Link } from "wouter";

const HELP_LINKS = [
  { icon: Ruler, label: "Size Guide", href: "/size-guide", desc: "Find your perfect fit", color: "text-[#C9A96E]", bg: "bg-[#C9A96E]/10" },
  { icon: Truck, label: "Shipping Policy", href: "/shipping", desc: "Delivery times & costs", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: RotateCcw, label: "Returns & Exchanges", href: "/returns", desc: "14-day easy returns", color: "text-purple-500", bg: "bg-purple-500/10" },
  { icon: Phone, label: "Contact Us", href: "/contact", desc: "We're here to help", color: "text-green-500", bg: "bg-green-500/10" },
];

export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    // bottom-20 = 80px (above WhatsApp at 20px + 48px height + 12px gap)
    <div ref={ref} className="fixed bottom-20 right-5 z-[1000]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-full right-0 mb-3 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-[#1A1A2E] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">Help Center</p>
                <p className="text-white/50 text-xs">What can we help you with?</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-2">
              {HELP_LINKS.map(({ icon: Icon, label, href, desc, color, bg }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={color} />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
              <div className="border-t border-border mt-1 pt-2 px-3 pb-1">
                <a href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-600 font-medium hover:text-green-700 transition-colors py-1">
                  <MessageCircle size={16} /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        className="relative w-10 h-10 rounded-full bg-[#1A1A2E] text-white shadow-lg flex items-center justify-center hover:bg-[#1A1A2E]/90 transition-colors"
        aria-label="Help center"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={18} /></motion.div>
            : <motion.div key="h" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><HelpCircle size={20} /></motion.div>
          }
        </AnimatePresence>
        {pulse && !open && (
          <span className="absolute inset-0 rounded-full bg-[#C9A96E]/40 animate-ping" />
        )}
      </motion.button>
    </div>
  );
}
