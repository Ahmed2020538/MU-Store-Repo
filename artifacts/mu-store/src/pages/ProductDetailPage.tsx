import { useState } from "react";
import { useParams, Link } from "wouter";
import { Heart, ShoppingBag, Share2, Minus, Plus, Star, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useGetProduct, useGetProductReviews, useListProducts, useAddToWishlist, useRemoveFromWishlist, useCreateReview, getGetProductQueryKey, getGetProductReviewsQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const GOVERNORATES = ["Cairo", "Giza", "Alexandria", "Dakahlia", "Red Sea", "Beheira", "Fayoum", "Gharbiya", "Ismailia", "Menofia", "Minya", "Qaliubiya", "New Valley", "Suez", "Aswan", "Assiut", "Beni Suef", "Port Said", "Damietta", "Sharqia", "South Sinai", "Kafr El Sheikh", "Matrouh", "Luxor", "Qena", "Sohag", "North Sinai"];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id ?? "0");
  const { data: product, isLoading } = useGetProduct(productId, { query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) } });
  const { data: reviews } = useGetProductReviews(productId, { query: { enabled: !!productId, queryKey: getGetProductReviewsQueryKey(productId) } });
  const { data: related } = useListProducts({ category: product?.categoryName?.toLowerCase(), limit: 4 }, { query: { enabled: !!product, queryKey: getListProductsQueryKey({ category: product?.categoryName?.toLowerCase(), limit: 4 }) } });

  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const [imgIdx, setImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const qc = useQueryClient();
  const createReview = useCreateReview();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-32 w-full" /></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-24"><p>Product not found.</p><Link href="/products" className="text-[#C9A96E] mt-4 block">Back to Shop</Link></div>;
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
    toast.success("Added to cart");
  };

  const handleWishlist = () => {
    if (!isLoggedIn) { toast.error("Please sign in to save items"); return; }
    if (wishlisted) {
      removeFromWishlist.mutate({ productId }, { onSuccess: () => { setWishlisted(false); toast.success("Removed from wishlist"); } });
    } else {
      addToWishlist.mutate({ productId }, { onSuccess: () => { setWishlisted(true); toast.success("Saved to wishlist"); } });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/products" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft size={16} /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted relative group">
            {images[imgIdx] && <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-cover" data-testid="img-product-main" />}
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-testid="button-img-prev">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-testid="button-img-next">
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${imgIdx === i ? "border-foreground" : "border-transparent"}`} data-testid={`button-thumb-${i}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.categoryName && <p className="text-xs tracking-widest uppercase text-[#C9A96E]">{product.categoryName}</p>}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight" data-testid="text-product-name">{product.name}</h1>

          {avgRating && (
            <div className="flex items-center gap-2">
              <div className="flex">{Array(5).fill(0).map((_, i) => <Star key={i} size={16} className={i < Math.round(avgRating) ? "text-[#C9A96E] fill-[#C9A96E]" : "text-muted-foreground/30"} />)}</div>
              <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>
          )}

          <div className="flex items-center gap-3" data-testid="text-product-price">
            {product.salePrice ? (
              <>
                <span className="text-3xl font-bold text-[#D4608A]">{product.salePrice.toLocaleString()} EGP</span>
                <span className="text-lg text-muted-foreground line-through">{product.price.toLocaleString()}</span>
                <span className="text-sm bg-[#D4608A]/10 text-[#D4608A] px-2 py-0.5 rounded font-medium">
                  -{Math.round((1 - product.salePrice / product.price) * 100)}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold">{product.price.toLocaleString()} EGP</span>
            )}
          </div>

          {/* Sizes */}
          {(product.sizes ?? []).length > 0 && (
            <div>
              <p className="font-semibold text-sm mb-2">Size {selectedSize && <span className="font-normal text-muted-foreground">— {selectedSize}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {(product.sizes ?? []).map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`w-12 h-12 rounded-lg text-sm border-2 font-medium transition-colors ${selectedSize === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                    data-testid={`button-size-${s}`}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {(product.colors ?? []).length > 0 && (
            <div>
              <p className="font-semibold text-sm mb-2">Color {selectedColor && <span className="font-normal text-muted-foreground">— {selectedColor}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {(product.colors ?? []).map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-colors ${selectedColor === c ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                    data-testid={`button-color-${c.toLowerCase()}`}>{c}</button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="font-semibold text-sm mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 hover:bg-muted transition-colors" data-testid="button-qty-minus"><Minus size={16} /></button>
                <span className="px-4 font-medium" data-testid="text-quantity">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="p-3 hover:bg-muted transition-colors" data-testid="button-qty-plus"><Plus size={16} /></button>
              </div>
              {product.stock <= 5 && product.stock > 0 && <span className="text-sm text-amber-600 font-medium">Only {product.stock} left!</span>}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <Button onClick={handleAddToCart} className="flex-1 bg-foreground text-background hover:opacity-90 h-12" disabled={product.stock === 0} data-testid="button-add-to-cart">
              <ShoppingBag size={18} className="mr-2" /> {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
            <Button onClick={handleWishlist} variant="outline" size="icon" className={`h-12 w-12 ${wishlisted ? "border-[#D4608A] text-[#D4608A]" : ""}`} data-testid="button-wishlist">
              <Heart size={18} className={wishlisted ? "fill-current" : ""} />
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }} data-testid="button-share">
              <Share2 size={18} />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="mt-6">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">Reviews ({product.reviewCount})</TabsTrigger>
              <TabsTrigger value="shipping" className="flex-1">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {product.description ?? "Handcrafted with premium Egyptian leather and fine attention to detail."}
              {product.material && <p className="mt-2"><span className="font-medium text-foreground">Material:</span> {product.material}</p>}
            </TabsContent>
            <TabsContent value="reviews" className="mt-4 space-y-4">
              {(reviews ?? []).length === 0
                ? <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
                : (reviews ?? []).map(r => (
                  <div key={r.id} className="border border-border rounded-lg p-3" data-testid={`review-${r.id}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">{Array(5).fill(0).map((_, i) => <Star key={i} size={12} className={i < r.rating ? "text-[#C9A96E] fill-[#C9A96E]" : "text-muted-foreground/30"} />)}</div>
                      <span className="text-xs text-muted-foreground">{r.userName ?? "Verified Buyer"}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="text-sm">{r.comment}</p>}
                  </div>
                ))}
              {isLoggedIn ? (
                <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3" data-testid="review-form">
                  <p className="font-semibold text-sm">Write a Review</p>
                  <div className="flex items-center gap-1">
                    {Array(5).fill(0).map((_, i) => (
                      <button key={i} type="button"
                        onClick={() => setReviewRating(i + 1)}
                        onMouseEnter={() => setReviewHover(i + 1)}
                        onMouseLeave={() => setReviewHover(0)}
                        data-testid={`star-${i + 1}`}
                        className="transition-transform hover:scale-110">
                        <Star size={22} className={(reviewHover || reviewRating) > i ? "text-[#C9A96E] fill-[#C9A96E]" : "text-muted-foreground/30"} />
                      </button>
                    ))}
                    {reviewRating > 0 && <span className="text-xs text-muted-foreground ml-2">{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}</span>}
                  </div>
                  <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} maxLength={500}
                    placeholder="Share your experience with this product..." data-testid="input-review-comment"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                  <Button size="sm" disabled={reviewRating === 0 || submittingReview}
                    className="bg-[#C9A96E] text-foreground hover:opacity-90"
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
                    <Send size={14} className="mr-1.5" />{submittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground border border-border rounded-lg p-3">
                  <Link href="/login" className="text-[#C9A96E] font-medium hover:underline">Sign in</Link> to leave a review.
                </p>
              )}
            </TabsContent>
            <TabsContent value="shipping" className="text-sm text-muted-foreground mt-4 space-y-2">
              <p>Free shipping on orders over 500 EGP. Standard delivery 2-5 business days.</p>
              <p>Cash on Delivery available (20 EGP fee applies).</p>
              <p>Easy 14-day returns — unused items in original packaging.</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Related products */}
      {related && related.products.filter(p => p.id !== productId).length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-bold mb-6">Complete the Look</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.products.filter(p => p.id !== productId).slice(0, 4).map(p => (
              <Link key={p.id} href={`/products/${p.id}`} className="group" data-testid={`card-related-${p.id}`}>
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                  {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                </div>
                <p className="font-medium text-sm mt-2">{p.name}</p>
                <p className="text-sm text-muted-foreground">{(p.salePrice ?? p.price).toLocaleString()} EGP</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
