// endpoint يجمع page-contents و custom-fields في طلب واحد
import { Router } from "express";
import { db, pageContentsTable, customFieldsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/:pageKey", async (req, res) => {
  const { pageKey } = req.params;
  try {
    // جلب page-contents
    const contents = await db
      .select()
      .from(pageContentsTable)
      .where(eq(pageContentsTable.pageKey, pageKey));

    // تحويل لـ object
    const contentMap: Record<string, string> = {};
    for (const row of contents) {
      contentMap[row.sectionKey] = row.content as string;
    }

    // جلب custom-fields
    const fields = await db
      .select()
      .from(customFieldsTable)
      .where(and(eq(customFieldsTable.pageKey, pageKey), eq(customFieldsTable.isActive, true)))
      .orderBy(customFieldsTable.sortOrder, customFieldsTable.id);

    res.json({
      content: contentMap,
      fields: fields,
    });
  } catch (err) {
    req.log.error({ err }, "خطأ في جلب بيانات الصفحة");
    res.status(500).json({ error: "فشل في جلب البيانات" });
  }
});

export default router;
