// مكون لطلب إذن الإشعارات وحفظ الجهاز
import { useState } from "react";
import { Bell, BellRing, CheckCircle, X, Smartphone, RefreshCw } from "lucide-react";
import { isFCMSupported, subscribeToFCM, getExistingFCMToken } from "@/lib/firebase";

interface NotificationSetupProps {
  onSuccess?: () => void;
  onDecline?: () => void;
  variant?: "button" | "card" | "banner";
}

export default function NotificationSetup({ 
  onSuccess, 
  onDecline,
  variant = "card" 
}: NotificationSetupProps) {
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(!!getExistingFCMToken());
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!isFCMSupported()) {
      setError("المتصفح لا يدعم الإشعارات");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await subscribeToFCM();
      if (success) {
        setSubscribed(true);
        onSuccess?.();
      } else {
        setError("فشل في تفعيل الإشعارات");
      }
    } catch (err) {
      setError("حدث خطأ أثناء التفعيل");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    onDecline?.();
  };

  // ─── حالة: تم التفعيل ───────────────────────────────
  if (subscribed) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>الإشعارات مفعّلة</span>
      </div>
    );
  }

  // ─── متغير: زر ──────────────────────────────────────
  if (variant === "button") {
    return (
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <BellRing className="w-4 h-4" />
        )}
        {loading ? "جاري التفعيل..." : "تفعيل الإشعارات"}
      </button>
    );
  }

  // ─── متغير: بانر علوي ──────────────────────────────
  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">تفعيل الإشعارات</h3>
            <p className="text-sm text-white/80">استلم إشعارات فورية عند وصول زوار جدد</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDecline}
            className="px-3 py-1.5 text-sm text-white/80 hover:text-white"
          >
            لاحقاً
          </button>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="px-4 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "تفعيل"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── متغير: بطاقة ──────────────────────────────────
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
          <BellRing className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-blue-900 mb-1">تفعيل الإشعارات</h3>
          <p className="text-sm text-blue-700 mb-4">
            استلم إشعارات فورية عند وصول زوار جدد أو إدخال بيانات جديدة. 
            الإشعارات تعمل حتى عند إغلاق المتصفح.
          </p>
          
          {error && (
            <div className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري التفعيل...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  تفعيل الإشعارات
                </>
              )}
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors"
            >
              لاحقاً
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
