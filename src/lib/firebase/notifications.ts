// src/lib/firebase/notifications.ts
// Firebase Cloud Messaging(FCM)을 이용한 푸시 알림
// Step 09 PWA 설정 이후 활성화. 그 전까지는 토글 상태만 로컬 저장.
//
// ── 알림 종류 ──
//   partner_record : 파트너가 새 방문 기록을 추가했을 때
//   wishlist_add   : 파트너가 위시리스트에 새 항목을 추가했을 때
//   anniversary    : 교제 100일, 200일, 1주년 등 기념일
//
// ── 사용 방법 ──
//   1. Firebase 콘솔 → Build → Cloud Messaging → 프로젝트 등록
//   2. .env.local 에 NEXT_PUBLIC_FIREBASE_VAPID_KEY 추가
//   3. public/firebase-messaging-sw.js 파일 생성 (아래 주석 참고)
//   4. initNotifications() 를 providers.tsx useEffect에서 호출

import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "./config";

// ── 알림 설정 타입 ──
export interface NotificationSettings {
  partnerRecord: boolean;   // 파트너 새 기록 알림
  wishlistAdd:   boolean;   // 파트너 위시리스트 추가 알림
  anniversary:   boolean;   // 기념일 알림
}

// ── 기본값 (로컬 스토리지 키) ──
const STORAGE_KEY = "matzip_notif_settings";

export function loadNotifSettings(): NotificationSettings {
  if (typeof window === "undefined") return { partnerRecord: true, wishlistAdd: true, anniversary: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { partnerRecord: true, wishlistAdd: true, anniversary: true };
  } catch {
    return { partnerRecord: true, wishlistAdd: true, anniversary: true };
  }
}

export function saveNotifSettings(settings: NotificationSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ── FCM 토큰 발급 및 Firestore 저장 ──
// .env.local: NEXT_PUBLIC_FIREBASE_VAPID_KEY=여기에_VAPID_키
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // 브라우저 알림 지원 확인
  if (!("Notification" in window)) {
    console.warn("이 브라우저는 알림을 지원하지 않습니다.");
    return null;
  }

  // 권한 요청
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("알림 권한이 거부됐습니다.");
    return null;
  }

  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const app = getApps().length ? getApp() : initializeApp({});
    const messaging: Messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    // Firestore users 문서에 FCM 토큰 저장
    if (auth.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fcmToken: token,
      });
    }

    return token;
  } catch (err) {
    console.error("FCM 토큰 발급 실패:", err);
    return null;
  }
}

// ── 포그라운드 메시지 수신 리스너 ──
// providers.tsx 에서 앱 시작 시 한 번 호출
export async function initForegroundMessageListener(
  onReceive: (title: string, body: string) => void
) {
  if (typeof window === "undefined") return;
  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const app      = getApps().length ? getApp() : initializeApp({});
    const messaging = getMessaging(app);

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "우리의 맛지도";
      const body  = payload.notification?.body  ?? "";
      onReceive(title, body);
    });
  } catch (err) {
    // FCM 미설정 환경(개발)에서 오류 무시
    console.warn("FCM 리스너 초기화 스킵:", err);
  }
}

// ── 기념일 계산 유틸 ──
// 오늘이 교제 기념일(100일, 200일, 1주년 등)인지 확인
export function checkAnniversary(startDateStr: string): string | null {
  if (!startDateStr) return null;

  const start   = new Date(startDateStr);
  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);

  // 100일 단위 기념일
  if (diffDays > 0 && diffDays % 100 === 0) {
    return `오늘은 교제 ${diffDays}일이에요! 🎉`;
  }

  // 주년 기념일 (365일 단위)
  const years = Math.floor(diffDays / 365);
  const yearDay = diffDays % 365;
  if (years > 0 && yearDay === 0) {
    return `오늘은 교제 ${years}주년이에요! 🎂`;
  }

  return null;
}

/*
────────────────────────────────────────────────
public/firebase-messaging-sw.js 에 아래 내용 추가
(Service Worker — FCM 백그라운드 메시지 처리)
────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "...",
  authDomain:        "...",
  projectId:         "...",
  storageBucket:     "...",
  messagingSenderId: "...",
  appId:             "...",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
  });
});
*/
