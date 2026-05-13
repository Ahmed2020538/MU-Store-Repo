import { db } from "@workspace/db";
import { usersTable, couponsTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { sendMail } from "./mailer.js";
import { logger } from "./logger.js";

function todayMMDD(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

async function runBirthdayCheck() {
  const currentYear = new Date().getFullYear();
  const todaySlice = todayMMDD(); // MM-DD

  try {
    const users = await db.select().from(usersTable).where(ne(usersTable.birthdayCouponYear, currentYear));
    const birthdayUsers = users.filter(u => {
      if (!u.birthDate) return false;
      // birthDate stored as YYYY-MM-DD — extract MM-DD
      const mmdd = u.birthDate.slice(5); // "MM-DD"
      return mmdd === todaySlice;
    });

    for (const user of birthdayUsers) {
      const code = `BDAY-${user.id}-${currentYear}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      try {
        await db.insert(couponsTable).values({
          code,
          discountPercent: 20,
          userId: user.id,
          expiresAt,
          used: false,
        }).onConflictDoNothing();

        await db.update(usersTable)
          .set({ birthdayCouponYear: currentYear })
          .where(eq(usersTable.id, user.id));

        if (user.email) {
          await sendMail({
            to: user.email,
            subject: "🎂 عيد ميلاد سعيد من MU!",
            html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:32px;background:#F8F5F0;text-align:right;">
              <h2 style="color:#1A1A2E;font-family:Georgia,serif;font-size:28px;">MU</h2>
              <h3 style="color:#C9A96E;">🎉 كل سنة وأنتِ بخير، ${user.name}!</h3>
              <p style="color:#555;font-size:16px;line-height:1.8;">
                بمناسبة عيد ميلادك، أهديكِ MU كود خصم خاص 🎁<br/>
                <strong style="font-size:22px;color:#1A1A2E;background:#F0E8D8;padding:8px 16px;border-radius:8px;display:inline-block;margin:12px 0;letter-spacing:2px;">${code}</strong><br/>
                خصم 20% على جميع المنتجات<br/>
                <span style="color:#888;font-size:13px;">صالح 7 أيام فقط — ينتهي ${new Date(expiresAt).toLocaleDateString("ar-EG")}</span>
              </p>
              <p style="color:#999;font-size:12px;margin-top:24px;">© ${currentYear} MU Store — القاهرة، مصر</p>
            </div>`,
          });
        }

        logger.info({ userId: user.id, code }, "Birthday coupon sent");
      } catch (err) {
        logger.error({ err, userId: user.id }, "Failed to process birthday for user");
      }
    }

    if (birthdayUsers.length > 0) {
      logger.info({ count: birthdayUsers.length }, "Birthday check complete");
    }
  } catch (err) {
    logger.error({ err }, "Birthday check failed");
  }
}

export function startBirthdayJob() {
  // Run once on startup, then every 24h
  runBirthdayCheck();
  setInterval(runBirthdayCheck, 24 * 60 * 60 * 1000);
  logger.info("Birthday job started");
}
