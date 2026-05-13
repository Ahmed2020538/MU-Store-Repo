export type SavedItem = {
  productId: number;
  size: string;
  color: string;
  savedAt: string;
  product: {
    id: number;
    name: string;
    price: number;
    salePrice?: number | null;
    images: string[];
    stock: number;
  };
};

const KEY = "mu_saved_for_later";

export function getSavedItems(): SavedItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveForLater(item: SavedItem): void {
  const current = getSavedItems();
  const exists = current.find(
    s => s.productId === item.productId && s.size === item.size && s.color === item.color
  );
  if (!exists) {
    current.unshift({ ...item, savedAt: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(current));
  }
}

export function removeSaved(productId: number, size: string, color: string): void {
  const updated = getSavedItems().filter(
    s => !(s.productId === productId && s.size === size && s.color === color)
  );
  localStorage.setItem(KEY, JSON.stringify(updated));
}
