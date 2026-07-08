// hook لجلب الحقول المخصصة وتحديثها فورياً من الـ WebSocket
import { useEffect, useState } from "react";
import { useWebSocket } from "@/context/WebSocketContext";

interface CustomField {
  id: number;
  pageKey: string;
  fieldKey: string;
  labelAr: string;
  fieldType: string;
  placeholder: string;
  options: string;
  isRequired: boolean;
  sortOrder: number;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function useCustomFields(pageKey: string, defaultFields: CustomField[] = []): CustomField[] {
  const [fields, setFields] = useState<CustomField[]>(() => {
    // محاولة قراءة البيانات من المتغيرات العالمية أولاً
    if (typeof window !== "undefined" && window.__PAGE_DATA__?.[pageKey]?.fields) {
      return window.__PAGE_DATA__[pageKey].fields as CustomField[];
    }
    return defaultFields;
  });
  const { subscribe } = useWebSocket();

  // جلب الحقول من الـ API إذا لم تكن البيانات متوفرة
  useEffect(() => {
    // إذا كانت البيانات موجودة من السيرفر، لا نعمل fetch
    if (typeof window !== "undefined" && window.__PAGE_DATA__?.[pageKey]?.fields) {
      return;
    }
    
    fetch(`${BASE}/api/custom-fields/${pageKey}`)
      .then((r) => r.ok ? r.json() : defaultFields)
      .then((data: CustomField[]) => setFields(data.length > 0 ? data : defaultFields))
      .catch(() => setFields(defaultFields));
  }, [pageKey]);

  // الاستماع للتحديثات الفورية عبر WebSocket
  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type === "custom_fields_update" && msg.pageKey === pageKey) {
        setFields(msg.fields as CustomField[]);
      }
    });
  }, [pageKey, subscribe]);

  return fields;
}
