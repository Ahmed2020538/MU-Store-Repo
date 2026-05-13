import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Heart, ShoppingBag, Share2, Minus, Plus, Star, ChevronLeft, ChevronRight, Send, Truck, RotateCcw, Shield, ZoomIn, Ruler, Box } from "lucide-react";
import AR3DViewer from "@/components/AR3DViewer";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { getDeliveryWindow } from "@/lib/delivery-estimate";

function getFitSummary(rating?: number | null, reviewCount?: number | null) {
  if (!rating || !reviewCount || reviewCount < 3) return null;
  if (rating >= 4.2) return { label: "Fits true to size", sub: `Based on ${reviewCount} verified reviews`, colorClass: "text-green-700 dark:text-green-400", bgClass: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" };
  if (rating >= 3.5) return { label: "Runs slightly small", sub: "Most customers recommend sizing up", colorClass: "text-amber-700 dark:text-amber-400", bgClass: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900" };
  return { label: "Sizing varies", sub: "Check our size guide for best fit", colorClass: "text-blue-700 dark:text-blue-400", bgClass: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900" };
}
import { motion, AnimatePresence } from "framer-motion";
import RecentlyViewedSection from "@/components/RecentlyViewedSection";
import { useGetProduct, useGetProductReviews, useListProducts, useAddToWishlist, useRemoveFromWishlist, useCreateReview, getGetProductQueryKey, getGetProductReviewsQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id ?? "0");
  const { data: product, isLoading } = useGetProduct(productId, { query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) } });
  const { data: reviews } = useGetProductReviews(productId, { query: { enabled: !!productId, queryKey: getGetProductReviewsQueryKey(productId) } });
  const { data: related } = useListProducts({ category: product?.categoryName?.toLowerCase(), limit: 4 }, { query: { enabled: !!product, queryKey: getListProductsQueryKey({ category: product?.categoryName?.toLowerCase(), limit: 4 }) } });

  const [socialProof, setSocialProof] = useState<{ recentPurchases: number; totalSold: number } | null>(null);

  useEffect(() => {
    if (!product) return;
    addRecentlyViewed({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      images: product.images ?? [],
      categoryName: product.categoryName,
    });
    fetch(`/api/products/${product.id}/social-proof`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSocialProof(d))
      .catch(() => {});
  }, [product?.id]);

  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const [imgIdx, setImgIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"photos" | "3d">("photos");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const qc = useQueryClient();
  const createReview = useCreateReview();
  const imgRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
          <div className="space-y-3">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="flex gap-2">{Array(4).fill(0).map((_,i) => <Skeleton key={i} className="w-16 h-16 rounded-xl" />)}</div>
          </div>
          <div className="space-y-5">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-8 w-1/3 rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-28">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={28} className="text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold mb-2">Product not found</p>
        <Link href="/products" className="text-[#C9A96E] text-sm hover:underline flex items-center gap-1 justify-center mt-2">
          <ChevronLeft size={14} /> Back to Shop
        </Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const avgRating = product.rating;

  const handleAddToCart = () => {
    const sizes = product.sizes ?? [];
    const colors = product.colors ?? [];
    if (!selectedSize && sizes.length > 0) { toast.error("Please select a size"); return; }
    if (!selectedColor && colors.length > 0) { toast.error("Please select a color"); return; }
    addItem({
      productId: product.id, quantity, size: selectedSize || "One Size", color: selectedColor || "Standard",
      product: { id: product.id, name: product.name, price: product.price, salePrice: product.salePrice, images: product.images, stock: product.stock },
    });
    toast.success("Added to cart ✓");
  };

  const handleWishlist = () => {
    if (!isLoggedIn) { toast.error("Please sign in to save items"); return; }
    if (wishlisted) {
      removeFromWishlist.mutate({ productId }, { onSuccess: () => { setWishlisted(false); toast.success("Removed from wishlist"); } });
    } else {
      addToWishlist.mutate({ productId }, { onSuccess: () => { setWishlisted(true); toast.success("Saved to wishlist ♥"); } });
    }
  };

  const MICRO_BADGES = [
    { icon: Truck, label: "Free shipping over 500 EGP" },
    { icon: RotateCcw, label: "14-day returns" },
    { icon: Shield, label: "Secure checkout" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors group">
        <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
        {/* Gallery */}
        <div className="space-y-3">
          {/* View mode toggle — only shown when product has a 3D model */}
          {product.modelUrl && (
            <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
              <button
                onClick={() => setViewMode("photos")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "photos" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <ZoomIn size={12} /> Photos
              </button>
              <button
                onClick={() => setViewMode("3d")}
                data-testid="button-view-3d"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "3d" ? "bg-background shadow text-[#C9A96E]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Box size={12} /> 3D / AR
              </button>
            </div>
          )}

          {viewMode === "3d" && product.modelUrl ? (
            <AR3DViewer modelUrl={product.modelUrl} productName={product.name} posterUrl={images[0]} />
          ) : (<>
          <div
            ref={imgRef}
            className={`aspect-square rounded-3xl overflow-hidden bg-muted relative group shadow-lg select-none ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setZoomOrigin({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              });
            }}
          >
            <div
              className="w-full h-full transition-transform duration-150 ease-out"
              style={zoomed ? { transform: "scale(2.2)", transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` } : {}}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={imgIdx}
                  src={images[imgIdx]}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full h-full object-cover pointer-events-none"
                  data-testid="img-product-main"
                />
              </AnimatePresence>
            </div>
            {!zoomed && <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><ZoomIn size={14} className="text-foreground/70" /></div>}
            {images.length > 1 && !zoomed && (
              <>
                <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-background hover:scale-105"
                  data-testid="button-img-prev">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-background hover:scale-105"
                  data-testid="button-img-next">
                  <ChevronRight size={18} />
                </button>
              </>
            )}
            {/* Dot indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`rounded-full transition-all duration-300 ${i === imgIdx ? "w-5 h-2 bg-[#C9A96E]" : "w-2 h-2 bg-white/50 hover:bg-white/80"}`} />
                ))}
              </div>
            )}
          </div>
          {images.length > 1 && !zoomed && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${imgIdx === i ? "border-[#C9A96E] shadow-md shadow-[#C9A96E]/20" : "border-transparent hover:border-border"}`}
                  data-testid={`button-thumb-${i}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          </>)}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.categoryName && (
            <p className="text-xs tracking-[0.25em] uppercase text-[#C9A96E] font-medium">{product.categoryName}</p>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight" data-testid="text-product-name">{product.name}</h1>

          {avgRating && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">{Array(5).fill(0).map((_, i) => <Star key={i} size={15} className={i < Math.round(avgRating) ? "text-[#C9A96E] fill-[#C9A96E]" : "text-muted-foreground/20 fill-muted-foreground/20"} />)}</div>
              <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3" data-testid="text-product-price">
            {product.salePrice ? (
              <>
                <span className="text-3xl font-bold text-[#D4608A]">{product.salePrice.toLocaleString()} EGP</span>
                <span className="text-lg text-muted-foreground line-through">{product.price.toLocaleString()}</span>
                <span className="text-xs bg-[#D4608A]/10 text-[#D4608A] px-2.5 py-1 rounded-full font-semibold">
                  -{Math.round((1 - product.salePrice / product.price) * 100)}% OFF
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold">{product.price.toLocaleString()} EGP</span>
            )}
          </div>

          {/* Sizes */}
          {(product.sizes ?? []).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="font-semibold text-sm">
                  Size {selectedSize && <span className="font-normal text-[#C9A96E]">— {selectedSize}</span>}
                </p>
                <Link href="/size-guide" className="text-xs text-[#C9A96E] hover:underline flex items-center gap-1">
                  <Ruler size={11} /> Size guide
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {(product.sizes ?? []).map(s => (
                  <motion.button key={s} onClick={() => setSelectedSize(s)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${selectedSize === s ? "border-foreground bg-foreground text-background shadow-md" : "border-border hover:border-foreground/50"}`}
                    data-testid={`button-size-${s}`}>{s}</motion.button>
                ))}
              </div>
              {(() => { const fit = getFitSummary(product.rating, product.reviewCount); return fit ? (
                <div className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border text-xs font-medium ${fit.bgClass}`}>
                  <span className={`${fit.colorClass} font-semibold`}>✓ {fit.label}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{fit.sub}</span>
                </div>
              ) : null; })()}
            </div>
          )}

          {/* Colors */}
          {(product.colors ?? []).length > 0 && (
            <div>
              <p className="font-semibold text-sm mb-2.5">
                Color {selectedColor && <span className="font-normal text-[#C9A96E]">— {selectedColor}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {(product.colors ?? []).map(c => (
                  <motion.button key={c} onClick={() => setSelectedColor(c)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${selectedColor === c ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50"}`}
                    data-testid={`button-color-${c.toLowerCase()}`}>{c}</motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="font-semibold text-sm mb-2.5">Quantity</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-muted transition-colors" data-testid="button-qty-minus"><Minus size={15} /></button>
                <span className="px-5 font-bold" data-testid="text-quantity">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="px-4 py-3 hover:bg-muted transition-colors" data-testid="button-qty-plus"><Plus size={15} /></button>
              </div>
              {product.stock <= 5 && product.stock > 0 && (
                <span className="text-sm text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg">
                  Only {product.stock} left!
                </span>
              )}
            </div>
          </div>

          {/* Social Proof */}
          {socialProof && socialProof.recentPurchases > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                <span className="font-bold">{socialProof.recentPurchases}</span> {socialProof.recentPurchases === 1 ? "person" : "people"} purchased this in the last 24 hours
              </p>
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-3">
            <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                onClick={handleAddToCart}
                className="w-full h-13 bg-foreground text-background hover:opacity-90 text-base font-semibold shadow-lg hover:shadow-xl transition-all rounded-2xl"
                disabled={product.stock === 0}
                data-testid="button-add-to-cart"
              >
                <ShoppingBag size={18} className="mr-2" />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            </motion.div>
            <Button onClick={handleWishlist} variant="outline" size="icon"
              className={`h-13 w-13 rounded-2xl border-2 transition-all hover:scale-105 ${wishlisted ? "border-[#D4608A] text-[#D4608A] bg-[#D4608A]/5" : "hover:border-[#D4608A] hover:text-[#D4608A]"}`}
              data-testid="button-wishlist">
              <Heart size={18} className={wishlisted ? "fill-current" : ""} />
            </Button>
            <Button variant="outline" size="icon" className="h-13 w-13 rounded-2xl border-2 hover:scale-105 transition-all"
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
              data-testid="button-share">
              <Share2 size={18} />
            </Button>
          </div>

          {/* Trust micro-badges */}
          <div className="flex gap-4 pt-1 border-t border-border/50">
            {MICRO_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon size={13} className="text-[#C9A96E] flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="mt-2">
            <TabsList className="w-full rounded-2xl">
              <TabsTrigger value="description" className="flex-1 rounded-xl">Description</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1 rounded-xl">Reviews ({product.reviewCount})</TabsTrigger>
              <TabsTrigger value="shipping" className="flex-1 rounded-xl">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="text-sm text-muted-foreground mt-5 leading-relaxed space-y-3">
              <p>{product.description ?? "Handcrafted with premium Egyptian leather and fine attention to detail."}</p>
              {product.material && <p className="pt-1"><span className="font-semibold text-foreground">Material:</span> {product.material}</p>}
            </TabsContent>
            <TabsContent value="reviews" className="mt-5 space-y-4">
              {(reviews ?? []).length === 0
                ? <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet. Be the first!</p>
                : (reviews ?? []).map(r => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="border border-border rounded-2xl p-4 hover:border-[#C9A96E]/30 transition-colors"
                    data-testid={`review-${r.id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-0.5">{Array(5).fill(0).map((_, i) => <Star key={i} size={12} className={i < r.rating ? "text-[#C9A96E] fill-[#C9A96E]" : "text-muted-foreground/20 fill-muted-foreground/20"} />)}</div>
                      <span className="text-xs font-semibold">{r.userName ?? "Verified Buyer"}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="text-sm leading-relaxed">{r.comment}</p>}
                  </motion.div>
                ))}
              {isLoggedIn ? (
                <div className="border border-border rounded-2xl p-5 bg-muted/20 space-y-4" data-testid="review-form">
                  <p className="font-semibold">Write a Review</p>
                  <div className="flex items-center gap-1">
                    {Array(5).fill(0).map((_, i) => (
                      <button key={i} type="button"
                        onClick={() => setReviewRating(i + 1)}
                        onMouseEnter={() => setReviewHover(i + 1)}
                        onMouseLeave={() => setReviewHover(0)}
                        data-testid={`star-${i + 1}`}
                        className="transition-transform hover:scale-125">
                        <Star size={24} className={(reviewHover || reviewRating) > i ? "text-[#C9A96E] fill-[#C9A96E]" : "text-muted-foreground/20 fill-muted-foreground/20"} />
                      </button>
                    ))}
                    {reviewRating > 0 && <span className="text-xs text-muted-foreground ml-2 font-medium">{["","Poor","Fair","Good","Very Good","Excellent"][reviewRating]}</span>}
                  </div>
                  <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} maxLength={500}
                    placeholder="Share your experience with this product..."
                    data-testid="input-review-comment"
                    className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm bg-background resize-none focus:outline-none focus:border-ring/50 transition-colors" />
                  <Button size="sm" disabled={reviewRating === 0 || submittingReview}
                    className="bg-[#C9A96E] text-foreground hover:opacity-90 rounded-xl font-semibold"
                    data-testid="button-submit-review"
                    onClick={async () => {
                      if (!reviewRating) { toast.error("Please select a rating"); return; }
                      setSubmittingReview(true);
                      createReview.mutate({ data: { productId, rating: reviewRating, comment: reviewComment || undefined } }, {
                        onSuccess: () => {
                          toast.success("Review submitted!");
                          setReviewRating(0); setReviewComment("");
                          qc.invalidateQueries({ queryKey: getGetProductReviewsQueryKey(productId) });
                        },
                        onError: () => toast.error("Failed to submit review"),
                        onSettled: () => setSubmittingReview(false),
                      });
                    }}>
                    <Send size={13} className="mr-1.5" />{submittingReview ? "Submitting…" : "Submit Review"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground border-2 border-border rounded-xl p-4 text-center">
                  <Link href="/login" className="text-[#C9A96E] font-semibold hover:underline">Sign in</Link> to leave a review.
                </p>
              )}
            </TabsContent>
            <TabsContent value="shipping" className="text-sm text-muted-foreground mt-5 space-y-3 leading-relaxed">
              <div className="p-4 rounded-2xl border border-[#C9A96E]/20 bg-[#C9A96E]/5 mb-1">
                <div className="flex items-center gap-2 mb-1">
                  <Truck size={15} className="text-[#C9A96E]" />
                  <span className="font-semibold text-foreground text-sm">Delivery Estimate</span>
                </div>
                {(() => {
                  const win = getDeliveryWindow();
                  return (
                    <div className="space-y-1">
                      <p className="text-xs"><span className="font-medium text-foreground">Cairo / Giza / Alexandria:</span> 1–2 business days</p>
                      <p className="text-xs"><span className="font-medium text-foreground">All other governorates:</span> 3–5 business days</p>
                      <p className="text-xs"><span className="font-medium text-foreground">Remote areas:</span> 5–7 business days</p>
                    </div>
                  );
                })()}
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { icon: Truck, text: "Free shipping on orders over 500 EGP." },
                  { icon: Shield, text: "Cash on Delivery available with a 20 EGP service fee." },
                  { icon: RotateCcw, text: "Easy 14-day returns — unused items in original packaging." },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex gap-3 p-3 rounded-xl bg-muted/40">
                    <Icon size={15} className="text-[#C9A96E] mt-0.5 flex-shrink-0" />
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <RecentlyViewedSection excludeId={productId} />

      {/* Related products */}
      {related && related.products.filter(p => p.id !== productId).length > 0 && (
        <div className="mt-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-[#C9A96E] mb-1 font-medium">You Might Also Love</p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">Complete the Look</h2>
            </div>
            <Link href="/products" className="text-sm text-muted-foreground hover:text-[#C9A96E] flex items-center gap-1 transition-colors group">
              View all <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.products.filter(p => p.id !== productId).slice(0, 4).map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -5 }} className="group" data-testid={`card-related-${p.id}`}>
                <Link href={`/products/${p.id}`}>
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted shadow-sm group-hover:shadow-lg transition-all duration-400">
                    {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600" loading="lazy" />}
                  </div>
                  <p className="font-medium text-sm mt-2.5 group-hover:text-[#C9A96E] transition-colors">{p.name}</p>
                  <p className="text-sm text-muted-foreground font-medium">{(p.salePrice ?? p.price).toLocaleString()} EGP</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
