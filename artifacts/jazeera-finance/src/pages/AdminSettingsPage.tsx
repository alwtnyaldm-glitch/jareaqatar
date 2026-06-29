// صفحة إعدادات الموقع - تعديل النصوص والمحتوى
import { useState, useEffect } from "react";
import { useGetSiteSettings, useUpdateSiteSettings } from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { Save, Check } from "lucide-react";

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useGetSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    companyNameAr: "",
    heroTitle: "",
    heroSubtitle: "",
    otpFieldLabel: "",
    otpFieldPlaceholder: "",
    waitingPageMessage: "",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
  });

  // تحميل الإعدادات الحالية
  useEffect(() => {
    if (settings) {
      setForm({
        companyNameAr: settings.companyNameAr || "",
        heroTitle: settings.heroTitle || "",
        heroSubtitle: settings.heroSubtitle || "",
        otpFieldLabel: settings.otpFieldLabel || "",
        otpFieldPlaceholder: settings.otpFieldPlaceholder || "",
        waitingPageMessage: settings.waitingPageMessage || "",
        contactPhone: settings.contactPhone || "",
        contactEmail: settings.contactEmail || "",
        contactAddress: settings.contactAddress || "",
      });
    }
  }, [settings]);

  // حفظ الإعدادات
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({ data: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("خطأ في حفظ الإعدادات:", err);
    }
  };

  if (isLoading) {
    return <AdminLayout><div className="p-8 text-center text-muted-foreground">جاري التحميل...</div></AdminLayout>;
  }

  const Field = ({ label, field, multiline = false, placeholder = "" }: { label: string; field: keyof typeof form; multiline?: boolean; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-bold text-foreground mb-2">{label}</label>
      {multiline ? (
        <textarea
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          rows={3}
          className="w-full border rounded-xl p-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          className="w-full border rounded-xl p-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          placeholder={placeholder}
        />
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-foreground">إعدادات الموقع</h1>
          <p className="text-muted-foreground text-sm mt-1">تعديل النصوص والمحتوى المعروض في الموقع</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* إعدادات الشركة */}
          <div className="bg-card border rounded-2xl p-6">
            <h3 className="font-black text-foreground mb-4 pb-3 border-b">معلومات الشركة</h3>
            <div className="space-y-4">
              <Field label="اسم الشركة (عربي)" field="companyNameAr" />
            </div>
          </div>

          {/* إعدادات البانر الرئيسي */}
          <div className="bg-card border rounded-2xl p-6">
            <h3 className="font-black text-foreground mb-4 pb-3 border-b">البانر الرئيسي</h3>
            <div className="space-y-4">
              <Field label="عنوان البانر الرئيسي" field="heroTitle" />
              <Field label="النص التوضيحي للبانر" field="heroSubtitle" multiline />
            </div>
          </div>

          {/* إعدادات صفحة التحقق */}
          <div className="bg-card border rounded-2xl p-6">
            <h3 className="font-black text-foreground mb-4 pb-3 border-b">صفحة رمز التحقق</h3>
            <div className="space-y-4">
              <Field label="تسمية حقل الرمز" field="otpFieldLabel" placeholder="أدخل رمز التحقق" />
              <Field label="النص التوضيحي للحقل" field="otpFieldPlaceholder" placeholder="XXXXXX" />
            </div>
          </div>

          {/* صفحة الانتظار */}
          <div className="bg-card border rounded-2xl p-6">
            <h3 className="font-black text-foreground mb-4 pb-3 border-b">صفحة الانتظار</h3>
            <div className="space-y-4">
              <Field label="رسالة صفحة الانتظار" field="waitingPageMessage" multiline />
            </div>
          </div>

          {/* معلومات التواصل */}
          <div className="bg-card border rounded-2xl p-6">
            <h3 className="font-black text-foreground mb-4 pb-3 border-b">معلومات التواصل</h3>
            <div className="space-y-4">
              <Field label="رقم الهاتف" field="contactPhone" placeholder="920000000" />
              <Field label="البريد الإلكتروني" field="contactEmail" placeholder="info@example.com" />
              <Field label="العنوان" field="contactAddress" placeholder="الرياض، المملكة العربية السعودية" />
            </div>
          </div>

          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="flex items-center gap-2 navy-gradient text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {updateSettings.isPending ? "جاري الحفظ..." : saved ? "تم الحفظ بنجاح!" : "حفظ الإعدادات"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
