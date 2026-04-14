// src/lib/firebase/notifications.ts
// 푸시 알림 시스템
// - 파트너 새 기록 알림
// - 위시리스트 추가 알림
// - 기념일 알림
// - FCM 토큰 관리

import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
} from "firebase/messaging";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

// ── 알림 설정 타입 ──
export interface NotificationSettings {
  partnerRecord: boolean;
  wishlistAdd:   boolean;
  anniversary:   boolean;
}

const STORAGE_KEY = "matzip_notif_settings";

export function loadNotifSettings(): NotificationSettings {
  if (typeof window === "undefined")
    return { partnerRecord: true, wishlistAdd: true, anniversary: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? JSON.parse(raw)
      : { partnerRecord: true, wishlistAdd: true, anniversary: true };
  } catch {
    return { partnerRecord: true, wishlistAdd: true, anniversary: true };
  }
}

export function saveNotifSettings(settings: NotificationSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ── FCM 권한 요청 + 토큰 발급 ──
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    const { getApp } = await import("firebase/app");
    const messaging: Messaging = getMessaging(getApp());
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    // Firestore users 문서에 토큰 저장
    if (auth.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fcmToken: token,
        fcmUpdatedAt: serverTimestamp(),
      });
    }
    return token;
  } catch (err) {
    console.warn("FCM 토큰 발급 실패:", err);
    return null;
  }
}

// ── 포그라운드 메시지 수신 ──
export async function initForegroundListener(
  onReceive: (title: string, body: string) => void,
) {
  if (typeof window === "undefined") return;
  try {
    const { getApp } = await import("firebase/app");
    const messaging  = getMessaging(getApp());
    onMessage(messaging, payload => {
      onReceive(
        payload.notification?.title ?? "우리의 맛지도",
        payload.notification?.body  ?? "",
      );
    });
  } catch (err) {
    console.warn("FCM 리스너 초기화 스킵:", err);
  }
}

// ══════════════════════════════════════════════════
//  알림 트리거 함수들
//  Firestore에 알림 문서를 저장 → Cloud Functions(선택)으로 발송
//  또는 클라이언트에서 직접 로컬 토스트로 표시
// ══════════════════════════════════════════════════

// ── 파트너 새 기록 알림 트리거 ──
// 기록 추가 후 호출 (page.tsx handleSave에서 호출)
export async function triggerPartnerRecordNotif(
  coupleId:    string,
  myName:      string,
  recordName:  string,
) {
  const settings = loadNotifSettings();
  if (!settings.partnerRecord) return;

  try {
    // Firestore notifications 컬렉션에 저장
    // Cloud Functions 미사용 시 → 파트너가 앱 열면 확인
    await addDoc(collection(db, "notifications"), {
      coupleId,
      type:      "partner_record",
      title:     `${myName}가 새 기록을 남겼어요! 🍽️`,
      body:      `"${recordName}" 맛집 기록을 확인해보세요`,
      createdAt: serverTimestamp(),
      read:      false,
    });
  } catch (err) {
    console.warn("알림 저장 실패:", err);
  }
}

// ── 위시리스트 추가 알림 트리거 ──
export async function triggerWishlistNotif(
  coupleId:  string,
  myName:    string,
  wishName:  string,
) {
  const settings = loadNotifSettings();
  if (!settings.wishlistAdd) return;

  try {
    await addDoc(collection(db, "notifications"), {
      coupleId,
      type:      "wishlist_add",
      title:     `${myName}가 가고 싶은 곳을 추가했어요! ⭐`,
      body:      `"${wishName}" 위시리스트에서 확인해보세요`,
      createdAt: serverTimestamp(),
      read:      false,
    });
  } catch (err) {
    console.warn("알림 저장 실패:", err);
  }
}

// ── 기념일 계산 ──
export function checkAnniversary(startDateStr: string): string | null {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (today.getTime() - start.getTime()) / 86400000,
  );

  // 100일 단위 기념일
  if (diffDays > 0 && diffDays % 100 === 0) {
    return `오늘은 교제 ${diffDays}일이에요! 🎉`;
  }
  // 연 기념일
  const years  = Math.floor(diffDays / 365);
  const yearDay = diffDays % 365;
  if (years > 0 && yearDay === 0) {
    return `오늘은 교제 ${years}주년이에요! 🎂`;
  }
  return null;
}

/*
────────────────────────────────────────────
public/firebase-messaging-sw.js 내용
(백그라운드 알림 수신용 서비스 워커)
────────────────────────────────────────────
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
messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(
    payload.notification?.title ?? '우리의 맛지도',
    {
      body:    payload.notification?.body ?? '',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-72.png',
      vibrate: [200, 100, 200],
    }
  );
});
*/
