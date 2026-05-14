import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Sparkles, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Product {
  id: number; name: string; nameAr?: string | null;
  price: number; salePrice?: number | null;
  images: string[]; categoryName?: string | null;
}

interface Props {
  productId: number;
  productName: string;
  categoryName?: string | null;
  colors?: string[];
}

function getComplementaryCategory(cat: string | null | undefined): string {
  const c = (cat ?? "").toLowerCase();
  if (["bags", "bag", "حقائب"].some(k => c.includes(k))) return "heels";
  return "bags";
}

function stylistTip(lang: string, productName: string, complementary: string): string {
  const isAr = lang.startsWith("ar");
  if (isAr) {
    if (complementary === "bags") return `حقيبة أنيقة ستكمل إطلالتك مع ${productName} بأسلوب فاخر يعكس الجمال المصري الأصيل.`;
    return `${productName} مثالية مع كعب أنيق لإطلالة كاملة تجمع بين الفخامة والأصالة.`;
  }
  if (complementary === "bags") return `A structured bag will elevate your ${productName} into a complete, editorial-worthy look. Our stylists suggest a contrasting tone for maximum impact.`;
  return `Complete your bag with a heel that matches its elegance — our stylists picked these for you.`;
}

export default function CompleteTheLook({ productId, productName, categoryName, colors }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [products, setProducts] = useState<Product[]>([]);
  const complementary = getComplementaryCategory(categoryName);

  useEffect(() => {
    fetch(`/api/products?category=${complementary}&limit=6`)
      .then(r => r.json())
      .then(d => {
        const list: Product[] = Array.isArray(d) ? d : d.products ?? [];
        setProducts(list.filter(p => p.id !== productId).slice(0, 4));
      })
      .catch(() => {});
  }, [productId, complementary]);

  if (products.length === 0) return null;

  const isRTL = lang.startsWith("ar");
  const label = isRTL ? "أكملي إطلالتك" : "Complete the Look";
  const poweredBy = isRTL ? "بواسطة MU Stylist AI" : "by MU Stylist AI";

  return (
    <section className="mt-14 pt-10 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#C9A96E]" />
          <h2 className="text-lg font-serif font-bold">{label}</h2>
          <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-full">{poweredBy}</span>
        </div>
        <Link href={`/products?category=${complementary}`}
          className="flex items-center gap-1 text-xs text-[#C9A96E] hover:underline font-medium">
          {isRTL ? "عرض الكل" : "View all"} <ChevronRight size={13} />
        </Link>
      </div>

      {/* Stylist tip */}
      <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#C9A96E]/6 border border-[#C9A96E]/15">
        <div className="w-6 h-6 rounded-full bg-[#C9A96E]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles size={11} className="text-[#C9A96E]" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed" dir={isRTL ? "rtl" : "ltr"}>
          <span className="text-foreground font-semibold">{isRTL ? "نصيحة المصممة: " : "Stylist tip: "}</span>
          {stylistTip(lang, productName, complementary)}
          {colors && colors.length > 0 && !isRTL && ` Pick up the ${colors[0].toLowerCase()} tone from your selection.`}
        </p>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {products.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}>
            <Link href={`/products/${p.id}`}>
              <div className="group cursor-pointer">
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-2 border border-border group-hover:border-[#C9A96E]/40 transition-colors shadow-sm">
                  <img src={p.images?.[0] ?? ""} alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <p className="text-xs font-semibold truncate">{lang.startsWith("ar") && p.nameAr ? p.nameAr : p.name}</p>
                <p className="text-xs text-[#C9A96E] font-bold mt-0.5">
                  {(p.salePrice ?? p.price).toLocaleString()} EGP
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
