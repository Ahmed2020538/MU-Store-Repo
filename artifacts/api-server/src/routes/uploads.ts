import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Images only"));
  },
});

router.post("/:id/images", requireAdmin, upload.array("images", 5), async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const newImages = (req.files as Express.Multer.File[]).map(f => `/uploads/${f.filename}`);
  const existing = (product.images ?? []) as string[];
  const merged = [...existing, ...newImages].slice(0, 5);

  const [updated] = await db.update(productsTable).set({ images: merged }).where(eq(productsTable.id, id)).returning();
  res.json({ images: updated.images });
});

router.delete("/:id/images/:imgIndex", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const idx = parseInt(String(req.params.imgIndex));
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const images = [...((product.images ?? []) as string[])];
  const [removed] = images.splice(idx, 1);
  if (removed?.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), removed);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  const [updated] = await db.update(productsTable).set({ images }).where(eq(productsTable.id, id)).returning();
  res.json({ images: updated.images });
});

export default router;
