import { Router } from "express";
import { db } from "@workspace/db";
import { discountCodesTable, couponsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ValidatePromoBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.post("/validate", async (req, res) => {
  const result = ValidatePromoBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { code, cartTotal = 0 } = result.data;
  const upper = code.toUpperCase();

  // 1. Check static discount codes table first
  const [promo] = await db.select().from(discountCodesTable).where(eq(discountCodesTable.code, upper)).limit(1);
  if (promo && promo.isActive) {
    let discountAmount = 0;
    if (promo.discountType === "percentage") {
      discountAmount = cartTotal * (promo.discountValue / 100);
    } else if (promo.discountType === "fixed") {
      discountAmount = promo.discountValue;
    } else if (promo.discountType === "free_shipping") {
      discountAmount = 50;
    }
    res.json({ code: promo.code, discountType: promo.discountType, discountValue: promo.discountValue, discountAmount });
    return;
  }

  // 2. Check user-specific coupons (birthday etc.)
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, upper)).limit(1);
  if (!coupon) { res.status(404).json({ error: "Invalid or expired promo code" }); return; }
  if (coupon.used) { res.status(400).json({ error: "Coupon already used" }); return; }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    res.status(400).json({ error: "Coupon has expired" }); return;
  }

  const discountAmount = cartTotal * ((coupon.discountPercent ?? 20) / 100);
  res.json({
    code: coupon.code,
    discountType: "percentage",
    discountValue: coupon.discountPercent ?? 20,
    discountAmount,
    couponId: coupon.id,
  });
});

// Mark coupon used (called internally after order placed)
router.post("/use", requireAuth, async (req, res) => {
  const { couponId } = req.body;
  if (!couponId) { res.status(400).json({ error: "Missing couponId" }); return; }
  await db.update(couponsTable).set({ used: true }).where(eq(couponsTable.id, couponId));
  res.json({ ok: true });
});

export default router;
