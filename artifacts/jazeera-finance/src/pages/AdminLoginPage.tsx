// صفحة تسجيل دخول المدير
import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin, useGetAdminMe } from "@workspace/api-client-react";
import { Building2, Lock, User, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const login = useAdminLogin();

  // التحقق من وجود جلسة إدارية نشطة
  useGetAdminMe({
    query: {
      retry: false,
      staleTime: 0,
    },
  });

  // تسجيل دخول المدير
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login.mutateAsync({ data: { username, password } });
      navigate("/admin/dashboard");
    } catch {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <div
      className="min-h-screen hero-gradient flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">
            الجزيرة للتمويل
          </h1>
          <p className="text-white/60 text-sm">لوحة التحكم الإدارية</p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <div className="bg-card rounded-3xl shadow-2xl p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-black text-foreground">
              تسجيل دخول المدير
            </h2>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                اسم المستخدم
              </label>
              <div className="relative">
                <User className="absolute top-3.5 right-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border rounded-xl pr-10 p-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="أدخل اسم المستخدم"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute top-3.5 right-3 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-xl pr-10 pl-10 p-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="أدخل كلمة المرور"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute top-3.5 left-3 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full navy-gradient text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {login.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            admin / يجب ادخال كلمة المرور بشكل صحيح للدخول
          </p>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            العودة للموقع الرئيسي
          </a>
        </div>
      </div>
    </div>
  );
}
