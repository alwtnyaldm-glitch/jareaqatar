// جدول البنوك - يحتوي على جميع البنوك المتاحة للاختيار
import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const banksTable = pgTable("banks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBankSchema = createInsertSchema(banksTable).omit({ id: true, createdAt: true });
export type InsertBank = z.infer<typeof insertBankSchema>;
export type Bank = typeof banksTable.$inferSelect;
