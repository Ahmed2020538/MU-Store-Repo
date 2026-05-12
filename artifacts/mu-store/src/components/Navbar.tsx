import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, User, Heart, Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, isAdmin, logout, user } = useAuth();
  const { itemCount, openCart } = useCart();
  const [, setLocation] = useLocation();

  const navLinks = [
    { href: "/products", label: "Shop" },
    { href: "/products?category=heels", label: "Heels" },
    { href: "/products?category=bags", label: "Bags" },
    { href: "/products?category=flats", label: "Flats" },
    { href: "/products?category=boots", label: "Boots" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="font-serif text-2xl font-bold tracking-widest text-foreground">MU</span>
            <span className="ml-2 text-xs text-muted-foreground tracking-widest hidden sm:block">WHERE EVERY STEP TELLS YOUR STORY</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/products")} className="p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-search">
              <Search size={20} />
            </button>

            {isLoggedIn && (
              <Link href="/account" className="p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="link-wishlist">
                <Heart size={20} />
              </Link>
            )}

            <button onClick={openCart} className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-cart">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D4608A] text-white text-xs flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </button>

            {isLoggedIn ? (
              <div className="relative group">
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-user">
                  <User size={20} />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Link href="/account" className="block px-3 py-2 text-sm hover:bg-muted transition-colors">My Account</Link>
                  {isAdmin && <Link href="/admin" className="block px-3 py-2 text-sm hover:bg-muted transition-colors">Admin Dashboard</Link>}
                  <button onClick={() => { logout(); setLocation("/"); }} className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors">Sign Out</button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium px-3 py-1.5 bg-foreground text-background rounded-md hover:opacity-90 transition-opacity" data-testid="link-login">
                Sign In
              </Link>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-muted-foreground" data-testid="button-menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="md:hidden border-t border-border bg-background px-4 pb-4">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
