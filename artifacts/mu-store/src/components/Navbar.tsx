import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, User, Heart, Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useSearch } from "@/lib/search-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isLoggedIn, isAdmin, logout, user } = useAuth();
  const { itemCount, openCart } = useCart();
  const { setOpen: openSearch } = useSearch();
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { href: "/products", label: t("nav.shop") },
    { href: "/products?category=heels", label: t("nav.heels") },
    { href: "/products?category=bags", label: t("nav.bags") },
    { href: "/products?category=flats", label: t("nav.flats") },
    { href: "/products?category=boots", label: t("nav.boots") },
  ];

  const isActive = (href: string) =>
    href === "/products"
      ? location === "/products"
      : location.startsWith("/products") && location.includes(href.split("?")[1] ?? "");

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-md"
          : "bg-background border-b border-border"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative">
              <span className="font-serif text-2xl font-bold tracking-widest text-foreground transition-all duration-300 group-hover:tracking-[0.25em]">
                MU
              </span>
              <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-[#C9A96E] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
            <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase hidden lg:block leading-none opacity-60">
              Where every step<br />tells your story
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-lg group ${
                  isActive(link.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C9A96E] rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />

            <button
              onClick={() => openSearch(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              aria-label="Search"
              data-testid="button-search"
            >
              <Search size={18} />
            </button>

            {isLoggedIn && <NotificationBell />}

            {isLoggedIn && (
              <Link
                href="/account"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                data-testid="link-wishlist"
                aria-label="Wishlist"
              >
                <Heart size={18} />
              </Link>
            )}

            <button
              onClick={openCart}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              aria-label="Cart"
              data-testid="button-cart"
            >
              <ShoppingBag size={18} />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D4608A] text-white text-xs flex items-center justify-center font-semibold shadow-sm"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {isLoggedIn ? (
              <div className="relative group">
                <button
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                  aria-label="Account"
                  data-testid="button-user"
                >
                  <User size={18} />
                </button>
                <div className="absolute right-0 mt-2 w-52 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all invisible group-hover:visible z-50 translate-y-2 group-hover:translate-y-0 duration-200">
                  <div className="p-4 border-b border-border/50">
                    <p className="text-sm font-semibold truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link href="/account" className="block px-3 py-2 text-sm rounded-lg hover:bg-muted/60 transition-colors font-medium">{t("nav.myAccount")}</Link>
                    {isAdmin && <Link href="/admin" className="block px-3 py-2 text-sm rounded-lg hover:bg-muted/60 transition-colors">{t("nav.admin")}</Link>}
                    <button
                      onClick={() => { logout(); setLocation("/"); }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg text-destructive hover:bg-muted/60 transition-colors"
                    >
                      {t("nav.signOut")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold px-4 py-1.5 bg-foreground text-background rounded-lg hover:opacity-90 transition-all hover:shadow-md ml-1"
                data-testid="link-login"
              >
                {t("nav.signIn")}
              </Link>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-muted-foreground rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Menu"
              data-testid="button-menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menuOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="block"
                >
                  {menuOpen ? <X size={18} /> : <Menu size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block py-2.5 px-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive(link.href) ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
