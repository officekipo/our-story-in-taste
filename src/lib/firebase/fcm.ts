// ============================================================
//  fcm.ts  적용 경로: src/lib/firebase/fcm.ts
//
//  FCM 토큰 요청 / Firestore 저장 / 포그라운드 메시지 구독
//
//  환경 변수 필요:
//    NEXT_PUBLIC_FIREBASE_VAPID_KEY  ← Firebase Console
//    → 프로젝트 설정 → 클라우드 메시징 → 웹 푸시 인증서 → 키 쌍 생성 후 복사
// ============================================================
import { getToken, onMessage, type Messaging } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db, getFirebaseMessaging } from "./config";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * 알림 권한 요청 → FCM 토큰 발급 → Firestore users/{uid}/fcmToken 저장
 * @returns 발급된 토큰 또는 null (권한 거부 / 미지원 환경)
 */
export async function requestFCMToken(uid: string): Promise<string | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging as Messaging, {
      vapidKey: VAPID_KEY,
    });

    if (token && uid) {
      await updateDoc(doc(db, "users", uid), { fcmToken: token }).catch(() => {});
    }

    return token ?? null;
  } catch (err) {
    console.error("[FCM] 토큰 요청 실패:", err);
    return null;
  }
}

/**
 * 포그라운드(앱 활성화 상태) 메시지 수신 구독
 * @returns unsubscribe 함수
 */
export async function subscribeForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
): Promise<() => void> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => {};
    return onMessage(messaging as Messaging, callback);
  } catch {
    return () => {};
  }
}
