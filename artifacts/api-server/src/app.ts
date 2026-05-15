import express, { type Express, type Request, type Response, type NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import session from "express-session";
import passport from "passport";
import rateLimit from "express-rate-limit";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import "./lib/passport.js";

const app: Express = express();

// Trust Replit's reverse proxy so X-Forwarded-* headers are correct
app.set("trust proxy", 1);

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

app.use(pinoHttp({
  logger,
  serializers: {
    req(req: { id: string | number; method: string; url?: string }) {
      return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
    },
    res(res: { statusCode: number }) {
      return { statusCode: res.statusCode };
    },
  },
}));

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (() => {
  const domains = (process.env["REPLIT_DOMAINS"] ?? "").split(",").map(d => d.trim()).filter(Boolean);
  const origins: (string | RegExp)[] = [/^http:\/\/localhost(:\d+)?$/];
  for (const d of domains) {
    origins.push(`https://${d}`);
    origins.push(`https://${d.replace(/^[^.]+\./, "")}`);
  }
  return origins;
})();

app.use(cors({
  origin: process.env["NODE_ENV"] === "production" ? allowedOrigins : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many order requests." },
});

// ── Security headers ──────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(uploadDir));

// ── Session (OAuth handshake only — JWT used for auth) ────────────────────────
app.use(session({
  secret: process.env["SESSION_SECRET"] ?? "mu-session-dev",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 10 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter);
app.use("/api/orders", orderLimiter);
app.use("/api", router);

// ── Global error handler ──────────────────────────────────────────────────────
// Must be registered after all routes; catches any error passed to next(err)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as any)?.status ?? (err as any)?.statusCode ?? 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  if (status >= 500) {
    logger.error({ err }, "Unhandled error");
  }
  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
});

export default app;
