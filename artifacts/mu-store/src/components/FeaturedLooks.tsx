import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Heart, Sparkles, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface OutfitProduct { id: number; name: string; nameAr?: string | null; price: number; salePrice?: number | null; images: string[]; }
interface OutfitItem { id: number; role: string; product?: OutfitProduct; }
interface Outfit { id: number; name: string; nameAr?: string | null; occasion: string; description?: string | null; descriptionAr?: string | null; coverImage?: string | null; items: OutfitItem[]; }

const OCCASION_COLORS: Record<string, string> = {
  casual: "bg-sky-100 text-sky-700", work: "bg-amber-100 text-amber-800",
  evening: "bg-purple-100 text-purple-800", wedding: "bg-rose-100 text-rose-700",
};

function SaveButton({ outfitId }: { outfitId: number }) {
  const [saved, setSaved] = useState(false);
  const token = localStorage.getItem("mu_token");

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) { toast.error("Sign in to save looks"); return; }
    try {
      const method = saved ? "DELETE" : "POST";
      await fetch(`/api/outfits/${outfitId}/save`, { method, headers: { Authorization: `Bearer ${token}` } });
      setSaved(s => !s);
      toast.success(saved ? "Removed from saved looks" : "Look saved!");
    } catch { toast.error("Could not save look"); }
  };

  return (
    <button onClick={toggle}
      className={`p-2 rounded-full transition-all ${saved ? "bg-rose-500 text-white" : "bg-white/80 text-muted-foreground hover:text-rose-500"} shadow-sm`}>
      <Heart size={14} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

export default function FeaturedLooks({ productId }: { productId: number }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang.startsWith("ar");
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  useEffect(() => {
    fetch(`/api/outfits?productId=${productId}`)
      .then(r => r.json())
      .then(async (list: Outfit[]) => {
        if (!list.length) return;
        const detailed = await Promise.all(list.slice(0, 3).map(o =>
          fetch(`/api/outfits/${o.id}`).then(r => r.json())
        ));
        setOutfits(detailed);
      })
      .catch(() => {});
  }, [productId]);

  if (!outfits.length) return null;

  return (
    <section className="mt-12 pt-10 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#C9A96E]" />
          <h2 className="text-lg font-serif font-bold">{isRTL ? "إطلالات مميزة" : "Styled Looks"}</h2>
          <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-full">
            {isRTL ? "بواسطة فريق MU" : "curated by MU Stylists"}
          </span>
        </div>
        <Link href="/lookbook" className="flex items-center gap-1 text-xs text-[#C9A96E] hover:underline font-medium">
          {isRTL ? "مزيد من الإطلالات" : "More looks"} <ChevronRight size={13} />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {outfits.map((outfit, oi) => {
          const products = outfit.items.filter(i => i.product).map(i => i.product!);
          const name = isRTL && outfit.nameAr ? outfit.nameAr : outfit.name;
          const desc = isRTL && outfit.descriptionAr ? outfit.descriptionAr : outfit.description;
          return (
            <motion.div key={outfit.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: oi * 0.1 }}
              className="rounded-2xl border border-border overflow-hidden bg-card hover:border-[#C9A96E]/40 transition-colors group">
              {/* Cover */}
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {outfit.coverImage
                  ? <img src={outfit.coverImage} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : (
                    <div className="grid grid-cols-2 h-full">
                      {products.slice(0, 4).map((p, i) => (
                        <div key={i} className="overflow-hidden">
                          <img src={p.images?.[0] ?? ""} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      ))}
                    </div>
                  )}
                <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${OCCASION_COLORS[outfit.occasion] ?? "bg-white/80 text-foreground"}`}>
                    {outfit.occasion}
                  </span>
                  <SaveButton outfitId={outfit.id} />
                </div>
              </div>
              {/* Info */}
              <div className="p-3.5">
                <p className="font-serif font-semibold text-sm leading-snug mb-1">{name}</p>
                {desc && <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2" dir={isRTL ? "rtl" : "ltr"}>{desc}</p>}
                <div className="flex gap-1 flex-wrap">
                  {products.slice(0, 3).map(p => (
                    <Link key={p.id} href={`/products/${p.id}`}
                      className="text-[10px] border border-border rounded-full px-2 py-0.5 hover:border-[#C9A96E]/60 hover:text-[#C9A96E] transition-colors truncate max-w-[120px]">
                      {isRTL && (p as never as { nameAr?: string }).nameAr ? (p as never as { nameAr: string }).nameAr : p.name}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
