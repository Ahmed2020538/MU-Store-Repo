import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, requireAuth } from "../lib/auth.js";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

router.post("/register", async (req, res) => {
  const result = RegisterBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password, name, phone } = result.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ email, passwordHash, name, phone }).returning();
  const token = signToken({ id: user.id, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, loyaltyPoints: user.loyaltyPoints ?? 0, createdAt: user.createdAt.toISOString() },
  });
});

router.post("/login", async (req, res) => {
  const result = LoginBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = result.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ id: user.id, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, loyaltyPoints: user.loyaltyPoints ?? 0, createdAt: user.createdAt.toISOString() },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, loyaltyPoints: user.loyaltyPoints ?? 0, createdAt: user.createdAt.toISOString() });
});

export default router;
