import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Truck, RotateCcw, Star } from "lucide-react";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { slug: "heels", label: "Heels", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400" },
  { slug: "flats", label: "Flats", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400" },
  { slug: "boots", label: "Boots", image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400" },
  { slug: "bags", label: "Bags", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400" },
  { slug: "accessories", label: "Accessories", image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400" },
];

const TRUST_BADGES = [
  { icon: Truck, label: "Free Shipping", sub: "On orders over 500 EGP" },
  { icon: RotateCcw, label: "Easy Returns", sub: "14-day return policy" },
  { icon: Shield, label: "Secure Payment", sub: "100% protected" },
  { icon: Star, label: "Made in Egypt", sub: "Premium craftsmanship" },
];

function HeroSection() {
  const [idx, setIdx] = useState(0);
  const headlines = ["Where Every Step", "Tells Your Story", "Walk in Luxury"];

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % headlines.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-foreground">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #C9A96E 0%, transparent 60%), radial-gradient(circle at 80% 20%, #D4608A 0%, transparent 50%)" }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-4">Premium Egyptian Brand</span>
          </motion.div>
          <div className="h-32 sm:h-24 overflow-hidden">
            <motion.h1 key={idx} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.5 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-background leading-tight">
              {headlines[idx]}
            </motion.h1>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-6 text-background/70 text-lg max-w-md leading-relaxed">
            Handcrafted luxury shoes and bags, designed for the modern Egyptian woman who knows her worth.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8 flex gap-4 flex-wrap">
            <Button asChild size="lg" className="bg-[#C9A96E] text-foreground hover:bg-[#C9A96E]/90 font-semibold px-8" data-testid="button-shop-now">
              <Link href="/products">Shop Now <ArrowRight size={16} className="ml-2" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-background/30 text-background hover:bg-background/10">
              <Link href="/products?category=bags">Shop Bags</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function NewArrivalsSection() {
  const { data, isLoading } = useListProducts({ sort: "newest", limit: 6 });
  const products = data?.products ?? [];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#C9A96E] mb-1">Fresh Arrivals</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">New Arrivals</h2>
        </div>
        <Link href="/products?sort=newest" className="text-sm font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          View All <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 gap-y-6">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)
          : products.slice(0, 6).map(p => (
            <motion.div key={p.id} whileHover={{ y: -4 }} className="group cursor-pointer" data-testid={`card-product-${p.id}`}>
              <Link href={`/products/${p.id}`}>
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted relative">
                  {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                  {p.isNew && <span className="absolute top-2 left-2 bg-foreground text-background text-xs px-2 py-0.5 rounded font-medium">New</span>}
                  {p.isSale && <span className="absolute top-2 right-2 bg-[#D4608A] text-white text-xs px-2 py-0.5 rounded font-medium">Sale</span>}
                </div>
                <div className="mt-3">
                  <p className="font-medium text-sm leading-tight">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {p.salePrice ? (
                      <>
                        <span className="font-bold text-[#D4608A]">{p.salePrice.toLocaleString()} EGP</span>
                        <span className="text-xs text-muted-foreground line-through">{p.price.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="font-semibold text-sm">{p.price.toLocaleString()} EGP</span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section className="bg-muted/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-[#C9A96E] mb-1">Explore</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link href={`/products?category=${cat.slug}`} className="group block" data-testid={`link-category-${cat.slug}`}>
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted relative">
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-foreground/40 group-hover:bg-foreground/50 transition-colors flex items-end p-4">
                    <span className="font-serif text-xl font-bold text-background">{cat.label}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-border hover:border-[#C9A96E] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
              <Icon size={22} className="text-[#C9A96E]" />
            </div>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BestSellersSection() {
  const { data, isLoading } = useListProducts({ sort: "best_selling", limit: 4 });
  const products = data?.products ?? [];

  return (
    <section className="bg-foreground py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase text-[#C9A96E] mb-1">Customer Favorites</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-background">Best Sellers</h2>
          </div>
          <Link href="/products?sort=best_selling" className="text-sm font-medium flex items-center gap-1 text-background/60 hover:text-background transition-colors">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl opacity-20" />)
            : products.map(p => (
              <Link key={p.id} href={`/products/${p.id}`} className="group" data-testid={`card-bestseller-${p.id}`}>
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-background/10 relative">
                  {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                  {(p.soldCount ?? 0) > 100 && <span className="absolute top-2 left-2 bg-[#D4608A] text-white text-xs px-2 py-0.5 rounded font-medium">Hot</span>}
                </div>
                <div className="mt-3">
                  <p className="font-medium text-sm text-background leading-tight">{p.name}</p>
                  <p className="font-bold text-[#C9A96E] mt-1">{(p.salePrice ?? p.price).toLocaleString()} EGP</p>
                  <p className="text-xs text-background/50 mt-0.5">{(p.soldCount ?? 0)}+ sold</p>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <NewArrivalsSection />
      <CategoriesSection />
      <TrustSection />
      <BestSellersSection />
    </div>
  );
}
