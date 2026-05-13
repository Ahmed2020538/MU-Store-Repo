import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, TrendingUp, Tag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSearch } from "@/lib/search-context";

const QUICK_CATEGORIES = [
  { label: "Heels", slug: "heels" },
  { label: "Flats", slug: "flats" },
  { label: "Sandals", slug: "sandals" },
  { label: "Bags", slug: "bags" },
  { label: "Boots", slug: "boots" },
];

const TRENDING = ["Block heels", "Leather bags", "Summer sandals", "Wedding flats"];

const RECENT_KEY = "mu_recent_searches";
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function addRecent(q: string) {
  const prev = getRecent().filter(s => s !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 5)));
}

interface Product {
  id: number; name: string; price: number; salePrice?: number | null;
  images: string[]; categoryName?: string | null;
}

export default function SearchModal() {
  const { open, setOpen } = useSearch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setQuery("");
      setResults([]);
      setSelected(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") setSelected(p => Math.min(p + 1, results.length - 1));
      if (e.key === "ArrowUp") setSelected(p => Math.max(p - 1, -1));
      if (e.key === "Enter" && selected >= 0) {
        const r = results[selected];
        if (r) navigate(`/products/${r.id}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, selected]);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    setLocation(href);
  }, [setOpen, setLocation]);

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`)
      .then(r => r.json())
      .then(d => setResults(Array.isArray(d) ? d : d.products ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    setSelected(-1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(v), 280);
  };

  const submitSearch = () => {
    if (!query.trim()) return;
    addRecent(query.trim());
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const pickRecent = (s: string) => {
    setQuery(s);
    addRecent(s);
    navigate(`/products?search=${encodeURIComponent(s)}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center pt-16 px-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={20} className="text-[#C9A96E] flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => handleChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitSearch()}
                placeholder="Search products, categories…"
                className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
              />
              {query && (
                <button onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={18} />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            <div className="max-h-[65vh] overflow-y-auto">
              {/* Live results */}
              {query.trim() ? (
                loading ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Searching…</div>
                ) : results.length > 0 ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-1 font-semibold">Results</p>
                    {results.map((r, i) => (
                      <button key={r.id} onClick={() => { addRecent(query); navigate(`/products/${r.id}`); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left ${selected === i ? "bg-muted" : ""}`}>
                        <img src={r.images?.[0] ?? "/placeholder.jpg"} alt={r.name}
                          className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-border" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.categoryName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {r.salePrice ? (
                            <>
                              <p className="text-sm font-semibold text-[#C9A96E]">{r.salePrice.toLocaleString()} EGP</p>
                              <p className="text-xs text-muted-foreground line-through">{r.price.toLocaleString()}</p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold">{r.price.toLocaleString()} EGP</p>
                          )}
                        </div>
                      </button>
                    ))}
                    <button onClick={submitSearch}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-border text-sm text-[#C9A96E] hover:bg-muted transition-colors font-medium">
                      See all results for "{query}" <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">No products found for "{query}"</div>
                )
              ) : (
                <div className="p-4 space-y-5">
                  {/* Recent searches */}
                  {recent.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">Recent</p>
                      <div className="flex flex-wrap gap-2">
                        {recent.map(s => (
                          <button key={s} onClick={() => pickRecent(s)}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border hover:border-[#C9A96E]/50 hover:bg-muted transition-colors">
                            <Search size={12} className="text-muted-foreground" />{s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Trending */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold flex items-center gap-1.5"><TrendingUp size={10} />Trending</p>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING.map(t => (
                        <button key={t} onClick={() => pickRecent(t)}
                          className="text-sm px-3 py-1.5 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] hover:bg-[#C9A96E]/20 transition-colors">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Categories */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold flex items-center gap-1.5"><Tag size={10} />Categories</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {QUICK_CATEGORIES.map(({ label, slug }) => (
                        <Link key={slug} href={`/products?category=${slug}`} onClick={() => setOpen(false)}>
                          <div className="text-center py-2 px-3 rounded-xl border border-border hover:border-[#C9A96E]/50 hover:bg-muted transition-colors cursor-pointer">
                            <p className="text-xs font-medium">{label}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
