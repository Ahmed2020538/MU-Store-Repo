import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const brandsTable = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  displayOrder: integer("display_order").default(0),
  active: integer("active").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Brand = typeof brandsTable.$inferSelect;
export type InsertBrand = typeof brandsTable.$inferInsert;
