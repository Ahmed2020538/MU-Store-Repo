import { createContext, useContext, useState, type ReactNode } from "react";

export interface LocalCartItem {
  productId: number;
  quantity: number;
  size: string;
  color: string;
  product: {
    id: number;
    name: string;
    price: number;
    salePrice?: number | null;
    images: string[];
    stock: number;
  };
}

interface CartContextType {
  items: LocalCartItem[];
  addItem: (item: LocalCartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, qty: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (item: LocalCartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.size === item.size && i.color === item.color);
      if (existing) {
        return prev.map(i => i.productId === item.productId && i.size === item.size && i.color === item.color
          ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: number) => setItems(prev => prev.filter(i => i.productId !== productId));

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((s, i) => s + (i.product.salePrice ?? i.product.price) * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false) }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
