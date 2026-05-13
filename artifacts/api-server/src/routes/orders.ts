import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { CreateOrderBody, AdminUpdateOrderStatusBody } from "@workspace/api-zod";
import { sendMail } from "../lib/mailer.js";
import { orderConfirmationHtml } from "../lib/email-templates.js";

const router = Router();

function formatOrder(o: any) {
  return {
    id: o.id,
    userId: o.userId,
    status: o.status,
    paymentMethod: o.paymentMethod ?? null,
    paymentStatus: o.paymentStatus ?? null,
    items: o.items ?? [],
    fullName: o.fullName ?? null,
    phone: o.phone ?? null,
    email: o.email ?? null,
    governorate: o.governorate ?? null,
    address: o.address ?? null,
    subtotal: o.subtotal,
    shipping: o.shipping,
    discount: o.discount,
    total: o.total,
    promoCode: o.promoCode ?? null,
    codDownPayment: o.codDownPayment ?? 0,
    codDownPaymentStatus: o.codDownPaymentStatus ?? "pending",
    codDownPaymentMethod: o.codDownPaymentMethod ?? null,
    amountDueOnDelivery: o.amountDueOnDelivery ?? 0,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, userId)).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(formatOrder));
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const result = CreateOrderBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const data = result.data;
  const isCod = data.paymentMethod === "cod";
  const codDownPayment = isCod ? ((data as any).codDownPayment ?? 50) : 0;
  const codDownPaymentStatus = isCod ? ((data as any).codDownPaymentStatus ?? "pending") : "paid";
  const amountDueOnDelivery = isCod ? Math.max(0, (data.total ?? 0) - codDownPayment) : 0;

  const [order] = await db.insert(ordersTable).values({
    userId,
    status: "pending",
    paymentMethod: data.paymentMethod,
    paymentStatus: isCod ? "partial" : "pending",
    items: data.items as any,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    governorate: data.governorate,
    address: data.address,
    subtotal: data.subtotal ?? 0,
    shipping: data.shipping ?? 0,
    discount: data.discount ?? 0,
    total: data.total ?? 0,
    promoCode: data.promoCode ?? null,
    codDownPayment,
    codDownPaymentStatus,
    codDownPaymentMethod: isCod ? ((data as any).codDownPaymentMethod ?? null) : null,
    amountDueOnDelivery,
  }).returning();

  res.status(201).json(formatOrder(order));

  // Send confirmation email (non-blocking)
  if (order.email) {
    sendMail({
      to: order.email,
      subject: `Order Confirmed — #${order.id} | MU Store`,
      html: orderConfirmationHtml({
        orderId: order.id,
        fullName: order.fullName ?? "",
        email: order.email,
        phone: order.phone ?? undefined,
        address: order.address ?? undefined,
        governorate: order.governorate ?? undefined,
        paymentMethod: order.paymentMethod ?? "card",
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        items: (order.items ?? []) as any[],
        promoCode: order.promoCode ?? undefined,
        codDownPayment: order.codDownPayment ?? 0,
        codDownPaymentMethod: order.codDownPaymentMethod ?? undefined,
        amountDueOnDelivery: order.amountDueOnDelivery ?? 0,
      }),
    }).catch(() => {});
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const userId = (req as any).user.id;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  if (order.userId !== userId && (req as any).user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  res.json(formatOrder(order));
});

// Admin routes
router.get("/admin/all", requireAdmin, async (_req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(formatOrder));
});

router.put("/admin/:id/status", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const result = AdminUpdateOrderStatusBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [order] = await db.update(ordersTable).set({ status: result.data.status }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatOrder(order));
});

export default router;
