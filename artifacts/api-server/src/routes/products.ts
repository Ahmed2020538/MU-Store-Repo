import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, desc, asc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { CreateProductBody, UpdateProductBody } from "@workspace/api-zod";

const router = Router();

function formatProduct(p: any, avgRating?: number, reviewCount?: number, categoryName?: string) {
  return {
    id: p.id,
    name: p.name,
    nameAr: p.nameAr ?? null,
    description: p.description ?? null,
    descriptionAr: p.descriptionAr ?? null,
    price: p.price,
    salePrice: p.salePrice ?? null,
    categoryId: p.categoryId,
    categoryName: categoryName ?? null,
    images: p.images ?? [],
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    stock: p.stock,
    material: p.material ?? null,
    isNew: p.isNew ?? false,
    isSale: p.isSale ?? false,
    isFeatured: p.isFeatured ?? false,
    rating: avgRating ?? null,
    reviewCount: reviewCount ?? 0,
    soldCount: p.soldCount ?? 0,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };
}

router.get("/", async (req, res) => {
  const { category, minPrice, maxPrice, size, color, sort, page = "1", limit = "12", search } = req.query as Record<string, string>;

  const conditions: any[] = [];
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (minPrice) conditions.push(gte(productsTable.price, parseFloat(minPrice)));
  if (maxPrice) conditions.push(lte(productsTable.price, parseFloat(maxPrice)));

  let orderBy: any = desc(productsTable.createdAt);
  if (sort === "price_asc") orderBy = asc(productsTable.price);
  else if (sort === "price_desc") orderBy = desc(productsTable.price);
  else if (sort === "best_selling") orderBy = desc(productsTable.soldCount);

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  let query = db.select().from(productsTable).leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

  if (category) {
    const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, category)).limit(1);
    if (cat[0]) conditions.push(eq(productsTable.categoryId, cat[0].id));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const allProducts = whereClause
    ? await query.where(whereClause).orderBy(orderBy)
    : await query.orderBy(orderBy);

  const total = allProducts.length;
  const paginated = allProducts.slice(offset, offset + limitNum);

  const products = await Promise.all(
    paginated.map(async (row) => {
      const reviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.productId, row.products.id));
      const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
      return formatProduct(row.products, avg ?? undefined, reviews.length, row.categories?.name ?? undefined);
    })
  );

  res.json({ products, total, page: pageNum, limit: limitNum });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db.select().from(productsTable).leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id)).where(eq(productsTable.id, id)).limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const reviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.productId, id));
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  res.json(formatProduct(row.products, avg ?? undefined, reviews.length, row.categories?.name ?? undefined));
});

router.get("/:id/reviews", async (req, res) => {
  const id = parseInt(req.params.id);
  const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, id)).orderBy(desc(reviewsTable.createdAt));

  res.json(allReviews.map(r => ({
    id: r.id,
    productId: r.productId,
    userId: r.userId,
    userName: null,
    rating: r.rating,
    comment: r.comment ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  })));
});

router.post("/", requireAdmin, async (req, res) => {
  const result = CreateProductBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [product] = await db.insert(productsTable).values(result.data as any).returning();
  res.status(201).json(formatProduct(product));
});

router.put("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const result = UpdateProductBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [product] = await db.update(productsTable).set(result.data as any).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatProduct(product));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).send();
});

export default router;
