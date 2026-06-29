// مسارات البنوك - إنشاء، قراءة، تعديل، حذف البنوك
import { Router } from "express";
import { db, banksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateBankBody, UpdateBankBody, GetBankParams, UpdateBankParams, DeleteBankParams } from "@workspace/api-zod";

const router = Router();

// الحصول على قائمة جميع البنوك
router.get("/", async (req, res) => {
  try {
    const banks = await db
      .select()
      .from(banksTable)
      .orderBy(banksTable.sortOrder, banksTable.id);
    res.json(banks);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب قائمة البنوك");
    res.status(500).json({ error: "فشل في جلب البنوك" });
  }
});

// إنشاء بنك جديد
router.post("/", async (req, res) => {
  const parsed = CreateBankBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "بيانات غير صالحة", details: parsed.error });
  }
  try {
    const [bank] = await db.insert(banksTable).values(parsed.data).returning();
    res.status(201).json(bank);
  } catch (err) {
    req.log.error({ err }, "خطأ في إنشاء بنك جديد");
    res.status(500).json({ error: "فشل في إنشاء البنك" });
  }
});

// الحصول على بنك محدد
router.get("/:id", async (req, res) => {
  const params = GetBankParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "معرف غير صالح" });
  try {
    const [bank] = await db.select().from(banksTable).where(eq(banksTable.id, params.data.id));
    if (!bank) return res.status(404).json({ error: "البنك غير موجود" });
    res.json(bank);
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب البنك");
    res.status(500).json({ error: "فشل في جلب البنك" });
  }
});

// تعديل بيانات بنك
router.patch("/:id", async (req, res) => {
  const params = UpdateBankParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "معرف غير صالح" });
  const parsed = UpdateBankBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صالحة" });
  try {
    const [bank] = await db
      .update(banksTable)
      .set(parsed.data)
      .where(eq(banksTable.id, params.data.id))
      .returning();
    if (!bank) return res.status(404).json({ error: "البنك غير موجود" });
    res.json(bank);
  } catch (err) {
    req.log.error({ err }, "خطأ في تعديل البنك");
    res.status(500).json({ error: "فشل في تعديل البنك" });
  }
});

// حذف بنك
router.delete("/:id", async (req, res) => {
  const params = DeleteBankParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "معرف غير صالح" });
  try {
    await db.delete(banksTable).where(eq(banksTable.id, params.data.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "خطأ في حذف البنك");
    res.status(500).json({ error: "فشل في حذف البنك" });
  }
});

export default router;
