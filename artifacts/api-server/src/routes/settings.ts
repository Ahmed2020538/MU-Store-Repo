import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

const DEFAULT_CONTACT: Record<string, any> = {
  phone1: "+20 100 000 0000",
  phone1Whatsapp: true,
  phone2: "",
  supportEmail: "support@mu-store.com",
  addressAr: "القاهرة، مصر",
  addressEn: "Cairo, Egypt",
  workingHours: "Sun–Thu: 10am–8pm",
  googleMapsUrl: "",
  socials: [
    { platform: "WhatsApp", active: true, url: "+20 100 000 0000", order: 0 },
    { platform: "Instagram", active: true, url: "https://instagram.com/mustore", order: 1 },
    { platform: "Facebook", active: true, url: "https://facebook.com/mustore", order: 2 },
    { platform: "TikTok", active: false, url: "", order: 3 },
  ],
  whatsappNumber: "+20 100 000 0000",
  whatsappMessage: "مرحباً، أريد الاستفسار عن منتج",
  whatsappButtonActive: true,
  whatsappButtonColor: "#25D366",
};

router.get("/contact", async (_req, res) => {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "contact_settings"));
  if (!row) { res.json(DEFAULT_CONTACT); return; }
  try { res.json(JSON.parse(row.value)); } catch { res.json(DEFAULT_CONTACT); }
});

router.post("/contact", requireAdmin, async (req, res) => {
  const value = JSON.stringify(req.body);
  await db.insert(settingsTable).values({ key: "contact_settings", value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
  res.json({ ok: true });
});

router.get("/cod-down-payment", async (_req, res) => {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "cod_down_payment"));
  res.json({ amount: row ? parseInt(row.value) : 50 });
});

router.post("/cod-down-payment", requireAdmin, async (req, res) => {
  const amount = String(req.body.amount ?? 50);
  await db.insert(settingsTable).values({ key: "cod_down_payment", value: amount })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: amount } });
  res.json({ ok: true, amount: parseInt(amount) });
});

export default router;
