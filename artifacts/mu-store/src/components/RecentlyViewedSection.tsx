import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { getRecentlyViewed, type RecentProduct } from "@/lib/recently-viewed";

export default function RecentlyViewedSection({ excludeId }: { excludeId?: number }) {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    const load = () => {
      const all = getRecentlyViewed();
      setProducts(excludeId ? all.filter(p => p.id !== excludeId) : all);
    };
    load();
    window.addEventListener("mu_recently_viewed_updated", load);
    return () => window.removeEventListener("mu_recently_viewed_updated", load);
  }, [excludeId]);

  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={15} className="text-[#C9A96E]" />
        <p className="text-xs tracking-[0.2em] uppercase text-[#C9A96E] font-medium">Recently Viewed</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.slice(0, 5).map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="group"
          >
            <Link href={`/products/${p.id}`}>
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted relative shadow-sm group-hover:shadow-md transition-all duration-300">
                {p.images[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                )}
              </div>
              <p className="font-medium text-xs mt-2 leading-tight group-hover:text-[#C9A96E] transition-colors line-clamp-2">
                {p.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {(p.salePrice ?? p.price).toLocaleString()} EGP
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
