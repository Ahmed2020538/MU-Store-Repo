import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { CreateReviewBody } from "@workspace/api-zod";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const result = CreateReviewBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [review] = await db.insert(reviewsTable).values({ ...result.data, userId }).returning();
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.status(201).json({
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    userName: user?.name ?? null,
    rating: review.rating,
    comment: review.comment ?? null,
    createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt,
  });
});

export default router;
