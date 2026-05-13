import { Router } from "express";
import { db } from "@workspace/db";
import { brandsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();
let cache: { data: any[]; time: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

const SEED_BRANDS = [
  "Baldinini", "Zitrone Berlin", "Enni Marco", "Mario Rossi Collezioni",
  "Steve Madden", "Aldo", "Nine West", "Charles & Keith", "Guess", "Michael Kors",
];

async function ensureSeed() {
  const [existing] = await db.select().from(brandsTable).limit(1);
  if (!existing) {
    await db.insert(brandsTable).values(
      SEED_BRANDS.map((name, i) => ({ name, displayOrder: i, active: 1 })),
    );
  }
}

router.get("/brands", async (_req, res) => {
  if (cache && Date.now() - cache.time < CACHE_TTL) { res.json(cache.data); return; }
  await ensureSeed();
  const brands = await db.select().from(brandsTable).where(eq(brandsTable.active, 1)).orderBy(asc(brandsTable.displayOrder));
  cache = { data: brands, time: Date.now() };
  res.json(brands);
});

router.get("/admin/brands", requireAdmin, async (_req, res) => {
  const brands = await db.select().from(brandsTable).orderBy(asc(brandsTable.displayOrder));
  res.json(brands);
});

router.post("/admin/brands", requireAdmin, async (req, res) => {
  const { name, logoUrl, websiteUrl, displayOrder } = req.body;
  const [brand] = await db.insert(brandsTable).values({ name, logoUrl, websiteUrl, displayOrder: displayOrder ?? 0, active: 1 }).returning();
  cache = null;
  res.json(brand);
});

router.put("/admin/brands/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const { name, logoUrl, websiteUrl, displayOrder, active } = req.body;
  const [brand] = await db.update(brandsTable).set({ name, logoUrl, websiteUrl, displayOrder, active }).where(eq(brandsTable.id, id)).returning();
  if (!brand) { res.status(404).json({ error: "Not found" }); return; }
  cache = null;
  res.json(brand);
});

router.delete("/admin/brands/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(brandsTable).where(eq(brandsTable.id, id));
  cache = null;
  res.json({ success: true });
});

router.post("/admin/brands/reorder", requireAdmin, async (req, res) => {
  const { order } = req.body as { order: { id: number; displayOrder: number }[] };
  await Promise.all(order.map(({ id, displayOrder }) =>
    db.update(brandsTable).set({ displayOrder }).where(eq(brandsTable.id, id)),
  ));
  cache = null;
  res.json({ success: true });
});

export default router;
