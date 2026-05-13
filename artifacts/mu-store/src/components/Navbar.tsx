import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, User, Heart, Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, isAdmin, logout, user } = useAuth();
  const { itemCount, openCart } = useCart();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const navLinks = [
    { href: "/products", label: t("nav.shop") },
    { href: "/products?category=heels", label: t("nav.heels") },
    { href: "/products?category=bags", label: t("nav.bags") },
    { href: "/products?category=flats", label: t("nav.flats") },
    { href: "/products?category=boots", label: t("nav.boots") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-serif text-2xl font-bold tracking-widest text-foreground">MU</span>
            <span className="text-xs text-muted-foreground tracking-widest hidden lg:block">WHERE EVERY STEP TELLS YOUR STORY</span>
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
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <LanguageSwitcher />

            <button
              onClick={() => setLocation("/products")}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              aria-label="Search"
              data-testid="button-search"
            >
              <Search size={18} />
            </button>

            {isLoggedIn && (
              <Link href="/account" className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted" data-testid="link-wishlist" aria-label="Wishlist">
                <Heart size={18} />
              </Link>
            )}

            <button
              onClick={openCart}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              aria-label="Cart"
              data-testid="button-cart"
            >
              <ShoppingBag size={18} />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D4608A] text-white text-xs flex items-center justify-center font-medium"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {isLoggedIn ? (
              <div className="relative group">
                <button
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                  aria-label="Account"
                  data-testid="button-user"
                >
                  <User size={18} />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all invisible group-hover:visible z-50 translate-y-1 group-hover:translate-y-0">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link href="/account" className="block px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">{t("nav.myAccount")}</Link>
                    {isAdmin && <Link href="/admin" className="block px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">{t("nav.admin")}</Link>}
                    <button
                      onClick={() => { logout(); setLocation("/"); }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg text-destructive hover:bg-muted transition-colors"
                    >
                      {t("nav.signOut")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium px-3 py-1.5 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity ml-1"
                data-testid="link-login"
              >
                {t("nav.signIn")}
              </Link>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-muted-foreground rounded-lg hover:bg-muted"
              aria-label="Menu"
              data-testid="button-menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden border-t border-border bg-background px-4 pb-4 pt-2"
          >
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
