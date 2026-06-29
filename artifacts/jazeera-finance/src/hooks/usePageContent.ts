// hook لجلب محتوى الصفحة وتحديثه فورياً من الـ WebSocket
import { useEffect, useState } from "react";
import { useWebSocket } from "@/context/WebSocketContext";

type ContentMap = Record<string, string>;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function usePageContent(pageKey: string, defaults: ContentMap = {}): ContentMap {
  const [content, setContent] = useState<ContentMap>(defaults);
  const { subscribe, connected } = useWebSocket();

  // جلب المحتوى من الـ API — يُعاد تنفيذه عند تغيير الصفحة أو عند إعادة اتصال WS
  useEffect(() => {
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
