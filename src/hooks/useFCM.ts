// ============================================================
//  useFCM.ts  적용 경로: src/hooks/useFCM.ts
//
//  FCM 초기화 훅
//    - 로그인 완료 시 토큰 요청 → Firestore 저장
//    - 포그라운드 메시지 수신 → uiStore 토스트 표시
//
//  사용법: providers.tsx 의 Providers 컴포넌트 안에서 한 번만 호출
// ============================================================
"use client";

import { useEffect } from "react";
import { useAuthStore }  from "@/store/authStore";
import { useUIStore }    from "@/store/uiStore";
import { requestFCMToken, subscribeForegroundMessage } from "@/lib/firebase/fcm";

export function useFCM() {
  const { myUid, initialized, setFcmToken } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);

  // ── 로그인 완료 시 토큰 요청 ────────────────────────────
  useEffect(() => {
    if (!initialized || !myUid) return;

    requestFCMToken(myUid).then((token) => {
      if (token) setFcmToken(token);
    });
  }, [initialized, myUid, setFcmToken]);

  // ── 포그라운드 메시지 수신 (앱 열려 있을 때) ────────────
  useEffect(() => {
    let unsub: (() => void) | undefined;

    subscribeForegroundMessage((payload) => {
      const title = payload.notification?.title ?? "우리의 맛지도";
      const body  = payload.notification?.body  ?? "새로운 알림이 있어요";
      // 타입별 이모지 구분
      const type  = payload.data?.type;
      const emoji =
        type === "visited"     ? "🍽️" :
        type === "wishlist"    ? "⭐" :
        type === "anniversary" ? "🎉" : "🔔";

      showToast(`${emoji} ${title} — ${body}`);
    }).then((fn) => { unsub = fn; });

    return () => unsub?.();
  }, [showToast]);
}
