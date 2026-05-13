import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const testimonialsTable = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerCity: text("customer_city"),
  customerAvatarUrl: text("customer_avatar_url"),
  rating: integer("rating").default(5),
  reviewText: text("review_text").notNull(),
  reviewTextAr: text("review_text_ar"),
  productName: text("product_name"),
  verifiedPurchase: integer("verified_purchase").default(1),
  featured: integer("featured").default(1),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Testimonial = typeof testimonialsTable.$inferSelect;
export type InsertTestimonial = typeof testimonialsTable.$inferInsert;
