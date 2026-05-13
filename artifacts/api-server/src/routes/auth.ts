import { Router } from "express";
import passport from "passport";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, requireAuth } from "../lib/auth.js";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

router.post("/register", async (req, res) => {
  const result = RegisterBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { email, password, name, phone } = result.data;
  const birthDate: string | undefined = typeof req.body.birthDate === "string" ? req.body.birthDate : undefined;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) { res.status(400).json({ error: "Email already registered" }); return; }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    email, passwordHash, name, phone, ...(birthDate ? { birthDate } : {}),
  }).returning();

  const token = signToken({ id: user.id, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, loyaltyPoints: user.loyaltyPoints ?? 0, createdAt: user.createdAt.toISOString() },
  });
});

router.post("/login", async (req, res) => {
  const result = LoginBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { email, password } = result.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }
  if (!user.passwordHash) { res.status(401).json({ error: "This account uses social login. Please sign in with Google." }); return; }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Invalid credentials" }); return; }
  const token = signToken({ id: user.id, role: user.role, permissions: user.permissions ?? "{}" });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, loyaltyPoints: user.loyaltyPoints ?? 0, createdAt: user.createdAt.toISOString() },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, (req as any).user.id)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role,
    loyaltyPoints: user.loyaltyPoints ?? 0, avatarUrl: user.avatarUrl,
    isProfileComplete: user.isProfileComplete, isPriority: user.isPriority,
    governorate: user.governorate, city: user.city, address: user.address,
    instagramHandle: user.instagramHandle, facebookUrl: user.facebookUrl,
    tiktokHandle: user.tiktokHandle, whatsappSocial: user.whatsappSocial, xHandle: user.xHandle,
    createdAt: user.createdAt.toISOString(),
  });
});

// ── Social Provider Status (admin-only) ───────────────────────────────────────
router.get("/social-status", requireAuth, (req, res) => {
  if ((req as any).user?.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const check = (...keys: string[]) => keys.every(k => !!process.env[k]);
  res.json({
    google: { configured: check("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET") },
    facebook: { configured: check("FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET") },
    twitter: { configured: check("TWITTER_API_KEY", "TWITTER_API_SECRET") },
    apple: { configured: check("APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY") },
  });
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get("/google", (req, res, next) => {
  if (!process.env["GOOGLE_CLIENT_ID"]) {
    res.redirect(`${process.env["STORE_URL"] ?? ""}/login?error=google_not_configured`); return;
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get("/google/callback",
  (req, res, next) => {
    if (!process.env["GOOGLE_CLIENT_ID"]) { res.redirect("/login?error=google_not_configured"); return; }
    passport.authenticate("google", { failureRedirect: "/login?error=oauth_failed" })(req, res, next);
  },
  (req, res) => {
    const user = req.user as any;
    if (!user) { res.redirect("/login?error=oauth_failed"); return; }
    const token = signToken({ id: user.id, role: user.role });
    const userJson = encodeURIComponent(JSON.stringify({
      id: user.id, email: user.email, name: user.name, role: user.role,
      loyaltyPoints: user.loyaltyPoints ?? 0, avatarUrl: user.avatarUrl,
      isProfileComplete: user.isProfileComplete,
    }));
    const base = process.env["STORE_URL"] ?? "";
    res.redirect(`${base}/auth-callback?token=${token}&user=${userJson}`);
  }
);

// ── Facebook OAuth ────────────────────────────────────────────────────────────
router.get("/facebook", (req, res, next) => {
  if (!process.env["FACEBOOK_APP_ID"]) {
    res.redirect(`${process.env["STORE_URL"] ?? ""}/login?error=facebook_not_configured`); return;
  }
  passport.authenticate("facebook", { scope: ["email", "public_profile"] })(req, res, next);
});

router.get("/facebook/callback",
  (req, res, next) => {
    if (!process.env["FACEBOOK_APP_ID"]) { res.redirect("/login?error=facebook_not_configured"); return; }
    passport.authenticate("facebook", { failureRedirect: "/login?error=oauth_failed" })(req, res, next);
  },
  (req, res) => {
    const user = req.user as any;
    if (!user) { res.redirect("/login?error=oauth_failed"); return; }
    const token = signToken({ id: user.id, role: user.role });
    const userJson = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, loyaltyPoints: user.loyaltyPoints ?? 0, isProfileComplete: user.isProfileComplete }));
    res.redirect(`${process.env["STORE_URL"] ?? ""}/auth-callback?token=${token}&user=${userJson}`);
  }
);

// ── Twitter / X OAuth ─────────────────────────────────────────────────────────
router.get("/twitter", (req, res, next) => {
  if (!process.env["TWITTER_API_KEY"]) {
    res.redirect(`${process.env["STORE_URL"] ?? ""}/login?error=twitter_not_configured`); return;
  }
  passport.authenticate("twitter")(req, res, next);
});

router.get("/twitter/callback",
  (req, res, next) => {
    if (!process.env["TWITTER_API_KEY"]) { res.redirect("/login?error=twitter_not_configured"); return; }
    passport.authenticate("twitter", { failureRedirect: "/login?error=oauth_failed" })(req, res, next);
  },
  (req, res) => {
    const user = req.user as any;
    if (!user) { res.redirect("/login?error=oauth_failed"); return; }
    const token = signToken({ id: user.id, role: user.role });
    const userJson = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, loyaltyPoints: user.loyaltyPoints ?? 0, isProfileComplete: user.isProfileComplete }));
    res.redirect(`${process.env["STORE_URL"] ?? ""}/auth-callback?token=${token}&user=${userJson}`);
  }
);

// ── Apple OAuth ───────────────────────────────────────────────────────────────
router.get("/apple", (req, res, next) => {
  if (!process.env["APPLE_CLIENT_ID"]) {
    res.redirect(`${process.env["STORE_URL"] ?? ""}/login?error=apple_not_configured`); return;
  }
  passport.authenticate("apple")(req, res, next);
});

router.post("/apple/callback",
  (req, res, next) => {
    if (!process.env["APPLE_CLIENT_ID"]) { res.redirect("/login?error=apple_not_configured"); return; }
    passport.authenticate("apple", { failureRedirect: "/login?error=oauth_failed" })(req, res, next);
  },
  (req, res) => {
    const user = req.user as any;
    if (!user) { res.redirect("/login?error=oauth_failed"); return; }
    const token = signToken({ id: user.id, role: user.role });
    const userJson = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, loyaltyPoints: user.loyaltyPoints ?? 0, isProfileComplete: user.isProfileComplete }));
    res.redirect(`${process.env["STORE_URL"] ?? ""}/auth-callback?token=${token}&user=${userJson}`);
  }
);

export default router;
