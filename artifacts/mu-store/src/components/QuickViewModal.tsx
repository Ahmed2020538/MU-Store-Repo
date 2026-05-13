import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ChevronLeft, ChevronRight, Star, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

interface Props {
  productId: number | null;
  onClose: () => void;
}

export default function QuickViewModal({ productId, onClose }: Props) {
  const { data: product, isLoading } = useGetProduct(productId ?? 0, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId ?? 0) },
  });
  const { addItem } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const handleAdd = () => {
    if (!product) return;
    const sizes = product.sizes ?? [];
    const colors = product.colors ?? [];
    if (!selectedSize && sizes.length > 0) { toast.error("Please select a size"); return; }
    if (!selectedColor && colors.length > 0) { toast.error("Please select a color"); return; }
    addItem({
      productId: product.id, quantity: 1,
      size: selectedSize || "One Size", color: selectedColor || "Standard",
      product: { id: product.id, name: product.name, price: product.price, salePrice: product.salePrice, images: product.images, stock: product.stock },
    });
    toast.success("Added to cart ✓");
    onClose();
  };

  return (
    <AnimatePresence>
      {!!productId && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-8"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              <X size={16} />
            </button>
            {isLoading || !product ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
                <Skeleton className="aspect-square rounded-2xl" />
                <div className="space-y-4 py-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-6 w-1/4" /><Skeleton className="h-20 w-full" /><Skeleton className="h-12 w-full rounded-xl" /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Image */}
                <div className="relative aspect-square rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none overflow-hidden bg-muted">
                  <AnimatePresence mode="wait">
                    <motion.img key={imgIdx} src={product.images?.[imgIdx] ?? "/placeholder.jpg"} alt={product.name}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }} className="w-full h-full object-cover" />
                  </AnimatePresence>
                  {(product.images?.length ?? 0) > 1 && (
                    <>
                      <button onClick={() => setImgIdx(i => (i - 1 + product.images!.length) % product.images!.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center shadow-md hover:bg-background transition-colors">
                        <ChevronLeft size={15} />
                      </button>
                      <button onClick={() => setImgIdx(i => (i + 1) % product.images!.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center shadow-md hover:bg-background transition-colors">
                        <ChevronRight size={15} />
                      </button>
                    </>
                  )}
                  {product.stock <= 3 && product.stock > 0 && (
                    <span className="absolute top-3 left-3 bg-amber-500/90 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
                      Only {product.stock} left!
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="p-6 space-y-4">
                  {product.categoryName && <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A96E] font-semibold">{product.categoryName}</p>}
                  <h2 className="font-serif text-xl font-bold leading-tight">{product.name}</h2>
                  {!!product.rating && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">{Array(5).fill(0).map((_, i) => <Star key={i} size={12} className={i < Math.round(product.rating!) ? "text-[#C9A96E] fill-[#C9A96E]" : "text-muted-foreground/20 fill-muted-foreground/20"} />)}</div>
                      <span className="text-xs text-muted-foreground">({product.reviewCount} reviews)</span>
                    </div>
                  )}
                  <div>
                    {product.salePrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#D4608A]">{product.salePrice.toLocaleString()} EGP</span>
                        <span className="text-sm text-muted-foreground line-through">{product.price.toLocaleString()}</span>
                        <span className="text-xs bg-[#D4608A]/10 text-[#D4608A] px-2 py-0.5 rounded-full font-semibold">-{Math.round((1 - product.salePrice / product.price) * 100)}%</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold">{product.price.toLocaleString()} EGP</span>
                    )}
                  </div>
                  {(product.sizes ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2">Size {selectedSize && <span className="text-[#C9A96E] font-normal">— {selectedSize}</span>}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(product.sizes ?? []).map(s => (
                          <button key={s} onClick={() => setSelectedSize(s)}
                            className={`w-10 h-10 rounded-lg text-xs font-semibold border-2 transition-all ${selectedSize === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(product.colors ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2">Color {selectedColor && <span className="text-[#C9A96E] font-normal">— {selectedColor}</span>}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(product.colors ?? []).map(c => (
                          <button key={c} onClick={() => setSelectedColor(c)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${selectedColor === c ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50"}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 pt-1">
                    <Button onClick={handleAdd} disabled={product.stock === 0}
                      className="w-full bg-foreground text-background hover:opacity-90 font-semibold rounded-xl h-11">
                      <ShoppingBag size={16} className="mr-2" />
                      {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                    <Link href={`/products/${product.id}`} onClick={onClose}>
                      <Button variant="outline" className="w-full rounded-xl h-10 text-sm">
                        <ExternalLink size={14} className="mr-2" /> View Full Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
