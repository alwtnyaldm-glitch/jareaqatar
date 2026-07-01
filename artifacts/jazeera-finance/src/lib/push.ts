// Push Notifications Service للـ Frontend باستخدام Firebase
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── توليد معرف جهاز فريد ────────────────────────────────────────────────
export function getDeviceId(): string {
  const stored = localStorage.getItem("deviceId");
  if (stored) return stored;
  
  const newId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  localStorage.setItem("deviceId", newId);
  return newId;
}

// ─── معلومات الجهاز ──────────────────────────────────────────────────────
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";
  
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  
  return {
    browser,
    os,
    deviceName: `${browser} على ${os}`,
    deviceType: /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop",
  };
}

// ─── تسجيل Service Worker للإشعارات ───────────────────────────────────────
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("[Push] Service Workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("[Push] Service Worker registered:", registration.scope);
    return registration;
  } catch (err) {
    console.error("[Push] Service Worker registration failed:", err);
    return null;
  }
}

// ─── الاشتراك في FCM Push Notifications ────────────────────────────────────
export async function subscribeToFCM(): Promise<PushSubscription | null> {
  try {
    console.log("[Push] Starting FCM subscription...");
    
    // 1. تسجيل Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error("[Push] Service Worker registration failed");
      return null;
    }

    // 2. الحصول على Permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[Push] Notification permission denied");
      return null;
    }
    console.log("[Push] Notification permission granted");

    // 3. الاشتراك في Push مع FCM
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      console.log("[Push] VAPID Public Key not available, using default FCM subscription");
      // اشتراك بدون VAPID (للـ FCM Legacy)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
      });
      return subscription;
    }

    // 4. تحويل VAPID Key
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // 5. الاشتراك في Push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log("[Push] FCM subscription successful!");
    console.log("[Push] Endpoint:", subscription.endpoint?.substring(0, 80) + "...");
    
    return subscription;
  } catch (err) {
    console.error("[Push] FCM subscription failed:", err);
    return null;
  }
}

// ─── الحصول على VAPID Public Key من السيرفر ──────────────────────────────
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/push/vapid-public-key`);
    if (!res.ok) return null;
    const data = await res.json() as { publicKey?: string };
    return data.publicKey || null;
  } catch {
    return null;
  }
}

// ─── تحويل VAPID Key إلى Uint8Array ──────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ─── حفظ اشتراك Push للجهاز ───────────────────────────────────────────────
export async function savePushSubscription(
  subscription: PushSubscription, 
  deviceId: string,
  deviceInfo?: { deviceName: string; browser?: string; os?: string }
): Promise<boolean> {
  try {
    const subData = subscription.toJSON();
    console.log("[Push] Saving subscription for device:", deviceId);
    console.log("[Push] Subscription data:", JSON.stringify(subData).substring(0, 200) + "...");
    
    const response = await fetch(`${BASE}/api/auth/devices/${deviceId}/push-subscription`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        subscription: subData,
        deviceName: deviceInfo?.deviceName,
        browser: deviceInfo?.browser,
        os: deviceInfo?.os,
      }),
    });

    const result = await response.json();
    console.log("[Push] Server response:", result);

    if (response.ok) {
      console.log("[Push] ✅ Subscription saved successfully:", result.action);
      return true;
    } else {
      console.error("[Push] ❌ Failed to save subscription:", response.status, result);
      return false;
    }
  } catch (err) {
    console.error("[Push] ❌ Error saving subscription:", err);
    return false;
  }
}

// ─── الاشتراك الكامل (تسجيل + حفظ) ───────────────────────────────────────
export async function subscribeToPush(deviceId: string): Promise<boolean> {
  const subscription = await subscribeToFCM();
  if (!subscription) {
    console.error("[Push] Failed to get FCM subscription");
    return false;
  }

  const saved = await savePushSubscription(subscription, deviceId);
  if (!saved) {
    console.error("[Push] Failed to save subscription to server");
    return false;
  }

  return true;
}

// ─── إلغاء الاشتراك ───────────────────────────────────────────────────────
export async function unsubscribeFromPush(subscription: PushSubscription): Promise<boolean> {
  try {
    await subscription.unsubscribe();
    console.log("[Push] Unsubscribed successfully");
    return true;
  } catch (err) {
    console.error("[Push] Unsubscribe failed:", err);
    return false;
  }
}

// ─── فحص حالة الاشتراك الحالية ──────────────────────────────────────────
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch {
    return null;
  }
}

// ─── فحص هل Push مدعوم ─────────────────────────────────────────────────
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// ─── تسجيل الدخول وحفظ الجهاز ────────────────────────────────────────────
export async function registerDevice(deviceId: string, deviceInfo: { deviceName: string; deviceType: string; browser: string; os: string }): Promise<boolean> {
  try {
    const response = await fetch(`${BASE}/api/auth/devices/trust`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        ...deviceInfo,
      }),
    });

    return response.ok;
  } catch (err) {
    console.error("[Push] Failed to register device:", err);
    return false;
  }
}
