import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Mic, Camera, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/lib/search-context";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import i18n from "@/i18n";

const DEFAULT: HeroConfig = {
  headlines: ["Walk in Luxury", "Crafted for Your Style", "Styled by AI"],
  subtext: "Handcrafted luxury shoes and bags, designed for the modern Egyptian woman who knows her worth.",
  badge: "Premium Egyptian Brand",
  primaryCta: { text: "Shop Now", link: "/products" },
  secondaryCta: { text: "Shop Bags", link: "/products?category=bags" },
  features: { aiStylist: true, tryOn: true, voiceShopping: true },
  socialProof: { count: 2400, rating: 4.9, label: "Egyptian women" },
  urgency: { enabled: true, message: "Limited Collection — New arrivals selling fast" },
};

export interface HeroConfig {
  headlines: string[];
  subtext: string;
  badge: string;
  primaryCta: { text: string; link: string };
  secondaryCta: { text: string; link: string };
  features: { aiStylist: boolean; tryOn: boolean; voiceShopping: boolean };
  socialProof: { count: number; rating: number; label: string };
  urgency: { enabled: boolean; message: string };
}

function useCountUp(target: number, delay = 800): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1600;
      const step = target / (duration / 16);
      let v = 0;
      const t = setInterval(() => {
        v += step;
        if (v >= target) { setCount(target); clearInterval(t); }
        else setCount(Math.floor(v));
      }, 16);
      return () => clearInterval(t);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return count;
}

export default function HeroSection() {
  const [cfg, setCfg] = useState<HeroConfig>(DEFAULT);
  const [idx, setIdx] = useState(0);
  const [greeting, setGreeting] = useState("");
  const { setOpen: setSearchOpen } = useSearch();
  const [, setLocation] = useLocation();
  const count = useCountUp(cfg.socialProof.count);

  useEffect(() => {
    fetch("/api/settings/hero").then(r => r.json()).then(d => setCfg(c => ({ ...c, ...d }))).catch(() => {});
    try {
      const user = JSON.parse(localStorage.getItem("mu_user") ?? "null");
      const first = user?.name?.split(" ")[0];
      setGreeting(first ? `Welcome back, ${first}` : "Discover Your Style");
    } catch { setGreeting("Discover Your Style"); }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % cfg.headlines.length), 3400);
    return () => clearInterval(t);
  }, [cfg.headlines.length]);

  const voice = useVoiceSearch({
    lang: i18n.language,
    onResult: (t) => { setSearchOpen(false); setLocation(`/products?search=${encodeURIComponent(t)}`); },
  });

  const handleVoice = useCallback(() => {
    if (voice.state === "listening") { voice.stop(); return; }
    setSearchOpen(true);
    setTimeout(() => voice.start(), 200);
  }, [setSearchOpen, voice]);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-foreground">
      <motion.div animate={{ x:[0,40,0], y:[0,-30,0], scale:[1,1.1,1] }}
        transition={{ duration:10, repeat:Infinity, ease:"easeInOut" }}
        className="absolute top-1/4 left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background:"radial-gradient(circle, rgba(201,169,110,0.18) 0%, transparent 70%)" }} />
      <motion.div animate={{ x:[0,-30,0], y:[0,25,0], scale:[1,0.95,1] }}
        transition={{ duration:13, repeat:Infinity, ease:"easeInOut", delay:2 }}
        className="absolute bottom-1/4 right-[5%] w-[380px] h-[380px] rounded-full pointer-events-none"
        style={{ background:"radial-gradient(circle, rgba(212,96,138,0.14) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage:"linear-gradient(rgba(201,169,110,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,110,1) 1px, transparent 1px)", backgroundSize:"60px 60px" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <div>
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
              {greeting && (
                <p className="text-[#C9A96E]/75 text-sm font-medium mb-3 flex items-center gap-1.5">
                  <Sparkles size={11} /> {greeting}
                </p>
              )}
              <span className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-5 border border-[#C9A96E]/30 px-4 py-1.5 rounded-full">
                <Sparkles size={10} /> {cfg.badge}
              </span>
            </motion.div>

            <div className="h-28 sm:h-24 overflow-hidden mb-2">
              <AnimatePresence mode="wait">
                <motion.h1 key={idx}
                  initial={{ y:50, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:-50, opacity:0 }}
                  transition={{ duration:0.55, ease:[0.22,1,0.36,1] }}
                  className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-background leading-tight">
                  {cfg.headlines[idx]}
                </motion.h1>
              </AnimatePresence>
            </div>

            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4, duration:0.8 }}
              className="mt-4 text-background/60 text-lg max-w-md leading-relaxed font-light">{cfg.subtext}</motion.p>

            {cfg.urgency.enabled && (
              <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.55 }}
                className="mt-4 inline-flex items-center gap-2 bg-[#D4608A]/12 border border-[#D4608A]/25 text-[#D4608A] text-xs px-3.5 py-1.5 rounded-full font-medium">
                <Zap size={10} /> {cfg.urgency.message}
              </motion.div>
            )}

            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
              className="mt-8 flex gap-3 flex-wrap">
              <Button asChild size="lg"
                className="bg-[#C9A96E] text-[#1A1A2E] hover:bg-[#D4B87E] font-semibold px-8 shadow-lg shadow-[#C9A96E]/25 hover:shadow-xl hover:shadow-[#C9A96E]/35 transition-all duration-300 hover:-translate-y-0.5"
                data-testid="button-shop-now">
                <Link href={cfg.primaryCta.link}>{cfg.primaryCta.text} <ArrowRight size={15} className="ml-1.5" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg"
                className="border-background/25 text-background hover:bg-background/10 hover:border-background/40 transition-all duration-300 hover:-translate-y-0.5">
                <Link href={cfg.secondaryCta.link}>{cfg.secondaryCta.text}</Link>
              </Button>
            </motion.div>

            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.82 }}
              className="mt-3 flex flex-wrap gap-2">
              {cfg.features.aiStylist && (
                <button onClick={() => setLocation("/products")}
                  className="flex items-center gap-1.5 text-xs text-background/65 hover:text-[#C9A96E] border border-background/12 hover:border-[#C9A96E]/40 px-4 py-2 rounded-full transition-all duration-200 hover:bg-[#C9A96E]/5">
                  <Sparkles size={11} /> Get Styled by AI
                </button>
              )}
              {cfg.features.tryOn && (
                <button onClick={() => setLocation("/products")}
                  className="flex items-center gap-1.5 text-xs text-background/65 hover:text-[#C9A96E] border border-background/12 hover:border-[#C9A96E]/40 px-4 py-2 rounded-full transition-all duration-200 hover:bg-[#C9A96E]/5">
                  <Camera size={11} /> Try It On Instantly
                </button>
              )}
              {cfg.features.voiceShopping && voice.state !== "unsupported" && (
                <button onClick={handleVoice}
                  className={`flex items-center gap-1.5 text-xs border px-4 py-2 rounded-full transition-all duration-200 ${voice.state === "listening" ? "text-red-400 border-red-400/35 bg-red-400/8 animate-pulse" : "text-background/65 hover:text-[#C9A96E] border-background/12 hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/5"}`}>
                  <Mic size={11} /> {voice.state === "listening" ? "Listening…" : "Speak to Shop"}
                </button>
              )}
            </motion.div>

            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.1 }}
              className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-2">
                {["bg-rose-400","bg-amber-400","bg-sky-400","bg-emerald-400"].map((c,i) => (
                  <motion.div key={i} whileHover={{ y:-2, zIndex:10 }}
                    className={`w-8 h-8 rounded-full ${c} border-2 border-[#1A1A2E] flex items-center justify-center cursor-default`}>
                    <span className="text-white text-[10px] font-bold">{["S","N","R","A"][i]}</span>
                  </motion.div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {Array(5).fill(0).map((_,i) => <Star key={i} size={11} className={i < Math.floor(cfg.socialProof.rating) ? "text-[#C9A96E] fill-[#C9A96E]" : "text-[#C9A96E]/25"} />)}
                  </div>
                  <span className="text-background/55 text-xs font-semibold">{cfg.socialProof.rating}</span>
                </div>
                <p className="text-xs text-background/40">
                  Loved by <span className="text-[#C9A96E] font-bold">{count.toLocaleString()}+</span> {cfg.socialProof.label}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right — lifestyle visual */}
          <motion.div initial={{ opacity:0, x:28 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3, duration:0.8 }}
            className="hidden lg:block relative">
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-background/10">
              <img src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85"
                alt="MU luxury shoes" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 via-transparent to-transparent" />
              <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-foreground/75 backdrop-blur-sm text-[#C9A96E] text-[10px] font-semibold px-3 py-1.5 rounded-full border border-[#C9A96E]/20">
                <Sparkles size={9} /> AI Styled Look
              </div>
              <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }}
                className="absolute bottom-5 left-5 right-5 bg-background/92 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    <img src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=100" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">Most Loved This Week</p>
                    <div className="flex gap-0.5 mt-0.5">{Array(5).fill(0).map((_,i) => <Star key={i} size={9} className="text-[#C9A96E] fill-[#C9A96E]" />)}</div>
                  </div>
                  <Link href="/products?sort=best_selling"
                    className="flex-shrink-0 text-[10px] bg-[#C9A96E] text-[#1A1A2E] font-bold px-3 py-1.5 rounded-full hover:bg-[#D4B87E] transition-colors">
                    Shop
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] tracking-[0.2em] uppercase text-background/22">Scroll</span>
        <motion.div animate={{ y:[0,6,0] }} transition={{ duration:1.5, repeat:Infinity, ease:"easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-[#C9A96E]/45 to-transparent" />
      </motion.div>
    </section>
  );
}
