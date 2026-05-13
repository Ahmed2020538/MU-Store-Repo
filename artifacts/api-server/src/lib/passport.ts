import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as TwitterStrategy } from "passport-twitter";
import AppleStrategy from "passport-apple";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { logger } from "./logger.js";

// Auto-detect the base URL: explicit override → first Replit domain → empty (relative paths)
const replitDomain = (process.env["REPLIT_DOMAINS"] ?? "").split(",")[0]?.trim() ?? "";
const API_BASE = process.env["API_BASE_URL"] ?? (replitDomain ? `https://${replitDomain}` : "");

// ── Shared upsert: find by providerId first, then link by email ───────────────
async function upsertSocialUser(opts: {
  provider: string; providerId: string;
  email: string; name: string; avatarUrl?: string | null;
}) {
  const { provider, providerId, email, name, avatarUrl } = opts;
  const isPlaceholder = email.includes(".oauth.mu");
  const whereClause = isPlaceholder
    ? eq(usersTable.authProviderId, providerId)
    : or(eq(usersTable.authProviderId, providerId), eq(usersTable.email, email));

  const [existing] = await db.select().from(usersTable).where(whereClause).limit(1);

  if (existing) {
    const patch: Record<string, unknown> = { authProvider: provider, authProviderId: providerId };
    if (avatarUrl && existing.avatarUrl !== avatarUrl) patch.avatarUrl = avatarUrl;
    await db.update(usersTable).set(patch).where(eq(usersTable.id, existing.id));
    return { ...existing, ...patch };
  }

  const [user] = await db.insert(usersTable).values({
    email, name, passwordHash: "", phone: null,
    authProvider: provider, authProviderId: providerId, avatarUrl: avatarUrl ?? null,
  }).returning();
  return user;
}

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    done(null, user ?? null);
  } catch (err) { done(err, null); }
});

// ── Google ────────────────────────────────────────────────────────────────────
if (process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]) {
  passport.use(new GoogleStrategy({
    clientID: process.env["GOOGLE_CLIENT_ID"],
    clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
    callbackURL: `${API_BASE}/api/auth/google/callback`,
    proxy: true,
  }, async (_at, _rt, profile, done) => {
    try {
      const user = await upsertSocialUser({
        provider: "google", providerId: profile.id,
        email: profile.emails?.[0]?.value ?? `google_${profile.id}@google.oauth.mu`,
        name: profile.displayName || "Google User",
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (err) { logger.error({ err }, "Google OAuth error"); done(err as Error, undefined); }
  }));
  logger.info("Google OAuth strategy registered");
}

// ── Facebook (also used by Instagram) ─────────────────────────────────────────
if (process.env["FACEBOOK_APP_ID"] && process.env["FACEBOOK_APP_SECRET"]) {
  passport.use(new FacebookStrategy({
    clientID: process.env["FACEBOOK_APP_ID"],
    clientSecret: process.env["FACEBOOK_APP_SECRET"],
    callbackURL: `${API_BASE}/api/auth/facebook/callback`,
    profileFields: ["id", "displayName", "emails", "photos"],
    enableProof: true,
    proxy: true,
  } as any, async (_at: any, _rt: any, profile: any, done: any) => {
    try {
      const user = await upsertSocialUser({
        provider: "facebook", providerId: profile.id,
        email: profile.emails?.[0]?.value ?? `fb_${profile.id}@facebook.oauth.mu`,
        name: profile.displayName || "Facebook User",
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (err) { logger.error({ err }, "Facebook OAuth error"); done(err as Error, undefined); }
  }));
  logger.info("Facebook/Instagram OAuth strategy registered");
}

// ── Twitter / X ───────────────────────────────────────────────────────────────
if (process.env["TWITTER_API_KEY"] && process.env["TWITTER_API_SECRET"]) {
  passport.use(new TwitterStrategy({
    consumerKey: process.env["TWITTER_API_KEY"],
    consumerSecret: process.env["TWITTER_API_SECRET"],
    callbackURL: `${API_BASE}/api/auth/twitter/callback`,
    includeEmail: true,
    proxy: true,
  } as any, async (_token: any, _secret: any, profile: any, done: any) => {
    try {
      const rawAvatar = (profile.photos?.[0]?.value ?? "") as string;
      const user = await upsertSocialUser({
        provider: "twitter", providerId: profile.id,
        email: profile.emails?.[0]?.value ?? `tw_${profile.id}@twitter.oauth.mu`,
        name: profile.displayName || profile.username || "X User",
        avatarUrl: rawAvatar ? rawAvatar.replace("_normal", "_400x400") : undefined,
      });
      done(null, user);
    } catch (err) { logger.error({ err }, "Twitter OAuth error"); done(err as Error, undefined); }
  }));
  logger.info("Twitter/X OAuth strategy registered");
}

// ── Apple ─────────────────────────────────────────────────────────────────────
if (process.env["APPLE_CLIENT_ID"] && process.env["APPLE_TEAM_ID"] &&
    process.env["APPLE_KEY_ID"] && process.env["APPLE_PRIVATE_KEY"]) {
  passport.use(new (AppleStrategy as any)({
    clientID: process.env["APPLE_CLIENT_ID"],
    teamID: process.env["APPLE_TEAM_ID"],
    keyID: process.env["APPLE_KEY_ID"],
    privateKeyString: process.env["APPLE_PRIVATE_KEY"].replace(/\\n/g, "\n"),
    callbackURL: `${API_BASE}/api/auth/apple/callback`,
    scope: ["name", "email"],
    passReqToCallback: true,
  }, async (req: any, _at: any, _rt: any, idToken: any, _profile: any, done: any) => {
    try {
      const providerId = String(idToken.sub);
      let name = "Apple User";
      try {
        const bodyUser = req.body?.user ? JSON.parse(req.body.user) : null;
        if (bodyUser?.name) {
          name = [bodyUser.name.firstName, bodyUser.name.lastName].filter(Boolean).join(" ") || name;
        }
      } catch { /* name not provided on subsequent logins */ }
      const user = await upsertSocialUser({
        provider: "apple", providerId,
        email: (idToken.email as string | undefined) ?? `apple_${providerId}@apple.oauth.mu`,
        name,
      });
      done(null, user);
    } catch (err) { logger.error({ err }, "Apple OAuth error"); done(err as Error, undefined); }
  }));
  logger.info("Apple OAuth strategy registered");
}
