import { Router } from "express";
import { db, outfitsTable, outfitItemsTable, savedLooksTable, productsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

async function withProducts(outfitId: number) {
  const items = await db.select().from(outfitItemsTable).where(eq(outfitItemsTable.outfitId, outfitId));
  if (!items.length) return [];
  const products = await db.select().from(productsTable)
    .where(inArray(productsTable.id, items.map(i => i.productId)));
  return items
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map(item => ({ ...item, product: products.find(p => p.id === item.productId) }));
}

router.get("/", async (req, res) => {
  const { occasion, productId, all } = req.query as Record<string, string>;
  let rows = await db.select().from(outfitsTable)
    .orderBy(outfitsTable.createdAt);
  if (all !== "1") rows = rows.filter(o => o.isPublished);
  if (occasion) rows = rows.filter(o => o.occasion === occasion);
  if (productId) {
    const pid = parseInt(productId, 10);
    const matches = await db.select({ outfitId: outfitItemsTable.outfitId })
      .from(outfitItemsTable).where(eq(outfitItemsTable.productId, pid));
    const ids = new Set(matches.map(m => m.outfitId));
    rows = rows.filter(o => ids.has(o.id));
  }
  res.json(rows);
});

router.get("/saved", requireAuth, async (req, res) => {
  const userId = (req as { user?: { id: number } }).user!.id;
  const saved = await db.select().from(savedLooksTable)
    .where(eq(savedLooksTable.userId, userId));
  if (!saved.length) { res.json([]); return; }
  const outfits = await db.select().from(outfitsTable)
    .where(inArray(outfitsTable.id, saved.map(s => s.outfitId)));
  const result = await Promise.all(outfits.map(async o => ({
    ...o, items: await withProducts(o.id),
    savedId: saved.find(s => s.outfitId === o.id)?.id,
  })));
  res.json(result);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [outfit] = await db.select().from(outfitsTable).where(eq(outfitsTable.id, id));
  if (!outfit) { res.status(404).json({ error: "Not found" }); return; }
  const items = await withProducts(id);
  res.json({ ...outfit, items });
});

router.post("/:id/save", requireAuth, async (req, res) => {
  const userId = (req as { user?: { id: number } }).user!.id;
  const outfitId = parseInt(String(req.params.id), 10);
  await db.insert(savedLooksTable).values({ userId, outfitId }).onConflictDoNothing();
  res.json({ ok: true });
});

router.delete("/:id/save", requireAuth, async (req, res) => {
  const userId = (req as { user?: { id: number } }).user!.id;
  const outfitId = parseInt(String(req.params.id), 10);
  await db.delete(savedLooksTable).where(
    and(eq(savedLooksTable.userId, userId), eq(savedLooksTable.outfitId, outfitId))
  );
  res.json({ ok: true });
});

router.post("/", requireAdmin, async (req, res) => {
  const { items, ...data } = req.body as { items?: { productId: number; role?: string }[] } & Record<string, unknown>;
  const [outfit] = await db.insert(outfitsTable).values(data as never).returning();
  if (items?.length) {
    await db.insert(outfitItemsTable).values(
      items.map((item, i) => ({ outfitId: outfit.id, productId: item.productId, role: item.role ?? "accessory", displayOrder: i }))
    );
  }
  res.status(201).json(outfit);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  const { items, ...data } = req.body as { items?: { productId: number; role?: string }[] } & Record<string, unknown>;
  const [outfit] = await db.update(outfitsTable).set(data as never).where(eq(outfitsTable.id, id)).returning();
  if (items !== undefined) {
    await db.delete(outfitItemsTable).where(eq(outfitItemsTable.outfitId, id));
    if (items.length) {
      await db.insert(outfitItemsTable).values(
        items.map((item, i) => ({ outfitId: id, productId: item.productId, role: item.role ?? "accessory", displayOrder: i }))
      );
    }
  }
  res.json(outfit);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  await db.delete(outfitsTable).where(eq(outfitsTable.id, id));
  res.json({ ok: true });
});

export default router;
