// ============================================================
//  FCMToast.tsx  적용 경로: src/components/common/FCMToast.tsx
//
//  포그라운드 FCM 알림 전용 토스트 UI
//  uiStore의 일반 토스트와 별도로 FCM 메시지를 리치하게 표시
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { subscribeForegroundMessage } from "@/lib/firebase/fcm";

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

export function FCMToast() {
  const [messages, setMessages] = useState<FCMMessage[]>([]);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    subscribeForegroundMessage((payload) => {
      const type  = payload.data?.type ?? "default";
      const title = payload.notification?.title ?? "우리의 맛지도";
      const body  = payload.notification?.body  ?? "새로운 알림이 있어요";

      const msg: FCMMessage = { id: Date.now(), type, title, body };

      setMessages((prev) => [...prev, msg]);

      // 4초 후 자동 제거
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, 4000);
    }).then((fn) => { unsub = fn; });

    return () => unsub?.();
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
            {/* 이모지 아이콘 */}
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: meta.color + "15",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>
              {meta.emoji}
            </div>
            {/* 텍스트 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1412", marginBottom: 2 }}>
                {msg.title}
              </p>
              <p style={{ fontSize: 13, color: "#8A8078", lineHeight: 1.5 }}>
                {msg.body}
              </p>
            </div>
            {/* 닫기 */}
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
