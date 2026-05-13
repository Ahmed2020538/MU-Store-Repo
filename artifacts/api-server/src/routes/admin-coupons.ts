import { Router } from "express";
import { db } from "@workspace/db";
import { couponsTable, usersTable } from "@workspace/db";
import { eq, lt, and } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

// List all coupons with user info
router.get("/", requireAdmin, async (_req, res) => {
  const coupons = await db.select().from(couponsTable).orderBy(couponsTable.createdAt);
  const users = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable);
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const now = new Date();
  const result = coupons.map(c => ({
    ...c,
    userName: c.userId ? (userMap[c.userId]?.name ?? "Unknown") : null,
    userEmail: c.userId ? (userMap[c.userId]?.email ?? null) : null,
    isExpired: c.expiresAt ? new Date(c.expiresAt) < now : false,
    isActive: !c.used && (!c.expiresAt || new Date(c.expiresAt) >= now),
  }));
  res.json(result);
});

// Stats
router.get("/stats", requireAdmin, async (_req, res) => {
  const coupons = await db.select().from(couponsTable);
  const now = new Date();
  res.json({
    total: coupons.length,
    birthday: coupons.filter(c => c.source === "birthday").length,
    active: coupons.filter(c => !c.used && (!c.expiresAt || new Date(c.expiresAt) >= now)).length,
    used: coupons.filter(c => c.used).length,
    expired: coupons.filter(c => c.expiresAt && new Date(c.expiresAt) < now && !c.used).length,
  });
});

// Toggle used status
router.put("/:id/toggle-used", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [c] = await db.select().from(couponsTable).where(eq(couponsTable.id, id)).limit(1);
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db.update(couponsTable).set({ used: !c.used }).where(eq(couponsTable.id, id)).returning();
  res.json(updated);
});

// Extend expiry by 7 days
router.put("/:id/extend", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [c] = await db.select().from(couponsTable).where(eq(couponsTable.id, id)).limit(1);
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  const base = c.expiresAt ? new Date(c.expiresAt) : new Date();
  base.setDate(base.getDate() + 7);
  const [updated] = await db.update(couponsTable).set({ expiresAt: base.toISOString() }).where(eq(couponsTable.id, id)).returning();
  res.json(updated);
});

// Delete single coupon
router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(couponsTable).where(eq(couponsTable.id, id));
  res.json({ ok: true });
});

// Bulk delete expired
router.delete("/bulk/expired", requireAdmin, async (_req, res) => {
  const now = new Date().toISOString();
  const result = await db.delete(couponsTable).where(lt(couponsTable.expiresAt, now)).returning();
  res.json({ deleted: result.length });
});

export default router;
