import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

if (!process.env["JWT_SECRET"]) {
  throw new Error(
    "[auth] JWT_SECRET environment variable is not set. " +
    "The server cannot start without a strong secret. " +
    "Set JWT_SECRET to a long random string before running."
  );
}

const JWT_SECRET = process.env["JWT_SECRET"];

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { id: number; role: string; permissions?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: number; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  (req as any).user = payload;
  next();
}

// Extracts user from token if present, but does NOT reject unauthenticated requests
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const payload = verifyToken(header.slice(7));
    if (payload) (req as any).user = payload;
  }
  next();
}

export async function isActiveAdmin(userId: number | null): Promise<boolean> {
  if (!userId) return false;
  const [row] = await db.select({ role: usersTable.role, isAdmin: usersTable.isAdmin })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return !!(row && row.role === "admin" && row.isAdmin);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const userId: number = (req as any).user?.id;
    if (!userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    db.select({ role: usersTable.role, isAdmin: usersTable.isAdmin })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)
      .then(([row]) => {
        if (!row || row.role !== "admin" || !row.isAdmin) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }
        next();
      })
      .catch(() => {
        res.status(500).json({ error: "Internal server error" });
      });
  });
}
