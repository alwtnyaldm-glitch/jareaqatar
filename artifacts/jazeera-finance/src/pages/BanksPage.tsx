// صفحة اختيار البنك - الخطوة الثانية
import { useLocation } from "wouter";
import { useListBanks, useUpdateApplication } from "@workspace/api-client-react";
import { useSession } from "@/context/SessionContext";
import { usePageContent } from "@/hooks/usePageContent";
import StepIndicator from "@/components/StepIndicator";
import Navbar from "@/components/Navbar";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const bankColors = [
  "bg-blue-600", "bg-green-600", "bg-purple-600", "bg-red-600",
  "bg-orange-600", "bg-teal-600", "bg-indigo-600", "bg-pink-600",
  "bg-emerald-600", "bg-cyan-600", "bg-violet-600", "bg-rose-600",
  "bg-amber-600",
];

export default function BanksPage() {
  const [, navigate] = useLocation();
  const { applicationId, setSelectedBank } = useSession();
  const { data: banks, isLoading } = useListBanks();
  const updateApp = useUpdateApplication();
  const [loadingBankId, setLoadingBankId] = useState<number | null>(null);
  const content = usePageContent("banks", { page_title: "اختر البنك", page_subtitle: "اختر البنك الذي تريد التقديم عبره" });

  // النقر على البنك يحفظه وينتقل فوراً
  const handleBankClick = async (bankId: number, bankNameAr: string, bankLogo?: string | null) => {
    if (!applicationId || loadingBankId !== null) return;
    setLoadingBankId(bankId);
    try {
      await updateApp.mutateAsync({
        id: applicationId,
        data: { bankId, bankName: bankNameAr, bankLogo: bankLogo || null, currentStep: "credentials" }
      });
      setSelectedBank(bankId);
      navigate("/apply/credentials");
    } catch (err) {
      console.error("خطأ في حفظ اختيار البنك:", err);
      setLoadingBankId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <StepIndicator currentStep={2} />

      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-black mb-2 text-center" style={{ color: content.title_color || "var(--color-primary)" }}>
          {content.page_title || "اختر البنك"}
        </h1>
        <p className="text-muted-foreground mb-8 text-center" style={content.text_color ? { color: content.text_color } : {}}>
          {content.page_subtitle || "اختر البنك الذي تريد التقديم عبره"}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(banks || []).filter(b => b.isActive).map((bank, i) => (
              <button
                key={bank.id}
                onClick={() => handleBankClick(bank.id, bank.nameAr, bank.logoUrl)}
                disabled={loadingBankId !== null}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg flex flex-col items-center gap-3 ${
                  loadingBankId === bank.id
                    ? "border-primary bg-primary/10 shadow-lg scale-95"
                    : "border-border bg-card hover:border-primary/60 hover:scale-[1.03]"
                } disabled:cursor-wait`}
              >
                {loadingBankId === bank.id && (
                  <div className="absolute inset-0 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  </div>
                )}
                {bank.logoUrl ? (
                  <img src={bank.logoUrl} alt={bank.nameAr} className="w-16 h-12 object-contain" />
                ) : (
                  <div className={`w-14 h-14 ${bankColors[i % bankColors.length]} rounded-xl flex items-center justify-center text-white font-black text-xl`}>
                    {bank.nameAr.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-bold text-center text-foreground">{bank.nameAr}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
