import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { sendMail } from "../lib/mailer.js";

const router = Router();

// Complete profile — 3-step wizard submission
router.post("/complete", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const {
    name, phone, birthDate,
    governorate, city, address,
    instagramHandle, facebookUrl, tiktokHandle, whatsappSocial, xHandle,
  } = req.body;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  const wasAlreadyComplete = !!user.isProfileComplete;

  await db.update(usersTable).set({
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(birthDate ? { birthDate } : {}),
    ...(governorate ? { governorate } : {}),
    ...(city ? { city } : {}),
    ...(address ? { address } : {}),
    ...(instagramHandle !== undefined ? { instagramHandle } : {}),
    ...(facebookUrl !== undefined ? { facebookUrl } : {}),
    ...(tiktokHandle !== undefined ? { tiktokHandle } : {}),
    ...(whatsappSocial !== undefined ? { whatsappSocial } : {}),
    ...(xHandle !== undefined ? { xHandle } : {}),
    isProfileComplete: 1,
    isPriority: 1,
    priorityGrantedAt: new Date().toISOString(),
    loyaltyPoints: wasAlreadyComplete ? (user.loyaltyPoints ?? 0) : (user.loyaltyPoints ?? 0) + 100,
  }).where(eq(usersTable.id, userId));

  if (!wasAlreadyComplete) {
    sendMail({
      to: user.email,
      subject: "🌟 أهلاً بك في نادي MU الـ VIP!",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:32px;background:#F8F5F0;">
        <h2 style="color:#1A1A2E;font-family:Georgia,serif;font-size:28px;">MU</h2>
        <h3 style="color:#C9A96E;">🎉 مبروك، ${user.name}! أنتِ الآن عضوة VIP</h3>
        <p style="color:#555;line-height:1.8;">تم إضافة <strong style="color:#C9A96E;">100 نقطة مكافأة</strong> لحسابك.<br/>
        كعضوة أولوية تحصلين على:<br/>
        ✦ وصول مبكر للعروض الحصرية 24 ساعة<br/>
        ✦ خصم 25% في عيد ميلادك<br/>
        ✦ نقاط مضاعفة على أول 3 طلبات<br/>
        ✦ أكواد خصم حصرية</p>
        <p style="color:#999;font-size:12px;">© ${new Date().getFullYear()} MU Store</p>
      </div>`,
    }).catch(() => {});
  }

  res.json({ ok: true, bonusPoints: wasAlreadyComplete ? 0 : 100, isPriority: true });
});

// Update individual social handles
router.put("/socials", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { instagramHandle, facebookUrl, tiktokHandle, whatsappSocial, xHandle } = req.body;
  await db.update(usersTable).set({
    ...(instagramHandle !== undefined ? { instagramHandle } : {}),
    ...(facebookUrl !== undefined ? { facebookUrl } : {}),
    ...(tiktokHandle !== undefined ? { tiktokHandle } : {}),
    ...(whatsappSocial !== undefined ? { whatsappSocial } : {}),
    ...(xHandle !== undefined ? { xHandle } : {}),
  }).where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

export default router;
