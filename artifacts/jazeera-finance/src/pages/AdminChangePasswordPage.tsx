// صفحة تغيير كلمة السر للإدارة
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { KeyRound, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AdminChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError("كلمة المرور الجديدة وتأكيدها غير متطابقين");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/admin/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل في تغيير كلمة المرور");
      } else {
        setSuccess(true);
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-foreground">تغيير كلمة السر</h1>
          <p className="text-muted-foreground text-sm mt-1">غيّر كلمة مرور لوحة الإدارة</p>
        </div>

        <div className="bg-card border rounded-2xl p-8">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-green-800 font-medium">تم تغيير كلمة المرور بنجاح</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2">كلمة المرور الحالية</label>
              <div className="relative">
                <KeyRound className="absolute top-3.5 right-3 w-4 h-4 text-muted-foreground" />
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={form.currentPassword}
                  onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                  className="w-full border rounded-xl pr-10 pl-10 p-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="أدخل كلمة المرور الحالية"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute top-3.5 left-3 text-muted-foreground">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">كلمة المرور الجديدة</label>
              <div className="relative">
                <KeyRound className="absolute top-3.5 right-3 w-4 h-4 text-muted-foreground" />
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={form.newPassword}
                  onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                  className="w-full border rounded-xl pr-10 pl-10 p-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="أدخل كلمة المرور الجديدة"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute top-3.5 left-3 text-muted-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">تأكيد كلمة المرور الجديدة</label>
              <div className="relative">
                <KeyRound className="absolute top-3.5 right-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full border rounded-xl pr-10 p-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full navy-gradient text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
