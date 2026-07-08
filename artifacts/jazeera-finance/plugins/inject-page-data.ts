// Vite plugin لدمج page-contents و custom-fields في HTML
import type { Plugin } from "vite";
import { db, pageContentsTable, customFieldsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { eq as sqlEq } from "drizzle-orm";

export function injectPageDataPlugin(): Plugin {
  return {
    name: "inject-page-data",
    
    // هذا يعمل فقط في build mode
    apply: "build",
    
    async transformIndexHtml(html: string) {
      try {
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
        
        // إضافة script في HTML
        const script = `<script>window.__PAGE_DATA__=${JSON.stringify(pageData)};</script>`;
        
        return html.replace("</head>", `${script}</head>`);
      } catch (err) {
        console.error("inject-page-data plugin error:", err);
        return html;
      }
    },
  };
}
