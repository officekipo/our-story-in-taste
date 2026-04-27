// ============================================================
//  FCMToast.tsx  적용 경로: src/components/common/FCMToast.tsx
//
//  Fix:
//    ★ data-only 방식 대응 — title/body를 payload.data에서 우선 읽기
//      이유: Cloud Functions가 notification 필드 없이 data만 보내도록 변경됨
//            payload.notification은 undefined → payload.data.title/body 사용
//    ★ 구독 재시도 로직 유지 (이전 수정)
// ============================================================
"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeForegroundMessage }  from "@/lib/firebase/fcm";

interface FCMMessage {
  id:    number;
  type:  string;
  title: string;
  body:  string;
}

const TYPE_META: Record<string, { emoji: string; color: string; bg: string }> = {
  visited:     { emoji: "🍽️", color: "#C96B52", bg: "#FFF5F2" },
  wishlist:    { emoji: "⭐",  color: "#D97706", bg: "#FFFBEB" },
  anniversary: { emoji: "🎉", color: "#7B6BAE", bg: "#F5F3FF" },
  default:     { emoji: "🔔", color: "#6B9E7E", bg: "#F0FDF4" },
};

const MAX_RETRY   = 5;
const RETRY_DELAY = 1200;

export function FCMToast() {
  const [messages, setMessages] = useState<FCMMessage[]>([]);
  const unsubRef   = useRef<(() => void) | undefined>(undefined);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const handleMessage = (payload: {
      notification?: { title?: string; body?: string };
      data?: Record<string, string>;
    }) => {
      if (!mountedRef.current) return;

      if (process.env.NODE_ENV === "development") {
        console.log("[FCMToast] 메시지 수신:", payload);
      }

      const type = payload.data?.type ?? "default";

      // ★ data 필드 우선, notification 폴백
      //   data-only 방식: payload.notification은 undefined
      //   notification 방식(레거시): payload.notification 사용
      const title =
        payload.data?.title          // ★ data 필드 우선
        ?? payload.notification?.title
        ?? "우리의 맛지도";

      const body =
        payload.data?.body           // ★ data 필드 우선
        ?? payload.notification?.body
        ?? "새로운 알림이 있어요";

      const msg: FCMMessage = { id: Date.now(), type, title, body };
      setMessages((prev) => [...prev, msg]);

      setTimeout(() => {
        if (!mountedRef.current) return;
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, 4000);
    };

    const trySubscribe = async () => {
      if (!mountedRef.current) return;

      try {
        const unsub = await subscribeForegroundMessage(handleMessage);
        const isNoop = unsub.toString().replace(/\s/g, "") === "()=>{}";

        if (isNoop && retryCount.current < MAX_RETRY) {
          retryCount.current += 1;
          if (process.env.NODE_ENV === "development") {
            console.log(`[FCMToast] messaging 미준비, 재시도 ${retryCount.current}/${MAX_RETRY}`);
          }
          retryTimer.current = setTimeout(trySubscribe, RETRY_DELAY);
        } else {
          unsubRef.current = unsub;
          if (process.env.NODE_ENV === "development") {
            console.log("[FCMToast] 포그라운드 메시지 구독 완료 ✅");
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("[FCMToast] 구독 오류:", err);
        }
      }
    };

    trySubscribe();

    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimer.current);
      unsubRef.current?.();
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
      width: "calc(100% - 32px)", maxWidth: 400, pointerEvents: "none",
    }}>
      {messages.map((msg) => {
        const meta = TYPE_META[msg.type] ?? TYPE_META.default;
        return (
          <div key={msg.id} style={{
            background: meta.bg,
            border: `1px solid ${meta.color}30`,
            borderRadius: 16,
            padding: "12px 16px",
            display: "flex", alignItems: "flex-start", gap: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            animation: "fcmSlideIn 0.3s ease both",
            pointerEvents: "auto",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: meta.color + "15",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>
              {meta.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1412", marginBottom: 2 }}>
                {msg.title}
              </p>
              <p style={{ fontSize: 13, color: "#8A8078", lineHeight: 1.5 }}>
                {msg.body}
              </p>
            </div>
            <button
              onClick={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 16, color: "#C0B8B0", lineHeight: 1, flexShrink: 0,
                padding: 2,
              }}
            >×</button>
          </div>
        );
      })}
      <style>{`
        @keyframes fcmSlideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
