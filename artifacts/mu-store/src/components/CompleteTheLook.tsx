import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Sparkles, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import MUStylistAvatar from "@/components/MUStylistAvatar";
import StyleDNAQuiz from "@/components/StyleDNAQuiz";
import { useStyleProfile } from "@/hooks/useStyleProfile";

interface Product {
  id: number; name: string; nameAr?: string | null;
  price: number; salePrice?: number | null;
  images: string[]; categoryName?: string | null;
  isFeatured?: boolean; isNew?: boolean;
}

interface Props {
  productId: number;
  productName: string;
  categoryName?: string | null;
  colors?: string[];
}

const OCCASIONS = [
  { key: "all", en: "All", ar: "الكل" },
  { key: "casual", en: "Casual", ar: "يومي" },
  { key: "work", en: "Work", ar: "عمل" },
  { key: "evening", en: "Evening", ar: "سهرة" },
  { key: "wedding", en: "Wedding", ar: "زفاف" },
];

function getComplementaryCategory(cat: string | null | undefined): string {
  const c = (cat ?? "").toLowerCase();
  if (["bags", "bag", "حقائب"].some(k => c.includes(k))) return "heels";
  return "bags";
}

function stylistTip(lang: string, productName: string, complementary: string, colors?: string[]): string {
  const isAr = lang.startsWith("ar");
  const colorHint = colors?.length ? (isAr ? ` — اختاري درجة ${colors[0]}` : ` Pick up the ${colors[0].toLowerCase()} tone.`) : "";
  if (isAr) {
    return complementary === "bags"
      ? `حقيبة أنيقة ستكمل إطلالتك مع ${productName} بأسلوب فاخر.${colorHint}`
      : `${productName} مثالية مع كعب أنيق لإطلالة كاملة.${colorHint}`;
  }
  return complementary === "bags"
    ? `A structured bag elevates ${productName} into an editorial-worthy look.${colorHint}`
    : `Complete your bag with a heel that matches its elegance.${colorHint}`;
}

export default function CompleteTheLook({ productId, productName, categoryName, colors }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang.startsWith("ar");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useStyleProfile();
  const [quizOpen, setQuizOpen] = useState(false);
  const [occasion, setOccasion] = useState(profile?.occasion ?? "all");
  const complementary = getComplementaryCategory(categoryName);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${productId}/recommendations`)
      .then(r => r.json())
      .then((list: Product[]) => {
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [productId]);

  const filtered = occasion === "all" ? products : products.filter((_, i) => {
    const buckets = ["casual", "work", "evening", "wedding"];
    return buckets.indexOf(occasion) === i % 4 || products.length < 4;
  });
  const shown = (occasion === "all" ? products : filtered).slice(0, 4);

  if (!loading && products.length === 0) return null;

  const label = isRTL ? "أكملي إطلالتك" : "Complete the Look";
  const poweredBy = isRTL ? "بواسطة MU Stylist AI" : "by MU Stylist AI";

  return (
    <section className="mt-14 pt-10 border-t border-border">
      <StyleDNAQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MUStylistAvatar size={26} pulse={false} />
          <h2 className="text-lg font-serif font-bold">{label}</h2>
          <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-full">{poweredBy}</span>
          {profile && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20 capitalize">{profile.vibe}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!profile && (
            <button onClick={() => setQuizOpen(true)}
              className="text-[10px] text-[#C9A96E] border border-[#C9A96E]/30 px-2 py-0.5 rounded-full hover:bg-[#C9A96E]/10 transition-colors flex items-center gap-1">
              <Sparkles size={9} /> {isRTL ? "اكتشفي أسلوبك" : "Your Style DNA"}
            </button>
          )}
          <Link href={`/products?category=${complementary}`}
            className="flex items-center gap-1 text-xs text-[#C9A96E] hover:underline font-medium">
            {isRTL ? "عرض الكل" : "View all"} <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Occasion tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {OCCASIONS.map(o => (
          <button key={o.key} onClick={() => setOccasion(o.key)}
            className={`text-[11px] px-3 py-1 rounded-full border transition-all font-medium ${
              occasion === o.key
                ? "bg-[#C9A96E] text-[#1A1A2E] border-[#C9A96E]"
                : "border-border text-muted-foreground hover:border-[#C9A96E]/50 hover:text-[#C9A96E]"
            }`}>
            {isRTL ? o.ar : o.en}
          </button>
        ))}
      </div>

      {/* Stylist tip */}
      <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#C9A96E]/6 border border-[#C9A96E]/15">
        <div className="w-6 h-6 rounded-full bg-[#C9A96E]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles size={11} className="text-[#C9A96E]" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed" dir={isRTL ? "rtl" : "ltr"}>
          <span className="text-foreground font-semibold">{isRTL ? "نصيحة المصممة: " : "Stylist tip: "}</span>
          {stylistTip(lang, productName, complementary, colors)}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {shown.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>
              <Link href={`/products/${p.id}`}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-2 border border-border group-hover:border-[#C9A96E]/40 transition-colors shadow-sm">
                    <img src={p.images?.[0] ?? ""} alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {p.isFeatured && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] bg-[#C9A96E] text-[#1A1A2E] font-bold px-1.5 py-0.5 rounded-full">
                        {isRTL ? "مميز" : "Top Pick"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold truncate">{lang.startsWith("ar") && p.nameAr ? p.nameAr : p.name}</p>
                  <p className="text-xs text-[#C9A96E] font-bold mt-0.5">{(p.salePrice ?? p.price).toLocaleString()} EGP</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
