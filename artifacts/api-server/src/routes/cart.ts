import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// ── Input guards ──────────────────────────────────────────────────────────────
function isValidCartAdd(body: any): body is { productId: number; quantity: number; size: string; color: string } {
  return (
    Number.isInteger(body?.productId) && body.productId > 0 &&
    Number.isInteger(body?.quantity) && body.quantity >= 1 && body.quantity <= 20 &&
    typeof body?.size === "string" && body.size.length >= 1 && body.size.length <= 20 &&
    typeof body?.color === "string" && body.color.length >= 1 && body.color.length <= 50
  );
}

function isValidCartUpdate(body: any): boolean {
  return (
    Number.isInteger(body?.quantity) && body.quantity >= 0 && body.quantity <= 20
  );
}

// ── In-memory session cart keyed by JWT or anonymous session ID ───────────────
const carts = new Map<string, Array<{ productId: number; quantity: number; size: string; color: string }>>();

function getCartKey(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return `user:${auth.slice(7)}`;
  let sid = req.cookies?.["cart_sid"];
  if (!sid) sid = Math.random().toString(36).slice(2);
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
  if (!isValidCartAdd(req.body)) { res.status(400).json({ error: "Invalid cart item" }); return; }
  const { productId, quantity, size, color } = req.body;
  const key = getCartKey(req);
  const items = carts.get(key) ?? [];
  const existing = items.find(i => i.productId === productId && i.size === size && i.color === color);
  if (existing) {
    existing.quantity = Math.min(20, existing.quantity + quantity);
  } else {
    items.push({ productId, quantity, size, color });
  }
  carts.set(key, items);
  res.json(await buildCartResponse(items));
});

router.put("/:productId", async (req, res) => {
  const productId = parseInt(req.params.productId);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid product ID" }); return; }
  if (!isValidCartUpdate(req.body)) { res.status(400).json({ error: "Invalid update data" }); return; }

  const key = getCartKey(req);
  const items = carts.get(key) ?? [];
  if (req.body.quantity === 0) {
    carts.set(key, items.filter(i => i.productId !== productId));
  } else {
    const item = items.find(i => i.productId === productId);
    if (item) {
      item.quantity = req.body.quantity;
      if (typeof req.body.size === "string") item.size = req.body.size;
      if (typeof req.body.color === "string") item.color = req.body.color;
    }
    carts.set(key, items);
  }
  res.json(await buildCartResponse(carts.get(key) ?? []));
});

router.delete("/:productId", async (req, res) => {
  const productId = parseInt(req.params.productId);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid product ID" }); return; }
  const key = getCartKey(req);
  carts.set(key, (carts.get(key) ?? []).filter(i => i.productId !== productId));
  res.json(await buildCartResponse(carts.get(key) ?? []));
});

router.delete("/", async (req, res) => {
  const key = getCartKey(req);
  carts.delete(key);
  res.json({ items: [], subtotal: 0, shipping: 0, discount: 0, total: 0, promoCode: null });
});

export default router;
