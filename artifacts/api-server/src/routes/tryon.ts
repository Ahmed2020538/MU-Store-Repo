import { Router, type Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const router = Router();

const tempDir = path.join(process.cwd(), "uploads/tryon-temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const tempStore = new Map<string, { file: string; expires: number }>();
const predStore = new Map<string, { provider: "fashn" | "replicate"; externalId: string }>();

setInterval(() => {
  const now = Date.now();
  for (const [id, e] of tempStore) {
    if (e.expires < now) {
      try { fs.unlinkSync(e.file); } catch { /* ignore */ }
      tempStore.delete(id);
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

function fashnCategory(cat: string): "tops" | "bottoms" | "one-pieces" {
  const c = cat.toLowerCase();
  if (["top", "shirt", "blouse", "jacket", "coat"].some(k => c.includes(k))) return "tops";
  if (["bottom", "pant", "skirt", "trouser", "jean"].some(k => c.includes(k))) return "bottoms";
  return "one-pieces";
}

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
router.post("/upload", upload.single("userImage"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No image provided" }); return; }
  const id = crypto.randomBytes(16).toString("hex");
  const filePath = path.join(tempDir, `${id}.jpg`);
  try {
    let buf = req.file.buffer;
    try {
      const sharp = (await import("sharp")).default;
      buf = await sharp(buf)
        .rotate()
        .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch { /* sharp unavailable — use original buffer */ }
    fs.writeFileSync(filePath, buf);
    tempStore.set(id, { file: filePath, expires: Date.now() + 10 * 60 * 1000 });
    res.json({ id, url: `${siteBaseUrl(req)}/api/tryon/temp/${id}` });
  } catch (err) {
    req.log.error(err, "tryon upload error");
    res.status(500).json({ error: "Image processing failed" });
  }
});

// GET /api/tryon/temp/:id  (serves temporary uploaded images for AI providers)
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
router.post("/start", async (req, res) => {
  const { userImageUrl, productImageUrl, productCategory, productName } = req.body as Record<string, string>;
  if (!userImageUrl || !productImageUrl) {
    res.status(400).json({ error: "userImageUrl and productImageUrl are required" });
    return;
  }

  const resolvedProduct = resolveImageUrl(productImageUrl, req);
  const fashnKey = process.env.FASHN_API_KEY;
  const replicateKey = process.env.REPLICATE_API_KEY;

  if (!fashnKey && !replicateKey) {
    res.json({ predictionId: `demo-${crypto.randomBytes(8).toString("hex")}`, provider: "demo" });
    return;
  }

  if (fashnKey) {
    try {
      const r = await fetch("https://api.fashn.ai/v1/run", {
        method: "POST",
        headers: { Authorization: `Bearer ${fashnKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model_image: userImageUrl,
          garment_image: resolvedProduct,
          category: fashnCategory(productCategory ?? ""),
          mode: "quality",
          adjust_hands: true,
          restore_background: true,
          restore_clothes: true,
          garment_photo_type: "auto",
          num_samples: 1,
        }),
      });
      if (r.ok) {
        const d = await r.json() as { id: string };
        const predId = `fashn-${d.id}`;
        predStore.set(predId, { provider: "fashn", externalId: d.id });
        res.json({ predictionId: predId, provider: "fashn" });
        return;
      }
      req.log.warn({ status: r.status }, "Fashn.ai start failed — trying Replicate");
    } catch (err) { req.log.warn(err, "Fashn.ai error"); }
  }

  if (replicateKey) {
    try {
      const r = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: { Authorization: `Token ${replicateKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          version: "906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f",
          input: {
            human_img: userImageUrl,
            garm_img: resolvedProduct,
            garment_des: productName ?? "garment",
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 30,
            seed: 42,
          },
        }),
      });
      if (r.ok) {
        const d = await r.json() as { id: string };
        const predId = `replicate-${d.id}`;
        predStore.set(predId, { provider: "replicate", externalId: d.id });
        res.json({ predictionId: predId, provider: "replicate" });
        return;
      }
    } catch (err) { req.log.error(err, "Replicate error"); }
  }

  res.status(503).json({ error: "AI providers unavailable. Please try again later." });
});

// GET /api/tryon/status/:predictionId
router.get("/status/:predictionId", async (req, res) => {
  const { predictionId } = req.params;

  if (predictionId.startsWith("demo-")) {
    res.json({ status: "demo", resultImageUrl: null, error: null, progress: 0 });
    return;
  }

  const pred = predStore.get(predictionId);
  if (!pred) { res.status(404).json({ error: "Prediction not found" }); return; }

  if (pred.provider === "fashn") {
    const key = process.env.FASHN_API_KEY;
    if (!key) { res.status(503).json({ error: "API key missing" }); return; }
    try {
      const r = await fetch(`https://api.fashn.ai/v1/status/${pred.externalId}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const d = await r.json() as { status: string; output?: string[]; error?: string };
      const status = d.status === "completed" ? "completed" : d.status === "failed" ? "failed" : "processing";
      const progress = status === "completed" ? 100 : status === "failed" ? 0 : d.status === "processing" ? 60 : 20;
      res.json({ status, resultImageUrl: d.output?.[0] ?? null, error: d.error ?? null, progress });
    } catch (err) { req.log.error(err, "fashn status"); res.status(503).json({ error: "Status check failed" }); }
    return;
  }

  if (pred.provider === "replicate") {
    const key = process.env.REPLICATE_API_KEY;
    if (!key) { res.status(503).json({ error: "API key missing" }); return; }
    try {
      const r = await fetch(`https://api.replicate.com/v1/predictions/${pred.externalId}`, {
        headers: { Authorization: `Token ${key}` },
      });
      const d = await r.json() as { status: string; output?: string | string[]; error?: string };
      const status = d.status === "succeeded" ? "completed" : ["failed", "canceled"].includes(d.status) ? "failed" : "processing";
      const resultImageUrl = typeof d.output === "string" ? d.output : Array.isArray(d.output) ? d.output[0] ?? null : null;
      res.json({ status, resultImageUrl, error: d.error ?? null, progress: status === "completed" ? 100 : status === "failed" ? 0 : 50 });
    } catch (err) { req.log.error(err, "replicate status"); res.status(503).json({ error: "Status check failed" }); }
  }
});

export default router;
