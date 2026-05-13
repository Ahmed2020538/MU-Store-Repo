import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

const FALLBACK = [
  "Baldinini", "Zitrone Berlin", "Enni Marco", "Mario Rossi Collezioni",
  "Steve Madden", "Aldo", "Nine West", "Charles & Keith", "Guess", "Michael Kors",
].map((name, i) => ({ id: i, name, logoUrl: null, websiteUrl: null }));

function BrandCard({ brand }: { brand: any }) {
  const card = (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 12px 32px rgba(201,169,110,0.25)" }}
      transition={{ duration: 0.25 }}
      className="flex-shrink-0 w-44 h-20 bg-[#F9F5F0] rounded-xl flex items-center justify-center px-4
                 border border-transparent hover:border-[#C9A96E] transition-colors duration-300 cursor-default"
    >
      {brand.logoUrl
        ? <img src={brand.logoUrl} alt={brand.name} className="max-h-12 max-w-[140px] object-contain" loading="lazy" />
        : <span className="font-serif text-sm font-bold text-[#1A1A2E] tracking-wide text-center leading-snug select-none">{brand.name}</span>}
    </motion.div>
  );
  return brand.websiteUrl
    ? <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer">{card}</a>
    : <>{card}</>;
}

export default function BrandsCarousel() {
  const [brands, setBrands] = useState<any[]>([]);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    fetch("/api/brands").then(r => r.json()).then(d => Array.isArray(d) && d.length && setBrands(d)).catch(() => {});
  }, []);

  const items = brands.length >= 3 ? brands : FALLBACK;
  const row1 = [...items, ...items, ...items];
  const row2 = [...items, ...items, ...items];

  return (
    <section ref={ref} className="bg-[#1A1A2E] py-16 overflow-hidden relative">
      {/* Grain overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <style>{`
        @keyframes mu-scroll-left  { 0% { transform: translateX(0); }    100% { transform: translateX(calc(-100% / 3)); } }
        @keyframes mu-scroll-right { 0% { transform: translateX(calc(-100% / 3)); } 100% { transform: translateX(0); } }
        .mu-row-left  { animation: mu-scroll-left  40s linear infinite; }
        .mu-row-right { animation: mu-scroll-right 32s linear infinite; }
        .mu-paused .mu-row-left,
        .mu-paused .mu-row-right { animation-play-state: paused; }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 px-4"
      >
        <p className="text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-2">Our Partners</p>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">Brands We Carry</h2>
        <p className="font-serif text-xl text-[#C9A96E]/60 mt-1 italic">الماركات المتاحة</p>
        <div className="mx-auto mt-4 w-20 h-px bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
      </motion.div>

      <div
        className={paused ? "mu-paused space-y-4" : "space-y-4"}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="overflow-hidden">
          <div className="mu-row-left flex gap-4" style={{ width: "max-content" }}>
            {row1.map((b, i) => <BrandCard key={`r1-${b.id}-${i}`} brand={b} />)}
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="mu-row-right flex gap-4" style={{ width: "max-content" }}>
            {row2.map((b, i) => <BrandCard key={`r2-${b.id}-${i}`} brand={b} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
