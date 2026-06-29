// نظام WebSocket للتحديثات اللحظية بين المستخدمين ولوحة الإدارة
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { logger } from "./logger";

let wss: WebSocketServer | null = null;

// إعداد خادم WebSocket
export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws, req) => {
    logger.info({ url: req.url }, "اتصال WebSocket جديد");

    ws.on("error", (err) => {
      logger.error({ err }, "خطأ في اتصال WebSocket");
    });

    ws.on("close", () => {
      logger.info("تم إغلاق اتصال WebSocket");
    });

    // إرسال رسالة ترحيب للتأكيد على الاتصال
    ws.send(JSON.stringify({ type: "connected", message: "تم الاتصال بالخادم" }));
  });

  logger.info("تم تفعيل خادم WebSocket على /api/ws");
  return wss;
}

// إرسال رسالة لجميع العملاء المتصلين
export function broadcast(data: unknown) {
  if (!wss) return;

  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export { wss };
