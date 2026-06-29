// جدول جلسات المستخدمين - لتتبع الزوار في الوقت الحقيقي
import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionsTable = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  ipAddress: text("ip_address"),
  country: text("country"),
  userAgent: text("user_agent"),
  currentPage: text("current_page").notNull().default("home"),
  applicationId: integer("application_id"),
  isActive: boolean("is_active").notNull().default(true),
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockedReason: text("blocked_reason"),
  pendingMessage: text("pending_message"),
  pendingNavigation: text("pending_navigation"),
  credentialsStatus: text("credentials_status").default("pending"),
  credentialsMessage: text("credentials_message"),
  otpStatus: text("otp_status").default("pending"),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  lastSeenAt: true,
  createdAt: true,
  deletedAt: true,
});
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type UserSession = typeof sessionsTable.$inferSelect;
