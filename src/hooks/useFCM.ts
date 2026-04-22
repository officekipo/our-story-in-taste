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
import { useAuthStore }   from "@/store/authStore";
import { requestFCMToken } from "@/lib/firebase/fcm";

// 포그라운드 메시지 표시는 FCMToast 컴포넌트(src/components/common/FCMToast.tsx)가 담당
export function useFCM() {
  const { myUid, initialized, setFcmToken } = useAuthStore();

  // ── 로그인 완료 시 토큰 요청 → Firestore 저장 ──────────
  useEffect(() => {
    if (!initialized || !myUid) return;

    requestFCMToken(myUid).then((token) => {
      if (token) setFcmToken(token);
    });
  }, [initialized, myUid, setFcmToken]);
}
