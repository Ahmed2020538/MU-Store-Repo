import { Router } from "express";
import { db } from "@workspace/db";
import { discountCodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ValidatePromoBody } from "@workspace/api-zod";

const router = Router();

router.post("/validate", async (req, res) => {
  const result = ValidatePromoBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { code, cartTotal = 0 } = result.data;
  const [promo] = await db.select().from(discountCodesTable).where(eq(discountCodesTable.code, code.toUpperCase())).limit(1);
  if (!promo || !promo.isActive) {
    res.status(404).json({ error: "Invalid or expired promo code" });
    return;
  }
  let discountAmount = 0;
  if (promo.discountType === "percentage") {
    discountAmount = cartTotal * (promo.discountValue / 100);
  } else if (promo.discountType === "fixed") {
    discountAmount = promo.discountValue;
  } else if (promo.discountType === "free_shipping") {
    discountAmount = 50; // standard shipping cost
  }
  res.json({
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmount,
  });
});

export default router;
