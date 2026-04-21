// ============================================================
//  src/lib/firebase/admin.ts
//  Firebase Admin SDK — Next.js API Route 전용 (서버 사이드)
//
//  ★ lazy 초기화: import 시점이 아닌 실제 호출 시점에 초기화
//    → Vercel 빌드 시 환경 변수 없어도 빌드 오류 없음
// ============================================================

import "server-only";
import admin from "firebase-admin";
import type { App } from "firebase-admin/app";

let _app: App | null = null;

function getAdminApp(): App {
  if (_app) return _app;

  // 이미 초기화된 앱이 있으면 재사용
  if (admin.apps.length > 0) {
    _app = admin.apps[0]!;
    return _app;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !privateKey) {
    throw new Error(
      "Firebase Admin 환경 변수가 설정되지 않았습니다.\n" +
      "FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY 를 확인하세요."
    );
  }

  _app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });

  return _app;
}

// ★ getter 함수로 노출 — 호출 시점에 초기화
export function getAdminAuth()      { return admin.auth(getAdminApp()); }
export function getAdminDb()        { return admin.firestore(getAdminApp()); }
export function getAdminMessaging() { return admin.messaging(getAdminApp()); }
