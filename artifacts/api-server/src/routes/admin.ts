import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, productsTable, categoriesTable, usersTable } from "@workspace/db";
import { desc, eq, sql, gte, lt, inArray } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/dashboard", requireAdmin, async (_req, res) => {
  const [{ totalRevenue }] = await db.select({ totalRevenue: sql<number>`coalesce(sum(total), 0)` }).from(ordersTable);
  const [{ totalOrders }] = await db.select({ totalOrders: sql<number>`count(*)` }).from(ordersTable);
  const [{ totalProducts }] = await db.select({ totalProducts: sql<number>`count(*)` }).from(productsTable);
  const [{ totalCustomers }] = await db.select({ totalCustomers: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "customer"));
  const [{ priorityCount }] = await db.select({ priorityCount: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.isPriority, 1));

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const [{ ordersToday }] = await db.select({ ordersToday: sql<number>`count(*)` }).from(ordersTable).where(gte(ordersTable.createdAt, todayStart));

  const categories = await db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable);
  const revenueByCategory = await Promise.all(categories.map(async (cat) => {
    const products = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.categoryId, cat.id));
    const pids = products.map(p => p.id);
    let revenue = 0;
    if (pids.length > 0) {
      const orders = await db.select({ items: ordersTable.items }).from(ordersTable);
      for (const o of orders) {
        for (const item of ((o.items as any[]) ?? [])) {
          if (pids.includes(item.productId)) revenue += (item.price ?? 0) * (item.quantity ?? 1);
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
    totalRevenue: Number(totalRevenue), totalOrders: Number(totalOrders),
    totalProducts: Number(totalProducts), totalCustomers: Number(totalCustomers),
    priorityCount: Number(priorityCount), ordersToday: Number(ordersToday),
    revenueByCategory,
    recentOrders: recentOrders.map(o => ({
      id: o.id, userId: o.userId, status: o.status,
      paymentMethod: o.paymentMethod ?? null, items: o.items ?? [],
      fullName: o.fullName ?? null, total: o.total,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    })),
    ordersByStatus,
  });
});

router.get("/insights", requireAdmin, async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const revenueByDay = await db
    .select({
      date: sql<string>`date(created_at)`,
      revenue: sql<number>`coalesce(sum(total), 0)`,
      orders: sql<number>`count(*)`,
    })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, thirtyDaysAgo))
    .groupBy(sql`date(created_at)`)
    .orderBy(sql`date(created_at)`);

  const allOrders = await db
    .select({ items: ordersTable.items })
    .from(ordersTable)
    .where(sql`${ordersTable.status} != 'cancelled'`);

  const revenueMap = new Map<number, { revenue: number; quantity: number }>();
  for (const { items } of allOrders) {
    for (const item of ((items as any[]) ?? [])) {
      const id = Number(item.productId);
      if (!id) continue;
      const prev = revenueMap.get(id) ?? { revenue: 0, quantity: 0 };
      revenueMap.set(id, {
        revenue: prev.revenue + (item.price ?? 0) * (item.quantity ?? 1),
        quantity: prev.quantity + (item.quantity ?? 1),
      });
    }
  }

  const topIds = [...revenueMap.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id]) => id);

  const topProductRows = topIds.length > 0
    ? await db
        .select({ id: productsTable.id, name: productsTable.name, stock: productsTable.stock, price: productsTable.price })
        .from(productsTable)
        .where(inArray(productsTable.id, topIds))
    : [];

  const topProducts = topProductRows
    .map(p => ({
      id: p.id, name: p.name,
      revenue: revenueMap.get(p.id)?.revenue ?? 0,
      sold: revenueMap.get(p.id)?.quantity ?? 0,
      stock: p.stock ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const lowStock = await db
    .select({ id: productsTable.id, name: productsTable.name, stock: productsTable.stock, price: productsTable.price })
    .from(productsTable)
    .where(lt(productsTable.stock, 10))
    .orderBy(productsTable.stock)
    .limit(12);

  res.json({
    revenueByDay: revenueByDay.map(r => ({ ...r, revenue: Number(r.revenue), orders: Number(r.orders) })),
    topProducts,
    lowStock,
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
    codDownPayment: (o as any).codDownPayment ?? null,
    codDownPaymentStatus: (o as any).codDownPaymentStatus ?? null,
    amountDueOnDelivery: (o as any).amountDueOnDelivery ?? null,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
  })));
});

router.put("/orders/:id/status", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
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
    isPriority: u.isPriority ?? 0, isProfileComplete: u.isProfileComplete ?? 0,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  })));
});

router.put("/customers/:id/priority", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const newPriority = user.isPriority ? 0 : 1;
  const [updated] = await db.update(usersTable).set({
    isPriority: newPriority,
    ...(newPriority ? { priorityGrantedAt: new Date().toISOString() } : {}),
  }).where(eq(usersTable.id, id)).returning();
  res.json({ id: updated.id, isPriority: updated.isPriority });
});

export default router;
