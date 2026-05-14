import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

interface Product {
  id: number; name: string; price: number; salePrice?: number | null;
  images: string[]; sizes: string[]; colors: string[]; stock: number;
}

interface Props { productCategory?: string; }

function getCompCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes("bag")) return "heels";
  return "bags";
}

export default function TryOnRecommendations({ productCategory }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    if (!productCategory) return;
    const cat = getCompCategory(productCategory);
    fetch(`/api/products?category=${cat}&limit=4`)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : (d.products ?? [])))
      .catch(() => {});
  }, [productCategory]);

  if (!products.length) return null;

  const quickAdd = (p: Product, e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: p.id, quantity: 1,
      size: p.sizes?.[0] ?? "38",
      color: p.colors?.[0] ?? "Black",
      product: { id: p.id, name: p.name, price: p.price, salePrice: p.salePrice, images: p.images, stock: p.stock },
    });
    toast.success(`${p.name} added`);
  };

  return (
    <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-1.5 mb-3 px-5">
        <Sparkles size={12} className="text-[#C9A96E]" />
        <p className="text-xs font-semibold text-white/70">Complete your look</p>
      </div>
      <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 scrollbar-none">
        {products.slice(0, 4).map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex-shrink-0 w-24">
            <Link href={`/products/${p.id}`}>
              <div className="group relative aspect-square rounded-xl overflow-hidden mb-1.5"
                style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
                <img src={p.images?.[0] ?? ""} alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                <button onClick={e => quickAdd(p, e)}
                  className="absolute inset-x-1 bottom-1 py-1 rounded-lg text-[9px] font-semibold flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(201,169,110,0.92)", color: "#1A1A2E" }}>
                  <ShoppingBag size={9} /> Add
                </button>
              </div>
              <p className="text-[10px] text-white/55 truncate leading-tight">{p.name}</p>
              <p className="text-[10px] text-[#C9A96E] font-bold">{(p.salePrice ?? p.price).toLocaleString()} EGP</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
