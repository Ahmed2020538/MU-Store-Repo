import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { logger } from "./logger.js";

// Minimal serialize/deserialize — only used during OAuth handshake, not for sessions
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    done(null, user ?? null);
  } catch (err) { done(err, null); }
});

if (process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
      callbackURL: `${process.env["API_BASE_URL"] ?? ""}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value ?? "";
        const avatarUrl = profile.photos?.[0]?.value ?? "";
        const name = profile.displayName ?? "User";

        // Check existing by provider ID or email
        const [existing] = await db.select().from(usersTable)
          .where(or(eq(usersTable.authProviderId, profile.id), ...(email ? [eq(usersTable.email, email)] : [])))
          .limit(1);

        if (existing) {
          // Update avatar if changed
          if (avatarUrl && existing.avatarUrl !== avatarUrl) {
            await db.update(usersTable).set({ avatarUrl, authProviderId: profile.id, authProvider: "google" }).where(eq(usersTable.id, existing.id));
          }
          done(null, { ...existing, avatarUrl });
          return;
        }

        // Create new user
        const [user] = await db.insert(usersTable).values({
          email, name, passwordHash: "", phone: null,
          authProvider: "google", authProviderId: profile.id, avatarUrl,
        }).returning();

        done(null, user);
      } catch (err) {
        logger.error({ err }, "Google OAuth error");
        done(err as Error, undefined);
      }
    }
  ));
  logger.info("Google OAuth strategy registered");
}
