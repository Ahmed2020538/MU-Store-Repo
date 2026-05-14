import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { ordersTable, productsTable, discountCodesTable, couponsTable, settingsTable } from "@workspace/db";
import type { Order } from "@workspace/db";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { optionalAuth, requireAuth, requireAdmin, isActiveAdmin } from "../lib/auth.js";
import { CreateOrderBody, AdminUpdateOrderStatusBody } from "@workspace/api-zod";
import { sendMail } from "../lib/mailer.js";
import { orderConfirmationHtml } from "../lib/email-templates.js";

const router = Router();

type StoredItem = {
  productId: number;
  productName: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  image?: string;
};

function formatOrder(o: Order, includeToken = false) {
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
    ...(includeToken && o.lookupToken ? { lookupToken: o.lookupToken } : {}),
  };
}

// Auth-required order history
router.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).user.id as number;
  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(o => formatOrder(o)));
});

// Guest + authenticated checkout — optionalAuth extracts user if token present
router.post("/", optionalAuth, async (req, res) => {
  const userId: number | null = (req as any).user?.id ?? null;
  const result = CreateOrderBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const data = result.data;

  if (data.items.length === 0) {
    res.status(400).json({ error: "Cart is empty" }); return;
  }

  // ── Server-side pricing recalculation ─────────────────────────────────────
  const productIds = data.items.map(i => i.productId);
  const dbProducts = await db.select().from(productsTable).where(inArray(productsTable.id, productIds));
  const productMap = new Map(dbProducts.map(p => [p.id, p]));

  for (const item of data.items) {
    if (!productMap.has(item.productId)) {
      res.status(400).json({ error: `Product ${item.productId} not found` }); return;
    }
  }

  const serverItems: StoredItem[] = data.items.map(item => {
    const product = productMap.get(item.productId)!;
    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: product.salePrice ?? product.price,
      image: product.images?.[0] ?? undefined,
    };
  });

  const subtotal = serverItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const baseShipping = subtotal > 0 && subtotal < 500 ? 50 : 0;
  const isCod = data.paymentMethod === "cod";
  const codFee = isCod ? 20 : 0;
  const shippingTotal = baseShipping + codFee;

  // ── Validate promo code server-side ──────────────────────────────────────
  let discount = 0;
  let validPromoCode: string | null = null;
  let appliedCouponId: number | null = null;
  if (data.promoCode) {
    const upper = data.promoCode.toUpperCase();
    const [promo] = await db.select().from(discountCodesTable).where(eq(discountCodesTable.code, upper)).limit(1);
    if (promo && promo.isActive) {
      if (promo.discountType === "percentage") {
        discount = subtotal * (promo.discountValue / 100);
      } else if (promo.discountType === "fixed") {
        discount = promo.discountValue;
      } else if (promo.discountType === "free_shipping") {
        discount = shippingTotal;
      }
      validPromoCode = promo.code;
    } else {
      const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, upper)).limit(1);
      if (coupon && !coupon.used && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())) {
        discount = subtotal * ((coupon.discountPercent ?? 20) / 100);
        validPromoCode = coupon.code;
        appliedCouponId = coupon.id;
      }
    }
  }

  const total = Math.max(0, subtotal + shippingTotal - discount);

  // ── COD down payment from settings (fallback 50 EGP) ─────────────────────
  let codDownPayment = 0;
  let codDownPaymentStatus = "paid";
  let amountDueOnDelivery = 0;
  if (isCod) {
    let codSetting: { key: string; value: string } | undefined;
    try {
      const rows = await db.select().from(settingsTable)
        .where(eq(settingsTable.key, "cod_down_payment")).limit(1);
      codSetting = rows[0];
    } catch {
      // settings unavailable — use default
    }
    codDownPayment = codSetting ? Number(codSetting.value) : 50;
    codDownPaymentStatus = "pending";
    amountDueOnDelivery = Math.max(0, total - codDownPayment);
  }

  // ── Generate lookup token for guest order access ──────────────────────────
  const lookupToken = randomUUID();

  const [order] = await db.insert(ordersTable).values({
    lookupToken,
    userId: userId ?? undefined,
    status: "pending",
    paymentMethod: data.paymentMethod,
    paymentStatus: isCod ? "partial" : "pending",
    items: serverItems,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    governorate: data.governorate,
    address: data.address,
    subtotal,
    shipping: shippingTotal,
    discount,
    total,
    promoCode: validPromoCode,
    codDownPayment,
    codDownPaymentStatus,
    codDownPaymentMethod: isCod ? (data.codDownPaymentMethod ?? null) : null,
    amountDueOnDelivery,
  }).returning();

  // ── Mark one-time user coupon as used ────────────────────────────────────
  if (appliedCouponId !== null) {
    setImmediate(async () => {
      try {
        await db.update(couponsTable).set({ used: true }).where(eq(couponsTable.id, appliedCouponId!));
      } catch { /* non-critical but logged best-effort */ }
    });
  }

  // ── Stock decrement (best-effort, non-blocking) ───────────────────────────
  setImmediate(async () => {
    try {
      for (const item of serverItems) {
        await db.update(productsTable)
          .set({
            stock: sql`GREATEST(0, ${productsTable.stock} - ${item.quantity})`,
            soldCount: sql`COALESCE(${productsTable.soldCount}, 0) + ${item.quantity}`,
          })
          .where(eq(productsTable.id, item.productId));
      }
    } catch { /* stock update is non-critical */ }
  });

  // ── Loyalty points for authenticated users ────────────────────────────────
  if (userId !== null) {
    setImmediate(async () => {
      try {
        const pointsEarned = Math.floor(total / 10);
        if (pointsEarned > 0) {
          await db.execute(
            sql`UPDATE users SET loyalty_points = COALESCE(loyalty_points, 0) + ${pointsEarned} WHERE id = ${userId}`
          );
        }
      } catch { /* non-critical */ }
    });
  }

  // Include lookupToken in the creation response so the client can store it
  res.status(201).json(formatOrder(order, true));

  // ── Confirmation email (non-blocking) ─────────────────────────────────────
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
        items: order.items ?? [],
        promoCode: order.promoCode ?? undefined,
        codDownPayment: order.codDownPayment ?? 0,
        codDownPaymentMethod: order.codDownPaymentMethod ?? undefined,
        amountDueOnDelivery: order.amountDueOnDelivery ?? 0,
      }),
    }).catch(() => {});
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid order ID" }); return; }
  const userId: number | null = (req as any).user?.id ?? null;

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }

  const isOwner = userId !== null && order.userId === userId;
  const adminAccess = await isActiveAdmin(userId);

  if (!isOwner && !adminAccess) {
    if (order.userId === null) {
      // Guest orders require a valid lookup token to prevent enumeration
      const providedToken = String(req.query.token ?? "");
      if (!providedToken || providedToken !== order.lookupToken) {
        res.status(403).json({ error: "Forbidden" }); return;
      }
    } else {
      res.status(403).json({ error: "Forbidden" }); return;
    }
  }

  res.json(formatOrder(order));
});

// Admin routes
router.get("/admin/all", requireAdmin, async (_req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(o => formatOrder(o)));
});

router.put("/admin/:id/status", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid order ID" }); return; }
  const result = AdminUpdateOrderStatusBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [order] = await db.update(ordersTable).set({ status: result.data.status }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatOrder(order));
});

export default router;
