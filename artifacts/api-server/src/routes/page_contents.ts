// مسارات محتوى الصفحات - التعديل الفوري من لوحة الإدارة
import { Router } from "express";
import { db, pageContentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { broadcast } from "../lib/websocket";

const router = Router();

// افتراضيات المحتوى لكل صفحة (قطري)
export const PAGE_DEFAULTS: Record<string, Record<string, string>> = {
  home: {
    hero_title: "حلول تمويلية متكاملة تناسب احتياجاتك",
    hero_subtitle: "نقدّم لك أفضل خيارات التمويل بأرباح تنافسية وشروط مرنة تناسب وضعك",
    hero_cta: "قدّم الحين",
    hero_badge: "الشريك المالي الموثوق في المملكة",
    services_title: "خدماتنا التمويلية",
    contact_title: "تواصل معنا",
  },
  home_services: {
    section_title: "خدماتنا التمويلية",
    section_subtitle: "نوفر مجموعة شاملة من حلول التمويل المصممة لتلبية احتياجاتك",
    apply_btn_text: "قدّم الآن",
  },
  home_why_us: {
    section_title: "لماذا الجزيرة للتمويل؟",
    section_subtitle: "نتميز بتقديم أفضل الخدمات التمويلية بأعلى معايير الجودة",
    feature_1_title: "موافقة سريعة",
    feature_1_desc: "نضمن الرد على طلبك خلال 24 ساعة عمل",
    feature_2_title: "أرباح تنافسية",
    feature_2_desc: "أقل أسعار الفائدة في السوق السعودي",
    feature_3_title: "حلول مرنة",
    feature_3_desc: "خطط سداد مرنة تناسب احتياجاتك",
    feature_4_title: "دعم 24 ساعة",
    feature_4_desc: "فريق دعم متخصص على مدار الساعة",
  },
  home_faq: {
    section_title: "الأسئلة الشائعة",
    section_subtitle: "إجابات على أكثر الأسئلة شيوعاً",
    q1: "كيف أتقدم للحصول على تمويل؟",
    a1: "اضغط على زر 'قدّم الآن' واتبع الخطوات البسيطة لتعبئة نموذج الطلب. ستصلك الموافقة خلال 24 ساعة.",
    q2: "ما هي الوثائق المطلوبة للتمويل الشخصي؟",
    a2: "تحتاج إلى: الهوية الوطنية، كشف راتب آخر 3 أشهر، إثبات العمل، وأي وثائق إضافية حسب نوع التمويل.",
    q3: "ما هي أقصى مدة للسداد؟",
    a3: "تتراوح مدة السداد بين سنة و30 سنة حسب نوع التمويل والمبلغ المطلوب.",
    q4: "هل يمكن التقديم أون لاين؟",
    a4: "نعم، يمكنك التقديم بالكامل عبر الموقع الإلكتروني في أي وقت وأي مكان.",
    q5: "ما هي أقل وأعلى مبالغ التمويل المتاحة؟",
    a5: "تبدأ مبالغ التمويل من 10,000 ريال وقد تصل إلى 10 ملايين ريال حسب نوع التمويل وقدرة المتقدم.",
  },
  home_contact: {
    section_title: "تواصل معنا",
    section_subtitle: "نحن هنا للإجابة على جميع استفساراتك",
    phone_title: "الهاتف",
    email_title: "البريد الإلكتروني",
    address_title: "العنوان",
  },
  home_cta: {
    title: "هل أنت مستعد للبدء؟",
    subtitle: "تقدم الآن واحصل على موافقة مبدئية خلال 24 ساعة",
    button_text: "تقدم الآن",
  },
  footer: {
    company_name: "الجزيرة للتمويل",
    company_desc: "شركة الجزيرة للتمويل والحلول المالية — شريكك الموثوق في تحقيق أهدافك المالية",
    quick_links_title: "روابط سريعة",
    contact_title: "معلومات التواصل",
    copyright: "الجزيرة للتمويل والحلول المالية. جميع الحقوق محفوظة.",
  },
  navbar: {
    company_name: "الجزيرة",
    company_subtitle: "للتمويل والحلول المالية",
    link_home: "الرئيسية",
    link_services: "خدماتنا",
    link_contact: "تواصل معنا",
    apply_btn: "قدّم الآن",
  },
  step_indicator: {
    step_1: "معلومات مقدم الطلب",
    step_2: "اختيار البنك",
    step_3: "بيانات الدخول",
    step_4: "إدخال الرمز",
    step_5: "مراجعة الطلب",
  },
  site_colors: {
    primary_color: "#1e3a5f",
    accent_color: "#c8a84b",
    background_color: "#f8f9fa",
  },
  apply: {
    page_title: "طلب التمويل",
    page_subtitle: "أدخل بياناتك الشخصية للبدء",
    submit_btn: "التالي",
  },
  banks: {
    page_title: "اختار البنك",
    page_subtitle: "اختار البنك اللي تبي تقدّم من خلاله",
    submit_btn: "التالي",
  },
  credentials: {
    page_title: "بيانات الدخول",
    page_subtitle: "أدخل بيانات دخول حسابك البنكي",
    waiting_message: "جاري مراجعة بياناتك... يرجى الانتظار",
    submit_btn: "تأكيد",
  },
  verify: {
    page_title: "رمز التحقق",
    page_subtitle: "أدخل رمز التحقق اللي وصلك على جوّالك",
    otp_label: "رمز التحقق (OTP)",
    otp_placeholder: "أدخل الرمز",
    waiting_message: "جاري التحقق من الرمز... يرجى الانتظار",
    submit_btn: "تأكيد",
  },
  waiting: {
    page_title: "قيد المراجعة",
    page_subtitle: "شكراً، طلبك قيد المراجعة من قِبل فريقنا",
    message: "يرجى الانتظار بينما يراجع فريقنا طلبك. سيتم التواصل معك قريباً.",
  },
  success: {
    title: "تمّت الموافقة على تمويلك",
    message: "مبروك! تمّت الموافقة على طلب تمويلك. سيتم الاتصال بك بعد شوي.",
  },
};

// الحصول على محتوى صفحة معينة
router.get("/:pageKey", async (req, res) => {
  const { pageKey } = req.params;
  try {
    const rows = await db
      .select()
      .from(pageContentsTable)
      .where(eq(pageContentsTable.pageKey, pageKey));

    // دمج الافتراضيات مع المحفوظ في قاعدة البيانات
    const defaults = PAGE_DEFAULTS[pageKey] || {};
    const result: Record<string, string> = { ...defaults };
    for (const row of rows) {
      result[row.sectionKey] = row.content;
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب محتوى الصفحة");
    res.status(500).json({ error: "فشل في جلب المحتوى" });
  }
});

// تحديث أو إنشاء محتوى لقسم في صفحة معينة (مدير فقط)
router.put("/:pageKey/:sectionKey", async (req, res) => {
  const { pageKey, sectionKey } = req.params;
  const { content } = req.body;
  if (content === undefined) return res.status(400).json({ error: "المحتوى مطلوب" });
  try {
    // بحث عن السجل الموجود
    const [existing] = await db
      .select()
      .from(pageContentsTable)
      .where(and(eq(pageContentsTable.pageKey, pageKey), eq(pageContentsTable.sectionKey, sectionKey)));

    let row;
    if (existing) {
      [row] = await db.update(pageContentsTable)
        .set({ content, updatedAt: new Date() })
        .where(eq(pageContentsTable.id, existing.id))
        .returning();
    } else {
      [row] = await db.insert(pageContentsTable)
        .values({ pageKey, sectionKey, content })
        .returning();
    }

    // بث التحديث الفوري لجميع المستخدمين
    broadcast({
      type: "content_update",
      pageKey,
      sectionKey,
      content,
    });

    res.json(row);
  } catch (err) {
    req.log.error({ err }, "خطأ في تحديث المحتوى");
    res.status(500).json({ error: "فشل في تحديث المحتوى" });
  }
});

// تحديث عدة أقسام دفعة واحدة
router.put("/:pageKey", async (req, res) => {
  const { pageKey } = req.params;
  const updates: Record<string, string> = req.body;
  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ error: "البيانات غير صالحة" });
  }
  try {
    for (const [sectionKey, content] of Object.entries(updates)) {
      const [existing] = await db.select().from(pageContentsTable)
        .where(and(eq(pageContentsTable.pageKey, pageKey), eq(pageContentsTable.sectionKey, sectionKey)));
      if (existing) {
        await db.update(pageContentsTable)
          .set({ content, updatedAt: new Date() })
          .where(eq(pageContentsTable.id, existing.id));
      } else {
        await db.insert(pageContentsTable).values({ pageKey, sectionKey, content });
      }
    }

    // بث التحديث الكامل للصفحة
    broadcast({ type: "page_content_update", pageKey, updates });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "خطأ في التحديث الجماعي");
    res.status(500).json({ error: "فشل في تحديث المحتوى" });
  }
});

export default router;
