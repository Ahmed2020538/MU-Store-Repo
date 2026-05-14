import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Sparkles, Heart, ShoppingBag, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";
import { useStyleProfile } from "@/hooks/useStyleProfile";
import MUStylistAvatar from "@/components/MUStylistAvatar";
import StyleDNAQuiz from "@/components/StyleDNAQuiz";
import { toast } from "sonner";

interface Product { id: number; name: string; nameAr?: string | null; price: number; salePrice?: number | null; images: string[]; sizes: string[]; colors: string[]; stock: number; categoryName?: string | null; }
interface OutfitItem { product?: Product; }
interface Outfit { id: number; name: string; nameAr?: string | null; occasion: string; description?: string | null; coverImage?: string | null; items: OutfitItem[]; }

const OCCASIONS = ["all", "casual", "work", "evening", "wedding"];
const OCC_LABEL: Record<string, string> = { all: "All", casual: "Casual", work: "Work", evening: "Evening", wedding: "Wedding" };
const OCC_COLORS: Record<string, string> = { casual: "bg-sky-100 text-sky-700", work: "bg-amber-100 text-amber-800", evening: "bg-purple-100 text-purple-800", wedding: "bg-rose-100 text-rose-700" };

function FadeCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

export default function FashionFeedPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang.startsWith("ar");
  const { addItem } = useCart();
  const { profile, clear } = useStyleProfile();
  const [quizOpen, setQuizOpen] = useState(false);
  const [occasion, setOccasion] = useState("all");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const token = localStorage.getItem("mu_token");

  useEffect(() => {
    const occ = occasion === "all" ? "" : `&occasion=${occasion}`;
    fetch(`/api/outfits?${occ}`).then(r => r.json())
      .then(d => setOutfits(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/products?limit=8&sort=popular").then(r => r.json())
      .then(d => setTrending(Array.isArray(d) ? d : (d.products ?? []))).catch(() => {});
  }, [occasion]);

  const toggleSave = async (outfitId: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) { toast.error("Sign in to save looks"); return; }
    const isSaved = savedIds.has(outfitId);
    await fetch(`/api/outfits/${outfitId}/save`, { method: isSaved ? "DELETE" : "POST", headers: { Authorization: `Bearer ${token}` } });
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(outfitId) : n.add(outfitId); return n; });
    toast.success(isSaved ? "Removed from saved looks" : "Look saved!");
  };

  const quickAdd = (p: Product, e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ productId: p.id, quantity: 1, size: p.sizes?.[0] ?? "38", color: p.colors?.[0] ?? "Black",
      product: { id: p.id, name: p.name, price: p.price, salePrice: p.salePrice, images: p.images, stock: p.stock } });
    toast.success(`${p.name} added`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <StyleDNAQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />

      {/* Hero header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <MUStylistAvatar size={48} />
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-[#C9A96E] mb-1 font-medium">Editorial</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">{isRTL ? "إلهام الموضة" : "Fashion Feed"}</h1>
            <p className="text-sm text-muted-foreground mt-1">{isRTL ? "إطلالات منتقاة بعناية" : "Curated looks & trending styles"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/5">
              <Sparkles size={11} className="text-[#C9A96E]" />
              <span className="text-xs text-[#C9A96E] font-medium capitalize">{profile.vibe} · {profile.occasion}</span>
              <button onClick={() => { clear(); setQuizOpen(true); }} className="text-[10px] text-muted-foreground hover:text-foreground ml-1">retake</button>
            </div>
          ) : (
            <button onClick={() => setQuizOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#C9A96E]/40 text-[#C9A96E] text-xs font-semibold hover:bg-[#C9A96E]/10 transition-colors">
              <Sparkles size={12} /> Discover Your Style
            </button>
          )}
        </div>
      </div>

      {/* Occasion filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-none">
        <Filter size={14} className="text-muted-foreground self-center flex-shrink-0" />
        {OCCASIONS.map(o => (
          <button key={o} onClick={() => setOccasion(o)}
            className={`flex-shrink-0 text-xs px-4 py-1.5 rounded-full border font-medium transition-all ${
              occasion === o ? "bg-[#C9A96E] text-[#1A1A2E] border-[#C9A96E]" : "border-border text-muted-foreground hover:border-[#C9A96E]/50"
            }`}>
            {OCC_LABEL[o]}
          </button>
        ))}
      </div>

      {/* Curated outfits */}
      {outfits.length > 0 && (
        <section className="mb-14">
          <h2 className="font-serif text-xl font-bold mb-5">{isRTL ? "إطلالات منتقاة" : "Styled Looks"}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {outfits.map((outfit, i) => {
              const prods = (outfit.items ?? []).filter(it => it.product).map(it => it.product!);
              const name = isRTL && outfit.nameAr ? outfit.nameAr : outfit.name;
              return (
                <FadeCard key={outfit.id} delay={i * 0.06}>
                  <div className="rounded-2xl border border-border overflow-hidden bg-card hover:border-[#C9A96E]/40 transition-colors group">
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      {outfit.coverImage
                        ? <img src={outfit.coverImage} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600" />
                        : <div className="grid grid-cols-2 h-full">{prods.slice(0, 4).map((p, pi) => (
                            <div key={pi} className="overflow-hidden"><img src={p.images?.[0] ?? ""} alt={p.name} className="w-full h-full object-cover" /></div>
                          ))}</div>}
                      <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${OCC_COLORS[outfit.occasion] ?? "bg-white/80 text-foreground"}`}>{outfit.occasion}</span>
                        <button onClick={e => toggleSave(outfit.id, e)}
                          className={`p-1.5 rounded-full transition-all shadow-sm ${savedIds.has(outfit.id) ? "bg-rose-500 text-white" : "bg-white/80 text-muted-foreground hover:text-rose-500"}`}>
                          <Heart size={13} fill={savedIds.has(outfit.id) ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-serif font-semibold text-sm mb-2">{name}</p>
                      <div className="flex gap-1 flex-wrap">
                        {prods.slice(0, 3).map(p => (
                          <Link key={p.id} href={`/products/${p.id}`}
                            className="text-[10px] border border-border rounded-full px-2 py-0.5 hover:border-[#C9A96E]/60 hover:text-[#C9A96E] transition-colors">
                            {p.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </FadeCard>
              );
            })}
          </div>
        </section>
      )}

      {/* Trending products */}
      {trending.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-bold mb-5">{isRTL ? "الأكثر طلباً" : "Trending Now"}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {trending.map((p, i) => (
              <FadeCard key={p.id} delay={i * 0.04}>
                <Link href={`/products/${p.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-2">
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-x-2 bottom-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={e => quickAdd(p, e)}
                        className="w-full bg-background/95 backdrop-blur-sm rounded-xl py-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-lg">
                        <ShoppingBag size={11} /> Add to Cart
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium truncate">{isRTL && p.nameAr ? p.nameAr : p.name}</p>
                  <p className="text-sm text-[#C9A96E] font-bold">{(p.salePrice ?? p.price).toLocaleString()} EGP</p>
                </Link>
              </FadeCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
