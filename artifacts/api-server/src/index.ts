import app from "./app";
import { logger } from "./lib/logger";
import { startBirthdayJob } from "./lib/birthday";
import { sendMail } from "./lib/mailer";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function sendOneTimeAdminEmail() {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "admin_email_sent"));
    if (row) return; // already sent

    const siteUrl = process.env["STORE_URL"] ?? "https://mu-store.com";
    const to = process.env["EMAIL_USER"] ?? "mubrand2050@gmail.com";

    const sent = await sendMail({
      to,
      subject: "🔐 MU Admin Login Credentials",
      html: `<div style="font-family:Arial,sans-serif;padding:32px;background:#F8F5F0;">
        <h2 style="color:#1A1A2E;font-family:Georgia,serif;">MU Store — Admin Credentials</h2>
        <p style="color:#555;line-height:1.8;">
          <strong>Admin URL:</strong> ${siteUrl}/admin<br/>
          <strong>Email:</strong> admin@mu.com<br/>
          <strong>Password:</strong> MUadmin2025<br/>
          <span style="color:#e65100;font-weight:bold;">Keep this private.</span>
        </p>
      </div>`,
    });

    if (sent) {
      await db.insert(settingsTable).values({ key: "admin_email_sent", value: "true" })
        .onConflictDoNothing();
      logger.info("One-time admin credentials email sent");
    }
  } catch (err) {
    logger.error({ err }, "Failed to send one-time admin email");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");

  // Post-startup tasks (non-blocking)
  setTimeout(() => {
    startBirthdayJob();
    sendOneTimeAdminEmail();
  }, 3000);
});
