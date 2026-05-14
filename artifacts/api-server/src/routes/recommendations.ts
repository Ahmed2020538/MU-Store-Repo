import { Router } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, ne, and, gte, lte, sql } from "drizzle-orm";

const router = Router({ mergeParams: true });

function complementarySlug(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("bag")) return "heels";
  if (s.includes("heel") || s.includes("flat") || s.includes("boot") || s.includes("sneaker")) return "bags";
  return "bags";
}

router.get("/:id/recommendations", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db
    .select({ price: productsTable.price, categoryId: productsTable.categoryId })
    .from(productsTable).where(eq(productsTable.id, id));

  if (!product) { res.status(404).json({ error: "Not found" }); return; }

  const [cat] = await db
    .select({ slug: categoriesTable.slug })
    .from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));

  const compSlug = complementarySlug(cat?.slug ?? "");

  const [compCat] = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable).where(eq(categoriesTable.slug, compSlug));

  const minPrice = product.price * 0.4;
  const maxPrice = product.price * 2.5;

  const candidates = await db
    .select()
    .from(productsTable)
    .where(and(
      compCat ? eq(productsTable.categoryId, compCat.id) : undefined,
      ne(productsTable.id, id),
      eq(productsTable.isHidden, false),
      gte(productsTable.price, minPrice),
      lte(productsTable.price, maxPrice),
    ))
    .limit(20);

  const scored = candidates.map(p => {
    let score = 0;
    if (p.isFeatured) score += 3;
    if (p.isNew) score += 1;
    if ((p.rating ?? 0) >= 4.5) score += 2;
    if ((p.soldCount ?? 0) > 50) score += 1;
    if (p.isSale) score += 0.5;
    return { ...p, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);
  const top = scored.slice(0, 6).map(({ _score, ...p }) => p);

  res.json(top);
});

export default router;
