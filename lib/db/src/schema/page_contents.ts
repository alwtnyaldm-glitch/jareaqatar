// جدول محتوى الصفحات - نصوص قابلة للتعديل في الوقت الحقيقي من لوحة الإدارة
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pageContentsTable = pgTable("page_contents", {
  id: serial("id").primaryKey(),
  pageKey: text("page_key").notNull(),    // home | apply | banks | credentials | verify | waiting
  sectionKey: text("section_key").notNull(), // hero_title | hero_subtitle | ...
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPageContentSchema = createInsertSchema(pageContentsTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;
export type PageContent = typeof pageContentsTable.$inferSelect;
