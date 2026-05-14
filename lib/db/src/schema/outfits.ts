import { pgTable, serial, text, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { usersTable } from "./users";

export const outfitsTable = pgTable("outfits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  occasion: text("occasion").notNull().default("casual"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  coverImage: text("cover_image"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outfitItemsTable = pgTable("outfit_items", {
  id: serial("id").primaryKey(),
  outfitId: integer("outfit_id").notNull().references(() => outfitsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  role: text("role").default("accessory"),
  displayOrder: integer("display_order").default(0),
});

export const savedLooksTable = pgTable("saved_looks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  outfitId: integer("outfit_id").notNull().references(() => outfitsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, t => [unique("saved_looks_user_outfit").on(t.userId, t.outfitId)]);

export const insertOutfitSchema = createInsertSchema(outfitsTable).omit({ id: true, createdAt: true });
export const insertOutfitItemSchema = createInsertSchema(outfitItemsTable).omit({ id: true });

export type Outfit = typeof outfitsTable.$inferSelect;
export type OutfitItem = typeof outfitItemsTable.$inferSelect;
export type SavedLook = typeof savedLooksTable.$inferSelect;
