import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"),
  loyaltyPoints: integer("loyalty_points").default(0),
  birthDate: text("birth_date"),
  birthdayCouponYear: integer("birthday_coupon_year").default(0),
  isAdmin: integer("is_admin").default(0),
  adminCreatedBy: integer("admin_created_by"),
  adminCreatedAt: text("admin_created_at"),
  permissions: text("permissions").default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, loyaltyPoints: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
