import { useState, useEffect } from "react";
import { useSearch, useLocation, Link } from "wouter";
import { SlidersHorizontal, Grid, List, X, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/lib/cart-context";
import Breadcrumb from "@/components/Breadcrumb";
import { toast } from "sonner";

const SIZES = ["35", "36", "37", "38", "39", "40", "41", "42"];
const COLORS = ["Black", "Champagne", "Nude", "Rose", "Gold", "Brown", "Navy", "White", "Ivory", "Sand"];

function ProductCard({ p }: { p: any }) {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const currentImg = hovered && p.images[1] ? p.images[1] : p.images[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const size = p.sizes[0] ?? "38";
    const color = p.colors[0] ?? "Black";
    addItem({ productId: p.id, quantity: 1, size, color, product: { id: p.id, name: p.name, price: p.price, salePrice: p.salePrice, images: p.images, stock: p.stock } });
    toast.success(`${p.name} added to cart`);
  };

  return (
    <motion.div whileHover={{ y: -4 }} className="group" data-testid={`card-product-${p.id}`}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link href={`/products/${p.id}`}>
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted relative">
          {currentImg && <img src={currentImg} alt={p.name} className="w-full h-full object-cover transition-all duration-500" loading="lazy" />}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {p.isNew && <span className="bg-foreground text-background text-xs px-2 py-0.5 rounded font-medium">{t("products.new_")}</span>}
            {p.isSale && <span className="bg-[#D4608A] text-white text-xs px-2 py-0.5 rounded font-medium">{t("products.sale")}</span>}
            {p.stock <= 3 && p.stock > 0 && <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded font-medium">{t("products.onlyLeft", { count: p.stock })}</span>}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button onClick={handleQuickAdd} size="sm" className="w-full bg-background text-foreground hover:bg-background/90 text-xs font-medium" data-testid={`button-quick-add-${p.id}`}>
              <ShoppingBag size={12} className="mr-1.5" /> {t("products.quickAdd")}
            </Button>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <p className="font-medium text-sm leading-tight">{p.name}</p>
          {p.rating && (
            <div className="flex items-center gap-1">
              <div className="flex">{Array(5).fill(0).map((_, i) => <span key={i} className={`text-xs ${i < Math.round(p.rating) ? "text-[#C9A96E]" : "text-muted-foreground/30"}`}>★</span>)}</div>
              <span className="text-xs text-muted-foreground">({p.reviewCount})</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {p.salePrice ? (
              <><span className="font-bold text-[#D4608A]">{p.salePrice.toLocaleString()} EGP</span>
              <span className="text-xs text-muted-foreground line-through">{p.price.toLocaleString()}</span></>
            ) : (
              <span className="font-semibold">{p.price.toLocaleString()} EGP</span>
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
        <h3 className="font-semibold text-sm mb-3">{t("products.category")}</h3>
        <div className="space-y-1">
          {[{ slug: "", name: t("products.all") }, ...(categories ?? [])].map(cat => (
            <button key={cat.slug} onClick={() => { setCategory(cat.slug); setPage(1); setLocation(cat.slug ? `/products?category=${cat.slug}` : "/products"); }}
              className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${category === cat.slug ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              data-testid={`filter-category-${cat.slug || "all"}`}>
              {cat.name} {"productCount" in cat ? `(${(cat as any).productCount})` : ""}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">{t("products.priceRange")}</h3>
        <Slider value={priceRange} onValueChange={v => { setPriceRange(v as [number, number]); setPage(1); }} min={0} max={3000} step={50} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{priceRange[0].toLocaleString()} EGP</span>
          <span>{priceRange[1].toLocaleString()} EGP</span>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">{t("products.size")}</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(s => (
            <button key={s} onClick={() => { setSelectedSize(selectedSize === s ? "" : s); setPage(1); }}
              className={`w-10 h-10 rounded-md text-sm border transition-colors ${selectedSize === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
              data-testid={`filter-size-${s}`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">{t("products.color")}</h3>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => { setSelectedColor(selectedColor === c ? "" : c); setPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${selectedColor === c ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground text-muted-foreground"}`}
              data-testid={`filter-color-${c.toLowerCase()}`}>{c}</button>
          ))}
        </div>
      </div>
      {(category || selectedSize || selectedColor || priceRange[0] > 0 || priceRange[1] < 3000) && (
        <Button variant="outline" size="sm" onClick={clearAll} className="w-full">
          <X size={14} className="mr-1" /> {t("products.clearFilters")}
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: t("breadcrumb.home"), href: "/" },
        { label: t("breadcrumb.shop"), href: "/products" },
        ...(categoryLabel ? [{ label: categoryLabel }] : []),
      ]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">{categoryLabel ?? t("products.allProducts")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("products.found", { count: total })}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-sort">
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="flex border border-border rounded-md overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-foreground text-background" : "hover:bg-muted"}`} data-testid="button-view-grid"><Grid size={16} /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-foreground text-background" : "hover:bg-muted"}`} data-testid="button-view-list"><List size={16} /></button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden" data-testid="button-filters">
            <SlidersHorizontal size={16} className="mr-1.5" /> {t("products.filters")}
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 flex-shrink-0"><FiltersPanel /></aside>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="absolute left-0 top-0 bottom-0 w-72 bg-background p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">{t("products.filters")}</h2>
                <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
              </div>
              <FiltersPanel />
            </motion.div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(12).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-lg font-medium mb-2">{t("products.noProducts")}</p>
              <p className="text-muted-foreground text-sm mb-4">{t("products.noProductsHint")}</p>
              <Button variant="outline" onClick={clearAll}>{t("products.clearAll")}</Button>
            </div>
          ) : (
            <>
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-4"}>
                {products.map(p => <ProductCard key={p.id} p={p} />)}
              </div>
              <div className="flex justify-center gap-2 mt-10">
                {Array(Math.ceil(total / 12)).fill(0).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${page === i + 1 ? "bg-foreground text-background" : "border border-border hover:bg-muted"}`}
                    data-testid={`button-page-${i + 1}`}>{i + 1}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
