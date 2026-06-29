// صفحة معلومات مقدم الطلب - حقول مدارة بالكامل من لوحة الإدارة
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useSession } from "@/context/SessionContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { usePageContent } from "@/hooks/usePageContent";
import StepIndicator from "@/components/StepIndicator";
import Navbar from "@/components/Navbar";
import { User, Briefcase, ChevronLeft, Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
type ApplicantType = "individual" | "business";

interface CustomField {
  id: number;
  pageKey: string;
  fieldKey: string;
  labelAr: string;
  fieldType: string;
  placeholder: string;
  options: string;
  isRequired: boolean;
  sortOrder: number;
}

// الحقول المعروفة التي لها أعمدة مخصصة في قاعدة البيانات
const INDIVIDUAL_KNOWN_KEYS = ["fullName", "nationalId", "dateOfBirth", "monthlySalary", "employer", "phone", "email", "city", "maritalStatus"];
const BUSINESS_KNOWN_KEYS = ["companyName", "businessType", "commercialRegistration", "employeeCount", "annualRevenue", "contactName", "phone", "email"];

function pageKeyFor(t: ApplicantType) {
  return t === "individual" ? "apply_individual" : "apply_business";
}

export default function ApplicantInfoPage() {
  const [, navigate] = useLocation();
  const { sessionId, applicationId, setApplicationId } = useSession();
  const { subscribe } = useWebSocket();
  const [type, setType] = useState<ApplicantType>("individual");
  const [isLoading, setIsLoading] = useState(false);
  const content = usePageContent("apply", {
    page_title: "طلب التمويل",
    page_subtitle: "أدخل بياناتك الشخصية للبدء",
    submit_btn: "التالي",
  });

  const [individualFields, setIndividualFields] = useState<CustomField[]>([]);
  const [businessFields, setBusinessFields] = useState<CustomField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const fetchFields = useCallback((t: ApplicantType) => {
    fetch(`${BASE}/api/custom-fields/${pageKeyFor(t)}`)
      .then(r => r.ok ? r.json() : [])
      .then((d: CustomField[]) => {
        if (t === "individual") setIndividualFields(d);
        else setBusinessFields(d);
      })
      .catch(() => {});
  }, []);

  // جلب الحقول لكلا النوعين عند التحميل
  useEffect(() => {
    fetchFields("individual");
    fetchFields("business");
  }, [fetchFields]);

  // الاستماع لتحديثات الحقول الفورية
  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type === "custom_fields_update") {
        if (msg.pageKey === "apply_individual") setIndividualFields(msg.fields as CustomField[]);
        if (msg.pageKey === "apply_business") setBusinessFields(msg.fields as CustomField[]);
      }
    });
  }, [subscribe]);

  // إعادة تعيين القيم عند تغيير النوع
  const handleTypeChange = (t: ApplicantType) => {
    setType(t);
    setFieldValues({});
  };

  const activeFields = type === "individual" ? individualFields : businessFields;
  const knownKeys = type === "individual" ? INDIVIDUAL_KNOWN_KEYS : BUSINESS_KNOWN_KEYS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    setIsLoading(true);

    try {
      let appId = applicationId;

      if (!appId) {
        const res = await fetch(`${BASE}/api/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, applicantType: type }),
        });
        const data = await res.json();
        appId = data.id;
        setApplicationId(appId!);
      }

      // تصنيف قيم الحقول: معروفة → أعمدة مخصصة، إضافية → extraData
      const patchBody: Record<string, string> = {
        applicantType: type,
        currentStep: "banks",
      };
      const extra: Record<string, string> = {};

      for (const [key, val] of Object.entries(fieldValues)) {
        if (knownKeys.includes(key)) {
          patchBody[key] = val;
        } else {
          extra[key] = val;
        }
      }
      if (Object.keys(extra).length > 0) {
        patchBody.extraData = JSON.stringify(extra);
      }

      await fetch(`${BASE}/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      navigate("/apply/banks");
    } catch (err) {
      console.error("خطأ:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <StepIndicator currentStep={1} />

      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-black mb-2" style={{ color: content.title_color || "var(--color-primary)" }}>{content.page_title}</h1>
        <p className="text-muted-foreground mb-8" style={content.text_color ? { color: content.text_color } : {}}>{content.page_subtitle}</p>

        {/* اختيار النوع */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { type: "individual" as const, label: "تمويل أفراد", icon: <User className="w-6 h-6" /> },
            { type: "business" as const, label: "تمويل أعمال", icon: <Briefcase className="w-6 h-6" /> },
          ].map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => handleTypeChange(option.type)}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 font-bold ${
                type === option.type
                  ? "border-primary bg-primary text-white shadow-lg"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-8 space-y-5">
          {activeFields.length === 0 ? (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">جاري تحميل الحقول...</p>
            </div>
          ) : (
            activeFields.map(field => (
              <DynamicField
                key={`${type}-${field.fieldKey}`}
                field={field}
                value={fieldValues[field.fieldKey] ?? ""}
                onChange={val => setFieldValues(prev => ({ ...prev, [field.fieldKey]: val }))}
              />
            ))
          )}

          <button
            type="submit"
            disabled={isLoading || activeFields.length === 0}
            className="w-full navy-gradient text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronLeft className="w-5 h-5" />}
            {isLoading ? "جاري الحفظ..." : content.submit_btn}
          </button>
        </form>
      </div>
    </div>
  );
}

// الحقول الرقمية التي تستخدم type="tel" لإظهار لوحة الأرقام على الجوال
const NUMERIC_FIELD_KEYS = [
  "nationalId", "phone", "mobile", "commercialRegistration",
  "monthlySalary", "employeeCount", "annualRevenue", "otpCode",
];

function resolveInputType(field: CustomField): string {
  const ft = (field.fieldType || "text").toLowerCase();
  if (ft === "password") return "password";
  if (ft === "email") return "email";
  if (ft === "date") return "date";
  if (ft === "select") return "select";
  if (ft === "tel" || ft === "number") return "tel";
  if (NUMERIC_FIELD_KEYS.includes(field.fieldKey)) return "tel";
  return "text";
}

const inputClass = "w-full border rounded-xl p-3 h-[50px] bg-background text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

function DynamicField({ field, value, onChange }: {
  field: CustomField;
  value: string;
  onChange: (v: string) => void;
}) {
  const isSelect = field.fieldType === "select";
  const inputType = resolveInputType(field);
  const options = field.options ? field.options.split(",").map(o => o.trim()).filter(Boolean) : [];

  return (
    <div>
      <label className="block text-sm font-bold text-foreground mb-2">
        {field.labelAr}
        {field.isRequired && <span className="text-destructive mr-1">*</span>}
      </label>

      {isSelect ? (
        <select
          required={field.isRequired}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">{field.placeholder || `اختر ${field.labelAr}`}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={inputType}
          required={field.isRequired}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || `أدخل ${field.labelAr}`}
          className={inputClass}
          inputMode={inputType === "tel" ? "numeric" : undefined}
        />
      )}
    </div>
  );
}
