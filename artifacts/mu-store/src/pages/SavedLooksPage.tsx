import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, Sparkles, Trash2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface OutfitProduct { id: number; name: string; nameAr?: string | null; price: number; salePrice?: number | null; images: string[]; }
interface OutfitItem { id: number; role: string; product?: OutfitProduct; }
interface Outfit { id: number; name: string; nameAr?: string | null; occasion: string; description?: string | null; descriptionAr?: string | null; coverImage?: string | null; items: OutfitItem[]; savedId?: number; }

const OCCASION_COLORS: Record<string, string> = {
  casual: "bg-sky-100 text-sky-700", work: "bg-amber-100 text-amber-800",
  evening: "bg-purple-100 text-purple-800", wedding: "bg-rose-100 text-rose-700",
};

export default function SavedLooksPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang.startsWith("ar");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("mu_token");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch("/api/outfits/saved", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setOutfits(Array.isArray(data) ? data : []))
      .catch(() => setOutfits([]))
      .finally(() => setLoading(false));
  }, [token]);

  const unsave = async (outfitId: number) => {
    try {
      await fetch(`/api/outfits/${outfitId}/save`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setOutfits(prev => prev.filter(o => o.id !== outfitId));
      toast.success("Removed from saved looks");
    } catch { toast.error("Could not remove look"); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#C9A96E]/15 flex items-center justify-center">
          <Heart size={18} className="text-[#C9A96E]" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold">{isRTL ? "إطلالاتي المحفوظة" : "My Saved Looks"}</h1>
          <p className="text-sm text-muted-foreground">{isRTL ? "إطلالات منتقاة بعناية من MU Stylists" : "Curated looks saved from MU Stylists"}</p>
        </div>
      </div>

      {!token && (
        <div className="text-center py-24">
          <Sparkles size={40} className="text-[#C9A96E] mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-6">{isRTL ? "سجلي دخولك لحفظ إطلالاتك" : "Sign in to save and view your looks"}</p>
          <Button asChild><Link href="/login">Sign In <ArrowRight size={15} className="ml-1" /></Link></Button>
        </div>
      )}

      {token && loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map(i => <div key={i} className="rounded-2xl bg-muted animate-pulse h-72" />)}
        </div>
      )}

      {token && !loading && outfits.length === 0 && (
        <div className="text-center py-24">
          <Heart size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">{isRTL ? "لا توجد إطلالات محفوظة بعد" : "No saved looks yet"}</p>
          <p className="text-sm text-muted-foreground mb-6">{isRTL ? "استكشفي منتجاتنا واحفظي الإطلالات التي تعجبك" : "Browse products and save looks you love"}</p>
          <Button asChild variant="outline"><Link href="/products">{isRTL ? "تصفح المنتجات" : "Browse Products"}</Link></Button>
        </div>
      )}

      {token && !loading && outfits.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {outfits.map((outfit, i) => {
            const products = outfit.items.filter(item => item.product).map(item => item.product!);
            const name = isRTL && outfit.nameAr ? outfit.nameAr : outfit.name;
            const desc = isRTL && outfit.descriptionAr ? outfit.descriptionAr : outfit.description;
            return (
              <motion.div key={outfit.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border overflow-hidden bg-card hover:border-[#C9A96E]/40 transition-colors group">
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {outfit.coverImage
                    ? <img src={outfit.coverImage} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : (
                      <div className="grid grid-cols-2 h-full">
                        {products.slice(0, 4).map((p, pi) => (
                          <div key={pi} className="overflow-hidden">
                            <img src={p.images?.[0] ?? ""} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${OCCASION_COLORS[outfit.occasion] ?? "bg-white/80 text-foreground"}`}>
                      {outfit.occasion}
                    </span>
                    <button onClick={() => unsave(outfit.id)}
                      className="p-1.5 rounded-full bg-white/80 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-serif font-semibold text-sm mb-1">{name}</p>
                  {desc && <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">{desc}</p>}
                  <div className="flex gap-1.5 flex-wrap">
                    {products.slice(0, 3).map(p => (
                      <Link key={p.id} href={`/products/${p.id}`}
                        className="text-[10px] border border-border rounded-full px-2 py-0.5 hover:border-[#C9A96E]/60 hover:text-[#C9A96E] transition-colors">
                        {isRTL && (p as never as { nameAr?: string }).nameAr ? (p as never as { nameAr: string }).nameAr : p.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
