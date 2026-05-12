import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// In-memory session cart (keyed by session or user). For simplicity use
// request-level cart stored in a Map keyed by a session cookie or user token.
// A real implementation would persist this to DB.
const carts = new Map<string, Array<{ productId: number; quantity: number; size: string; color: string }>>();

function getCartKey(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return `user:${auth.slice(7)}`;
  let sid = req.cookies?.["cart_sid"];
  if (!sid) { sid = Math.random().toString(36).slice(2); }
  return `sid:${sid}`;
}

async function buildCartResponse(items: Array<{ productId: number; quantity: number; size: string; color: string }>) {
  const enriched = await Promise.all(items.map(async (item) => {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
    if (!product) return null;
    return {
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      product: {
        id: product.id,
        name: product.name,
        nameAr: product.nameAr ?? null,
        description: product.description ?? null,
        descriptionAr: product.descriptionAr ?? null,
        price: product.price,
        salePrice: product.salePrice ?? null,
        categoryId: product.categoryId,
        categoryName: null,
        images: product.images ?? [],
        sizes: product.sizes ?? [],
        colors: product.colors ?? [],
        stock: product.stock,
        material: product.material ?? null,
        isNew: product.isNew ?? false,
        isSale: product.isSale ?? false,
        isFeatured: product.isFeatured ?? false,
        rating: null,
        reviewCount: 0,
        soldCount: product.soldCount ?? 0,
        createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
      },
    };
  }));

  const valid = enriched.filter(Boolean) as any[];
  const subtotal = valid.reduce((s, i) => s + (i.product.salePrice ?? i.product.price) * i.quantity, 0);
  const shipping = subtotal > 0 && subtotal < 500 ? 50 : 0;
  return { items: valid, subtotal, shipping, discount: 0, total: subtotal + shipping, promoCode: null };
}

router.get("/", async (req, res) => {
  const key = getCartKey(req);
  const items = carts.get(key) ?? [];
  res.json(await buildCartResponse(items));
});

router.post("/", async (req, res) => {
  const key = getCartKey(req);
  const { productId, quantity, size, color } = req.body;
  let items = carts.get(key) ?? [];
  const existing = items.find(i => i.productId === productId && i.size === size && i.color === color);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity, size, color });
  }
  carts.set(key, items);
  res.json(await buildCartResponse(items));
});

router.put("/:productId", async (req, res) => {
  const key = getCartKey(req);
  const productId = parseInt(req.params.productId);
  const { quantity, size, color } = req.body;
  let items = carts.get(key) ?? [];
  const item = items.find(i => i.productId === productId);
  if (item) {
    item.quantity = quantity;
    if (size) item.size = size;
    if (color) item.color = color;
  }
  carts.set(key, items);
  res.json(await buildCartResponse(items));
});

router.delete("/:productId", async (req, res) => {
  const key = getCartKey(req);
  const productId = parseInt(req.params.productId);
  let items = (carts.get(key) ?? []).filter(i => i.productId !== productId);
  carts.set(key, items);
  res.json(await buildCartResponse(items));
});

export default router;
