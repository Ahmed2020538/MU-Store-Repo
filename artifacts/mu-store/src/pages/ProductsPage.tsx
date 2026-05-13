import { useState, useEffect, useRef } from "react";
import { useSearch, useLocation, Link } from "wouter";
import { SlidersHorizontal, Grid, List, X, ShoppingBag, ArrowRight, Eye } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/lib/cart-context";
import Breadcrumb from "@/components/Breadcrumb";
import { toast } from "sonner";
import QuickViewModal from "@/components/QuickViewModal";

const SIZES = ["35", "36", "37", "38", "39", "40", "41", "42"];
const COLORS = ["Black", "Champagne", "Nude", "Rose", "Gold", "Brown", "Navy", "White", "Ivory", "Sand"];

function ProductCard({ p, index = 0, onQuickView }: { p: any; index?: number; onQuickView?: (id: number) => void }) {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const currentImg = hovered && p.images[1] ? p.images[1] : p.images[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const size = p.sizes[0] ?? "38";
    const color = p.colors[0] ?? "Black";
    addItem({
      productId: p.id, quantity: 1, size, color,
      product: { id: p.id, name: p.name, price: p.price, salePrice: p.salePrice, images: p.images, stock: p.stock },
    });
    toast.success(`${p.name} added to cart`);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: (index % 4) * 0.06, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      className="group"
      data-testid={`card-product-${p.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/products/${p.id}`}>
        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted relative shadow-sm group-hover:shadow-xl transition-all duration-500">
          {currentImg && (
            <img
              src={currentImg}
              alt={p.name}
              className="w-full h-full object-cover transition-all duration-600 ease-out group-hover:scale-105"
              loading="lazy"
            />
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {p.isNew && <span className="bg-foreground/90 backdrop-blur-sm text-background text-[10px] px-2.5 py-0.5 rounded-full font-semibold">{t("products.new_")}</span>}
            {p.isSale && <span className="bg-[#D4608A] text-white text-[10px] px-2.5 py-0.5 rounded-full font-semibold">{t("products.sale")}</span>}
            {p.stock <= 3 && p.stock > 0 && <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-0.5 rounded-full font-semibold">{t("products.onlyLeft", { count: p.stock })}</span>}
          </div>
          {/* Quick actions - slides up */}
          <div className="absolute inset-x-2.5 bottom-2.5 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out flex gap-1.5">
            <Button
              onClick={handleQuickAdd}
              size="sm"
              className="flex-1 bg-background/95 backdrop-blur-sm text-foreground hover:bg-background text-xs font-semibold shadow-lg rounded-xl"
              data-testid={`button-quick-add-${p.id}`}
            >
              <ShoppingBag size={12} className="mr-1.5" /> {t("products.quickAdd")}
            </Button>
            {onQuickView && (
              <Button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onQuickView(p.id); }}
                size="sm"
                variant="outline"
                className="w-9 bg-background/95 backdrop-blur-sm hover:bg-background shadow-lg rounded-xl flex-shrink-0 px-0"
                data-testid={`button-quick-view-${p.id}`}
                title="Quick view"
              >
                <Eye size={13} />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3.5 space-y-1">
          <p className="font-medium text-sm leading-snug group-hover:text-[#C9A96E] transition-colors duration-300">{p.name}</p>
          {p.rating && (
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">{Array(5).fill(0).map((_, i) => <span key={i} className={`text-[11px] ${i < Math.round(p.rating) ? "text-[#C9A96E]" : "text-muted-foreground/25"}`}>★</span>)}</div>
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

export default function ProductsPage() {
  const { t } = useTranslation();
  const searchStr = useSearch();
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(searchStr);
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [sort, setSort] = useState<string>(params.get("sort") ?? "newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [quickViewId, setQuickViewId] = useState<number | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(searchStr);
    setCategory(p.get("category") ?? "");
    setSort(p.get("sort") ?? "newest");
    setPage(1);
  }, [searchStr]);

  const { data: categories } = useListCategories();
  const { data, isLoading } = useListProducts({
    category: category || undefined,
    sort: sort as any,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 3000 ? priceRange[1] : undefined,
    size: selectedSize || undefined,
    color: selectedColor || undefined,
    page, limit: 12,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;

  const categoryLabel = category
    ? (categories?.find(c => c.slug === category)?.name ?? category)
    : null;

  const SORTS = [
    { value: "newest", label: t("products.sort.newest") },
    { value: "price_asc", label: t("products.sort.priceAsc") },
    { value: "price_desc", label: t("products.sort.priceDesc") },
    { value: "best_selling", label: t("products.sort.bestSelling") },
    { value: "top_rated", label: t("products.sort.topRated") },
  ];

  const clearAll = () => {
    setCategory(""); setSelectedSize(""); setSelectedColor(""); setPriceRange([0, 3000]); setPage(1);
    setLocation("/products");
  };

  const FiltersPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">{t("products.category")}</h3>
        <div className="space-y-0.5">
          {[{ slug: "", name: t("products.all") }, ...(categories ?? [])].map(cat => (
            <button key={cat.slug}
              onClick={() => { setCategory(cat.slug); setPage(1); setLocation(cat.slug ? `/products?category=${cat.slug}` : "/products"); }}
              className={`block w-full text-left text-sm px-3 py-2 rounded-xl transition-all duration-200 ${category === cat.slug ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
              data-testid={`filter-category-${cat.slug || "all"}`}>
              {cat.name} {"productCount" in cat ? <span className="opacity-50 text-xs">({(cat as any).productCount})</span> : ""}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-4">{t("products.priceRange")}</h3>
        <Slider value={priceRange} onValueChange={v => { setPriceRange(v as [number, number]); setPage(1); }} min={0} max={3000} step={50} className="mb-3" />
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>{priceRange[0].toLocaleString()} EGP</span>
          <span>{priceRange[1].toLocaleString()} EGP</span>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">{t("products.size")}</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(s => (
            <button key={s} onClick={() => { setSelectedSize(selectedSize === s ? "" : s); setPage(1); }}
              className={`w-10 h-10 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${selectedSize === s ? "bg-foreground text-background border-foreground shadow-md" : "border-border hover:border-foreground/50 hover:bg-muted/50"}`}
              data-testid={`filter-size-${s}`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">{t("products.color")}</h3>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map(c => (
            <button key={c} onClick={() => { setSelectedColor(selectedColor === c ? "" : c); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition-all duration-200 ${selectedColor === c ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40 text-muted-foreground hover:text-foreground"}`}
              data-testid={`filter-color-${c.toLowerCase()}`}>{c}</button>
          ))}
        </div>
      </div>
      {(category || selectedSize || selectedColor || priceRange[0] > 0 || priceRange[1] < 3000) && (
        <Button variant="outline" size="sm" onClick={clearAll} className="w-full rounded-xl">
          <X size={14} className="mr-1" /> {t("products.clearFilters")}
        </Button>
      )}
    </div>
  );

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: t("breadcrumb.home"), href: "/" },
        { label: t("breadcrumb.shop"), href: "/products" },
        ...(categoryLabel ? [{ label: categoryLabel }] : []),
      ]} />

      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <h1 className="font-serif text-3xl font-bold">{categoryLabel ?? t("products.allProducts")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("products.found", { count: total })}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow hover:shadow-sm"
            data-testid="select-sort">
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="flex border border-border rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-foreground text-background" : "hover:bg-muted/60"}`} data-testid="button-view-grid"><Grid size={15} /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-foreground text-background" : "hover:bg-muted/60"}`} data-testid="button-view-list"><List size={15} /></button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden rounded-xl" data-testid="button-filters">
            <SlidersHorizontal size={15} className="mr-1.5" /> {t("products.filters")}
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24 self-start">
          <FiltersPanel />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-background p-6 overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-semibold text-lg">{t("products.filters")}</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={18} /></button>
              </div>
              <FiltersPanel />
            </motion.div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(12).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-28"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={28} className="text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-1">{t("products.noProducts")}</p>
              <p className="text-muted-foreground text-sm mb-6">{t("products.noProductsHint")}</p>
              <Button variant="outline" onClick={clearAll} className="rounded-xl">{t("products.clearAll")}</Button>
            </motion.div>
          ) : (
            <>
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-4"}>
                {products.map((p, i) => <ProductCard key={p.id} p={p} index={i} onQuickView={setQuickViewId} />)}
              </div>
              {Math.ceil(total / 12) > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  {Array(Math.ceil(total / 12)).fill(0).map((_, i) => (
                    <motion.button
                      key={i}
                      onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${page === i + 1 ? "bg-foreground text-background shadow-md" : "border border-border hover:bg-muted/60"}`}
                      data-testid={`button-page-${i + 1}`}
                    >
                      {i + 1}
                    </motion.button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    <QuickViewModal productId={quickViewId} onClose={() => setQuickViewId(null)} />
    </>
  );
}
