// الصفحة الرئيسية - واجهة الموقع للزوار
import { useListServices, useGetSiteSettings } from "@workspace/api-client-react";
import { Building2, Car, Home, Ship, Briefcase, CheckCircle, Clock, TrendingDown, HeadphonesIcon, ChevronDown, Phone, Mail, MapPin } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageContent } from "@/hooks/usePageContent";

const serviceIcons: Record<string, React.ReactNode> = {
  personal: <Building2 className="w-10 h-10" />,
  "real-estate": <Home className="w-10 h-10" />,
  auto: <Car className="w-10 h-10" />,
  yacht: <Ship className="w-10 h-10" />,
  business: <Briefcase className="w-10 h-10" />,
};

const defaultServices = [
  { id: 1, titleAr: "تمويل شخصي", descriptionAr: "حلول تمويلية مرنة للأفراد بأسعار تنافسية وإجراءات بسيطة", financingType: "personal", isActive: true },
  { id: 2, titleAr: "تمويل عقاري", descriptionAr: "امتلك منزل أحلامك بتمويل عقاري ميسّر بأرباح تنافسية وفترات سداد طويلة", financingType: "real-estate", isActive: true },
  { id: 3, titleAr: "تمويل سيارات", descriptionAr: "تمويل سيارتك الجديدة أو المستعملة بأفضل الشروط والأسعار", financingType: "auto", isActive: true },
  { id: 4, titleAr: "تمويل يخوت", descriptionAr: "حلول تمويلية متخصصة للقوارب واليخوت الفاخرة", financingType: "yacht", isActive: true },
  { id: 5, titleAr: "تمويل أعمال", descriptionAr: "دعم مالي متكامل لتوسيع أعمالك وتطوير شركتك نحو النجاح", financingType: "business", isActive: true },
];

export default function HomePage() {
  const { data: services } = useListServices();
  const { data: settings } = useGetSiteSettings();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const home = usePageContent("home");
  const svcContent = usePageContent("home_services");
  const whyUs = usePageContent("home_why_us");
  const faqContent = usePageContent("home_faq");
  const contactContent = usePageContent("home_contact");
  const cta = usePageContent("home_cta");
  const colors = usePageContent("site_colors");

  const accentColor  = colors.accent_color  || "#c8a84b";
  const primaryColor = colors.primary_color || "#1e3a5f";

  const displayServices = (services && services.length > 0 ? services.filter(s => s.isActive) : defaultServices);

  const faqs = [
    { q: faqContent.q1 || "كيف أتقدم للحصول على تمويل؟", a: faqContent.a1 || "اضغط على زر 'قدّم الآن' واتبع الخطوات البسيطة لتعبئة نموذج الطلب. ستصلك الموافقة خلال 24 ساعة." },
    { q: faqContent.q2 || "ما هي الوثائق المطلوبة للتمويل الشخصي؟", a: faqContent.a2 || "تحتاج إلى: الهوية الوطنية، كشف راتب آخر 3 أشهر، إثبات العمل، وأي وثائق إضافية حسب نوع التمويل." },
    { q: faqContent.q3 || "ما هي أقصى مدة للسداد؟", a: faqContent.a3 || "تتراوح مدة السداد بين سنة و30 سنة حسب نوع التمويل والمبلغ المطلوب." },
    { q: faqContent.q4 || "هل يمكن التقديم أون لاين؟", a: faqContent.a4 || "نعم، يمكنك التقديم بالكامل عبر الموقع الإلكتروني في أي وقت وأي مكان." },
    { q: faqContent.q5 || "ما هي أقل وأعلى مبالغ التمويل المتاحة؟", a: faqContent.a5 || "تبدأ مبالغ التمويل من 10,000 ريال وقد تصل إلى 10 ملايين ريال حسب نوع التمويل وقدرة المتقدم." },
  ];

  const features = [
    { icon: <CheckCircle className="w-10 h-10" />, title: whyUs.feature_1_title || "موافقة سريعة", desc: whyUs.feature_1_desc || "نضمن الرد على طلبك خلال 24 ساعة عمل" },
    { icon: <TrendingDown className="w-10 h-10" />, title: whyUs.feature_2_title || "أرباح تنافسية", desc: whyUs.feature_2_desc || "أقل أسعار الفائدة في السوق السعودي" },
    { icon: <Clock className="w-10 h-10" />, title: whyUs.feature_3_title || "حلول مرنة", desc: whyUs.feature_3_desc || "خطط سداد مرنة تناسب احتياجاتك" },
    { icon: <HeadphonesIcon className="w-10 h-10" />, title: whyUs.feature_4_title || "دعم 24 ساعة", desc: whyUs.feature_4_desc || "فريق دعم متخصص على مدار الساعة" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      {/* قسم البانر الرئيسي */}
      <section className="hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full border-2 border-white/30" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-white/15" />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-36 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block bg-accent/20 border border-accent/40 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              {home.hero_badge || "الشريك المالي الموثوق في المملكة"}
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6" style={home.title_color ? { color: home.title_color } : {}}>
              {settings?.heroTitle || home.hero_title || "حلول تمويلية متكاملة لتحقيق أهدافك"}
            </h1>
            <p className="text-xl md:text-2xl mb-10 leading-relaxed" style={{ color: home.text_color || "rgba(255,255,255,0.8)" }}>
              {settings?.heroSubtitle || home.hero_subtitle || "نقدم لك أفضل خيارات التمويل بأرباح تنافسية وشروط مرنة مع أسرع إجراءات الموافقة"}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/apply"
                className="btn-gold px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 inline-block"
              >
                {home.hero_cta || "قدّم الآن"}
              </a>
              <a
                href="#services"
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 inline-block"
              >
                اكتشف خدماتنا
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-background" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* قسم الخدمات */}
      <section id="services" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: svcContent.title_color || primaryColor }}>
              {svcContent.section_title || "خدماتنا التمويلية"}
            </h2>
            <p className="text-lg max-w-xl mx-auto text-muted-foreground" style={svcContent.text_color ? { color: svcContent.text_color } : {}}>
              {svcContent.section_subtitle || "نوفر مجموعة شاملة من حلول التمويل المصممة لتلبية احتياجاتك"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayServices.map((service) => (
              <div key={service.id} className="card-hover bg-card border rounded-2xl p-8 group cursor-pointer" onClick={() => window.location.href = '/apply'}>
                <div className="w-16 h-16 navy-gradient rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  {serviceIcons[service.financingType] || <Building2 className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{service.titleAr}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{service.descriptionAr}</p>
                <a href="/apply" className="inline-flex items-center gap-2 text-primary font-bold hover:text-accent transition-colors">
                  {svcContent.apply_btn_text || "قدّم الآن"}
                  <span className="text-lg">←</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم المميزات */}
      <section className="py-20 text-white" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}ee 100%)` }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: whyUs.title_color || "white" }}>
              {whyUs.section_title || "لماذا الجزيرة للتمويل؟"}
            </h2>
            <p className="text-lg" style={{ color: whyUs.text_color || "rgba(255,255,255,0.7)" }}>
              {whyUs.section_subtitle || "نتميز بتقديم أفضل الخدمات التمويلية بأعلى معايير الجودة"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((item, i) => (
              <div key={i} className="text-center group">
                <div
                  className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300"
                  style={{ color: accentColor }}
                >
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: whyUs.title_color || "white" }}>{item.title}</h3>
                <p className="leading-relaxed" style={{ color: whyUs.text_color || "rgba(255,255,255,0.7)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم الأسئلة الشائعة */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: faqContent.title_color || primaryColor }}>
              {faqContent.section_title || "الأسئلة الشائعة"}
            </h2>
            <p className="text-lg text-muted-foreground" style={faqContent.text_color ? { color: faqContent.text_color } : {}}>
              {faqContent.section_subtitle || "إجابات على أكثر الأسئلة شيوعاً"}
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card border rounded-xl overflow-hidden">
                <button
                  className="w-full flex justify-between items-center p-6 text-right font-bold text-foreground hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 leading-relaxed border-t pt-4 text-muted-foreground" style={faqContent.text_color ? { color: faqContent.text_color } : {}}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم التواصل */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: contactContent.title_color || primaryColor }}>
              {contactContent.section_title || "تواصل معنا"}
            </h2>
            <p className="text-lg text-muted-foreground" style={contactContent.text_color ? { color: contactContent.text_color } : {}}>
              {contactContent.section_subtitle || "نحن هنا للإجابة على جميع استفساراتك"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: <Phone className="w-6 h-6" />, title: contactContent.phone_title || "الهاتف", value: settings?.contactPhone || "920000000" },
              { icon: <Mail className="w-6 h-6" />, title: contactContent.email_title || "البريد الإلكتروني", value: settings?.contactEmail || "info@aljazeera-finance.com" },
              { icon: <MapPin className="w-6 h-6" />, title: contactContent.address_title || "العنوان", value: settings?.contactAddress || "الرياض، المملكة العربية السعودية" },
            ].map((item, i) => (
              <div key={i} className="bg-card border rounded-xl p-6 text-center card-hover">
                <div className="w-12 h-12 navy-gradient rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)` }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4" style={{ color: cta.title_color || primaryColor }}>
            {cta.title || "هل أنت مستعد للبدء؟"}
          </h2>
          <p className="text-lg mb-8" style={{ color: cta.text_color || `${primaryColor}bb` }}>
            {cta.subtitle || "تقدم الآن واحصل على موافقة مبدئية خلال 24 ساعة"}
          </p>
          <a
            href="/apply"
            className="px-10 py-4 rounded-xl text-lg font-bold hover:opacity-90 transition-opacity inline-block text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {cta.button_text || "تقدم الآن"}
          </a>
        </div>
      </section>

      <Footer settings={settings} />
    </div>
  );
}
