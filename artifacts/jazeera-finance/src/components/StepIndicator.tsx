// مؤشر خطوات التقديم - يدعم الجوال وقابل للتخصيص من لوحة الإدارة
import { usePageContent } from "@/hooks/usePageContent";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const DEFAULT_STEPS = [
  "معلومات مقدم الطلب",
  "اختيار البنك",
  "بيانات الدخول",
  "إدخال الرمز",
  "مراجعة الطلب",
];

export default function StepIndicator({ currentStep, totalSteps = 5 }: StepIndicatorProps) {
  const content = usePageContent("step_indicator");

  const steps = DEFAULT_STEPS.map((def, i) => content[`step_${i + 1}`] || def);

  return (
    <div className="bg-card border-b py-3" dir="rtl">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between">
          {steps.slice(0, totalSteps).map((step, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            return (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                    isCompleted ? "bg-green-500 text-white" :
                    isActive ? "bg-primary text-white shadow-lg ring-2 ring-primary/30" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? "✓" : stepNum}
                  </div>
                  <span className={`hidden sm:block text-xs mt-1 text-center whitespace-nowrap ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground"
                  }`}>
                    {step}
                  </span>
                  <span className={`sm:hidden text-[9px] mt-0.5 text-center leading-tight line-clamp-2 max-w-[52px] ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground"
                  }`}>
                    {step}
                  </span>
                </div>
                {i < totalSteps - 1 && (
                  <div className={`h-0.5 w-3 sm:w-8 flex-shrink-0 mx-0.5 mb-4 sm:mb-5 transition-colors duration-300 ${
                    stepNum < currentStep ? "bg-green-500" : "bg-muted"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
