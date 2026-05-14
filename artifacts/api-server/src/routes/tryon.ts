import { Router, type Request } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const router = Router();

const tryonMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many try-on requests. Please try again later." },
});

const tryonStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many status requests. Please slow down." },
});

const HF_SPACE = "https://yisol-idm-vton.hf.space";

const tempDir = path.join(process.cwd(), "uploads/tryon-temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const tempStore = new Map<string, { file: string; expires: number }>();

type PredEntry = {
  sessionHash: string;
  status: "queued" | "processing" | "completed" | "failed";
  resultImageUrl: string | null;
  error: string | null;
  progress: number;
};
const PRED_TTL_MS = 30 * 60 * 1000;
const predStore = new Map<string, PredEntry & { expires: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [id, e] of tempStore) {
    if (e.expires < now) {
      try { fs.unlinkSync(e.file); } catch { /* ignore */ }
      tempStore.delete(id);
    }
  }
  for (const [id, e] of predStore) {
    if (e.expires < now) {
      predStore.delete(id);
    }
  }
}, 5 * 60 * 1000);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only JPG, PNG, WebP allowed"));
  },
});

function siteBaseUrl(req: Request): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  return domain ? `https://${domain}` : `${req.protocol}://${req.get("host")}`;
}

function resolveImageUrl(url: string, req: Request): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${siteBaseUrl(req)}${url.startsWith("/") ? url : `/${url}`}`;
}

// POST /api/tryon/upload
router.post("/upload", tryonMutationLimiter, upload.single("userImage"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No image provided" }); return; }
  const id = crypto.randomBytes(16).toString("hex");
  const filePath = path.join(tempDir, `${id}.jpg`);
  try {
    let buf = req.file.buffer;
    try {
      const sharp = (await import("sharp")).default;
      buf = await sharp(buf)
        .rotate()
        .resize(768, 1024, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch { /* sharp unavailable — use original buffer */ }
    fs.writeFileSync(filePath, buf);
    tempStore.set(id, { file: filePath, expires: Date.now() + 15 * 60 * 1000 });
    res.json({ id, url: `${siteBaseUrl(req)}/api/tryon/temp/${id}` });
  } catch (err) {
    req.log.error(err, "tryon upload error");
    res.status(500).json({ error: "Image processing failed" });
  }
});

// GET /api/tryon/temp/:id
router.get("/temp/:id", (req, res) => {
  const id = req.params.id.replace(/[^a-f0-9]/g, "");
  const entry = tempStore.get(id);
  if (!entry || entry.expires < Date.now()) {
    res.status(404).json({ error: "Not found or expired" });
    return;
  }
  res.setHeader("Content-Type", "image/jpeg");
  res.sendFile(entry.file);
});

// POST /api/tryon/start
router.post("/start", tryonMutationLimiter, async (req, res) => {
  const { userImageUrl, productImageUrl, productName } = req.body as Record<string, string>;
  if (!userImageUrl || !productImageUrl) {
    res.status(400).json({ error: "userImageUrl and productImageUrl are required" });
    return;
  }
  const resolvedProduct = resolveImageUrl(productImageUrl, req);
  const sessionHash = crypto.randomBytes(8).toString("hex");

  try {
    const r = await fetch(`${HF_SPACE}/gradio_api/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fn_index: 0,
        session_hash: sessionHash,
        data: [
          { background: userImageUrl, layers: [], composite: userImageUrl },
          resolvedProduct,
          productName ?? "fashion item",
          true,
          false,
          30,
          42,
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      req.log.warn({ status: r.status, body: text }, "HF space join failed");
      res.status(503).json({ error: "Try-on service unavailable. Please try again." });
      return;
    }

    const predId = `hf-${sessionHash}`;
    predStore.set(predId, { sessionHash, status: "queued", resultImageUrl: null, error: null, progress: 5, expires: Date.now() + PRED_TTL_MS });
    res.json({ predictionId: predId, provider: "huggingface" });
  } catch (err) {
    req.log.error(err, "HF space start error");
    res.status(503).json({ error: "Failed to start try-on. Please try again." });
  }
});

// GET /api/tryon/status/:predictionId
router.get("/status/:predictionId", tryonStatusLimiter, async (req, res) => {
  const predictionId = String(req.params["predictionId"]);

  if (predictionId.startsWith("demo-")) {
    res.json({ status: "demo", resultImageUrl: null, error: null, progress: 0 });
    return;
  }

  const pred = predStore.get(predictionId);
  if (!pred) { res.status(404).json({ error: "Prediction not found" }); return; }

  if (pred.status === "completed" || pred.status === "failed") {
    res.json({ status: pred.status, resultImageUrl: pred.resultImageUrl, error: pred.error, progress: pred.progress });
    return;
  }

  try {
    const r = await fetch(
      `${HF_SPACE}/gradio_api/queue/status?session_hash=${pred.sessionHash}`,
      { signal: AbortSignal.timeout(12000) },
    );

    if (!r.ok || !r.body) {
      res.json({ status: pred.status, resultImageUrl: null, error: null, progress: pred.progress });
      return;
    }

    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let done = false;
    let finalised = false;

    while (!done && !finalised) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) buf += dec.decode(value, { stream: true });

      const chunks = buf.split("\n\n");
      buf = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const dataLine = chunk.split("\n").find(l => l.startsWith("data:"));
        if (!dataLine) continue;
        try {
          const d = JSON.parse(dataLine.slice(5).trim()) as {
            msg: string;
            rank?: number;
            queue_size?: number;
            success?: boolean;
            output?: { data: unknown[] };
          };

          if (d.msg === "estimation") {
            const rank = d.rank ?? 0;
            const qs = Math.max(d.queue_size ?? 10, 1);
            pred.progress = Math.max(5, Math.round((1 - rank / qs) * 45));
          }
          if (d.msg === "process_starts") { pred.progress = 55; pred.status = "processing"; }
          if (d.msg === "progress") { pred.progress = Math.min(pred.progress + 10, 90); }

          if (d.msg === "process_completed") {
            if (d.success && Array.isArray(d.output?.data)) {
              const img = d.output!.data[0] as Record<string, string> | string | null;
              if (img && typeof img === "object" && img.path) {
                pred.resultImageUrl = `${HF_SPACE}/gradio_api/file=${img.path}`;
              } else if (img && typeof img === "object" && img.url) {
                pred.resultImageUrl = img.url;
              } else if (typeof img === "string" && img.startsWith("http")) {
                pred.resultImageUrl = img;
              }
              pred.status = "completed";
              pred.progress = 100;
            } else {
              pred.status = "failed";
              pred.error = "Generation failed. Please try again.";
              pred.progress = 0;
            }
            predStore.set(predictionId, pred);
            finalised = true;
          }
        } catch { /* skip malformed event */ }
      }
    }

    reader.cancel().catch(() => {});
    res.json({ status: pred.status, resultImageUrl: pred.resultImageUrl, error: pred.error, progress: pred.progress });
  } catch (err) {
    req.log.warn(err, "HF status poll error");
    res.json({ status: pred.status, resultImageUrl: null, error: null, progress: pred.progress });
  }
});

export default router;
