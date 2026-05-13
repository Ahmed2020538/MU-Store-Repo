import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, BadgeCheck } from "lucide-react";

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= rating ? "fill-[#C9A96E] text-[#C9A96E]" : "text-white/20"} />
      ))}
    </div>
  );
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
      style={{ background: `linear-gradient(135deg, hsl(${hue},55%,45%), hsl(${(hue + 40) % 360},55%,35%))` }}>
      {initials}
    </div>
  );
}

function TestimonialCard({ t, scale = 1 }: { t: any; scale?: number }) {
  return (
    <div className="text-center px-4 sm:px-8 lg:px-16" style={{ opacity: scale < 1 ? 0.5 : 1, transform: `scale(${scale})`, transformOrigin: "center" }}>
      <div className="text-[80px] leading-none text-[#C9A96E] opacity-20 font-serif select-none -mb-6">"</div>
      <p className="text-lg sm:text-xl lg:text-2xl text-white/90 leading-relaxed font-light italic">{t.reviewText}</p>
      <div className="text-[80px] leading-none text-[#C9A96E] opacity-20 font-serif select-none -mt-4 text-right">"</div>
      <div className="flex justify-center mt-4"><StarRow rating={t.rating ?? 5} /></div>
      <div className="flex items-center justify-center gap-3 mt-6">
        {t.customerAvatarUrl
          ? <img src={t.customerAvatarUrl} alt={t.customerName} className="w-14 h-14 rounded-full object-cover border-2 border-[#C9A96E]/40" />
          : <InitialsAvatar name={t.customerName} />}
        <div className="text-left">
          <p className="font-bold text-white">{t.customerName}</p>
          <p className="text-sm text-[#C9A96E]/80">{t.customerCity}</p>
          {t.verifiedPurchase ? <div className="flex items-center gap-1 mt-0.5"><BadgeCheck size={12} className="text-green-400" /><span className="text-[10px] text-green-400">Verified Purchase</span></div> : null}
          {t.productName && <p className="text-[11px] text-white/40 mt-0.5">👟 {t.productName}</p>}
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [items, setItems] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [countShown, setCountShown] = useState(false);

  useEffect(() => {
    fetch("/api/testimonials").then(r => r.json()).then(d => Array.isArray(d) && setItems(d)).catch(() => {});
  }, []);

  const next = useCallback(() => setIdx(i => (i + 1) % Math.max(items.length, 1)), [items.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1)), [items.length]);

  useEffect(() => {
    if (!playing || items.length < 2) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [playing, items.length, next]);

  useEffect(() => { if (isInView) setCountShown(true); }, [isInView]);

  if (!items.length) return null;

  const avg = (items.reduce((s, t) => s + (t.rating ?? 5), 0) / items.length).toFixed(1);
  const prevIdx = (idx - 1 + items.length) % items.length;
  const nextIdx = (idx + 1) % items.length;

  return (
    <section ref={ref} className="bg-gradient-to-b from-[#1A1A2E] to-[#0d0d1a] py-20 relative overflow-hidden"
      onMouseEnter={() => setPlaying(false)} onMouseLeave={() => setPlaying(true)}>
      {/* Watermark quote */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[320px] font-serif text-[#C9A96E] leading-none" style={{ opacity: 0.025 }}>"</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-2">Reviews</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">What Our Customers Say</h2>
          <div className="mx-auto mt-4 w-20 h-px bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="text-4xl font-bold text-[#C9A96E]">{countShown ? avg : "0"}</span>
            <div>
              <StarRow rating={5} size={18} />
              <p className="text-white/40 text-xs mt-1">Based on {items.length} verified reviews</p>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-4">
          {/* Prev side preview */}
          <div className="hidden lg:block w-56 flex-shrink-0 pointer-events-none">
            <div className="opacity-30 blur-sm scale-90 origin-right">
              <TestimonialCard t={items[prevIdx]} />
            </div>
          </div>

          {/* Main card */}
          <div className="flex-1 min-w-0 relative">
            <AnimatePresence mode="wait">
              <motion.div key={idx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
                <TestimonialCard t={items[idx]} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next side preview */}
          <div className="hidden lg:block w-56 flex-shrink-0 pointer-events-none">
            <div className="opacity-30 blur-sm scale-90 origin-left">
              <TestimonialCard t={items[nextIdx]} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-10">
          <button onClick={() => { prev(); setPlaying(false); }}
            className="w-10 h-10 rounded-full border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/10 flex items-center justify-center transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button key={i} onClick={() => { setIdx(i); setPlaying(false); }}
                className={`rounded-full transition-all duration-300 ${i === idx ? "w-6 h-2.5 bg-[#C9A96E]" : "w-2.5 h-2.5 bg-white/20 hover:bg-white/40"}`} />
            ))}
          </div>
          <button onClick={() => { next(); setPlaying(false); }}
            className="w-10 h-10 rounded-full border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/10 flex items-center justify-center transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
