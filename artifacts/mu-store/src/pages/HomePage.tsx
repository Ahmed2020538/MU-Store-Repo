import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Shield, Truck, RotateCcw, Star, Clock } from "lucide-react";
import { useListProducts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BrandsCarousel from "@/components/BrandsCarousel";
import TestimonialsSection from "@/components/TestimonialsSection";
import { getRecentlyViewed, type RecentProduct } from "@/lib/recently-viewed";
import HeroSection from "@/components/HeroSection";

const CATEGORIES = [
  { slug: "heels", label: "Heels", sub: "High Heels", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600" },
  { slug: "flats", label: "Flats", sub: "Flat Shoes", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600" },
  { slug: "boots", label: "Boots", sub: "Ankle & Knee", image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600" },
  { slug: "bags", label: "Bags", sub: "Handbags & Totes", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600" },
  { slug: "accessories", label: "Accessories", sub: "Belts & More", image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600" },
];

const TRUST_BADGES = [
  { icon: Truck, label: "Free Shipping", sub: "On orders over 500 EGP", color: "#C9A96E" },
  { icon: RotateCcw, label: "Easy Returns", sub: "14-day return policy", color: "#6E9EC9" },
  { icon: Shield, label: "Secure Payment", sub: "100% protected", color: "#9EC96E" },
  { icon: Star, label: "Made in Egypt", sub: "Premium craftsmanship", color: "#D4608A" },
];


function SectionHeader({ eyebrow, title, centered = false }: { eyebrow: string; title: string; centered?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }} className={centered ? "text-center" : ""}>
      <p className="text-xs tracking-[0.28em] uppercase text-[#C9A96E] mb-2 font-medium">{eyebrow}</p>
      <h2 className="font-serif text-3xl sm:text-4xl font-bold">{title}</h2>
      <div className={`mt-4 h-px w-16 bg-gradient-to-r from-[#C9A96E] to-transparent ${centered ? "mx-auto" : ""}`} />
    </motion.div>
  );
}

function ProductCard({ p, index = 0 }: { p: any; index?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="group cursor-pointer"
      data-testid={`card-product-${p.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/products/${p.id}`}>
        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted relative shadow-sm group-hover:shadow-xl transition-all duration-500">
          {p.images[0] && (
            <img
              src={hovered && p.images[1] ? p.images[1] : p.images[0]}
              alt={p.name}
              className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          )}
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {p.isNew && <span className="bg-foreground/90 backdrop-blur-sm text-background text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide">NEW</span>}
            {p.isSale && <span className="bg-[#D4608A] text-white text-[10px] px-2.5 py-1 rounded-full font-semibold">SALE</span>}
          </div>
          {/* Quick-view label */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="bg-background/95 backdrop-blur-sm rounded-xl px-3 py-2 text-xs font-semibold text-foreground text-center shadow-lg">
              View Product →
            </div>
          </div>
        </div>
        <div className="mt-3.5 space-y-1">
          <p className="font-medium text-sm leading-snug group-hover:text-[#C9A96E] transition-colors duration-300">{p.name}</p>
          {p.rating && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">{Array(5).fill(0).map((_,i) => <span key={i} className={`text-[11px] ${i < Math.round(p.rating) ? "text-[#C9A96E]" : "text-muted-foreground/25"}`}>★</span>)}</div>
              <span className="text-[11px] text-muted-foreground">({p.reviewCount})</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {p.salePrice ? (
              <><span className="font-bold text-[#D4608A]">{p.salePrice.toLocaleString()} EGP</span>
              <span className="text-xs text-muted-foreground line-through">{p.price.toLocaleString()}</span></>
            ) : (
              <span className="font-semibold text-sm">{p.price.toLocaleString()} EGP</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function NewArrivalsSection() {
  const { data, isLoading } = useListProducts({ sort: "newest", limit: 6 });
  const products = data?.products ?? [];
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex items-end justify-between mb-10">
        <SectionHeader eyebrow="Fresh Arrivals" title="New Arrivals" />
        <Link href="/products?sort=newest"
          className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground hover:text-[#C9A96E] transition-colors group">
          View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 gap-y-8">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)
          : products.slice(0, 6).map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
      </div>
    </section>
  );
}

function CategoriesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/40" />
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12"><SectionHeader eyebrow="Explore" title="Shop by Category" centered /></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.slug}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}>
              <Link href={`/products?category=${cat.slug}`} className="group block" data-testid={`link-category-${cat.slug}`}>
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted relative shadow-md group-hover:shadow-2xl transition-all duration-500">
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                  {/* Border glow on hover */}
                  <div className="absolute inset-0 border-2 border-[#C9A96E]/0 group-hover:border-[#C9A96E]/60 rounded-2xl transition-all duration-500" />
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <span className="font-serif text-xl font-bold text-white leading-tight">{cat.label}</span>
                    <span className="text-white/60 text-xs mt-0.5">{cat.sub}</span>
                    <span className="text-[#C9A96E] text-xs mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-1 group-hover:translate-y-0">
                      Shop now <ArrowRight size={11} />
                    </span>
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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <section ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TRUST_BADGES.map(({ icon: Icon, label, sub, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-[#C9A96E]/30 transition-all duration-300 cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300"
              style={{ background: `${color}18` }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function BestSellersSection() {
  const { data, isLoading } = useListProducts({ sort: "best_selling", limit: 4 });
  const products = data?.products ?? [];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-20 overflow-hidden bg-foreground mu-noise">
      {/* Animated accent */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 right-0 w-[600px] h-[600px] opacity-5 pointer-events-none"
        style={{ background: "conic-gradient(from 0deg, #C9A96E, transparent, #D4608A, transparent, #C9A96E)" }}
      />
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.28em] uppercase text-[#C9A96E] mb-2 font-medium">Customer Favorites</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-background">Best Sellers</h2>
            <div className="mt-4 h-px w-16 bg-gradient-to-r from-[#C9A96E] to-transparent" />
          </div>
          <Link href="/products?sort=best_selling"
            className="text-sm font-medium flex items-center gap-1.5 text-background/50 hover:text-[#C9A96E] transition-colors group">
            View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl opacity-20" />)
            : products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="group"
                data-testid={`card-bestseller-${p.id}`}
              >
                <Link href={`/products/${p.id}`}>
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-background/10 relative shadow-lg group-hover:shadow-2xl transition-all duration-500">
                    {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                    {(p.soldCount ?? 0) > 100 && (
                      <span className="absolute top-3 left-3 bg-[#D4608A] text-white text-[10px] px-2.5 py-1 rounded-full font-semibold">🔥 Hot</span>
                    )}
                  </div>
                  <p className="font-medium text-sm text-background mt-3 leading-snug group-hover:text-[#C9A96E] transition-colors">{p.name}</p>
                  <p className="font-bold text-[#C9A96E] mt-1">{(p.salePrice ?? p.price).toLocaleString()} EGP</p>
                  <p className="text-xs text-background/40 mt-0.5">{(p.soldCount ?? 0).toLocaleString()}+ sold</p>
                </Link>
              </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}

function PromoBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className="mx-4 sm:mx-6 lg:mx-auto max-w-7xl lg:px-8 my-8"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1A1A2E] via-[#242442] to-[#1A1A2E] px-8 py-10 sm:px-12 sm:py-14 shadow-2xl">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,169,110,0.2) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-[#C9A96E] mb-2">Exclusive Offer</p>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">Get 20% Off Your First Order</h3>
            <p className="text-white/50 text-sm mt-1">Use code <span className="text-[#C9A96E] font-bold tracking-widest">MU20</span> at checkout</p>
          </div>
          <Button asChild size="lg"
            className="flex-shrink-0 bg-[#C9A96E] text-[#1A1A2E] hover:bg-[#D4B87E] font-bold px-8 shadow-lg shadow-[#C9A96E]/30 hover:-translate-y-0.5 transition-all">
            <Link href="/products">Shop Now</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

function RecentlyViewedSection() {
  const [items, setItems] = useState<RecentProduct[]>([]);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    const load = () => setItems(getRecentlyViewed());
    load();
    window.addEventListener("mu_recently_viewed_updated", load);
    return () => window.removeEventListener("mu_recently_viewed_updated", load);
  }, []);

  if (items.length === 0) return null;

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
            <Clock size={16} className="text-[#C9A96E]" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold">Recently Viewed</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pick up where you left off</p>
          </div>
        </div>
        <Link href="/products" className="text-sm text-[#C9A96E] font-medium hover:underline flex items-center gap-1">
          See all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.slice(0, 4).map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.07, duration: 0.45 }}
          >
            <Link href={`/products/${item.id}`}>
              <div className="group rounded-2xl border border-border overflow-hidden bg-card hover:border-[#C9A96E]/40 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="aspect-square overflow-hidden bg-muted relative">
                  <img
                    src={item.images?.[0] ?? "/placeholder.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate leading-tight">{item.name}</p>
                  {item.categoryName && <p className="text-xs text-muted-foreground mt-0.5">{item.categoryName}</p>}
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    {item.salePrice ? (
                      <>
                        <span className="text-sm font-bold text-[#C9A96E]">{item.salePrice.toLocaleString()} EGP</span>
                        <span className="text-xs text-muted-foreground line-through">{item.price.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold">{item.price.toLocaleString()} EGP</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <RecentlyViewedSection />
      <NewArrivalsSection />
      <CategoriesSection />
      <TrustSection />
      <BestSellersSection />
      <PromoBanner />
      <BrandsCarousel />
      <TestimonialsSection />
    </div>
  );
}
