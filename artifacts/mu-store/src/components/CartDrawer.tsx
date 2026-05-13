import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X, Minus, Plus, ShoppingBag, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { saveForLater, removeSaved, getSavedItems, type SavedItem } from "@/lib/save-for-later";
import { toast } from "sonner";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, addItem, total, itemCount } = useCart();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const shipping = total > 0 && total < 500 ? 50 : 0;

  useEffect(() => {
    if (isOpen) setSavedItems(getSavedItems());
  }, [isOpen]);

  const handleSaveForLater = (item: typeof items[0]) => {
    saveForLater({
      productId: item.productId, size: item.size, color: item.color,
      savedAt: new Date().toISOString(), product: item.product,
    });
    removeItem(item.productId);
    setSavedItems(getSavedItems());
    toast.success("Saved for later");
  };

  const handleMoveToCart = (saved: SavedItem) => {
    addItem({ productId: saved.productId, quantity: 1, size: saved.size, color: saved.color, product: saved.product });
    removeSaved(saved.productId, saved.size, saved.color);
    setSavedItems(getSavedItems());
    toast.success("Moved to cart");
  };

  const handleRemoveSaved = (saved: SavedItem) => {
    removeSaved(saved.productId, saved.size, saved.color);
    setSavedItems(getSavedItems());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart} className="fixed inset-0 z-40 bg-black/50" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} />
                <h2 className="font-serif text-lg font-semibold">Your Cart ({itemCount})</h2>
              </div>
              <button onClick={closeCart} className="p-1 text-muted-foreground hover:text-foreground" data-testid="button-close-cart">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 && savedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <ShoppingBag size={48} className="text-muted-foreground/40" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <Button onClick={closeCart} asChild variant="outline" size="sm">
                    <Link href="/products">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {items.map(item => (
                    <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3" data-testid={`cart-item-${item.productId}`}>
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.product.images[0] && <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Size: {item.size} · Color: {item.color}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 border border-border rounded-md">
                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5 hover:bg-muted transition-colors" data-testid={`button-qty-minus-${item.productId}`}><Minus size={12} /></button>
                            <span className="px-2 text-sm font-medium" data-testid={`text-qty-${item.productId}`}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1.5 hover:bg-muted transition-colors" data-testid={`button-qty-plus-${item.productId}`}><Plus size={12} /></button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm" data-testid={`text-price-${item.productId}`}>
                              {((item.product.salePrice ?? item.product.price) * item.quantity).toLocaleString()} EGP
                            </span>
                            <button onClick={() => handleSaveForLater(item)} className="text-muted-foreground hover:text-[#C9A96E] transition-colors" title="Save for later" data-testid={`button-save-later-${item.productId}`}>
                              <Bookmark size={14} />
                            </button>
                            <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`button-remove-${item.productId}`}>
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Saved for Later */}
                  {savedItems.length > 0 && (
                    <div className="border-t border-border pt-4 mt-2">
                      <div className="flex items-center gap-1.5 mb-3">
                        <BookmarkCheck size={14} className="text-[#C9A96E]" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saved for Later ({savedItems.length})</p>
                      </div>
                      <div className="space-y-3">
                        {savedItems.map(saved => (
                          <div key={`${saved.productId}-${saved.size}-${saved.color}`} className="flex gap-3 bg-muted/30 rounded-xl p-2.5">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {saved.product.images[0] && <img src={saved.product.images[0]} alt={saved.product.name} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs leading-tight truncate">{saved.product.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{saved.size} · {saved.color}</p>
                              <p className="text-xs font-bold mt-1">{(saved.product.salePrice ?? saved.product.price).toLocaleString()} EGP</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <button onClick={() => handleMoveToCart(saved)} className="text-[10px] text-[#C9A96E] font-semibold hover:underline">Move to cart</button>
                                <span className="text-muted-foreground/40">·</span>
                                <button onClick={() => handleRemoveSaved(saved)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={11} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>{total.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span><span>{shipping === 0 ? "Free" : `${shipping} EGP`}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
                    <span>Total</span><span data-testid="text-cart-total">{(total + shipping).toLocaleString()} EGP</span>
                  </div>
                </div>
                {total < 500 && <p className="text-xs text-muted-foreground text-center">Add {(500 - total).toLocaleString()} EGP more for free shipping</p>}
                <Button asChild className="w-full bg-foreground text-background hover:opacity-90" onClick={closeCart} data-testid="button-checkout">
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
