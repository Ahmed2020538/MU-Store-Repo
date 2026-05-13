import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { DEFAULT_SMTP } from "../lib/mailer.js";

const router = Router();

const DEFAULT_CONTACT: Record<string, any> = {
  phone1: "+20 100 000 0000", phone1Whatsapp: true, phone2: "",
  supportEmail: "support@mu-store.com",
  addressAr: "القاهرة، مصر", addressEn: "Cairo, Egypt",
  workingHours: "Sun–Thu: 10am–8pm", googleMapsUrl: "",
  socials: [
    { platform: "WhatsApp", active: true, url: "+20 100 000 0000", order: 0 },
    { platform: "Instagram", active: true, url: "https://instagram.com/mustore", order: 1 },
    { platform: "Facebook", active: true, url: "https://facebook.com/mustore", order: 2 },
    { platform: "TikTok", active: false, url: "", order: 3 },
  ],
  whatsappNumber: "+20 100 000 0000",
  whatsappMessage: "مرحباً، أريد الاستفسار عن منتج",
  whatsappButtonActive: true, whatsappButtonColor: "#25D366",
};

const DEFAULT_SOCIAL: Record<string, any> = {
  whatsapp:  { active: true,  value: "+201000000000", order: 1 },
  instagram: { active: true,  value: "mustore.eg",    order: 2 },
  facebook:  { active: true,  value: "mustore.eg",    order: 3 },
  tiktok:    { active: true,  value: "mustore.eg",    order: 4 },
  twitter:   { active: true,  value: "mustore_eg",    order: 5 },
  linkedin:  { active: true,  value: "mu-store-eg",   order: 6 },
  pinterest: { active: false, value: "", order: 7 },
  youtube:   { active: false, value: "", order: 8 },
  snapchat:  { active: false, value: "", order: 9 },
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

// Social media (public read, admin write)
router.get("/social", async (_req, res) => {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "social_media"));
  if (!row) { res.json(DEFAULT_SOCIAL); return; }
  try { res.json(JSON.parse(row.value)); } catch { res.json(DEFAULT_SOCIAL); }
});

router.post("/social", requireAdmin, async (req, res) => {
  const value = JSON.stringify(req.body);
  await db.insert(settingsTable).values({ key: "social_media", value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
  res.json({ ok: true });
});

// SMTP settings
router.get("/smtp", requireAdmin, async (_req, res) => {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "smtp_settings"));
  if (!row) { res.json({ ...DEFAULT_SMTP, pass: "" }); return; }
  try {
    const cfg = JSON.parse(row.value);
    res.json({ ...cfg, pass: cfg.pass ? "••••••••" : "" });
  } catch { res.json({ ...DEFAULT_SMTP, pass: "" }); }
});

router.post("/smtp", requireAdmin, async (req, res) => {
  const incoming = req.body;
  if (incoming.pass === "••••••••") {
    const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.key, "smtp_settings"));
    if (existing) {
      try { incoming.pass = JSON.parse(existing.value).pass; } catch { /* keep */ }
    }
  }
  const value = JSON.stringify(incoming);
  await db.insert(settingsTable).values({ key: "smtp_settings", value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
  res.json({ ok: true });
});

router.post("/smtp/test", requireAdmin, async (req, res) => {
  const { to } = req.body;
  if (!to) { res.status(400).json({ error: "Missing 'to' email" }); return; }
  const { sendMail: send } = await import("../lib/mailer.js");
  const ok = await send({
    to, subject: "MU Store — Test Email",
    html: `<div style="font-family:Arial,sans-serif;padding:32px;background:#F8F5F0;">
      <h2 style="color:#1A1A2E;font-family:Georgia,serif;">MU Store</h2>
      <p style="color:#555;">SMTP is configured correctly! ✓</p>
    </div>`,
  });
  if (ok) { res.json({ ok: true }); }
  else { res.status(500).json({ error: "Failed — check SMTP credentials and enable flag." }); }
});

export default router;
