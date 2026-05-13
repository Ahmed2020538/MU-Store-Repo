import cron from "node-cron";
import { db } from "@workspace/db";
import { usersTable, couponsTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { sendMail } from "./mailer.js";
import { logger } from "./logger.js";

function todayMMDD(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function runBirthdayCheck() {
  const currentYear = new Date().getFullYear();
  const todaySlice = todayMMDD();
  try {
    const users = await db.select().from(usersTable);
    const birthdayUsers = users.filter(u =>
      u.birthDate && u.birthDate.slice(5) === todaySlice && (u.birthdayCouponYear ?? 0) !== currentYear
    );
    for (const user of birthdayUsers) {
      const isPriority = !!user.isPriority;
      const discountPct = isPriority ? 25 : 20;
      const code = `BDAY-${user.id}-${currentYear}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      try {
        await db.insert(couponsTable).values({
          code, discountPercent: discountPct, userId: user.id, expiresAt, used: false, source: "birthday",
        }).onConflictDoNothing();
        await db.update(usersTable).set({ birthdayCouponYear: currentYear }).where(eq(usersTable.id, user.id));
        if (user.email) {
          await sendMail({
            to: user.email,
            subject: "🎂 عيد ميلاد سعيد من MU!",
            html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:32px;background:#F8F5F0;">
              <h2 style="color:#1A1A2E;font-family:Georgia,serif;">MU</h2>
              <h3 style="color:#C9A96E;">🎉 كل سنة وأنتِ بخير، ${user.name}!</h3>
              <p style="color:#555;font-size:16px;line-height:1.8;">
                بمناسبة عيد ميلادك أهديكِ MU كود خصم خاص 🎁<br/>
                <strong style="font-size:22px;color:#1A1A2E;background:#F0E8D8;padding:8px 16px;border-radius:8px;display:inline-block;margin:12px 0;letter-spacing:2px;">${code}</strong><br/>
                خصم <strong>${discountPct}%</strong>${isPriority ? " 🌟 VIP" : ""} — صالح 7 أيام
              </p>
              <p style="color:#999;font-size:12px;">© ${currentYear} MU Store</p>
            </div>`,
          });
        }
        logger.info({ userId: user.id, code, discountPct }, "Birthday coupon sent");
      } catch (err) { logger.error({ err, userId: user.id }, "Birthday user error"); }
    }
    if (birthdayUsers.length > 0) logger.info({ count: birthdayUsers.length }, "Birthday check done");
  } catch (err) { logger.error({ err }, "Birthday check failed"); }
}

export function startBirthdayJob() {
  cron.schedule("1 0 * * *", runBirthdayCheck);
  runBirthdayCheck();
  logger.info("Birthday cron job started (daily 00:01)");
}
