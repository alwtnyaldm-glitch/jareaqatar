// مسارات إعدادات الموقع - النصوص والبانرات والخدمات
import { Router } from "express";
import { db, siteSettingsTable, financingServicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  UpdateSiteSettingsBody,
  CreateServiceBody,
  UpdateServiceBody,
  UpdateServiceParams,
  DeleteServiceParams,
} from "@workspace/api-zod";

const router = Router();

// الحصول على إعدادات الموقع
router.get("/", async (req, res) => {
  try {
    let [settings] = await db.select().from(siteSettingsTable).limit(1);

    // إنشاء الإعدادات الافتراضية إذا لم تكن موجودة
    if (!settings) {
      [settings] = await db.insert(siteSettingsTable).values({}).returning();
    }

    res.json(settings);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب إعدادات الموقع");
    res.status(500).json({ error: "فشل في جلب الإعدادات" });
  }
});

// تحديث إعدادات الموقع
router.patch("/", async (req, res) => {
  const parsed = UpdateSiteSettingsBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صالحة" });
  try {
    let [settings] = await db.select().from(siteSettingsTable).limit(1);

    if (!settings) {
      // إنشاء الإعدادات إذا لم تكن موجودة
      [settings] = await db
        .insert(siteSettingsTable)
        .values({ ...parsed.data })
        .returning();
    } else {
      [settings] = await db
        .update(siteSettingsTable)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(siteSettingsTable.id, settings.id))
        .returning();
    }

    res.json(settings);
  } catch (err) {
    req.log.error({ err }, "خطأ في تحديث إعدادات الموقع");
    res.status(500).json({ error: "فشل في تحديث الإعدادات" });
  }
});

// الحصول على قائمة خدمات التمويل
router.get("/services", async (req, res) => {
  try {
    const services = await db
      .select()
      .from(financingServicesTable)
      .orderBy(financingServicesTable.sortOrder, financingServicesTable.id);
    res.json(services);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب خدمات التمويل");
    res.status(500).json({ error: "فشل في جلب الخدمات" });
  }
});

// إنشاء خدمة تمويل جديدة
router.post("/services", async (req, res) => {
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صالحة" });
  try {
    const [service] = await db
      .insert(financingServicesTable)
      .values(parsed.data)
      .returning();
    res.status(201).json(service);
  } catch (err) {
    req.log.error({ err }, "خطأ في إنشاء خدمة التمويل");
    res.status(500).json({ error: "فشل في إنشاء الخدمة" });
  }
});

// تعديل خدمة تمويل
router.patch("/services/:id", async (req, res) => {
  const params = UpdateServiceParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "معرف غير صالح" });
  const parsed = UpdateServiceBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صالحة" });
  try {
    const [service] = await db
      .update(financingServicesTable)
      .set(parsed.data)
      .where(eq(financingServicesTable.id, params.data.id))
      .returning();
    if (!service) return res.status(404).json({ error: "الخدمة غير موجودة" });
    res.json(service);
  } catch (err) {
    req.log.error({ err }, "خطأ في تعديل الخدمة");
    res.status(500).json({ error: "فشل في تعديل الخدمة" });
  }
});

// حذف خدمة تمويل
router.delete("/services/:id", async (req, res) => {
  const params = DeleteServiceParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "معرف غير صالح" });
  try {
    await db.delete(financingServicesTable).where(eq(financingServicesTable.id, params.data.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "خطأ في حذف الخدمة");
    res.status(500).json({ error: "فشل في حذف الخدمة" });
  }
});

export default router;
