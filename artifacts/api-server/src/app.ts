import express, { type Express } from "express";
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
// (required for passport's `proxy: true` option and accurate req.ip)
app.set("trust proxy", 1);

app.use(pinoHttp({
  logger,
  serializers: {
    req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
    res(res) { return { statusCode: res.statusCode }; },
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
    origins.push(`https://${d.replace(/^[^.]+\./, "")}`); // bare domain
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
  windowMs: 15 * 60 * 1000, // 15 minutes
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

export default app;
