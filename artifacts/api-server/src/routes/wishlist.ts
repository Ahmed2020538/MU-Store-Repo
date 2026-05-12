import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistTable, productsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const items = await db.select({ products: productsTable })
    .from(wishlistTable)
    .innerJoin(productsTable, eq(wishlistTable.productId, productsTable.id))
    .where(eq(wishlistTable.userId, userId));
  res.json(items.map(i => ({
    id: i.products.id,
    name: i.products.name,
    nameAr: i.products.nameAr ?? null,
    description: i.products.description ?? null,
    descriptionAr: i.products.descriptionAr ?? null,
    price: i.products.price,
    salePrice: i.products.salePrice ?? null,
    categoryId: i.products.categoryId,
    categoryName: null,
    images: i.products.images ?? [],
    sizes: i.products.sizes ?? [],
    colors: i.products.colors ?? [],
    stock: i.products.stock,
    material: i.products.material ?? null,
    isNew: i.products.isNew ?? false,
    isSale: i.products.isSale ?? false,
    isFeatured: i.products.isFeatured ?? false,
    rating: null,
    reviewCount: 0,
    soldCount: i.products.soldCount ?? 0,
    createdAt: i.products.createdAt instanceof Date ? i.products.createdAt.toISOString() : i.products.createdAt,
  })));
});

router.post("/:productId", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const productId = parseInt(req.params.productId);
  const existing = await db.select().from(wishlistTable).where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.productId, productId))).limit(1);
  if (existing.length === 0) {
    await db.insert(wishlistTable).values({ userId, productId });
  }
  res.json({ success: true });
});

router.delete("/:productId", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const productId = parseInt(req.params.productId);
  await db.delete(wishlistTable).where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.productId, productId)));
  res.json({ success: true });
});

export default router;
