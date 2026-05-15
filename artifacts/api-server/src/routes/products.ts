import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, desc, asc, sql, inArray } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { CreateProductBody, UpdateProductBody } from "@workspace/api-zod";

const router = Router();

function formatProduct(p: any, avgRating?: number, reviewCount?: number, categoryName?: string) {
  return {
    id: p.id, name: p.name, nameAr: p.nameAr ?? null,
    description: p.description ?? null, descriptionAr: p.descriptionAr ?? null,
    price: p.price, salePrice: p.salePrice ?? null,
    categoryId: p.categoryId, categoryName: categoryName ?? null,
    images: p.images ?? [], sizes: p.sizes ?? [], colors: p.colors ?? [],
    stock: p.stock, material: p.material ?? null,
    isNew: p.isNew ?? false, isSale: p.isSale ?? false,
    isFeatured: p.isFeatured ?? false, isHidden: p.isHidden ?? false,
    discountLabel: p.discountLabel ?? null,
    rating: avgRating ?? null, reviewCount: reviewCount ?? 0,
    soldCount: p.soldCount ?? 0,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const {
      category, minPrice, maxPrice, size, color,
      sort, page = "1", limit = "12", search,
    } = req.query as Record<string, string>;

    const conditions: any[] = [eq(productsTable.isHidden, false)];

    if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
    if (minPrice) conditions.push(gte(productsTable.price, parseFloat(minPrice)));
    if (maxPrice) conditions.push(lte(productsTable.price, parseFloat(maxPrice)));
    if (size) conditions.push(sql`${productsTable.sizes}::jsonb @> ${JSON.stringify([size])}::jsonb`);
    if (color) conditions.push(sql`${productsTable.colors}::jsonb @> ${JSON.stringify([color])}::jsonb`);

    if (category) {
      const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, category)).limit(1);
      if (cat[0]) conditions.push(eq(productsTable.categoryId, cat[0].id));
      else { res.json({ products: [], total: 0, page: 1, limit: parseInt(limit) }); return; }
    }

    let orderBy: any = desc(productsTable.createdAt);
    if (sort === "price_asc") orderBy = asc(productsTable.price);
    else if (sort === "price_desc") orderBy = desc(productsTable.price);
    else if (sort === "best_selling") orderBy = desc(productsTable.soldCount);
    else if (sort === "top_rated") orderBy = desc(productsTable.rating);

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      whereClause
        ? db.select({ count: sql<number>`count(*)` }).from(productsTable).where(whereClause)
        : db.select({ count: sql<number>`count(*)` }).from(productsTable).where(eq(productsTable.isHidden, false)),
      whereClause
        ? db.select().from(productsTable)
            .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
            .where(whereClause).orderBy(orderBy).limit(limitNum).offset(offset)
        : db.select().from(productsTable)
            .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
            .orderBy(orderBy).limit(limitNum).offset(offset),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    if (rows.length === 0) {
      res.json({ products: [], total, page: pageNum, limit: limitNum });
      return;
    }

    const productIds = rows.map(r => r.products.id);
    const reviewAggs = await db
      .select({
        productId: reviewsTable.productId,
        avg: sql<number>`avg(rating)`,
        count: sql<number>`count(*)`,
      })
      .from(reviewsTable)
      .where(inArray(reviewsTable.productId, productIds))
      .groupBy(reviewsTable.productId);

    const reviewMap = new Map(reviewAggs.map(r => [r.productId, { avg: Number(r.avg), count: Number(r.count) }]));

    const products = rows.map(row => {
      const rev = reviewMap.get(row.products.id);
      return formatProduct(row.products, rev?.avg, rev?.count ?? 0, row.categories?.name ?? undefined);
    });

    res.json({ products, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const [[row], reviewAgg] = await Promise.all([
      db.select().from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .where(eq(productsTable.id, id)).limit(1),
      db.select({ avg: sql<number>`avg(rating)`, count: sql<number>`count(*)` })
        .from(reviewsTable).where(eq(reviewsTable.productId, id)),
    ]);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    const avg = reviewAgg[0]?.avg ? Number(reviewAgg[0].avg) : undefined;
    const count = Number(reviewAgg[0]?.count ?? 0);
    res.json(formatProduct(row.products, avg, count, row.categories?.name ?? undefined));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/reviews", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const allReviews = await db.select().from(reviewsTable)
      .where(eq(reviewsTable.productId, id)).orderBy(desc(reviewsTable.createdAt));
    res.json(allReviews.map(r => ({
      id: r.id, productId: r.productId, userId: r.userId, userName: null,
      rating: r.rating, comment: r.comment ?? null,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })));
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const result = CreateProductBody.safeParse(req.body);
    if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const [product] = await db.insert(productsTable).values(result.data as any).returning();
    res.status(201).json(formatProduct(product));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id));
    const result = UpdateProductBody.safeParse(req.body);
    if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const [product] = await db.update(productsTable).set(result.data as any).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatProduct(product));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
