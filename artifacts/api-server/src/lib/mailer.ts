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

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const config = await getSmtpConfig();
  if (!config.enabled || !config.user || !config.pass) {
    logger.info({ to: opts.to, subject: opts.subject }, "Email sending disabled — skipping");
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    logger.info({ to: opts.to, subject: opts.subject }, "Email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.to }, "Failed to send email");
    return false;
  }
}
