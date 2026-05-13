import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
}

export const DEFAULT_SMTP: SmtpConfig = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  user: "",
  pass: "",
  fromName: "MU Store",
  fromEmail: "noreply@mu-store.com",
  enabled: false,
};

export async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "smtp_settings"));
    if (!row) return DEFAULT_SMTP;
    return { ...DEFAULT_SMTP, ...JSON.parse(row.value) };
  } catch {
    return DEFAULT_SMTP;
  }
}

function buildTransporter(user: string, pass: string, host: string, port: number, secure: boolean) {
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
}): Promise<boolean> {
  const config = await getSmtpConfig();

  // Use DB config if enabled
  if (config.enabled && config.user && config.pass) {
    try {
      const t = buildTransporter(config.user, config.pass, config.host, config.port, config.secure);
      await t.sendMail({
        from: `"${opts.fromName ?? config.fromName}" <${opts.fromEmail ?? config.fromEmail}>`,
        to: opts.to, subject: opts.subject, html: opts.html,
      });
      logger.info({ to: opts.to, subject: opts.subject }, "Email sent via DB SMTP");
      return true;
    } catch (err) {
      logger.error({ err, to: opts.to }, "DB SMTP failed");
      return false;
    }
  }

  // Fallback to ENV vars (EMAIL_USER / EMAIL_PASS)
  const envUser = process.env["EMAIL_USER"];
  const envPass = process.env["EMAIL_PASS"];
  if (envUser && envPass) {
    try {
      const t = buildTransporter(envUser, envPass, "smtp.gmail.com", 587, false);
      await t.sendMail({
        from: `"MU Store" <${envUser}>`,
        to: opts.to, subject: opts.subject, html: opts.html,
      });
      logger.info({ to: opts.to, subject: opts.subject }, "Email sent via ENV SMTP");
      return true;
    } catch (err) {
      logger.error({ err, to: opts.to }, "ENV SMTP failed");
      return false;
    }
  }

  logger.info({ to: opts.to, subject: opts.subject }, "Email skipped — no SMTP configured");
  return false;
}
