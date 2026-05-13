import { Router } from "express";
import { db } from "@workspace/db";
import { contactMessagesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { sendMail } from "../lib/mailer.js";

const router = Router();

function genRef() {
  return "MU-" + Date.now().toString(36).toUpperCase();
}

// Public: submit contact form
router.post("/", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "name, email, subject, message required" }); return;
  }
  const trackingRef = genRef();
  const [saved] = await db.insert(contactMessagesTable).values({
    name, email, phone: phone || null, subject, message, trackingRef, isRead: false,
  }).returning();

  // Admin notification
  sendMail({
    to: "mubrand2050@gmail.com",
    subject: `📩 رسالة جديدة: ${subject}`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#F8F5F0;">
      <h2 style="color:#1A1A2E;">MU — رسالة تواصل جديدة</h2>
      <p><strong>الاسم:</strong> ${name}</p>
      <p><strong>البريد:</strong> ${email}</p>
      ${phone ? `<p><strong>الهاتف:</strong> ${phone}</p>` : ""}
      <p><strong>الموضوع:</strong> ${subject}</p>
      <p><strong>الرسالة:</strong></p>
      <blockquote style="border-right:3px solid #C9A96E;padding:8px 12px;color:#555;">${message}</blockquote>
      <p style="color:#999;font-size:12px;">رقم التتبع: ${trackingRef}</p>
    </div>`,
  }).catch(() => {});

  // Auto-reply to customer
  sendMail({
    to: email,
    subject: `شكراً لتواصلك مع MU — ${trackingRef}`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:32px;background:#F8F5F0;">
      <h2 style="color:#1A1A2E;font-family:Georgia,serif;">MU</h2>
      <p style="color:#555;line-height:1.8;">مرحباً ${name}،<br/>تم استلام رسالتك بنجاح وسيتواصل معك فريقنا في أقرب وقت ممكن.<br/>
      <strong>رقم التتبع:</strong> <code style="background:#F0E8D8;padding:2px 8px;border-radius:4px;">${trackingRef}</code></p>
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
