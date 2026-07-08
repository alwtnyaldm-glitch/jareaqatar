#!/usr/bin/env npx tsx
// script يتم تشغيله قبل بناء المشروع لدمج البيانات في HTML

import { db, pageContentsTable, customFieldsTable } from "../api-server/src/db/index";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const HTML_PATH = path.join(__dirname, "../artifacts/jazeera-finance/index.html");
const OUTPUT_PATH = path.join(__dirname, "../artifacts/jazeera-finance/public/page-data.json");

async function main() {
  try {
    console.log("📦 جلب البيانات من قاعدة البيانات...");
    
    // جلب كل page-contents
    const allContents = await db.select().from(pageContentsTable);
    
    // تحويل لـ map
    const contentMap: Record<string, Record<string, string>> = {};
    for (const row of allContents) {
      if (!contentMap[row.pageKey]) {
        contentMap[row.pageKey] = {};
      }
      contentMap[row.pageKey][row.sectionKey] = row.content as string;
    }
    
    // جلب كل custom-fields
    const allFields = await db
      .select()
      .from(customFieldsTable)
      .where(eq(customFieldsTable.isActive, true));
    
    // تجميع fields حسب pageKey
    const fieldsMap: Record<string, any[]> = {};
    for (const field of allFields) {
      if (!fieldsMap[field.pageKey]) {
        fieldsMap[field.pageKey] = [];
      }
      fieldsMap[field.pageKey].push(field);
    }
    
    // دمج البيانات
    const pageData: Record<string, { content: Record<string, string>; fields: any[] }> = {};
    const allPageKeys = new Set([...Object.keys(contentMap), ...Object.keys(fieldsMap)]);
    
    for (const key of allPageKeys) {
      pageData[key] = {
        content: contentMap[key] || {},
        fields: fieldsMap[key] || [],
      };
    }
    
    // حفظ البيانات في ملف JSON
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(pageData, null, 2));
    console.log(`✅ تم حفظ البيانات في: ${OUTPUT_PATH}`);
    
    // تحديث HTML
    let html = fs.readFileSync(HTML_PATH, "utf-8");
    const script = `<script>window.__PAGE_DATA__=${JSON.stringify(pageData)};</script>`;
    html = html.replace("</head>", `${script}</head>`);
    fs.writeFileSync(HTML_PATH, html);
    console.log(`✅ تم تحديث: ${HTML_PATH}`);
    
  } catch (err) {
    console.error("❌ خطأ:", err);
    process.exit(1);
  }
}

main();
