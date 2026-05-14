import { Router } from "express";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { contactMessagesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { sendMail } from "../lib/mailer.js";

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many contact requests. Please try again later." },
});

const router = Router();

function genRef() {
  return "MU-" + Date.now().toString(36).toUpperCase();
}

function sanitize(val: unknown, max: number): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim().slice(0, max);
  return trimmed.length ? trimmed : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Public: submit contact form
router.post("/", contactLimiter, async (req, res) => {
  const name = sanitize(req.body?.name, 100);
  const email = sanitize(req.body?.email, 254);
  const phone = sanitize(req.body?.phone, 20);
  const subject = sanitize(req.body?.subject, 200);
  const message = sanitize(req.body?.message, 2000);

  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "name, email, subject, message required" }); return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Invalid email address" }); return;
  }
  const trackingRef = genRef();
  const [saved] = await db.insert(contactMessagesTable).values({
    name, email, phone: phone || null, subject, message, trackingRef, isRead: false,
  }).returning();

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = phone ? escapeHtml(phone) : null;
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);
  const safeRef = escapeHtml(trackingRef);

  // Admin notification
  sendMail({
    to: "mubrand2050@gmail.com",
    subject: `📩 رسالة جديدة: ${safeSubject}`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#F8F5F0;">
      <h2 style="color:#1A1A2E;">MU — رسالة تواصل جديدة</h2>
      <p><strong>الاسم:</strong> ${safeName}</p>
      <p><strong>البريد:</strong> ${safeEmail}</p>
      ${safePhone ? `<p><strong>الهاتف:</strong> ${safePhone}</p>` : ""}
      <p><strong>الموضوع:</strong> ${safeSubject}</p>
      <p><strong>الرسالة:</strong></p>
      <blockquote style="border-right:3px solid #C9A96E;padding:8px 12px;color:#555;">${safeMessage}</blockquote>
      <p style="color:#999;font-size:12px;">رقم التتبع: ${safeRef}</p>
    </div>`,
  }).catch(() => {});

  // Auto-reply to customer
  sendMail({
    to: email,
    subject: `شكراً لتواصلك مع MU — ${trackingRef}`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:32px;background:#F8F5F0;">
      <h2 style="color:#1A1A2E;font-family:Georgia,serif;">MU</h2>
      <p style="color:#555;line-height:1.8;">مرحباً ${safeName}،<br/>تم استلام رسالتك بنجاح وسيتواصل معك فريقنا في أقرب وقت ممكن.<br/>
      <strong>رقم التتبع:</strong> <code style="background:#F0E8D8;padding:2px 8px;border-radius:4px;">${safeRef}</code></p>
      <p style="color:#999;font-size:12px;">© ${new Date().getFullYear()} MU Store</p>
    </div>`,
  }).catch(() => {});

  res.status(201).json({ ok: true, trackingRef });
});

// Admin: list messages
router.get("/admin", requireAdmin, async (_req, res) => {
  const msgs = await db.select().from(contactMessagesTable).orderBy(desc(contactMessagesTable.createdAt));
  res.json(msgs);
});

// Admin: mark as read
router.put("/admin/:id/read", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.update(contactMessagesTable).set({ isRead: true }).where(eq(contactMessagesTable.id, id));
  res.json({ ok: true });
});

// Admin: delete message
router.delete("/admin/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(contactMessagesTable).where(eq(contactMessagesTable.id, id));
  res.json({ ok: true });
});

// Admin: stats (total + unread today)
router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const msgs = await db.select().from(contactMessagesTable);
  const unreadToday = msgs.filter(m => !m.isRead && m.createdAt >= today).length;
  res.json({ total: msgs.length, unreadToday, unread: msgs.filter(m => !m.isRead).length });
});

export default router;
