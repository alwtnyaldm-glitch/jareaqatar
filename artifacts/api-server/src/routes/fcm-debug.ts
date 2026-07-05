// FCM Debug Routes - لتسجيل الأخطاء من التطبيق
import { Router } from "express";
import { db } from "@workspace/db";

const router = Router();

// ─── تسجيل خطأ FCM من التطبيق ───────────────────────────────────────────
router.post("/log-error", async (req, res) => {
  const { 
    error, 
    context,
    deviceInfo,
    timestamp 
  } = req.body as {
    error?: {
      message?: string;
      code?: string;
      stack?: string;
    };
    context?: string;
    deviceInfo?: {
      userAgent?: string;
      platform?: string;
    };
    timestamp?: number;
  };

  try {
    console.log("═══════════════════════════════════════════════════");
    console.log("📱 [FCM ERROR] خطأ FCM من التطبيق:");
    console.log("───────────────────────────────────────────────────");
    console.log(`⏰ الوقت: ${new Date(timestamp || Date.now()).toISOString()}`);
    console.log(`📍 السياق: ${context || 'غير محدد'}`);
    console.log(`🔧 الجهاز: ${deviceInfo?.userAgent || 'غير معروف'}`);
    console.log(`❌ الكود: ${error?.code || 'غير محدد'}`);
    console.log(`💬 الرسالة: ${error?.message || 'غير محددة'}`);
    if (error?.stack) {
      console.log(`📋 Stack Trace:`);
      console.log(error.stack.split('\n').map((line: string) => `   ${line}`).join('\n'));
    }
    console.log("═══════════════════════════════════════════════════");

    // حفظ الخطأ في قاعدة البيانات إذا أردنا تتبعه لاحقاً
    // يمكن إضافة جدول fcm_errors إذا احتاج الأمر
    
    res.json({ success: true, logged: true });
  } catch (err) {
    console.error("[FCM DEBUG] Error logging failed:", err);
    res.status(500).json({ error: "فشل في تسجيل الخطأ" });
  }
});

// ─── اختبار الاتصال ───────────────────────────────────────────────────────
router.get("/test", (_req, res) => {
  res.json({ 
    success: true, 
    message: "FCM Debug API is working",
    timestamp: new Date().toISOString()
  });
});

export default router;
