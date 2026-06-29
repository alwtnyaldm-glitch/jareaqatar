import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Supabase PostgreSQL connection
if (!process.env.DATABASE_URL) {
  console.error("❌ فشل الاتصال بقاعدة البيانات: متغير DATABASE_URL غير موجود!");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.connect()
  .then((client) => {
    console.log("✅ تم الاتصال بقاعدة البيانات بنجاح!");
    client.release();
  })
  .catch((err) => {
    console.error("❌ فشل الاتصال بقاعدة البيانات!");
    console.error("📋 تفاصيل الخطأ:", err.message);
    if (err.code) console.error("🔢 كود الخطأ:", err.code);
    if (err.hostname) console.error("🌐 اسم المضيف:", err.hostname);
    if (err.port) console.error("🔌 المنفذ:", err.port);
    console.error("💡 تأكد من:");
    console.error("   1. صحة رابط قاعدة البيانات (DATABASE_URL)");
    console.error("   2. تفعيل SSL في الاتصال");
    console.error("   3. صحة اسم المستخدم وكلمة المرور");
  });

export const db = drizzle(pool, { schema });

export * from "./schema";
