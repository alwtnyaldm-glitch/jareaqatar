// طبقة الحظر — تظهر فوق كل شيء عندما يُحظر المستخدم
import { useSession } from "@/context/SessionContext";
import { ShieldOff } from "lucide-react";

export default function BlockedOverlay() {
  const { isBlocked, blockedReason } = useSession();
  if (!isBlocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 backdrop-blur-sm p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-black text-white mb-4">تم تقييد الوصول</h1>
        <p className="text-gray-300 leading-relaxed text-lg">
          {blockedReason || "تم حظر حسابك. للاستفسار، يرجى التواصل مع الدعم."}
        </p>
      </div>
    </div>
  );
}
