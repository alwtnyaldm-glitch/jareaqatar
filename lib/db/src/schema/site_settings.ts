// جدول إعدادات الموقع - يحتوي على جميع النصوص والإعدادات القابلة للتعديل
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("Al Jazeera Finance"),
  companyNameAr: text("company_name_ar").notNull().default("الجزيرة للتمويل والحلول المالية"),
  heroTitle: text("hero_title").notNull().default("حلول تمويلية متكاملة لتحقيق أهدافك"),
  heroSubtitle: text("hero_subtitle").notNull().default("نقدم لك أفضل خيارات التمويل بأرباح تنافسية وشروط مرنة"),
  heroImageUrl: text("hero_image_url"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#1e3a5f"),
  contactPhone: text("contact_phone").default("920000000"),
  contactEmail: text("contact_email").default("info@aljazeera-finance.com"),
  contactAddress: text("contact_address").default("الرياض، المملكة العربية السعودية"),
  otpFieldLabel: text("otp_field_label").notNull().default("أدخل رمز التحقق"),
  otpFieldPlaceholder: text("otp_field_placeholder").notNull().default("رمز التحقق"),
  waitingPageMessage: text("waiting_page_message").notNull().default("يرجى الانتظار بينما يقوم فريقنا بمراجعة طلبكم. سيتم التواصل معكم قريباً."),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettingsTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
