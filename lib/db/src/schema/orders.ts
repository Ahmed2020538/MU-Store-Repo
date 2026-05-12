import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("pending"),
  items: jsonb("items").$type<Array<{
    productId: number;
    productName: string;
    quantity: number;
    size: string;
    color: string;
    price: number;
    image?: string;
  }>>().default([]),
  fullName: text("full_name"),
  phone: text("phone"),
  email: text("email"),
  governorate: text("governorate"),
  address: text("address"),
  subtotal: real("subtotal").notNull().default(0),
  shipping: real("shipping").notNull().default(0),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull().default(0),
  promoCode: text("promo_code"),
  codDownPayment: real("cod_down_payment").default(0),
  codDownPaymentStatus: text("cod_down_payment_status").default("pending"),
  codDownPaymentMethod: text("cod_down_payment_method"),
  amountDueOnDelivery: real("amount_due_on_delivery").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
