// مكون الإشعار الفوري — يظهر عندما يرسل المدير رسالة للمستخدم
import { useSession } from "@/context/SessionContext";
import { X, MessageCircle } from "lucide-react";

export default function NotificationModal() {
  const { notification, clearNotification } = useSession();
  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-card border rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 navy-gradient rounded-2xl flex items-center justify-center text-white mx-auto mb-6">
          <MessageCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-primary mb-4">اشعار مهم  </h2>
        <p className="text-foreground leading-relaxed text-lg mb-8 whitespace-pre-wrap">{notification}</p>
        <button
          onClick={clearNotification}
          className="w-full navy-gradient text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <X className="w-4 h-4" />
          حسناً، فهمت
        </button>
      </div>
    </div>
  );
}
