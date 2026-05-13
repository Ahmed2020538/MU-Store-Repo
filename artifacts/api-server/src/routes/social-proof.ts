import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router({ mergeParams: true });

router.get("/:id/social-proof", async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) return res.status(400).json({ error: "Invalid product ID" });

  try {
    const recentResult = await db.execute(sql`
      SELECT COUNT(DISTINCT o.id)::int AS count
      FROM orders o,
           jsonb_array_elements(o.items) AS item
      WHERE o.created_at > NOW() - INTERVAL '24 hours'
        AND (item->>'productId')::int = ${productId}
    `);

    const totalResult = await db.execute(sql`
      SELECT COUNT(DISTINCT o.id)::int AS count
      FROM orders o,
           jsonb_array_elements(o.items) AS item
      WHERE (item->>'productId')::int = ${productId}
    `);

    return res.json({
      recentPurchases: Number((recentResult.rows[0] as any)?.count ?? 0),
      totalSold: Number((totalResult.rows[0] as any)?.count ?? 0),
    });
  } catch (err) {
    req.log.error(err, "social-proof query failed");
    return res.json({ recentPurchases: 0, totalSold: 0 });
  }
});

export default router;
