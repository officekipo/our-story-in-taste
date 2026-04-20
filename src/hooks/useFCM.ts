// ============================================================
//  useFCM.ts  적용 경로: src/hooks/useFCM.ts
//
//  사용법: providers.tsx 또는 최상위 클라이언트 컴포넌트에서 한 번만 호출
//    import { useFCM } from "@/hooks/useFCM";
//    export function Providers(...) {
//      useFCM();
//      ...
//    }
// ============================================================
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { requestFCMToken, subscribeForegroundMessage } from "@/lib/firebase/fcm";

export function useFCM() {
  const { myUid, initialized, setFcmToken } = useAuthStore();

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
      const body  = payload.notification?.body  ?? "새로운 알림이 있어요 🍽️";

      // TODO: 토스트 UI 연결 시 여기에 toast(title, body) 호출
      console.log("[FCM 포그라운드]", title, body);
    }).then((fn) => {
      unsub = fn;
    });

    return () => unsub?.();
  }, []);
}
