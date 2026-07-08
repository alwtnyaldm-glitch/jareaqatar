// صفحة إدارة الأجهزة الموثوقة للمدير
import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import NotificationSetup from "@/components/NotificationSetup";
import {
  Smartphone, Trash2, RefreshCw, Bell, BellOff, Clock, AlertCircle
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface TrustedDevice {
  id: number;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  lastUsedAt: string;
  createdAt: string;
  hasPushSubscription: boolean;
}

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  // جلب الأجهزة الموثوقة
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/devices`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      } else {
        console.error("Failed to fetch devices");
      }
    } catch (err) {
      console.error("Error fetching devices:", err);
    } finally {
      setLoading(false);
    }
  };

  // حالة الإشعارات
  const [notificationDismissed, setNotificationDismissed] = useState(
    localStorage.getItem("notification_dismissed") === "true"
  );

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDismissNotification = () => {
    setNotificationDismissed(true);
    localStorage.setItem("notification_dismissed", "true");
  };

  // حذف جهاز
  const handleDelete = async (deviceId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الجهاز؟")) return;
    
    setDeleting(parseInt(deviceId));
    try {
      const res = await fetch(`${BASE}/api/auth/devices/${deviceId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setDevices(devices.filter(d => d.deviceId !== deviceId));
      }
    } catch (err) {
      console.error("Error deleting device:", err);
    } finally {
      setDeleting(null);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* الرأس */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-foreground">الأجهزة الموثوقة</h1>
            <p className="text-muted-foreground text-sm mt-1">
              إدارة الأجهزة المسموح لها باستلام الإشعارات
            </p>
          </div>
          <button
            onClick={fetchDevices}
            className="flex items-center gap-2 border rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        {/* بطاقة تفعيل الإشعارات */}
      {!notificationDismissed && (
        <NotificationSetup
          variant="card"
          onSuccess={() => {
            handleDismissNotification();
            fetchDevices();
          }}
          onDecline={handleDismissNotification}
        />
      )}

      {/* الشرح */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          كيف يعمل؟
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• عند تفعيل الإشعارات، يتم تسجيل الجهاز تلقائياً كجهاز موثوق</li>
          <li>• الأجهزة الموثوقة تستلم إشعارات Push حتى عند إغلاق المتصفح</li>
          <li>• يمكنك حذف أي جهاز غير معروف من هذه القائمة</li>
        </ul>
      </div>

        {/* قائمة الأجهزة */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
            <p>جاري التحميل...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl">
            <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد أجهزة موثوقة</p>
            <p className="text-sm">سجل دخولك لاستقبال الإشعارات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-card border rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {/* أيقونة الجهاز */}
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>

                  {/* معلومات الجهاز */}
                  <div>
                    <h3 className="font-bold text-foreground">{device.deviceName}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{device.browser}</span>
                      <span>•</span>
                      <span>{device.os}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>آخر استخدام: {formatDate(device.lastUsedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* الحالة والأزرار */}
                <div className="flex items-center gap-3">
                  {/* مؤشر Push */}
                  {device.hasPushSubscription ? (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <Bell className="w-4 h-4" />
                      <span>Push مفعّل</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      <BellOff className="w-4 h-4" />
                      <span>بدون Push</span>
                    </div>
                  )}

                  {/* زر الحذف */}
                  <button
                    onClick={() => handleDelete(device.deviceId)}
                    disabled={deleting === device.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                    title="حذف الجهاز"
                  >
                    {deleting === device.id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* إجمالي الأجهزة */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          إجمالي: {devices.length} جهاز موثوق
        </div>
      </div>
    </AdminLayout>
  );
}
