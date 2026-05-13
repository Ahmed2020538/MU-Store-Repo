const KEY = "mu_recently_viewed";
const MAX = 8;

export interface RecentProduct {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;
  images: string[];
  categoryName?: string | null;
  savedAt: number;
}

export function getRecentlyViewed(): RecentProduct[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addRecentlyViewed(product: Omit<RecentProduct, "savedAt">) {
  try {
    const existing = getRecentlyViewed().filter(p => p.id !== product.id);
    const updated = [{ ...product, savedAt: Date.now() }, ...existing].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("mu_recently_viewed_updated"));
  } catch {}
}

export function clearRecentlyViewed() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("mu_recently_viewed_updated"));
}
