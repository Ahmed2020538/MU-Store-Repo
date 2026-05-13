import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const CACHE_TTL = 10 * 60 * 1000;
let cache: { data: any[]; ts: number } | null = null;

function invalidateCache() { cache = null; }

router.get("/", async (_req, res) => {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    res.json(cache.data);
    return;
  }

  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  const result = await Promise.all(cats.map(async (cat) => {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productsTable)
      .where(eq(productsTable.categoryId, cat.id));
    return {
      id: cat.id,
      name: cat.name,
      nameAr: cat.nameAr ?? null,
      slug: cat.slug,
      image: cat.image ?? null,
      productCount: Number(count),
    };
  }));

  cache = { data: result, ts: Date.now() };
  res.json(result);
});

export { invalidateCache };
export default router;
