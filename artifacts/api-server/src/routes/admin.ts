import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, productsTable, categoriesTable, usersTable } from "@workspace/db";
import { desc, eq, sql, gte } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/dashboard", requireAdmin, async (_req, res) => {
  const [{ totalRevenue }] = await db.select({ totalRevenue: sql<number>`coalesce(sum(total), 0)` }).from(ordersTable);
  const [{ totalOrders }] = await db.select({ totalOrders: sql<number>`count(*)` }).from(ordersTable);
  const [{ totalProducts }] = await db.select({ totalProducts: sql<number>`count(*)` }).from(productsTable);
  const [{ totalCustomers }] = await db.select({ totalCustomers: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "customer"));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [{ ordersToday }] = await db.select({ ordersToday: sql<number>`count(*)` }).from(ordersTable).where(gte(ordersTable.createdAt, todayStart));

  const categories = await db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable);
  const revenueByCategory = await Promise.all(categories.map(async (cat) => {
    const products = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.categoryId, cat.id));
    const pids = products.map(p => p.id);
    let revenue = 0;
    if (pids.length > 0) {
      const orders = await db.select({ items: ordersTable.items }).from(ordersTable);
      for (const o of orders) {
        const items = (o.items as any[]) ?? [];
        for (const item of items) {
          if (pids.includes(item.productId)) {
            revenue += (item.price ?? 0) * (item.quantity ?? 1);
          }
        }
      }
    }
    return { category: cat.name, revenue };
  }));

  const recentOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10);
  const statuses = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];
  const ordersByStatus = await Promise.all(statuses.map(async (status) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(eq(ordersTable.status, status));
    return { status, count: Number(count) };
  }));

  res.json({
    totalRevenue: Number(totalRevenue),
    totalOrders: Number(totalOrders),
    totalProducts: Number(totalProducts),
    totalCustomers: Number(totalCustomers),
    ordersToday: Number(ordersToday),
    revenueByCategory,
    recentOrders: recentOrders.map(o => ({
      id: o.id, userId: o.userId, status: o.status,
      paymentMethod: o.paymentMethod ?? null, paymentStatus: o.paymentStatus ?? null,
      items: o.items ?? [], fullName: o.fullName ?? null, phone: o.phone ?? null,
      email: o.email ?? null, governorate: o.governorate ?? null, address: o.address ?? null,
      subtotal: o.subtotal, shipping: o.shipping, discount: o.discount, total: o.total,
      promoCode: o.promoCode ?? null,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    })),
    ordersByStatus,
  });
});

router.get("/orders", requireAdmin, async (_req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(o => ({
    id: o.id, userId: o.userId, status: o.status,
    paymentMethod: o.paymentMethod ?? null, paymentStatus: o.paymentStatus ?? null,
    items: o.items ?? [], fullName: o.fullName ?? null, phone: o.phone ?? null,
    email: o.email ?? null, governorate: o.governorate ?? null, address: o.address ?? null,
    subtotal: o.subtotal, shipping: o.shipping, discount: o.discount, total: o.total,
    promoCode: o.promoCode ?? null,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
  })));
});

router.put("/orders/:id/status", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...order, createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt });
});

router.get("/customers", requireAdmin, async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(u => ({
    id: u.id, email: u.email, name: u.name, phone: u.phone ?? null,
    role: u.role, loyaltyPoints: u.loyaltyPoints ?? 0,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  })));
});

export default router;
