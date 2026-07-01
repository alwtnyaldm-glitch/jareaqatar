// صفحة تسجيل دخول المدير مع الأجهزة الموثوقة
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminLogin, useGetAdminMe } from "@workspace/api-client-react";
import { Building2, Lock, User, Eye, EyeOff, ShieldCheck, Smartphone, CheckCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── توليد معرف جهاز فريد ────────────────────────────────────────────────
function getDeviceId(): string {
  const stored = localStorage.getItem("deviceId");
  if (stored) return stored;
  
  const newId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  localStorage.setItem("deviceId", newId);
  return newId;
}

// ─── معلومات الجهاز ──────────────────────────────────────────────────────
function getDeviceInfo() {
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

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [trusting, setTrusting] = useState(false);
  const [trusted, setTrusted] = useState(false);
  const login = useAdminLogin();
  const deviceId = getDeviceId();
  const deviceInfo = getDeviceInfo();

  // التحقق من حالة الجهاز الموثوق
  useEffect(() => {
    const checkTrusted = async () => {
      try {
        const res = await fetch(`${BASE}/api/auth/devices`, {
          credentials: "include",
        });
        if (res.ok) {
          const devices = await res.json();
          const isTrusted = devices.some((d: { deviceId: string }) => d.deviceId === deviceId);
          setTrusted(isTrusted);
        }
      } catch {
        // تجاهل
      }
    };
    checkTrusted();
  }, []);

  // التحقق من وجود جلسة إدارية نشطة
  useGetAdminMe({
    query: {
      retry: false,
      staleTime: 0,
    },
  });

  // تسجيل دخول المدير
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTrusting(true);
    
    try {
      await login.mutateAsync({ data: { username, password } });
      
      // تسجيل الجهاز كجهاز موثوق
      await fetch(`${BASE}/api/auth/devices/trust`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
        }),
      });
      
      // الاشتراك في Push Notifications
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          const reg = await navigator.serviceWorker.ready;
          const vapidRes = await fetch(`${BASE}/api/push/vapid-public-key`);
          if (vapidRes.ok) {
            const { publicKey } = await vapidRes.json();
            if (publicKey) {
              const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
              });
              
              await fetch(`${BASE}/api/auth/devices/${deviceId}/push-subscription`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription: sub.toJSON() }),
              });
            }
          }
        } catch {
          // تجاهل أخطاء Push
        }
      }
      
      setTrusted(true);
      navigate("/admin/dashboard");
    } catch {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    } finally {
      setTrusting(false);
    }
  };

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

  return (
    <div
      className="min-h-screen hero-gradient flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">
            الجزيرة للتمويل
          </h1>
          <p className="text-white/60 text-sm">لوحة التحكم الإدارية</p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <div className="bg-card rounded-3xl shadow-2xl p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-black text-foreground">
              تسجيل دخول المدير
            </h2>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                اسم المستخدم
              </label>
              <div className="relative">
                <User className="absolute top-3.5 right-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border rounded-xl pr-10 p-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="أدخل اسم المستخدم"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute top-3.5 right-3 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-xl pr-10 pl-10 p-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="أدخل كلمة المرور"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute top-3.5 left-3 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full navy-gradient text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {login.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            admin / يجب ادخال كلمة المرور بشكل صحيح للدخول
          </p>

          {/* مؤشر الجهاز الموثوق */}
          {trusted && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-400">جهاز موثوق</p>
                <p className="text-xs text-green-400/70">{deviceInfo.deviceName}</p>
              </div>
            </div>
          )}

          {/* طلب إذن الإشعارات */}
          {!trusted && "Notification" in window && Notification.permission === "default" && (
            <button
              type="button"
              onClick={async () => {
                const perm = await Notification.requestPermission();
                if (perm === "granted") {
                  // طلب التحديث
                  setError("");
                }
              }}
              className="mt-4 w-full py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              تفعيل الإشعارات على هذا الجهاز
            </button>
          )}
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            العودة للموقع الرئيسي
          </a>
        </div>
      </div>
    </div>
  );
}
