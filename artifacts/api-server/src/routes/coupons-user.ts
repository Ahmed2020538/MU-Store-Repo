import { Router } from "express";
import { db } from "@workspace/db";
import { couponsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// GET /api/coupons/mine — user's own coupons
router.get("/mine", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const coupons = await db.select().from(couponsTable)
    .where(eq(couponsTable.userId, userId))
    .orderBy(desc(couponsTable.createdAt));

  const now = new Date();
  const result = coupons.map(c => ({
    ...c,
    isExpired: c.expiresAt ? new Date(c.expiresAt) < now : false,
    isActive: !c.used && (!c.expiresAt || new Date(c.expiresAt) >= now),
  }));

  res.json(result);
});

export default router;
