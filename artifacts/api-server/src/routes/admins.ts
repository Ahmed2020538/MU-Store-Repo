import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { hashPassword } from "../lib/auth.js";
import { sendMail } from "../lib/mailer.js";

const router = Router();

function fmtAdmin(u: any) {
  return {
    id: u.id, email: u.email, name: u.name, role: u.role,
    isAdmin: u.isAdmin, permissions: u.permissions ?? "{}",
    adminCreatedAt: u.adminCreatedAt ?? null,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  };
}

// List all admins
router.get("/", requireAdmin, async (_req, res) => {
  const admins = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
  res.json(admins.map(fmtAdmin));
});

// Create new admin
router.post("/", requireAdmin, async (req, res) => {
  const { name, email, password, permissions } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, password required" }); return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) { res.status(400).json({ error: "Email already in use" }); return; }

  const passwordHash = await hashPassword(password);
  const creatorId = (req as any).user.id;
  const [user] = await db.insert(usersTable).values({
    email, passwordHash, name, role: "admin",
    isAdmin: 1,
    adminCreatedBy: creatorId,
    adminCreatedAt: new Date().toISOString(),
    permissions: JSON.stringify(permissions ?? {}),
  }).returning();

  const siteUrl = process.env["STORE_URL"] ?? "https://mu-store.com";
  sendMail({
    to: email,
    subject: "تم إضافتك كمشرف على موقع MU 🔐",
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:32px;background:#F8F5F0;">
      <h2 style="color:#1A1A2E;font-family:Georgia,serif;">MU Store</h2>
      <h3 style="color:#C9A96E;">مرحباً ${name}،</h3>
      <p style="color:#555;line-height:1.8;">تم إضافتك كمشرف على متجر MU. بيانات الدخول:<br/>
        <strong>رابط الدخول:</strong> ${siteUrl}/admin<br/>
        <strong>البريد:</strong> ${email}<br/>
        <strong>كلمة المرور:</strong> ${password}<br/>
        <span style="color:#e65100;">يرجى تغييرها بعد أول دخول.</span>
      </p>
    </div>`,
  }).catch(() => {});

  res.status(201).json(fmtAdmin(user));
});

// Deactivate admin (set role=customer, isAdmin=0) — protect original admin
router.put("/:id/deactivate", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!target) { res.status(404).json({ error: "Not found" }); return; }
  if (target.email === "admin@mu.com") { res.status(403).json({ error: "Cannot deactivate root admin" }); return; }
  const [updated] = await db.update(usersTable)
    .set({ role: "customer", isAdmin: 0 })
    .where(eq(usersTable.id, id)).returning();
  res.json(fmtAdmin(updated));
});

// Delete admin — protect original admin
router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!target) { res.status(404).json({ error: "Not found" }); return; }
  if (target.email === "admin@mu.com") { res.status(403).json({ error: "Cannot delete root admin" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

export default router;
