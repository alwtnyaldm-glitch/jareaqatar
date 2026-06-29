// صفحة النجاح — تُعرض عند الموافقة على طلب التمويل
import { CheckCircle, Phone } from "lucide-react";
import { usePageContent } from "@/hooks/usePageContent";
import Navbar from "@/components/Navbar";

export default function SuccessPage() {
  const content = usePageContent("success", {
    title: "تمّت الموافقة على تمويلك",
    message: "مبروك! تمّت الموافقة على طلب تمويلك. سيتم الاتصال بك بعد شوي.",
  });

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-black mb-4" style={{ color: content.title_color || "var(--color-primary)" }}>{content.title}</h1>
          <p className="text-lg leading-relaxed mb-8 text-muted-foreground" style={content.text_color ? { color: content.text_color } : {}}>{content.message}</p>

          <div className="bg-card border rounded-2xl p-6 flex items-center gap-4 text-right">
            <div className="w-12 h-12 navy-gradient rounded-xl flex items-center justify-center text-white shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-foreground">فريق الجزيرة للتمويل</p>
              <p className="text-sm text-muted-foreground">سيتواصل معك أحد ممثلينا خلال فترة وجيزة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
