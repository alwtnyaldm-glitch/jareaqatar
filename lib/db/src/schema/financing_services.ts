// جدول خدمات التمويل - بطاقات الخدمات المعروضة في الصفحة الرئيسية
import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const financingServicesTable = pgTable("financing_services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull(),
  description: text("description").notNull(),
  descriptionAr: text("description_ar").notNull(),
  imageUrl: text("image_url"),
  iconName: text("icon_name"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  financingType: text("financing_type").notNull(), // personal | real-estate | auto | yacht | business
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFinancingServiceSchema = createInsertSchema(financingServicesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFinancingService = z.infer<typeof insertFinancingServiceSchema>;
export type FinancingService = typeof financingServicesTable.$inferSelect;
