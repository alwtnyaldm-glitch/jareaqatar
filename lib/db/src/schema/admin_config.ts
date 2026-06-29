// جدول إعدادات المدير - كلمة السر وإعدادات الإدارة
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminConfigTable = pgTable("admin_config", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().default("admin"),
  password: text("password").notNull().default("Fa@@20yiz"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdminConfigSchema = createInsertSchema(adminConfigTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertAdminConfig = z.infer<typeof insertAdminConfigSchema>;
export type AdminConfig = typeof adminConfigTable.$inferSelect;
