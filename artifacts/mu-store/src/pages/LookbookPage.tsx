import { useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useListProducts } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

function ProductCard({ p }: { p: any }) {
  const { addItem } = useCart();
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ productId: p.id, quantity: 1, size: p.sizes?.[0] ?? "38", color: p.colors?.[0] ?? "Black",
      product: { id: p.id, name: p.name, price: p.price, salePrice: p.salePrice, images: p.images, stock: p.stock } });
    toast.success(`${p.name} added to cart`);
  };
  return (
    <Link href={`/products/${p.id}`} className="group block">
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted relative shadow-sm group-hover:shadow-xl transition-shadow duration-500">
        {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button onClick={handleAdd} className="w-full bg-background/95 backdrop-blur-sm rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-background transition-colors shadow-lg">
            <ShoppingBag size={11} /> Add to Cart
          </button>
        </div>
        {p.salePrice && (
          <span className="absolute top-2.5 left-2.5 bg-[#D4608A] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
            -{Math.round((1 - p.salePrice / p.price) * 100)}% OFF
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="font-medium text-sm leading-tight group-hover:text-[#C9A96E] transition-colors">{p.name}</p>
        <p className="text-sm font-bold mt-0.5">{(p.salePrice ?? p.price).toLocaleString()} EGP</p>
      </div>
    </Link>
  );
}

export default function LookbookPage() {
  const { data: heels } = useListProducts({ category: "heels", limit: 4, sort: "most_reviewed" });
  const { data: bags } = useListProducts({ category: "bags", limit: 4, sort: "most_reviewed" });
  const { data: featured } = useListProducts({ limit: 8, sort: "best_selling" });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-[70vh] min-h-[500px] bg-[#0B1623] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1623] via-[#0B1623]/80 to-[#1a2535]" />
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1400')] bg-cover bg-center" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <p className="text-[#C9A96E] text-xs tracking-[0.4em] uppercase font-semibold mb-4">The MU Edit — Spring 2026</p>
            <h1 className="font-serif text-5xl sm:text-7xl font-bold text-white leading-none mb-6">
              Crafted for<br />
              <span className="text-[#C9A96E]">Every Story</span>
            </h1>
            <p className="text-white/70 text-lg max-w-md mb-8">Handcrafted luxury shoes and bags for the Egyptian woman who defines her own elegance.</p>
            <Link href="/products">
              <Button className="bg-[#C9A96E] text-[#0B1623] hover:bg-[#C9A96E]/90 font-semibold rounded-xl px-8 h-12 text-sm">
                Shop the Collection <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Heels Story */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <p className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase font-semibold mb-4">Chapter I</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold leading-tight mb-6">The Height<br />of Elegance</h2>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">
                Each heel is a statement — sculptured with precision, finished with care. From ballroom to boardroom, MU heels carry you through every chapter of your day.
              </p>
              <Link href="/products?category=heels">
                <Button variant="outline" className="rounded-xl border-2">
                  Shop Heels <ArrowRight size={15} className="ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {heels?.products?.slice(0, 4).map((p, i) => (
                <FadeIn key={p.id} delay={i * 0.08}>
                  <ProductCard p={p} />
                </FadeIn>
              )) ?? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div>
          </div>
        </FadeIn>

        {/* Divider */}
        <div className="flex items-center gap-6 my-16">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[#C9A96E] font-serif text-2xl">MU</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Bags Story */}
        <FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="grid grid-cols-2 gap-4 order-2 lg:order-1">
              {bags?.products?.slice(0, 4).map((p, i) => (
                <FadeIn key={p.id} delay={i * 0.08}>
                  <ProductCard p={p} />
                </FadeIn>
              )) ?? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase font-semibold mb-4">Chapter II</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold leading-tight mb-6">The Art<br />of the Bag</h2>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">
                A MU bag is not just an accessory — it is an heirloom in the making. Structured silhouettes, buttery leathers, and finishes that only improve with time.
              </p>
              <Link href="/products?category=bags">
                <Button variant="outline" className="rounded-xl border-2">
                  Shop Bags <ArrowRight size={15} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* Featured grid */}
        <FadeIn>
          <div className="text-center mb-12">
            <p className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase font-semibold mb-3">Best Sellers</p>
            <h2 className="font-serif text-4xl font-bold">Most Loved</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {featured?.products?.slice(0, 8).map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.05}>
                <ProductCard p={p} />
              </FadeIn>
            )) ?? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
          </div>
          <div className="text-center">
            <Link href="/products">
              <Button variant="outline" className="rounded-xl border-2 px-8 h-12">
                View All Products <ArrowRight size={15} className="ml-2" />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
