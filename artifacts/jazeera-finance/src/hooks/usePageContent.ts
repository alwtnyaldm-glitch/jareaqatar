// hook لجلب محتوى الصفحة وتحديثه فورياً من الـ WebSocket
import { useEffect, useState } from "react";
import { useWebSocket } from "@/context/WebSocketContext";

type ContentMap = Record<string, string>;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// قراءة البيانات من المتغيرات العالمية (تُملأ من السيرفر)
declare global {
  interface Window {
    __PAGE_DATA__?: Record<string, { content: ContentMap; fields?: any[] }>;
  }
}

export function usePageContent(pageKey: string, defaults: ContentMap = {}): ContentMap {
  const [content, setContent] = useState<ContentMap>(() => {
    // محاولة قراءة البيانات من المتغيرات العالمية أولاً (البيانات من السيرفر)
    if (typeof window !== "undefined" && window.__PAGE_DATA__?.[pageKey]?.content) {
      return { ...defaults, ...window.__PAGE_DATA__[pageKey].content };
    }
    return defaults;
  });
  const { subscribe, connected } = useWebSocket();

  // جلب المحتوى من الـ API إذا لم تكن البيانات متوفرة
  useEffect(() => {
    // إذا كانت البيانات موجودة من السيرفر، لا نعمل fetch
    if (typeof window !== "undefined" && window.__PAGE_DATA__?.[pageKey]?.content) {
      return;
    }
    
    fetch(`${BASE}/api/page-contents/${pageKey}`)
      .then((r) => r.ok ? r.json() : defaults)
      .then((data: ContentMap) => setContent({ ...defaults, ...data }))
      .catch(() => setContent(defaults));
  }, [pageKey, connected]);

  // الاستماع للتحديثات الفورية عبر WebSocket
  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type === "content_update" && msg.pageKey === pageKey) {
        setContent((prev) => ({
          ...prev,
          [msg.sectionKey as string]: msg.content as string,
        }));
      } else if (msg.type === "page_content_update" && msg.pageKey === pageKey) {
        setContent((prev) => ({ ...prev, ...(msg.updates as ContentMap) }));
      }
    });
  }, [pageKey, subscribe]);

  return content;
}
