// جدول الحقول المخصصة - حقول النماذج القابلة للإضافة والحذف من لوحة الإدارة
import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customFieldsTable = pgTable("custom_fields", {
  id: serial("id").primaryKey(),
  pageKey: text("page_key").notNull(),    // الصفحة التي ينتمي إليها الحقل
  fieldKey: text("field_key").notNull(),  // مفتاح فريد للحقل
  labelAr: text("label_ar").notNull(),    // التسمية بالعربية
  fieldType: text("field_type").notNull().default("text"), // text | number | select | tel | email | date
  placeholder: text("placeholder").default(""),
  options: text("options").default(""),   // خيارات للـ select مفصولة بفاصلة
  isRequired: boolean("is_required").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomFieldSchema = createInsertSchema(customFieldsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type CustomField = typeof customFieldsTable.$inferSelect;
