// جدول الأجهزة الموثوقة للمديرين
import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trustedDevicesTable = pgTable("trusted_devices", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(), // معرف الجهاز الفريد
  deviceName: text("device_name"), // اسم الجهاز (مثل "Chrome على Windows")
  deviceType: text("device_type"), // browser, mobile, desktop
  browser: text("browser"), // Chrome, Firefox, Safari
  os: text("os"), // Windows, MacOS, Android
  pushSubscription: text("push_subscription"), // JSON subscription for push notifications
  ipAddress: text("ip_address"), // آخر IP استخدمه
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrustedDeviceSchema = createInsertSchema(trustedDevicesTable).omit({
  id: true,
  lastUsedAt: true,
  createdAt: true,
});

export const updateTrustedDeviceSchema = createInsertSchema(trustedDevicesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTrustedDevice = z.infer<typeof insertTrustedDeviceSchema>;
export type TrustedDevice = typeof trustedDevicesTable.$inferSelect;
