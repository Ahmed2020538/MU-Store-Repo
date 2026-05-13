import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { DEFAULT_SMTP } from "../lib/mailer.js";

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
  // If pass is the placeholder, preserve existing
  if (incoming.pass === "••••••••") {
    const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.key, "smtp_settings"));
    if (existing) {
      try {
        const prev = JSON.parse(existing.value);
        incoming.pass = prev.pass;
      } catch { /* keep placeholder */ }
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
    to,
    subject: "MU Store — Test Email",
    html: `<div style="font-family:Arial,sans-serif;padding:32px;background:#F8F5F0;">
      <h2 style="color:#1A1A2E;font-family:Georgia,serif;">MU Store</h2>
      <p style="color:#555;">This is a test email from your MU Store admin panel. SMTP is configured correctly! 🎉</p>
    </div>`,
  });
  if (ok) { res.json({ ok: true }); }
  else { res.status(500).json({ error: "Failed to send — check SMTP credentials and that email sending is enabled." }); }
});

export default router;
