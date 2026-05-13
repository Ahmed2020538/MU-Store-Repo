import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").default(20),
  userId: integer("user_id"),
  expiresAt: text("expires_at"),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Coupon = typeof couponsTable.$inferSelect;
