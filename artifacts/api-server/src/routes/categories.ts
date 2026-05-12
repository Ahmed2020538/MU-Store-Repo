import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  const result = await Promise.all(cats.map(async (cat) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(eq(productsTable.categoryId, cat.id));
    return {
      id: cat.id,
      name: cat.name,
      nameAr: cat.nameAr ?? null,
      slug: cat.slug,
      image: cat.image ?? null,
      productCount: Number(count),
    };
  }));
  res.json(result);
});

export default router;
